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
            const { data, error } = await supabase
                .schema('sourcing')
                .from('v_pendientes_bandeja')
                .select('*')
                .eq('estado_compra', 'borrador')
                .returns<ViewPendientesBandeja[]>();

            if (error) throw error;

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
        } catch (err: any) {
            console.error("Error cargando pendientes:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendientes();
    }, []);

    return { pendientes, loading, error, refetch: fetchPendientes };
}