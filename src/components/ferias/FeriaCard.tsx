import { MapPin, Calendar, Briefcase, Edit2, Trash2, UserPlus } from "lucide-react";
import { Fair } from "@/types/database";

interface FeriaCardProps {
    feria: Fair;
    userRole: string | null;
    onEdit: (feria: Fair) => void;
    onDelete: (feria: Fair) => void;
    onAssign: (feria: Fair) => void;
}

export default function FeriaCard({ feria, userRole, onEdit, onDelete, onAssign }: FeriaCardProps) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaEvaluacion = feria.fecha_fin ? new Date(feria.fecha_fin) : new Date(feria.fecha_inicio);
    fechaEvaluacion.setHours(0, 0, 0, 0);

    const isPasada = fechaEvaluacion < hoy;
    const isActiva = feria.estado_activo && !isPasada;

    const isAdmin = userRole === 'it' || userRole === 'director';

    return (
        <div className={`bg-white rounded-3xl p-6 border ${isPasada ? 'border-gray-100 opacity-75' : 'border-gray-200 shadow-sm hover:shadow-md'} transition-all relative overflow-hidden flex flex-col justify-between group`}>

            {/* Botones de acción rápidos (Solo Admin) */}
            {isAdmin && (
                <div className="absolute top-4 right-4 flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => onEdit(feria)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(feria)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-sm">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div>
                {/* Etiqueta de Estado */}
                <div className={`absolute top-0 right-0 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl transition-opacity ${!isPasada ? 'opacity-0 md:group-hover:opacity-0' : ''} ${isActiva ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isActiva ? 'Activa' : 'Finalizada'}
                </div>

                <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPasada ? 'bg-gray-100 text-gray-400' : 'bg-red-50 text-red-600'}`}>
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="pr-16 md:pr-12">
                        <h3 className={`font-black text-lg leading-tight transition-colors ${isPasada ? 'text-gray-600' : 'text-gray-900 group-hover:text-red-600'}`}>
                            {feria.nombre}
                        </h3>

                        <div className="mt-3 space-y-1.5 mb-4">
                            <div className="flex items-center text-sm text-gray-500 font-medium">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{feria.region ? `${feria.region}, ${feria.pais}` : (feria.pais || 'Ubicación no definida')}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 font-medium">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                    {new Date(feria.fecha_inicio).toLocaleDateString()}
                                    {feria.fecha_fin && ` - ${new Date(feria.fecha_fin).toLocaleDateString()}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botón de Gestión de Equipo */}
            {isAdmin && (
                <div className="pt-4 border-t border-gray-50 mt-auto">
                    <button
                        onClick={() => onAssign(feria)}
                        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center space-x-2 ${isPasada ? 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50' : 'bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600'}`}
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>{isPasada ? 'Ver Equipo' : 'Gestionar Equipo'}</span>
                    </button>
                </div>
            )}
        </div>
    );
}