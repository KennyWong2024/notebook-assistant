"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/database";
import {
    Search, Shield, AlertCircle, X,
    Loader2, UserPlus, CheckCircle2, User, Power
} from "lucide-react";
import { crearUsuario, alternarEstadoUsuario } from "@/actions/usuarios";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .schema('sourcing')
                .from('perfiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsuarios(data || []);
        } catch (err: any) {
            setError(err.message || "Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError("");
        setSuccessMessage("");

        const formData = new FormData(e.currentTarget);
        const result = await crearUsuario(formData);

        if (result.success) {
            setSuccessMessage("¡Colaborador creado con éxito!");
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMessage("");
                fetchData();
            }, 1500);
        } else {
            setModalError(result.error || "Ocurrió un error inesperado.");
            setIsSubmitting(false);
        }
    };

    const handleToggleEstado = async (userId: string, estadoActual: boolean) => {
        const accion = estadoActual ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Estás seguro de que deseas ${accion} a este colaborador?`)) return;

        setIsActionLoading(userId);
        setError("");

        const result = await alternarEstadoUsuario(userId, estadoActual);

        if (result.success) {
            setUsuarios(usuarios.map(u =>
                u.id === userId ? { ...u, estado_activo: result.nuevoEstado! } : u
            ));
        } else {
            setError(result.error || "Error al cambiar el estado del usuario.");
        }
        setIsActionLoading(null);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">

            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Gestión de Accesos</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Administra los permisos y el personal.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl font-bold flex justify-center items-center space-x-2 transition-all shadow-lg shadow-red-100 active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    <span>Nuevo Colaborador</span>
                </button>
            </div>

            {error && (
                <div className="mb-6 flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar colaborador..."
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex flex-col items-center space-y-3">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                        <p className="text-gray-400 font-medium text-sm">Consultando base de datos...</p>
                    </div>
                ) : usuarios.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-medium">No se encontraron colaboradores.</div>
                ) : (
                    <>
                        <div className="md:hidden divide-y divide-gray-100">
                            {usuarios.map((user) => (
                                <div key={user.id} className={`p-5 transition-colors ${user.estado_activo ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 grayscale-[30%]'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${user.estado_activo ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-200 text-gray-400 border-gray-300"
                                                }`}>
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold leading-tight ${user.estado_activo ? "text-gray-900" : "text-gray-500"}`}>
                                                    {user.nombre_completo}
                                                </h3>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                                            {(user.rol === 'it' || user.rol === 'director') && <Shield className="w-3 h-3" />}
                                            <span>{user.rol}</span>
                                        </span>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.estado_activo
                                                ? "bg-green-50 text-green-700 border-green-100"
                                                : "bg-gray-100 text-gray-500 border-gray-200"
                                            }`}>
                                            {user.estado_activo ? "Activo" : "Inactivo"}
                                        </span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                        <button
                                            onClick={() => handleToggleEstado(user.id, user.estado_activo)}
                                            disabled={isActionLoading === user.id}
                                            className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all ${user.estado_activo
                                                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                                                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-100"
                                                }`}
                                        >
                                            {isActionLoading === user.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Power className="w-4 h-4" />
                                                    <span>{user.estado_activo ? "Desactivar Acceso" : "Reactivar Acceso"}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100">
                                        <th className="p-5 font-bold">Colaborador</th>
                                        <th className="p-5 font-bold">Rol en Sistema</th>
                                        <th className="p-5 font-bold text-center">Estado</th>
                                        <th className="p-5 font-bold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {usuarios.map((user) => (
                                        <tr key={user.id} className={`transition-colors group ${user.estado_activo ? 'hover:bg-gray-50/30' : 'bg-gray-50/30'}`}>
                                            <td className="p-5">
                                                <div className={`font-bold transition-colors ${user.estado_activo ? "text-gray-900 group-hover:text-red-600" : "text-gray-500"}`}>
                                                    {user.nombre_completo}
                                                </div>
                                                <div className="text-sm text-gray-500 font-medium">{user.email}</div>
                                            </td>
                                            <td className="p-5">
                                                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-tighter">
                                                    {(user.rol === 'it' || user.rol === 'director') && <Shield className="w-3.5 h-3.5" />}
                                                    <span>{user.rol}</span>
                                                </span>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter border ${user.estado_activo
                                                        ? "bg-green-50 text-green-700 border-green-100"
                                                        : "bg-gray-100 text-gray-500 border-gray-200"
                                                    }`}>
                                                    {user.estado_activo ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => handleToggleEstado(user.id, user.estado_activo)}
                                                    disabled={isActionLoading === user.id}
                                                    className={`p-2.5 rounded-full transition-all flex items-center justify-center ml-auto ${user.estado_activo
                                                            ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                            : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                                        }`}
                                                    title={user.estado_activo ? "Desactivar acceso" : "Reactivar acceso"}
                                                >
                                                    {isActionLoading === user.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Power className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end md:justify-center md:items-center z-[60] p-0 md:p-4 items-end">
                    <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 md:fade-in md:zoom-in-95 duration-200">

                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Nuevo Acceso</h2>
                            </div>
                            <button
                                onClick={() => !isSubmitting && setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 max-h-[85vh] overflow-y-auto pb-10 md:pb-8">
                            {modalError && (
                                <div className="flex items-center space-x-3 text-red-600 text-sm bg-red-50 p-4 rounded-2xl border border-red-100">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="font-bold">{modalError}</p>
                                </div>
                            )}
                            {successMessage && (
                                <div className="flex items-center space-x-3 text-green-700 text-sm bg-green-50 p-4 rounded-2xl border border-green-100">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <p className="font-bold">{successMessage}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                                    <input type="text" name="nombre" required placeholder="Nombre del colaborador" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all" />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Correo Pequeño Mundo</label>
                                    <input type="email" name="email" required placeholder="usuario@pequenomundo.com" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all" />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Rol</label>
                                    <select name="rol" required className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-bold text-gray-700 transition-all">
                                        <option value="comprador">Comprador</option>
                                        <option value="gerente">Gerente</option>
                                        <option value="director">Director</option>
                                        <option value="it">IT</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Contraseña Temporal</label>
                                    <input type="password" name="password" required minLength={6} placeholder="Mínimo 6 caracteres" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all" />
                                </div>
                            </div>

                            <div className="pt-4 flex space-x-3">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white border border-gray-200 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex justify-center items-center"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Guardar</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}