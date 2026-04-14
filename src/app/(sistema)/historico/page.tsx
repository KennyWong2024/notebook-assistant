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
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen animate-in fade-in duration-300">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                    {productosFiltrados.map(producto => (
                        <TarjetaHistorial
                            key={producto.id}
                            producto={producto}
                            onClick={setProductoSeleccionado}
                        />
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