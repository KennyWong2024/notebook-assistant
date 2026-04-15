"use client";

import { useState, useEffect } from "react";
import { ViewHistorialProducto } from "@/types/database";
import { Loader2, BookOpen, Search, ArrowLeft, ChevronRight, Folder, ChevronLeft } from "lucide-react";

import BuscadorMagico from "@/components/ui/BuscadorMagico";
import TarjetaHistorial from "@/components/historico/TarjetaHistorial";
import ModalDetalleHistorial from "@/components/historico/ModalDetalleHistorial";
import { getResumenFerias, getProductosPaginados } from "@/actions/productos";
import ContenedorPagina from "@/components/ui/ContenedorPagina";

type ResumenFeria = { feria: string; cantidad_productos: number };

export default function PanelHistorico() {
    const [resumenFerias, setResumenFerias] = useState<ResumenFeria[]>([]);
    const [productos, setProductos] = useState<ViewHistorialProducto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
    const [feriaSeleccionada, setFeriaSeleccionada] = useState<string | null>(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const POR_PAGINA = 20;

    // 1. Cargar el resumen de ferias al inicio
    useEffect(() => {
        const fetchFerias = async () => {
            setLoading(true);
            const res = await getResumenFerias();
            if (res.success && res.data) {
                setResumenFerias(res.data);
            }
            setLoading(false);
        };
        fetchFerias();
    }, []);

    // 2. Cargar productos cuando cambia la feria, la página o hay búsqueda
    useEffect(() => {
        if (!feriaSeleccionada && !searchTerm.trim()) {
            setProductos([]);
            return;
        }

        const fetchProductos = async () => {
            setLoading(true);
            const res = await getProductosPaginados(feriaSeleccionada, searchTerm, paginaActual, POR_PAGINA);

            if (res.success && res.data) {
                setProductos(res.data);
                setTotalPaginas(res.totalPaginas || 1);
            }
            setLoading(false);
        };

        const timer = setTimeout(() => {
            fetchProductos();
        }, 300);

        return () => clearTimeout(timer);
    }, [feriaSeleccionada, searchTerm, paginaActual]);

    useEffect(() => {
        setPaginaActual(1);
    }, [feriaSeleccionada, searchTerm]);

    const handleVolver = () => {
        setFeriaSeleccionada(null);
        setSearchTerm("");
        setPaginaActual(1);
    };

    return (
        <ContenedorPagina>
            {/* Header y Buscador */}
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-end md:justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center">
                        <BookOpen className="w-6 h-6 md:w-8 md:h-8 mr-3 text-red-600 hidden md:block" />
                        Historial de Compras
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2 font-medium">
                        {feriaSeleccionada && !searchTerm ? `Explorando: ${feriaSeleccionada}` : 'Busca y revisa fichas técnicas.'}
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

            {/* Navegación (Botón Volver) */}
            {feriaSeleccionada && !searchTerm && (
                <button
                    onClick={handleVolver}
                    className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full w-fit flex-shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a Ferias
                </button>
            )}

            {/* Contenido Principal */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                    </div>
                ) : searchTerm.trim() || feriaSeleccionada ? (
                    // VIEW 2: LISTA DE PRODUCTOS
                    productos.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center mt-8">
                            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No encontramos resultados</h3>
                            <p className="text-gray-500 mt-2">Intenta buscar con otra palabra clave.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Lista de tarjetas */}
                            <div className="flex flex-col space-y-3 md:space-y-4 mb-8">
                                {productos.map(producto => (
                                    <TarjetaHistorial
                                        key={producto.id}
                                        producto={producto}
                                        onClick={setProductoSeleccionado}
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
                    )
                ) : (
                    // VIEW 1: LISTADO DE FERIAS
                    <div className="flex flex-col space-y-3 md:space-y-4">
                        {resumenFerias.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">No hay ferias registradas.</div>
                        ) : (
                            resumenFerias.map((item) => (
                                <div
                                    key={item.feria}
                                    onClick={() => setFeriaSeleccionada(item.feria)}
                                    className="group bg-white rounded-2xl md:rounded-3xl border border-gray-100 p-4 md:p-6 cursor-pointer hover:border-red-200 hover:shadow-md transition-all flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gray-50 group-hover:bg-red-50 text-gray-400 group-hover:text-red-500 rounded-2xl flex items-center justify-center transition-colors">
                                            <Folder className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-base md:text-xl font-black text-gray-900">{item.feria}</h2>
                                            <p className="text-xs md:text-sm font-bold text-gray-400 mt-0.5">{item.cantidad_productos} Productos</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-red-500 group-hover:text-white transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Detalle */}
            {productoSeleccionado && (
                <ModalDetalleHistorial
                    idProducto={productoSeleccionado}
                    onClose={() => setProductoSeleccionado(null)}
                />
            )}
        </ContenedorPagina>
    );
}