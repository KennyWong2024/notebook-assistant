"use server"

import { createClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
};

export async function getProveedoresPaginados(busqueda: string, pagina: number = 1, porPagina: number = 20) {
    try {
        const supabaseAdmin = getSupabaseAdmin();

        let query = supabaseAdmin
            .schema('sourcing')
            .from('v_directorio_proveedores')
            .select('*', { count: 'exact' });

        if (busqueda) {
            const termino = `%${busqueda}%`;
            query = query.or(`nombre_empresa.ilike.${termino},pais_origen.ilike.${termino},sap_bp_id.ilike.${termino}`);
        }

        const from = (pagina - 1) * porPagina;
        const to = from + porPagina - 1;

        const { data, count, error } = await query
            .order('nombre_empresa', { ascending: true })
            .range(from, to);

        if (error) throw error;

        const totalRegistros = count || 0;
        const totalPaginas = Math.ceil(totalRegistros / porPagina);

        return { success: true, data, totalRegistros, totalPaginas };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}