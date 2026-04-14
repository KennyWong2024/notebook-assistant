"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { ViewHistorialProducto } from "@/types/database";
import { Loader2, BookOpen, Search } from "lucide-react";

import BuscadorMagico from "@/components/ui/BuscadorMagico";
import TarjetaHistorial from "@/components/historico/TarjetaHistorial";
import ModalDetalleHistorial from "@/components/historico/ModalDetalleHistorial";

export default function HistorialPage() {
    const [productos, setProductos] = useState<ViewHistorialProducto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistorial = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .schema('sourcing')
                    .from('v_historial_productos')
                    .select('*')
                    .order('codigo_trazabilidad', { ascending: false });

                if (error) throw error;
                setProductos(data || []);
            } catch (error) {
                console.error("Error cargando historial:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistorial();
    }, []);

    const productosFiltrados = useMemo(() => {
        if (!searchTerm.trim()) return productos;
        const terms = searchTerm.toLowerCase().split(" ");

        return productos.filter(p => {
            const searchableText = `
                ${p.nombre_rapido || ''} 
                ${p.proveedor || ''} 
                ${p.codigo_trazabilidad || ''} 
                ${p.feria || ''}
                ${p.categoria || ''}
                ${p.departamento || ''}
            `.toLowerCase();

            return terms.every(term => searchableText.includes(term));
        });
    }, [productos, searchTerm]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-screen">
            <div className="mb-8 md:mb-12 flex flex-col space-y-6 md:space-y-0 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center">
                        <BookOpen className="w-8 h-8 mr-3 text-red-600 hidden md:block" />
                        Historial de Compras
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Busca y revisa la ficha técnica de los productos procesados.</p>
                </div>

                <div className="w-full md:w-[400px] lg:w-[500px]">
                    <BuscadorMagico
                        valor={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Ej. Ugreen, Soporte, CAN-SOP..."
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
            ) : productosFiltrados.length === 0 ? (
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
                        productosFiltrados.reduce((acc, current) => {
                            const feria = current.feria || 'Sin feria asignada';
                            if(!acc[feria]) acc[feria] = [];
                            acc[feria].push(current);
                            return acc;
                        }, {} as Record<string, typeof productosFiltrados>)
                    )
                    .sort(([feriaA], [feriaB]) => feriaA.localeCompare(feriaB))
                    .map(([feria, productos]) => (
                        <details key={feria} open className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden open:pb-6">
                            <summary className="flex items-center justify-between p-6 cursor-pointer select-none outline-none group-open:border-b group-open:border-gray-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-md">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 tracking-tight">{feria}</h2>
                                        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase mt-0.5">{productos.length} PRODUCTOS HISTÓRICOS</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-open:-rotate-180 transition-transform duration-300">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </summary>
                            
                            <div className="px-6 pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                                    {productos.map(producto => (
                                        <TarjetaHistorial
                                            key={producto.id}
                                            producto={producto}
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
                <ModalDetalleHistorial
                    idProducto={productoSeleccionado}
                    onClose={() => setProductoSeleccionado(null)}
                />
            )}
        </div>
    );
}