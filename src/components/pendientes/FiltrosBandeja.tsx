"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

type FiltrosBandejaProps = {
    search: string;
    onSearchChange: (val: string) => void;
    feriaSeleccionada: string;
    onFeriaChange: (val: string) => void;
    proveedorSeleccionado: string;
    onProveedorChange: (val: string) => void;
    feriasDisponibles: string[];
    proveedoresDisponibles: string[];
};

export default function FiltrosBandeja({
    search, onSearchChange,
    feriaSeleccionada, onFeriaChange,
    proveedorSeleccionado, onProveedorChange,
    feriasDisponibles, proveedoresDisponibles
}: FiltrosBandejaProps) {
    const [mostrarAvanzados, setMostrarAvanzados] = useState(false);

    const hayFiltrosActivos = feriaSeleccionada !== "" || proveedorSeleccionado !== "";

    return (
        <div className="space-y-3 mb-6">
            {/* Buscador Principal */}
            <div className="flex space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-2 focus:ring-red-600 outline-none text-sm text-gray-800 shadow-sm transition-all"
                    />
                    {search && (
                        <button onClick={() => onSearchChange("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setMostrarAvanzados(!mostrarAvanzados)}
                    className={`w-14 flex items-center justify-center rounded-[1.5rem] border transition-all ${hayFiltrosActivos || mostrarAvanzados
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <Filter className="h-5 w-5" />
                </button>
            </div>

            {/* Filtros Avanzados (Desplegables) */}
            {mostrarAvanzados && (
                <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm space-y-4 animate-in slide-in-from-top-2">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">
                            Filtrar por Feria
                        </label>
                        <select
                            value={feriaSeleccionada}
                            onChange={(e) => onFeriaChange(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm text-gray-700"
                        >
                            <option value="">Todas las ferias</option>
                            {feriasDisponibles.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">
                            Filtrar por Proveedor
                        </label>
                        <select
                            value={proveedorSeleccionado}
                            onChange={(e) => onProveedorChange(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm text-gray-700"
                        >
                            <option value="">Todos los proveedores</option>
                            {proveedoresDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {hayFiltrosActivos && (
                        <button
                            onClick={() => { onFeriaChange(""); onProveedorChange(""); }}
                            className="w-full py-2 text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider"
                        >
                            Limpiar Filtros
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}