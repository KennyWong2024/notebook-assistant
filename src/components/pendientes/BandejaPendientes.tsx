"use client";

import { useState, useMemo } from "react";
import { usePendientes } from "@/hooks/usePendientes";
import { Loader2, LayoutGrid, ClipboardList, Search } from "lucide-react";
import PanelEnriquecimiento from "./PanelEnriquecimiento";
import TarjetaPendiente from "./TarjetaPendiente";
import BuscadorMagico from "@/components/ui/BuscadorMagico";
import ContenedorPagina from "@/components/ui/ContenedorPagina";

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
        <ContenedorPagina>
            {/* Header y Buscador */}
            <div className="mb-6 md:mb-8 flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center">
                        <ClipboardList className="w-6 h-6 md:w-8 md:h-8 mr-3 text-red-600 hidden md:block" />
                        Mis Pendientes
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2 font-medium">
                        Productos capturados pendientes de enriquecer. ({pendientesFiltrados.length} listos)
                    </p>
                </div>

                <div className="w-full md:w-[400px]">
                    <BuscadorMagico
                        valor={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Ej. Ugreen, Soporte..."
                    />
                </div>
            </div>

            {/* Contenido */}
            {pendientes.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center mt-8 shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <LayoutGrid className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Bandeja Limpia</h2>
                    <p className="text-gray-500 max-w-sm">
                        No tienes productos pendientes de enriquecer. ¡Todo al día!
                    </p>
                </div>
            ) : pendientesFiltrados.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center mt-8 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No encontramos resultados</h3>
                    <p className="text-gray-500 mt-2">Intenta buscar con otra palabra clave o proveedor.</p>
                </div>
            ) : (
                <div className="flex flex-col space-y-3 md:space-y-4 pb-20">
                    {pendientesFiltrados.map((prod) => (
                        <TarjetaPendiente
                            key={prod.id}
                            producto={prod}
                            onClick={setProductoSeleccionado}
                        />
                    ))}
                </div>
            )}

            {/* Modal de Enriquecimiento */}
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
        </ContenedorPagina>
    );
}