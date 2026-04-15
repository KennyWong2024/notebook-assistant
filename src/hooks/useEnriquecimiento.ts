import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ProductProspect, CatalogDepartment, CatalogCategory } from "@/types/database";

export function useEnriquecimiento() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [departamentos, setDepartamentos] = useState<CatalogDepartment[]>([]);
    const [categorias, setCategorias] = useState<CatalogCategory[]>([]);

    const cargarCatalogos = useCallback(async () => {
        try {
            if (navigator.onLine) {
                const [deptRes, catRes] = await Promise.all([
                    supabase.schema('sourcing').from('departamentos').select('*').eq('estado_activo', true),
                    supabase.schema('sourcing').from('categorias').select('*').eq('estado_activo', true)
                ]);

                if (!deptRes.error && !catRes.error) {
                    setDepartamentos(deptRes.data || []);
                    setCategorias(catRes.data || []);
                    return;
                }
            }
            throw new Error("Offline o error de consulta");
        } catch (err: any) {
            console.log("Fallback modo offline para catálogos...");
            try {
                const depts = await import("@/lib/offline-db").then(m => m.getCatalogoLocal('departamentos'));
                const cats = await import("@/lib/offline-db").then(m => m.getCatalogoLocal('categorias'));
                
                if (depts) setDepartamentos(depts);
                if (cats) setCategorias(cats);
            } catch (fallbackErr) {
                console.error("Error cargando catálogos offline:", fallbackErr);
                setError("No se pudieron cargar las clasificaciones en modo offline.");
            }
        }
    }, []);

    const obtenerDetalleProducto = async (idProducto: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .schema('sourcing')
                .from('productos_prospecto')
                .select(`
                    *,
                    activos_adjuntos ( id, url_storage, id_tipo_activo, estado_activo )
                `)
                .eq('id', idProducto)
                .maybeSingle();

            if (error) throw error;
            return data as any;
        } catch (err: any) {
            console.error("Error obteniendo producto:", err);
            setError("No se pudo cargar el detalle del producto.");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const guardarEnriquecimiento = async (
        idProducto: string,
        datosActualizados: Partial<ProductProspect>,
        pideMuestra: boolean,
        fotosNuevas: File[],
        idsFotosBorradas: string[]
    ) => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa");

            const nuevoEstado = pideMuestra ? 'muestra_solicitada' : 'completado';

            const { error: updateError } = await supabase
                .schema('sourcing')
                .from('productos_prospecto')
                .update({
                    ...datosActualizados,
                    pidio_muestra: pideMuestra,
                    estado_compra: nuevoEstado,
                    updated_at: new Date().toISOString()
                })
                .eq('id', idProducto);

            if (updateError) throw updateError;

            if (idsFotosBorradas.length > 0) {
                await supabase.schema('sourcing').from('activos_adjuntos').delete().in('id', idsFotosBorradas);
            }

            if (fotosNuevas.length > 0) {
                for (const [idx, f] of fotosNuevas.entries()) {
                    const path = `${idProducto}/p_enriquecido_${Date.now()}_${idx}.jpg`;
                    await supabase.storage.from('activos_feria').upload(path, f);
                    const { data: url } = supabase.storage.from('activos_feria').getPublicUrl(path);

                    await supabase.schema('sourcing').from('activos_adjuntos').insert({
                        url_storage: url.publicUrl,
                        id_tipo_activo: 2,
                        creado_por: user.id,
                        id_producto: idProducto
                    });
                }
            }

            return true;
        } catch (err: any) {
            console.error("Error guardando enriquecimiento:", err);
            setError("Hubo un error al guardar los datos. Revisa tu conexión.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading, error, departamentos, categorias,
        cargarCatalogos, obtenerDetalleProducto, guardarEnriquecimiento
    };
}