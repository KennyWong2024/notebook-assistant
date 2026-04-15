"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Fair } from "@/types/database";
import { Plus, AlertCircle, Loader2, Briefcase } from "lucide-react";

import ModalAsignacionFeria from "./ModalAsignacionFeria";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import FeriaCard from "./FeriaCard";
import FeriaFormModal from "./FeriaFormModal";
import ContenedorPagina from "@/components/ui/ContenedorPagina";

export default function PanelFerias() {
    const [ferias, setFerias] = useState<Fair[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userRole, setUserRole] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'activas' | 'pasadas'>('activas');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [feriaEditando, setFeriaEditando] = useState<Fair | null>(null);

    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [feriaToDelete, setFeriaToDelete] = useState<Fair | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [feriaParaAsignar, setFeriaParaAsignar] = useState<Fair | null>(null);

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

    // ---------------- LÓGICA DE FECHAS Y FILTROS ----------------
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const feriasFiltradas = ferias.filter((feria) => {
        const fechaEval = feria.fecha_fin ? new Date(feria.fecha_fin) : new Date(feria.fecha_inicio);
        fechaEval.setHours(0, 0, 0, 0);

        if (activeTab === 'activas') return fechaEval >= hoy;
        return fechaEval < hoy;
    });

    // ---------------- ACCIONES DE GUARDADO ----------------
    const handleSave = async (datosFeria: Partial<Fair>) => {
        setIsSubmitting(true);
        setModalError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa.");

            if (feriaEditando) {
                const { error: dbError } = await supabase.schema('sourcing').from('ferias')
                    .update(datosFeria).eq('id', feriaEditando.id);
                if (dbError) throw dbError;
                setSuccessMessage("Feria actualizada con éxito.");
            } else {
                const { error: dbError } = await supabase.schema('sourcing').from('ferias')
                    .insert({ ...datosFeria, creado_por: user.id, estado_activo: true });
                if (dbError) throw dbError;
                setSuccessMessage("Feria creada con éxito.");
            }

            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMessage("");
                fetchData();
            }, 1000);

        } catch (err: any) {
            setModalError(err.message || "Error al guardar.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ---------------- ACCIONES DE ELIMINACIÓN ----------------
    const handleDeleteClick = async (feria: Fair) => {
        try {
            const { count, error } = await supabase.schema('sourcing')
                .from('productos_prospecto')
                .select('*', { count: 'exact', head: true })
                .eq('id_feria', feria.id);

            if (error) throw error;
            if (count && count > 0) {
                alert(`¡ALTO! No se puede eliminar "${feria.nombre}". Hay ${count} producto(s) atado(s).`);
                return;
            }

            setFeriaToDelete(feria);
            setIsConfirmDeleteOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    const confirmDelete = async () => {
        if (!feriaToDelete) return;
        setIsDeleting(true);
        try {
            await supabase.schema('sourcing').from('ferias').delete().eq('id', feriaToDelete.id);
            setIsConfirmDeleteOpen(false);
            setFeriaToDelete(null);
            fetchData();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <ContenedorPagina>
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-3xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center">
                        <Briefcase className="w-8 h-8 mr-3 text-red-600 hidden md:block" />
                        Gestión de Ferias
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Catálogo de eventos logísticos e internacionales.</p>
                </div>

                {(userRole === 'it' || userRole === 'director') && (
                    <button
                        onClick={() => { setFeriaEditando(null); setModalError(""); setSuccessMessage(""); setIsModalOpen(true); }}
                        className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl font-bold flex justify-center items-center space-x-2 transition-all shadow-lg shadow-red-100 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nueva Feria</span>
                    </button>
                )}
            </div>

            {/* PESTAÑAS (TABS) */}
            <div className="flex space-x-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('activas')}
                    className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'activas' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    En curso y Próximas
                </button>
                <button
                    onClick={() => setActiveTab('pasadas')}
                    className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pasadas' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Finalizadas
                </button>
            </div>

            {error && (
                <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* CONTENIDO (GRILLA O VACÍO) */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
            ) : feriasFiltradas.length === 0 ? (
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-6">
                        <Briefcase className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No hay ferias en esta sección</h3>
                    <p className="text-gray-500 mt-2">Prueba buscando en la otra pestaña o crea una nueva.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {feriasFiltradas.map((feria) => (
                        <FeriaCard
                            key={feria.id}
                            feria={feria}
                            userRole={userRole}
                            onEdit={(f) => { setFeriaEditando(f); setIsModalOpen(true); }}
                            onDelete={handleDeleteClick}
                            onAssign={setFeriaParaAsignar}
                        />
                    ))}
                </div>
            )}

            {/* MODALES INVISIBLES */}
            <FeriaFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                feriaEditando={feriaEditando}
                isSubmitting={isSubmitting}
                modalError={modalError}
                successMessage={successMessage}
            />

            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar esta feria?"
                description={<>Se borrará permanentemente la feria <strong>{feriaToDelete?.nombre}</strong>. Esta acción no se puede deshacer.</>}
                confirmText="Eliminar"
                variant="danger"
                isLoading={isDeleting}
            />

            {feriaParaAsignar && (
                <ModalAsignacionFeria
                    feriaId={feriaParaAsignar.id}
                    feriaNombre={feriaParaAsignar.nombre}
                    onClose={() => setFeriaParaAsignar(null)}
                />
            )}
        </ContenedorPagina>
    );
}