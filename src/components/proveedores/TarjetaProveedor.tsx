import { ViewDirectorioProveedor } from "@/types/database";
import { Building2, MapPin, Mail, UserCircle, Database, ChevronRight, PackageSearch } from "lucide-react";
import Link from "next/link";

interface TarjetaProveedorProps {
    proveedor: ViewDirectorioProveedor;
}

export default function TarjetaProveedor({ proveedor }: TarjetaProveedorProps) {
    const tieneProductos = proveedor.cantidad_productos > 0;

    return (
        <Link
            href={`/proveedores/${proveedor.id}`}
            className="group bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all cursor-pointer overflow-hidden flex flex-row p-3 md:p-4 items-center gap-4 md:gap-5 block"
        >
            {/* Ícono de Empresa (Izquierda) */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gray-50 flex flex-col items-center justify-center flex-shrink-0 border border-gray-100 group-hover:bg-red-50 group-hover:text-red-600 transition-colors text-gray-400 relative">
                <Building2 className="w-8 h-8 md:w-10 md:h-10" />
            </div>

            {/* Detalles (Derecha) */}
            <div className="flex flex-col justify-between flex-1 py-1 min-w-0 pr-2">

                {/* Fila 1: Nombre y Badge SAP */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-sm md:text-lg text-gray-900 leading-tight truncate group-hover:text-red-600 transition-colors">
                        {proveedor.nombre_empresa}
                    </h3>
                    {proveedor.sap_bp_id && (
                        <div className="bg-blue-50 text-blue-600 text-[9px] md:text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center whitespace-nowrap flex-shrink-0 border border-blue-100">
                            <Database className="w-3 h-3 md:mr-1" />
                            <span className="hidden md:inline">SAP: {proveedor.sap_bp_id}</span>
                        </div>
                    )}
                </div>

                {/* Fila 2: Origen y Contacto */}
                <div className="mt-1 md:mt-2 grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2">
                    <p className="text-xs md:text-sm font-medium text-gray-500 flex items-center truncate">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{proveedor.pais_origen || 'Origen desconocido'}</span>
                    </p>
                    <p className="text-xs md:text-sm font-medium text-gray-500 flex items-center truncate hidden md:flex">
                        <UserCircle className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{proveedor.contacto_principal || 'Sin contacto'}</span>
                    </p>
                </div>

                {/* Fila 3: Cantidad de Prospectos */}
                <div className="flex items-end justify-between mt-2 md:mt-3">
                    <div className={`flex items-center space-x-1.5 text-[10px] md:text-xs font-bold ${tieneProductos ? 'text-gray-900' : 'text-gray-400'}`}>
                        <PackageSearch className="w-3.5 h-3.5" />
                        <span>{proveedor.cantidad_productos} Prospectos</span>
                    </div>

                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-50 group-hover:bg-red-600 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </div>
                </div>
            </div>
        </Link>
    );
}