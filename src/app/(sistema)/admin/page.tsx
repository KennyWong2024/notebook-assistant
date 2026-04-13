"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/database";
import { Search, Shield, AlertCircle, Loader2, UserPlus, User, Power, KeyRound, ChevronDown } from "lucide-react";
import { crearUsuario, alternarEstadoUsuario, restablecerContrasenaUsuario, cambiarRolUsuario } from "@/actions/usuarios";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import UserFormModal from "@/components/admin/UserFormModal";
import ResetPasswordModal from "@/components/admin/ResetPasswordModal";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<'activos' | 'inactivos'>('activos');
    const [searchTerm, setSearchTerm] = useState("");

    // Estados Modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Estado Acción de Filas
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [isRoleUpdating, setIsRoleUpdating] = useState<string | null>(null);

    // Modales de Confirmación y Reseteo
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; user: Profile | null; }>({ isOpen: false, user: null });
    const [resetPassModal, setResetPassModal] = useState<{ isOpen: boolean; user: Profile | null; }>({ isOpen: false, user: null });

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.schema('sourcing').from('perfiles').select('*').order('created_at', { ascending: false });
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

    const usuariosFiltrados = usuarios.filter((user) => {
        const matchesTab = activeTab === 'activos' ? user.estado_activo : !user.estado_activo;
        const matchesSearch = user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleCreateSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        setModalError(""); setSuccessMessage("");

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

    const executeToggle = async () => {
        const user = confirmModal.user;
        if (!user) return;

        setConfirmModal({ isOpen: false, user: null });
        setIsActionLoading(user.id);
        setError("");

        const result = await alternarEstadoUsuario(user.id, user.estado_activo);

        if (result.success) {
            // Reflejamos el cambio visualmente pasándolo a la otra pestaña
            setUsuarios(usuarios.map(u => u.id === user.id ? { ...u, estado_activo: result.nuevoEstado! } : u));
        } else {
            setError(result.error || "Error al cambiar el estado del usuario.");
        }
        setIsActionLoading(null);
    };

    const executeResetPassword = async (userId: string, newPassword: string) => {
        setIsSubmitting(true);
        const result = await restablecerContrasenaUsuario(userId, newPassword);

        if (result.success) {
            alert("Contraseña actualizada correctamente.");
            setResetPassModal({ isOpen: false, user: null });
        } else {
            alert(result.error || "Error al actualizar contraseña.");
        }
        setIsSubmitting(false);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setIsRoleUpdating(userId);
        const result = await cambiarRolUsuario(userId, newRole);

        if (result.success) {
            setUsuarios(usuarios.map(u => u.id === userId ? { ...u, rol: newRole as any } : u));
        } else {
            alert("Error al cambiar el rol: " + result.error);
        }
        setIsRoleUpdating(null);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Gestión de Accesos</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Administra los permisos y el personal.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl font-bold flex justify-center items-center space-x-2 transition-all shadow-lg shadow-red-100 active:scale-95">
                    <UserPlus className="w-5 h-5" />
                    <span>Nuevo Colaborador</span>
                </button>
            </div>

            <div className="flex space-x-2 mb-6 border-b border-gray-200">
                <button onClick={() => setActiveTab('activos')} className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'activos' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    Usuarios Activos
                </button>
                <button onClick={() => setActiveTab('inactivos')} className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'inactivos' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    Usuarios Inactivos
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
                        <input type="text" placeholder="Buscar colaborador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-white transition-all shadow-sm" />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex flex-col items-center space-y-3">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                        <p className="text-gray-400 font-medium text-sm">Consultando base de datos...</p>
                    </div>
                ) : usuariosFiltrados.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-medium">No se encontraron colaboradores en esta sección.</div>
                ) : (
                    <>
                        {/* VISTA MÓVIL */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {usuariosFiltrados.map((user) => (
                                <div key={user.id} className="p-5 bg-white hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${user.estado_activo ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold leading-tight ${user.estado_activo ? "text-gray-900" : "text-gray-500"}`}>{user.nombre_completo}</h3>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center mt-4">
                                        <div className="relative inline-block group">
                                            <Shield className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                            <select
                                                value={user.rol}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={isRoleUpdating === user.id || !user.estado_activo}
                                                className="appearance-none bg-slate-100 text-slate-700 border border-slate-200 rounded-full pl-8 pr-8 py-1.5 text-xs font-bold uppercase tracking-tighter outline-none focus:ring-2 focus:ring-red-600 cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="comprador">Comprador</option>
                                                <option value="gerente">Gerente</option>
                                                <option value="director">Director</option>
                                                <option value="it">IT</option>
                                            </select>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                        </div>
                                        {isRoleUpdating === user.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600 ml-2" />}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
                                        {user.estado_activo && (
                                            <button onClick={() => setResetPassModal({ isOpen: true, user })} className="text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-all">
                                                <KeyRound className="w-4 h-4" /> <span>Clave</span>
                                            </button>
                                        )}
                                        <button onClick={() => setConfirmModal({ isOpen: true, user })} disabled={isActionLoading === user.id} className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all ${user.estado_activo ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100" : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-100"}`}>
                                            {isActionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Power className="w-4 h-4" /> <span>{user.estado_activo ? "Desactivar" : "Reactivar"}</span></>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* VISTA ESCRITORIO */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100">
                                        <th className="p-5 font-bold">Colaborador</th>
                                        <th className="p-5 font-bold">Rol</th>
                                        <th className="p-5 font-bold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {usuariosFiltrados.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="p-5">
                                                <div className={`font-bold ${user.estado_activo ? "text-gray-900" : "text-gray-500"}`}>{user.nombre_completo}</div>
                                                <div className="text-sm text-gray-500 font-medium">{user.email}</div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center space-x-2">
                                                    <div className="relative inline-block group">
                                                        <Shield className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                                        <select
                                                            value={user.rol}
                                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                            disabled={isRoleUpdating === user.id || !user.estado_activo}
                                                            className="appearance-none bg-slate-100 text-slate-700 border border-slate-200 rounded-full pl-8 pr-8 py-1.5 text-xs font-bold uppercase tracking-tighter outline-none focus:ring-2 focus:ring-red-600 cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="comprador">Comprador</option>
                                                            <option value="gerente">Gerente</option>
                                                            <option value="director">Director</option>
                                                            <option value="it">IT</option>
                                                        </select>
                                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                    {isRoleUpdating === user.id && <Loader2 className="w-4 h-4 animate-spin text-red-600" />}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {user.estado_activo && (
                                                        <button onClick={() => setResetPassModal({ isOpen: true, user })} className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm" title="Restablecer Contraseña">
                                                            <KeyRound className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => setConfirmModal({ isOpen: true, user })} disabled={isActionLoading === user.id} className={`p-2.5 bg-white border border-gray-200 rounded-xl transition-all shadow-sm flex items-center justify-center ${user.estado_activo ? "text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50"}`} title={user.estado_activo ? "Desactivar" : "Reactivar"}>
                                                        {isActionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateSubmit} isSubmitting={isSubmitting} modalError={modalError} successMessage={successMessage} />
            <ResetPasswordModal isOpen={resetPassModal.isOpen} user={resetPassModal.user} onClose={() => setResetPassModal({ isOpen: false, user: null })} onConfirm={executeResetPassword} isSubmitting={isSubmitting} />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, user: null })}
                onConfirm={executeToggle}
                title={confirmModal.user?.estado_activo ? "¿Desactivar usuario?" : "¿Reactivar usuario?"}
                description={<>Estás a punto de {confirmModal.user?.estado_activo ? "bloquear" : "restaurar"} el acceso de <strong className="text-gray-900">{confirmModal.user?.nombre_completo}</strong> al sistema.</>}
                variant={confirmModal.user?.estado_activo ? "danger" : "success"}
            />
        </div>
    );
}