"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Fair } from "@/types/database";
import {
    Briefcase, Plus, MapPin, Calendar,
    AlertCircle, X, Loader2, CheckCircle2, Globe, UserPlus
} from "lucide-react";
import ModalAsignacionFeria from "@/components/ferias/ModalAsignacionFeria";

export default function FeriasPage() {
    const [ferias, setFerias] = useState<Fair[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [feriaParaAsignar, setFeriaParaAsignar] = useState<Fair | null>(null);

    const [nombre, setNombre] = useState("");
    const [region, setRegion] = useState("");
    const [pais, setPais] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: perfil } = await supabase.schema('sourcing').from('perfiles')
                    .select('rol').eq('id', user.id).single();
                if (perfil) setUserRole(perfil.rol);
            }

            const { data: feriasData, error: feriasError } = await supabase.schema('sourcing')
                .from('ferias')
                .select('*')
                .order('fecha_inicio', { ascending: false });

            if (feriasError) throw feriasError;
            setFerias(feriasData || []);
        } catch (err: any) {
            setError(err.message || "Error al cargar las ferias.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa.");

            const { error: dbError } = await supabase.schema('sourcing').from('ferias').insert({
                nombre,
                region,
                pais,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin || null,
                creado_por: user.id,
                estado_activo: true
            });

            if (dbError) throw dbError;

            setSuccessMessage("Feria creada y activada con éxito.");
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMessage("");
                setNombre(""); setRegion(""); setPais(""); setFechaInicio(""); setFechaFin("");
                fetchData();
            }, 1500);

        } catch (err: any) {
            setModalError(err.message || "Ocurrió un error al guardar la feria.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Gestión de Ferias</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Catálogo de eventos logísticos e internacionales.</p>
                </div>

                {(userRole === 'it' || userRole === 'director') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl font-bold flex justify-center items-center space-x-2 transition-all shadow-lg shadow-red-100 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nueva Feria</span>
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-6 flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
            ) : ferias.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                        <Briefcase className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No hay ferias registradas</h3>
                    <p className="text-gray-500 mt-1 text-sm">Crea la primera feria para empezar a recolectar prospectos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {ferias.map((feria) => (
                        <div key={feria.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between group">
                            <div>
                                {feria.estado_activo && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                                        Activa
                                    </div>
                                )}
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-red-600 transition-colors">{feria.nombre}</h3>

                                        <div className="mt-3 space-y-1.5 mb-4">
                                            <div className="flex items-center text-sm text-gray-500 font-medium">
                                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                {feria.region ? `${feria.region}, ${feria.pais}` : (feria.pais || 'Ubicación no definida')}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500 font-medium">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(feria.fecha_inicio).toLocaleDateString()}
                                                {feria.fecha_fin && ` - ${new Date(feria.fecha_fin).toLocaleDateString()}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(userRole === 'it' || userRole === 'director') && (
                                <div className="pt-4 border-t border-gray-50 mt-auto">
                                    <button
                                        onClick={() => setFeriaParaAsignar(feria)}
                                        className="w-full py-2.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl text-sm font-bold transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        <span>Gestionar Equipo</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end md:justify-center md:items-center z-[60] p-0 md:p-4 items-end">
                    <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 md:fade-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Crear Nueva Feria</h2>
                            <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 max-h-[85vh] overflow-y-auto">
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
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre del Evento</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                                        <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all" placeholder="Ej: Canton Fair 2026" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">País</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                                            <input type="text" required value={pais} onChange={(e) => setPais(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all" placeholder="China" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Región/Ciudad</label>
                                        <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all" placeholder="Guangzhou" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Fecha de Inicio</label>
                                        <input type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all text-gray-700" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Fecha de Fin</label>
                                        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all text-gray-700" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex space-x-3">
                                <button type="button" disabled={isSubmitting} onClick={() => setIsModalOpen(false)} className="flex-1 bg-white border border-gray-200 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex justify-center items-center">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Guardar Feria</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {feriaParaAsignar && (
                <ModalAsignacionFeria
                    feriaId={feriaParaAsignar.id}
                    feriaNombre={feriaParaAsignar.nombre}
                    onClose={() => setFeriaParaAsignar(null)}
                />
            )}
        </div>
    );
}