"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ViewHistorialProducto } from "@/types/database";
import { Loader2, Building2, MapPin, Mail, UserCircle, Database, Edit2, ArrowLeft, PackageSearch, History } from "lucide-react";
import Link from "next/link";
import TarjetaHistorial from "@/components/historico/TarjetaHistorial";
import ModalDetalleHistorial from "@/components/historico/ModalDetalleHistorial";
import ModalEditarProveedor from "./ModalEditarProveedor";

export default function ShowroomProveedor({ idProveedor }: { idProveedor: string }) {
    const [proveedor, setProveedor] = useState<any>(null);
    const [interacciones, setInteracciones] = useState<any[]>([]);
    const [productos, setProductos] = useState<ViewHistorialProducto[]>([]);
    const [showHistorialCorreos, setShowHistorialCorreos] = useState(false);
    const [loading, setLoading] = useState(true);
    const [canEdit, setCanEdit] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);

    const fetchDatos = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Traer Proveedor
            const { data: provData, error: provError } = await supabase.schema('sourcing')
                .from('proveedores')
                .select('*')
                .eq('id', idProveedor)
                .single();

            if (provError) throw provError;
            setProveedor(provData);

            if (user) {
                const { data: perfil } = await supabase.schema('sourcing').from('perfiles').select('rol').eq('id', user.id).single();
                if (perfil?.rol === 'it' || perfil?.rol === 'director' || provData.creado_por === user.id) {
                    setCanEdit(true);
                }
            }

            // 1.5 Traer Historial de Correos/Encuentros
            const { data: interaccionesData } = await supabase.schema('sourcing')
                .from('proveedor_feria_interacciones')
                .select('id, fecha_interaccion, email_contacto, nombre_contacto, ferias(nombre)')
                .eq('id_proveedor', idProveedor)
                .order('fecha_interaccion', { ascending: false });

            setInteracciones(interaccionesData || []);

            // 2. Traer Productos
            const { data: prodData, error: prodError } = await supabase.schema('sourcing')
                .from('v_historial_productos')
                .select('*')
                .eq('id_proveedor', idProveedor)
                .order('codigo_trazabilidad', { ascending: false });

            if (prodError) {
                console.error("Error al traer productos de la vista:", prodError);
            }

            setProductos(prodData || []);

        } catch (error) {
            console.error("Error cargando showroom:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDatos();
    }, [idProveedor]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-gray-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-red-600" />
                <p className="font-bold">Abriendo showroom...</p>
            </div>
        );
    }

    if (!proveedor) {
        return <div className="p-8 text-center font-bold text-gray-500">Proveedor no encontrado.</div>;
    }

    return (
        <div className="space-y-8 pb-24 md:pb-10">
            <Link href="/proveedores" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-red-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Directorio
            </Link>

            {/* BANNER DEL PROVEEDOR */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 md:p-10 relative overflow-hidden">
                {proveedor.sap_bp_id && (
                    <div className="absolute top-6 right-6 bg-blue-50 text-blue-600 text-xs font-black uppercase px-4 py-2 rounded-full flex items-center space-x-1 border border-blue-100">
                        <Database className="w-4 h-4" />
                        <span>SAP: {proveedor.sap_bp_id}</span>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100 text-gray-400 mb-6 md:mb-0">
                        <Building2 className="w-10 h-10 md:w-14 md:h-14" />
                    </div>

                    <div className="flex-1">
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-2">
                            {proveedor.nombre_empresa}
                        </h1>
                        <p className="text-gray-500 font-medium flex items-center text-sm md:text-base">
                            <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                            {proveedor.pais_origen || 'País de origen no registrado'}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6 mt-6 pt-6 border-t border-gray-50">
                            <div className="flex items-center text-gray-700 font-medium mb-3 sm:mb-0 mt-2">
                                <UserCircle className="w-5 h-5 mr-2 text-gray-400" />
                                {proveedor.contacto_principal || <span className="text-gray-400 italic">Sin agente de ventas global</span>}
                            </div>
                            <div className="relative mt-2 sm:mt-0">
                                <div className="flex items-center text-gray-700 font-medium">
                                    <Mail className="w-5 h-5 mr-2 text-gray-400" />
                                    {interacciones.length > 0 && interacciones.find(i => i.email_contacto)?.email_contacto ? (
                                        <span>{interacciones.find(i => i.email_contacto)?.email_contacto}</span>
                                    ) : (
                                        proveedor.email_contacto || <span className="text-gray-400 italic">Sin correo registrado</span>
                                    )}
                                    
                                    {interacciones.filter(i => i.email_contacto).length > 0 && (
                                        <button 
                                            onClick={() => setShowHistorialCorreos(!showHistorialCorreos)}
                                            className="ml-2 bg-gray-100 p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title="Ver historial de contactos"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                
                                {showHistorialCorreos && (
                                    <div className="absolute top-10 left-0 w-80 bg-white border border-gray-100 shadow-xl rounded-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                            Historial de Correos en Ferias
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-2">
                                            {interacciones.filter(i => i.email_contacto).map(int => (
                                                <div key={int.id} className="p-3 bg-white hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 flex flex-col mb-1">
                                                    <span className="text-sm font-bold text-gray-900">{int.email_contacto}</span>
                                                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{int.ferias?.nombre || 'Desconocida'}</span>
                                                        <span>{new Date(int.fecha_interaccion).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {proveedor.email_contacto && !interacciones.find(i => i.email_contacto === proveedor.email_contacto) && (
                                                <div className="p-3 bg-white rounded-xl flex flex-col mb-1">
                                                    <span className="text-sm font-bold text-gray-900">{proveedor.email_contacto}</span>
                                                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                                        <span>Correo Global Inicial</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {canEdit && (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="mt-4 sm:mt-0 sm:ml-auto flex items-center text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors bg-red-50 px-4 py-2 rounded-xl"
                                >
                                    <Edit2 className="w-3 h-3 mr-1.5" /> Editar Datos
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN DE PRODUCTOS */}
            <div>
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                    <PackageSearch className="w-6 h-6 mr-2 text-red-600" />
                    Catálogo Prospectado ({productos.length})
                </h2>

                {productos.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PackageSearch className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No hay productos visibles</h3>
                        <p className="text-gray-500 mt-2 text-sm">Este proveedor aún no tiene prospectos capturados por ti o tu equipo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                        {productos.map(producto => (
                            <TarjetaHistorial
                                key={producto.id}
                                producto={producto}
                                onClick={setProductoSeleccionado}
                            />
                        ))}
                    </div>
                )}
            </div>

            {isEditModalOpen && (
                <ModalEditarProveedor
                    proveedor={proveedor}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={() => { setIsEditModalOpen(false); fetchDatos(); }}
                />
            )}

            {productoSeleccionado && (
                <ModalDetalleHistorial
                    idProducto={productoSeleccionado}
                    onClose={() => setProductoSeleccionado(null)}
                    onSuccess={fetchDatos}
                />
            )}
        </div>
    );
}