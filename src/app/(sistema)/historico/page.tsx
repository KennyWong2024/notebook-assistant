"use client";

import { Briefcase } from "lucide-react";

export default function FeriasPage() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Histórico de Ferias</h1>
            <p className="text-gray-500 mt-2 font-medium">Aquí verás el histórico de ferias.</p>
        </div>
    );
}