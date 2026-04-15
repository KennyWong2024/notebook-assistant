"use client";

import { useState, useEffect } from "react";
import { ViewDirectorioProveedor } from "@/types/database";
import { Loader2, Building2, Search, ChevronLeft, ChevronRight } from "lucide-react";

import BuscadorMagico from "@/components/ui/BuscadorMagico";
import TarjetaProveedor from "./TarjetaProveedor";
import { getProveedoresPaginados } from "@/actions/proveedores";

export default function PanelProveedores() {
    const [proveedores, setProveedores] = useState<ViewDirectorioProveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const POR_PAGINA = 20;

    useEffect(() => {
        const fetchProveedores = async () => {
            setLoading(true);
            const res = await getProveedoresPaginados(searchTerm, paginaActual, POR_PAGINA);

            if (res.success && res.data) {
                setProveedores(res.data);
                setTotalPaginas(res.totalPaginas || 1);
            }
            setLoading(false);
        };

        const timer = setTimeout(() => {
            fetchProveedores();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, paginaActual]);

    useEffect(() => {
        setPaginaActual(1);
    }, [searchTerm]);

    return (
        <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 min-h-screen flex flex-col">

            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-end md:justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center">
                        <Building2 className="w-6 h-6 md:w-8 md:h-8 mr-3 text-red-600 hidden md:block" />
                        Directorio de Proveedores
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2 font-medium">Explora el catálogo universal y sus fábricas.</p>
                </div>

                <div className="w-full md:w-[400px]">
                    <BuscadorMagico
                        valor={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Ej. Empresa, país o SAP..."
                    />
                </div>
            </div>

            <div className="flex-1">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                    </div>
                ) : proveedores.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center mt-8 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No encontramos resultados</h3>
                        <p className="text-gray-500 mt-2">Intenta buscar con otro nombre o país.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex flex-col space-y-3 md:space-y-4 mb-8">
                            {proveedores.map(proveedor => (
                                <TarjetaProveedor
                                    key={proveedor.id}
                                    proveedor={proveedor}
                                />
                            ))}
                        </div>

                        {/* Controles de Paginación */}
                        {totalPaginas > 1 && (
                            <div className="flex items-center justify-center space-x-4 mt-auto pb-10">
                                <button
                                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                    disabled={paginaActual === 1}
                                    className="p-2 md:px-4 md:py-2 flex items-center justify-center bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 md:mr-1" />
                                    <span className="hidden md:inline">Anterior</span>
                                </button>

                                <span className="text-sm font-bold text-gray-500">
                                    Página {paginaActual} de {totalPaginas}
                                </span>

                                <button
                                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                                    disabled={paginaActual === totalPaginas}
                                    className="p-2 md:px-4 md:py-2 flex items-center justify-center bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <span className="hidden md:inline">Siguiente</span>
                                    <ChevronRight className="w-5 h-5 md:ml-1" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}