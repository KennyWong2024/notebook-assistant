import Image from "next/image";
import { ViewHistorialProducto } from "@/types/database";
import { PackageSearch, CheckCircle2, AlertCircle, Send, FileBox } from "lucide-react";

interface TarjetaHistorialProps {
    producto: ViewHistorialProducto;
    onClick: (id: string) => void;
}

export default function TarjetaHistorial({ producto, onClick }: TarjetaHistorialProps) {
    const tieneFoto = Boolean(producto.foto_principal_url);
    const precio = producto.precio_referencia ? Number(producto.precio_referencia).toFixed(2) : '--';
    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case 'completado': return { color: 'bg-blue-500 text-white', icon: FileBox, texto: 'Completado' };
            case 'muestra_solicitada': return { color: 'bg-purple-500 text-white', icon: Send, texto: 'Muestra' };
            case 'aprobado_gerencia': return { color: 'bg-green-500 text-white', icon: CheckCircle2, texto: 'Aprobado' };
            case 'error': return { color: 'bg-red-500 text-white', icon: AlertCircle, texto: 'Error SAP' };
            default: return { color: 'bg-gray-100 text-gray-600', icon: PackageSearch, texto: estado };
        }
    };

    const config = producto.estado_sincronizacion_sap === 'error'
        ? getEstadoConfig('error')
        : getEstadoConfig(producto.estado_compra);

    const Icono = config.icon;

    return (
        <div
            onClick={() => onClick(producto.id)}
            className="group bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer overflow-hidden flex flex-row p-2 md:p-3 items-center gap-3 md:gap-5"
        >
            {/* Thumbnail Izquierdo */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-xl md:rounded-2xl flex-shrink-0 overflow-hidden">
                {tieneFoto ? (
                    <Image
                        src={producto.foto_principal_url!}
                        alt={producto.nombre_rapido || 'Producto'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                        <PackageSearch className="w-8 h-8 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Sin Foto</span>
                    </div>
                )}
            </div>

            {/* Detalles Derecho */}
            <div className="flex flex-col justify-between flex-1 py-1 md:py-2 min-w-0 pr-2">

                {/* Fila 1: Título y Badge de estado */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-sm md:text-lg text-gray-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                        {producto.nombre_rapido || producto.codigo_trazabilidad}
                    </h3>
                    <div className={`${config.color} text-[9px] md:text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center whitespace-nowrap flex-shrink-0`}>
                        <Icono className="w-3 h-3 md:mr-1" />
                        <span className="hidden md:inline">{config.texto}</span>
                    </div>
                </div>

                {/* Fila 2: Proveedor y Código */}
                <div className="mt-1 md:mt-2">
                    <p className="text-xs md:text-sm font-medium text-gray-500 line-clamp-1">
                        {producto.proveedor || 'Sin proveedor'}
                    </p>
                    <p className="text-[10px] md:text-xs font-bold text-gray-400 mt-0.5">
                        {producto.codigo_trazabilidad}
                    </p>
                </div>

                {/* Fila 3: Precio y Departamento */}
                <div className="flex items-end justify-between mt-2 md:mt-3">
                    <div className="flex items-baseline space-x-1">
                        <span className="text-[10px] md:text-xs font-bold text-gray-400">{producto.moneda || 'USD'}</span>
                        <span className="text-sm md:text-lg font-black text-gray-900">{precio}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded-md truncate max-w-[100px] md:max-w-[150px]">
                            {producto.departamento || 'Sin depto'}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}