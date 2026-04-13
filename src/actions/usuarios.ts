"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function crearUsuario(formData: FormData) {
    const email = formData.get("email") as string
    const nombre = formData.get("nombre") as string
    const rol = formData.get("rol") as string
    const password = formData.get("password") as string

    try {
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