"use server"

import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const getSupabaseAdmin = () => {
    return createClient<Database>(
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

export async function limpiarProveedorHuerfano(idProveedorViejo: string) {
    if (!idProveedorViejo) return null;

    try {
        const supabaseAdmin = getSupabaseAdmin();

        // Verificar si el proveedor todavia tiene productos colgados
        const { count, error: countError } = await supabaseAdmin
            .schema('sourcing')
            .from('productos_prospecto')
            .select('id', { count: 'exact', head: true })
            .eq('id_proveedor', idProveedorViejo);

        if (countError) throw countError;

        // Si ya no tiene productos, verificamos sus caracteristicas
        if (count === 0) {
            const { data: prov, error: provError } = await supabaseAdmin
                .schema('sourcing')
                .from('proveedores')
                .select('nombre_empresa, contacto_principal, email_contacto')
                .eq('id', idProveedorViejo)
                .single();
            
            if (provError && provError.code !== 'PGRST116') throw provError;

            // Logica heurística: Si era "Por definir" O si ni siquiera tenía un contacto o email real
            const isPorDefinir = prov?.nombre_empresa?.trim().toLowerCase() === 'por definir' || prov?.nombre_empresa?.trim().toLowerCase().startsWith('s/n');
            const hasNoContact = !prov?.contacto_principal && !prov?.email_contacto;

            if (prov && (isPorDefinir || hasNoContact)) {
                // Procedemos a eliminarlo (Las llaves foraneas asumen CASCADE en activos e interacciones, si no fallaría, pero es seguro intentar)
                await supabaseAdmin
                    .schema('sourcing')
                    .from('proveedores')
                    .delete()
                    .eq('id', idProveedorViejo);
                
                return { success: true, action: 'deleted' };
            }
        }
        return { success: true, action: 'kept' };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}