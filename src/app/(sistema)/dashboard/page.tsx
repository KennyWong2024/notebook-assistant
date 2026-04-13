"use client";

import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Mis Pendientes</h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">Productos capturados en feria pendientes de enriquecer.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center min-h-[40vh]">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                    <LayoutDashboard className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No hay pendientes</h3>
                <p className="text-gray-500 mt-1 text-sm max-w-md">
                    Ve a la sección de Captura desde tu móvil para empezar a registrar prospectos en la feria.
                </p>
            </div>
        </div>
    );
}