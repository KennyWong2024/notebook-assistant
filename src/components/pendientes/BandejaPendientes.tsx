"use client";

import { useState, useMemo } from "react";
import { usePendientes } from "@/hooks/usePendientes";
import { Loader2, LayoutGrid, Map, ChevronRight, PackageSearch } from "lucide-react";
import FiltrosBandeja from "./FiltrosBandeja";
import PanelEnriquecimiento from "./PanelEnriquecimiento";

export default function BandejaPendientes() {
    const { pendientes, loading, error, refetch } = usePendientes();
    const [search, setSearch] = useState("");
    const [feriaSeleccionada, setFeriaSeleccionada] = useState("");
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");

    const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);

    const feriasDisponibles = useMemo(() => {
        const ferias = pendientes.map(p => p.feria);
        return Array.from(new Set(ferias)).sort();
    }, [pendientes]);

    const proveedoresDisponibles = useMemo(() => {
        const proveedores = pendientes.map(p => p.proveedor);
        return Array.from(new Set(proveedores)).sort();
    }, [pendientes]);

    const pendientesFiltrados = useMemo(() => {
        return pendientes.filter(prod => {
            const matchSearch = prod.nombre_rapido?.toLowerCase().includes(search.toLowerCase()) ||
                prod.codigo_trazabilidad.toLowerCase().includes(search.toLowerCase());
            const matchFeria = feriaSeleccionada === "" || prod.feria === feriaSeleccionada;
            const matchProveedor = proveedorSeleccionado === "" || prod.proveedor === proveedorSeleccionado;

            return matchSearch && matchFeria && matchProveedor;
        });
    }, [pendientes, search, feriaSeleccionada, proveedorSeleccionado]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-500" />
                <p className="font-bold animate-pulse">Cargando tus pendientes...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500 bg-red-50 rounded-2xl text-center font-bold">Error: {error}</div>;
    }

    if (pendientes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <LayoutGrid className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">No hay pendientes</h2>
                <p className="text-gray-500 max-w-sm">
                    Ve a la sección de Captura desde tu móvil para empezar a registrar prospectos en la feria.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="max-w-2xl">
                <FiltrosBandeja
                    search={search}
                    onSearchChange={setSearch}
                    feriaSeleccionada={feriaSeleccionada}
                    onFeriaChange={setFeriaSeleccionada}
                    proveedorSeleccionado={proveedorSeleccionado}
                    onProveedorChange={setProveedorSeleccionado}
                    feriasDisponibles={feriasDisponibles}
                    proveedoresDisponibles={proveedoresDisponibles}
                />
            </div>

            <div className="flex items-center justify-between px-2 mb-4">
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                    Por Enriquecer ({pendientesFiltrados.length})
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pendientesFiltrados.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No hay productos que coincidan con los filtros.
                    </div>
                ) : (
                    pendientesFiltrados.map((prod) => (
                        <button
                            key={prod.id}
                            onClick={() => setProductoSeleccionado(prod.id)}
                            className="w-full bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex items-center space-x-4 hover:border-red-200 hover:shadow-md transition-all group text-left"
                        >
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
                                {prod.foto_url ? (
                                    <img src={prod.foto_url} alt={prod.nombre_rapido || 'Producto'} className="w-full h-full object-cover" />
                                ) : (
                                    <PackageSearch className="w-8 h-8 text-gray-300" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 py-1">
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1 truncate">
                                    {prod.proveedor}
                                </p>
                                <h3 className="text-base font-black text-gray-900 truncate mb-1">
                                    {prod.nombre_rapido}
                                </h3>
                                <div className="flex items-center space-x-3 text-xs font-medium text-gray-500">
                                    <span className="flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                                        <Map className="w-3 h-3 mr-1" />
                                        <span className="truncate max-w-[80px]">{prod.feria}</span>
                                    </span>
                                    {prod.precio_referencia && (
                                        <span className="font-bold text-gray-700">
                                            {prod.moneda} {prod.precio_referencia}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition-colors">
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                            </div>
                        </button>
                    ))
                )}
            </div>

            <PanelEnriquecimiento
                idProducto={productoSeleccionado}
                onClose={() => setProductoSeleccionado(null)}
                onSuccess={() => {
                    setProductoSeleccionado(null);
                    refetch();
                }}
            />
        </div>
    );
}