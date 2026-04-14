"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { ViewDirectorioProveedor } from "@/types/database";
import { Loader2, Building2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import BuscadorMagico from "@/components/ui/BuscadorMagico";
import TarjetaProveedor from "./TarjetaProveedor";

export default function PanelProveedores() {
    const router = useRouter();
    const [proveedores, setProveedores] = useState<ViewDirectorioProveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchProveedores = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .schema('sourcing')
                    .from('v_directorio_proveedores')
                    .select('*')
                    .order('nombre_empresa', { ascending: true });

                if (error) throw error;
                setProveedores(data || []);
            } catch (error) {
                console.error("Error cargando proveedores:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProveedores();
    }, []);

    const proveedoresFiltrados = useMemo(() => {
        if (!searchTerm.trim()) return proveedores;
        const terms = searchTerm.toLowerCase().split(" ");

        return proveedores.filter(p => {
            const searchableText = `
                ${p.nombre_empresa || ''} 
                ${p.pais_origen || ''} 
                ${p.sap_bp_id || ''}
            `.toLowerCase();

            return terms.every(term => searchableText.includes(term));
        });
    }, [proveedores, searchTerm]);

    const handleAbrirShowroom = (idProveedor: string) => {
        router.push(`/proveedores/${idProveedor}`);
    };

    return (
        <div className="space-y-8">
            <div className="mb-8 md:mb-12 flex flex-col space-y-6 md:space-y-0 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center">
                        <Building2 className="w-8 h-8 mr-3 text-red-600 hidden md:block" />
                        Directorio de Proveedores
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Explora el catálogo universal y revisa los prospectos de cada fábrica.</p>
                </div>

                <div className="w-full md:w-[400px] lg:w-[500px]">
                    <BuscadorMagico
                        valor={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar por empresa, país o ID SAP..."
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
            ) : proveedoresFiltrados.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-12 flex flex-col items-center justify-center text-center mt-8">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No encontramos resultados</h3>
                    <p className="text-gray-500 mt-2">Intenta buscar con otro nombre o país.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {proveedoresFiltrados.map(proveedor => (
                        <TarjetaProveedor
                            key={proveedor.id}
                            proveedor={proveedor}
                            onClick={handleAbrirShowroom}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}