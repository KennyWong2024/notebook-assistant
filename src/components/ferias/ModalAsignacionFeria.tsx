"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, UserPlus, Check, User } from "lucide-react";
import { Profile } from "@/types/database";

interface Props {
    feriaId: string;
    feriaNombre: string;
    onClose: () => void;
}

export default function ModalAsignacionFeria({ feriaId, feriaNombre, onClose }: Props) {
    const [usuarios, setUsuarios] = useState<Profile[]>([]);
    const [asignados, setAsignados] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        const cargarDatos = async () => {
            const { data: usersData } = await supabase.schema('sourcing')
                .from('perfiles').select('*').eq('estado_activo', true);

            if (usersData) setUsuarios(usersData);

            const { data: asignaciones } = await supabase.schema('sourcing')
                .from('asignaciones_feria').select('id_usuario').eq('id_feria', feriaId);

            if (asignaciones) {
                setAsignados(new Set(asignaciones.map(a => a.id_usuario)));
            }
            setLoading(false);
        };
        cargarDatos();
    }, [feriaId]);

    const toggleAsignacion = async (usuarioId: string) => {
        setSaving(usuarioId);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Sin sesión");

            const yaAsignado = asignados.has(usuarioId);

            if (yaAsignado) {
                // Desasignar
                await supabase.schema('sourcing').from('asignaciones_feria')
                    .delete().match({ id_feria: feriaId, id_usuario: usuarioId });

                const nuevos = new Set(asignados);
                nuevos.delete(usuarioId);
                setAsignados(nuevos);
            } else {
                // Asignar
                await supabase.schema('sourcing').from('asignaciones_feria')
                    .insert({ id_feria: feriaId, id_usuario: usuarioId, asignado_por: user.id });

                const nuevos = new Set(asignados);
                nuevos.add(usuarioId);
                setAsignados(nuevos);
            }
        } catch (error) {
            console.error("Error al modificar asignación:", error);
            alert("Error al guardar el cambio.");
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end md:justify-center md:items-center z-[60] p-0 md:p-4 items-end">
            <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 md:fade-in duration-200 flex flex-col max-h-[90vh]">

                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Personal Asignado</h2>
                        <p className="text-xs text-red-600 font-bold uppercase tracking-widest">{feriaNombre}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-red-600" /></div>
                    ) : (
                        <div className="space-y-2">
                            {usuarios.map(u => {
                                const isAssigned = asignados.has(u.id);
                                const isUpdating = saving === u.id;
                                return (
                                    <div key={u.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isAssigned ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAssigned ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm leading-tight">{u.nombre_completo}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">{u.rol}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleAsignacion(u.id)}
                                            disabled={isUpdating}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isAssigned ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                isAssigned ? <Check className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}