"use server"

import { createClient } from '@supabase/supabase-js'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error("Variables de entorno faltantes en Cloudflare.");
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

export async function crearUsuario(formData: FormData) {
    const email = formData.get("email") as string
    const nombre = formData.get("nombre") as string
    const rol = formData.get("rol") as string
    const password = formData.get("password") as string

    try {
        const supabaseAdmin = getSupabaseAdmin();

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
        })

        if (authError) throw new Error(`Error Auth: ${authError.message}`)
        if (!authData.user) throw new Error("No se pudo crear el usuario")

        const { error: dbError } = await supabaseAdmin
            .schema('sourcing')
            .from('perfiles')
            .insert([
                {
                    id: authData.user.id,
                    email: email,
                    nombre_completo: nombre,
                    rol: rol,
                }
            ])

        if (dbError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            throw new Error(`Error BD: ${dbError.message}`)
        }

        return { success: true }

    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function alternarEstadoUsuario(userId: string, estadoActual: boolean) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const nuevoEstado = !estadoActual;

        const { error: dbError } = await supabaseAdmin
            .schema('sourcing')
            .from('perfiles')
            .update({ estado_activo: nuevoEstado })
            .eq('id', userId);

        if (dbError) throw new Error(`Error BD: ${dbError.message}`);

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: nuevoEstado ? 'none' : '876000h'
        });

        if (authError) throw new Error(`Error Auth: ${authError.message}`);

        return { success: true, nuevoEstado };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function restablecerContrasenaUsuario(userId: string, newPassword: string) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (error) throw new Error(`Error Auth: ${error.message}`);

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function cambiarRolUsuario(userId: string, nuevoRol: string) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error: dbError } = await supabaseAdmin
            .schema('sourcing')
            .from('perfiles')
            .update({ rol: nuevoRol })
            .eq('id', userId);

        if (dbError) throw new Error(`Error BD: ${dbError.message}`);

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}