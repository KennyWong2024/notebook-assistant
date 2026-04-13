import { X, Loader2, AlertCircle, Briefcase, Globe, CheckCircle2 } from "lucide-react";
import { Fair } from "@/types/database";
import { useState, useEffect } from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (datos: Partial<Fair>) => Promise<void>;
    feriaEditando: Fair | null;
    isSubmitting: boolean;
    modalError: string;
    successMessage: string;
}

export default function FeriaFormModal({ isOpen, onClose, onSubmit, feriaEditando, isSubmitting, modalError, successMessage }: Props) {
    const [nombre, setNombre] = useState("");
    const [region, setRegion] = useState("");
    const [pais, setPais] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");

    useEffect(() => {
        if (feriaEditando) {
            setNombre(feriaEditando.nombre);
            setRegion(feriaEditando.region || "");
            setPais(feriaEditando.pais || "");
            setFechaInicio(feriaEditando.fecha_inicio);
            setFechaFin(feriaEditando.fecha_fin || "");
        } else {
            setNombre(""); setRegion(""); setPais(""); setFechaInicio(""); setFechaFin("");
        }
    }, [feriaEditando, isOpen]);

    if (!isOpen) return null;

    const handleSubmitLocal = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ nombre, region, pais, fecha_inicio: fechaInicio, fecha_fin: fechaFin });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end md:justify-center md:items-center z-[60] p-0 md:p-4 items-end">
            <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-10 md:fade-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                        {feriaEditando ? "Editar Feria" : "Crear Nueva Feria"}
                    </h2>
                    <button onClick={() => !isSubmitting && onClose()} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmitLocal} className="p-6 md:p-8 space-y-5 max-h-[85vh] overflow-y-auto">
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
                        <button type="button" disabled={isSubmitting} onClick={onClose} className="flex-1 bg-white border border-gray-200 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex justify-center items-center">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{feriaEditando ? "Guardar Cambios" : "Guardar Feria"}</span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}