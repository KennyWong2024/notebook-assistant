"use server"

import { revalidatePath } from "next/cache"

export async function registrarCapturaRapida(formData: any) {
    try {
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}