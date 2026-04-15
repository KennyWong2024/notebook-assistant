import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ProductoPendiente, ViewPendientesBandeja } from "@/types/database";

export function usePendientes() {
    const [pendientes, setPendientes] = useState<ProductoPendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPendientes = async () => {
        setLoading(true);
        try {
            if (navigator.onLine) {
                const { data, error } = await supabase
                    .schema('sourcing')
                    .from('v_pendientes_bandeja')
                    .select('*')
                    .eq('estado_compra', 'borrador')
                    .returns<ViewPendientesBandeja[]>();

                if (!error) {
                    const formateados: ProductoPendiente[] = (data || []).map((item) => ({
                        id: item.id,
                        codigo_trazabilidad: item.codigo_trazabilidad,
                        nombre_rapido: item.nombre_rapido || 'Producto sin nombre',
                        precio_referencia: item.precio_referencia,
                        moneda: item.moneda || 'USD',
                        proveedor: item.proveedor || 'Proveedor Desconocido',
                        feria: item.feria || 'Feria Desconocida',
                        foto_url: item.foto_url,
                        prioridad: item.prioridad
                    }));
                    setPendientes(formateados);
                    return;
                }
            }
            throw new Error("offline");
        } catch (err: any) {
            console.log("Fallback modo offline para Pendientes...");
            try {
                const locales = await import("@/lib/offline-db").then(m => m.getAllLocals('productos_recientes'));
                const filtrados = locales.filter(p => p.estado_compra === 'borrador');
                
                const formateados: ProductoPendiente[] = filtrados.map(item => ({
                    id: item.id,
                    codigo_trazabilidad: item.codigo_trazabilidad || "OFFLINE_TEMP",
                    nombre_rapido: item.nombre_rapido || 'Producto sin nombre',
                    precio_referencia: item.precio_referencia,
                    moneda: item.moneda || 'USD',
                    proveedor: item.proveedor_nombre || 'Proveedor Desconocido',
                    feria: item.feria || 'Feria',
                    foto_url: item.activos?.[0]?.url_storage || null,
                    prioridad: item.prioridad
                }));
                // Ordenar por más reciente (timestamp invertido)
                setPendientes(formateados.sort((a,b) => (b as any).timestamp - (a as any).timestamp));
            } catch(e) {
                console.error("Error cargando pendientes offline:", e);
                setError("Modo sin conexión. Bandeja no disponible temporalmente.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendientes();
    }, []);

    return { pendientes, loading, error, refetch: fetchPendientes };
}