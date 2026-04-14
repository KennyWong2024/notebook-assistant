"use client";

import { useState, useMemo } from "react";
import { usePendientes } from "@/hooks/usePendientes";
import { Loader2, LayoutGrid, ClipboardList, Search } from "lucide-react";
import PanelEnriquecimiento from "./PanelEnriquecimiento";
import TarjetaPendiente from "./TarjetaPendiente";
import BuscadorMagico from "@/components/ui/BuscadorMagico";

export default function BandejaPendientes() {
    const { pendientes, loading, error, refetch } = usePendientes();
    const [searchTerm, setSearchTerm] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);

    const pendientesFiltrados = useMemo(() => {
        if (!searchTerm.trim()) return pendientes;
        const terms = searchTerm.toLowerCase().split(" ");

        return pendientes.filter(prod => {
            const searchableText = `
                ${prod.nombre_rapido || ''}
                ${prod.codigo_trazabilidad || ''}
                ${prod.proveedor || ''}
                ${prod.feria || ''}
            `.toLowerCase();

            return terms.every(term => searchableText.includes(term));
        });
    }, [pendientes, searchTerm]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-600 bg-red-50 rounded-2xl border border-red-100 font-bold flex justify-center">Error: {error}</div>;
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="mb-8 md:mb-12 flex flex-col space-y-6 md:space-y-0 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center">
                        <ClipboardList className="w-8 h-8 mr-3 text-red-600 hidden md:block" />
                        Mis Pendientes
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        Productos capturados en feria pendientes de enriquecer. ({pendientesFiltrados.length} listos)
                    </p>
                </div>

                <div className="w-full md:w-[400px] lg:w-[500px]">
                    <BuscadorMagico
                        valor={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Ej. Ugreen, Soporte, Canton Fair..."
                    />
                </div>
            </div>

            {pendientes.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-12 flex flex-col items-center justify-center text-center mt-8">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <LayoutGrid className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Bandeja Limpia</h2>
                    <p className="text-gray-500 max-w-sm">
                        No tienes productos pendientes de enriquecer. Ve a la sección de Captura para registrar nuevos prospectos.
                    </p>
                </div>
            ) : pendientesFiltrados.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-12 flex flex-col items-center justify-center text-center mt-8">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No encontramos resultados</h3>
                    <p className="text-gray-500 mt-2">Intenta buscar con otra palabra clave o proveedor.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(
                        pendientesFiltrados.reduce((acc, current) => {
                            const feria = current.feria || 'Sin feria asignada';
                            if(!acc[feria]) acc[feria] = [];
                            acc[feria].push(current);
                            return acc;
                        }, {} as Record<string, typeof pendientesFiltrados>)
                    )
                    .sort(([feriaA], [feriaB]) => feriaA.localeCompare(feriaB))
                    .map(([feria, productos]) => (
                        <details key={feria} open className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden open:pb-6">
                            <summary className="flex items-center justify-between p-6 cursor-pointer select-none outline-none group-open:border-b group-open:border-gray-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-md">
                                        <ClipboardList className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 tracking-tight">{feria}</h2>
                                        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase mt-0.5">{productos.length} REVISIONES PENDIENTES</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-open:-rotate-180 transition-transform duration-300">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </summary>
                            
                            <div className="px-6 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                                    {productos.map((prod) => (
                                        <TarjetaPendiente
                                            key={prod.id}
                                            producto={prod}
                                            onClick={setProductoSeleccionado}
                                        />
                                    ))}
                                </div>
                            </div>
                        </details>
                    ))}
                </div>
            )}

            {productoSeleccionado && (
                <PanelEnriquecimiento
                    idProducto={productoSeleccionado}
                    onClose={() => setProductoSeleccionado(null)}
                    onSuccess={() => {
                        setProductoSeleccionado(null);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}