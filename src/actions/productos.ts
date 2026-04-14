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
        const { error: dbError } = await supabaseAdmin
            .schema('sourcing')
            .from('productos_prospecto')
            .delete()
            .eq('id', idProducto);

        if (dbError) throw new Error(`Error BD: ${dbError.message}`);

        revalidatePath("/dashboard");
        revalidatePath("/historico");

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}