"use client";

import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-gray-500 p-3 w-full rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
        >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
    );
}