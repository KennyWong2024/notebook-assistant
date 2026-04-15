"use server"

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from "next/cache"

const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
};

export async function eliminarProducto(idProducto: string) {
    try {
        const supabaseAdmin = getSupabaseAdmin();

        const { data: activos } = await supabaseAdmin
            .schema('sourcing')
            .from('activos_adjuntos')
            .select('url_storage')
            .eq('id_producto', idProducto);

        const { error: dbError } = await supabaseAdmin
            .schema('sourcing')
            .from('productos_prospecto')
            .delete()
            .eq('id', idProducto);

        if (dbError) throw new Error(`Error BD: ${dbError.message}`);

        if (activos && activos.length > 0) {
            const pathsToDelete = activos.map(a => {
                const parts = a.url_storage.split('/activos_feria/');
                return parts.length > 1 ? parts[1] : null;
            }).filter(Boolean) as string[];

            if (pathsToDelete.length > 0) {
                await supabaseAdmin.storage.from('activos_feria').remove(pathsToDelete);
            }
        }

        revalidatePath("/dashboard");
        revalidatePath("/historico");

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getResumenFerias() {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
            .schema('sourcing')
            .from('v_resumen_ferias')
            .select('*')
            .order('feria', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getProductosPaginados(feria: string | null, busqueda: string, pagina: number = 1, porPagina: number = 20) {
    try {
        const supabaseAdmin = getSupabaseAdmin();

        let query = supabaseAdmin
            .schema('sourcing')
            .from('v_historial_productos')
            .select('*', { count: 'exact' });

        if (feria && !busqueda) {
            if (feria === 'Sin feria asignada') {
                query = query.is('feria', null);
            } else {
                query = query.eq('feria', feria);
            }
        }

        if (busqueda) {
            const termino = `%${busqueda}%`;
            query = query.or(`nombre_rapido.ilike.${termino},proveedor.ilike.${termino},codigo_trazabilidad.ilike.${termino}`);
        }

        const from = (pagina - 1) * porPagina;
        const to = from + porPagina - 1;

        const { data, count, error } = await query
            .order('codigo_trazabilidad', { ascending: false })
            .range(from, to);

        if (error) throw error;

        const totalRegistros = count || 0;
        const totalPaginas = Math.ceil(totalRegistros / porPagina);

        return { success: true, data, totalRegistros, totalPaginas };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}