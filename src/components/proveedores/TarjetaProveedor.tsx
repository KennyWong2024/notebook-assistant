import { ViewDirectorioProveedor } from "@/types/database";
import { Building2, MapPin, Mail, UserCircle, Database, ChevronRight, PackageSearch } from "lucide-react";

interface TarjetaProveedorProps {
    proveedor: ViewDirectorioProveedor;
    onClick: (id: string) => void;
}

export default function TarjetaProveedor({ proveedor, onClick }: TarjetaProveedorProps) {
    const tieneProductos = proveedor.cantidad_productos > 0;

    return (
        <div
            onClick={() => onClick(proveedor.id)}
            className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-red-100 transition-all cursor-pointer overflow-hidden flex flex-col p-6 h-[260px] relative"
        >
            {/* Etiqueta SAP Flotante */}
            {proveedor.sap_bp_id && (
                <div className="absolute top-4 right-4 bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-full flex items-center space-x-1 border border-blue-100">
                    <Database className="w-3 h-3" />
                    <span>SAP: {proveedor.sap_bp_id}</span>
                </div>
            )}

            <div className="flex items-start space-x-4 mb-4 mt-2">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100 group-hover:bg-red-50 group-hover:text-red-600 transition-colors text-gray-400">
                    <Building2 className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-black text-xl text-gray-900 leading-tight truncate group-hover:text-red-600 transition-colors">
                        {proveedor.nombre_empresa}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {proveedor.pais_origen || 'Origen desconocido'}
                    </p>
                </div>
            </div>

            <div className="space-y-2 mt-2 flex-1">
                <div className="flex items-center text-sm text-gray-600 font-medium">
                    <UserCircle className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="truncate">{proveedor.contacto_principal || 'Sin contacto registrado'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 font-medium">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="truncate">{proveedor.email_contacto || 'Sin email registrado'}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className={`flex items-center space-x-2 text-sm font-bold ${tieneProductos ? 'text-gray-900' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tieneProductos ? 'bg-gray-100' : 'bg-gray-50'}`}>
                        <PackageSearch className="w-4 h-4" />
                    </div>
                    <span>{proveedor.cantidad_productos} Prospectos</span>
                </div>

                <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-red-600 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
            </div>
        </div>
    );
}