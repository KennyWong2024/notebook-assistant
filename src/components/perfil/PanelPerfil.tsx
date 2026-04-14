"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, Lock, Mail, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function PanelPerfil() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [email, setEmail] = useState("");
    const [nombre, setNombre] = useState("");
    const [rol, setRol] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                setEmail(user.email || "");

                const { data: perfilData, error } = await supabase
                    .schema('sourcing')
                    .from('perfiles')
                    .select('nombre_completo, rol')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (perfilData) {
                    setNombre(perfilData.nombre_completo);
                    setRol(perfilData.rol);
                }
            } catch (error: any) {
                setMessage({ type: 'error', text: "Error al cargar los datos del perfil." });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        if (password && password !== confirmPassword) {
            setMessage({ type: 'error', text: "Las contraseñas no coinciden." });
            setSaving(false);
            return;
        }

        if (password && password.length < 6) {
            setMessage({ type: 'error', text: "La contraseña debe tener al menos 6 caracteres." });
            setSaving(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa.");

            const { error: dbError } = await supabase
                .schema('sourcing')
                .from('perfiles')
                .update({ nombre_completo: nombre })
                .eq('id', user.id);

            if (dbError) throw dbError;

            if (password) {
                const { error: authError } = await supabase.auth.updateUser({
                    password: password
                });
                if (authError) throw authError;
            }

            setMessage({ type: 'success', text: "Perfil actualizado correctamente." });
            setPassword("");
            setConfirmPassword("");

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Ocurrió un error al guardar." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Mi Perfil</h1>
                <p className="text-sm text-gray-500 mt-1 font-medium">Gestiona tu información personal y seguridad.</p>
            </div>

            {message && (
                <div className={`mb-6 flex items-center space-x-3 p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <p className="font-bold text-sm">{message.text}</p>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

                    <div className="space-y-5">
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Datos Personales</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Correo (Corporativo)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 text-gray-500 rounded-2xl font-medium cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Rol en Sistema</label>
                                <input
                                    type="text"
                                    value={rol.toUpperCase()}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 text-gray-500 rounded-2xl font-bold tracking-wider cursor-not-allowed"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 pt-4">
                        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Seguridad</h3>
                        <p className="text-xs text-gray-500 font-medium">Deja estos campos en blanco si no deseas cambiar tu contraseña actual.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nueva Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirmar Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-red-100 flex justify-center items-center space-x-2 disabled:opacity-50 active:scale-95"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Guardar Cambios</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}