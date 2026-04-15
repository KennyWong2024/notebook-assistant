"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, Save, UserCircle, Mail, AlertCircle, MapPin } from "lucide-react";

interface Props {
    proveedor: { id: string; nombre_empresa: string; contacto_principal: string | null; email_contacto: string | null; pais_origen: string | null };
    onClose: () => void;
    onSuccess: () => void;
}

export default function ModalEditarProveedor({ proveedor, onClose, onSuccess }: Props) {
    const [contacto, setContacto] = useState(proveedor.contacto_principal || "");
    const [email, setEmail] = useState(proveedor.email_contacto || "");
    const [pais, setPais] = useState(proveedor.pais_origen || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const term = proveedor.nombre_empresa.trim().toLowerCase();
    const noEditable = term === 'pendiente de definir' || term === 'por definir' || term.startsWith('s/n');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { error: dbError } = await supabase.schema('sourcing')
                .from('proveedores')
                .update({
                    contacto_principal: contacto.trim() || null,
                    email_contacto: email.trim() || null,
                    pais_origen: pais.trim() || null
                })
                .eq('id', proveedor.id);

            if (dbError) throw dbError;
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Error al actualizar el proveedor. Verifica tus permisos.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Editar Proveedor</p>
                        <h2 className="text-xl font-black text-gray-900 truncate max-w-[250px]">{proveedor.nombre_empresa}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {noEditable ? (
                    <div className="p-8 text-center space-y-4 border-t border-gray-100">
                        <div className="flex justify-center mb-2"><AlertCircle className="w-12 h-12 text-yellow-500" /></div>
                        <h3 className="text-lg font-bold text-gray-900">Proveedor Genérico Intocable</h3>
                        <p className="text-sm text-gray-600">Este es un contenedor autogenerado para productos capturados sin fábrica. No es un proveedor real y su nombre global no se puede modificar.</p>
                        <p className="text-xs text-gray-400 mt-4 font-bold rounded-xl bg-gray-50 py-3 px-2">Para asignar al proveedor correcto, edita el Perfil del Producto de cada artículo de forma individual.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">País de Origen</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={pais}
                                    onChange={(e) => setPais(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm font-medium text-gray-800 transition-all"
                                    placeholder="Ej: China"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre del Contacto (Agente)</label>
                            <div className="relative">
                                <UserCircle className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={contacto}
                                    onChange={(e) => setContacto(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm font-medium text-gray-800 transition-all"
                                    placeholder="Ej: Bruce Wayne"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm font-medium text-gray-800 transition-all"
                                    placeholder="ventas@proveedor.com"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center space-x-2 text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100 font-bold">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-200 flex justify-center items-center active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> GUARDAR DATOS</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}