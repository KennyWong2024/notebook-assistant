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
        
        // 1. Obtener los activos físicos primero
        const { data: activos } = await supabaseAdmin
            .schema('sourcing')
            .from('activos_adjuntos')
            .select('url_storage')
            .eq('id_producto', idProducto);

        // 2. Eliminar de base de datos (se borran dependecias por Cascade)
        const { error: dbError } = await supabaseAdmin
            .schema('sourcing')
            .from('productos_prospecto')
            .delete()
            .eq('id', idProducto);

        if (dbError) throw new Error(`Error BD: ${dbError.message}`);

        // 3. Borrar de Storage si hubo éxito en DB
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