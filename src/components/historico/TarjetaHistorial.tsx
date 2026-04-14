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

    // Configuración visual según el estado
    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case 'completado': return { color: 'bg-blue-500', icon: FileBox, texto: 'Completado' };
            case 'muestra_solicitada': return { color: 'bg-purple-500', icon: Send, texto: 'Muestra en camino' };
            case 'aprobado_gerencia': return { color: 'bg-green-500', icon: CheckCircle2, texto: 'Aprobado' };
            case 'error': return { color: 'bg-red-500', icon: AlertCircle, texto: 'Error SAP' };
            default: return { color: 'bg-gray-500', icon: PackageSearch, texto: estado };
        }
    };

    const config = producto.estado_sincronizacion_sap === 'error'
        ? getEstadoConfig('error')
        : getEstadoConfig(producto.estado_compra);

    const Icono = config.icon;

    return (
        <div
            onClick={() => onClick(producto.id)}
            className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer overflow-hidden flex flex-col h-[340px]"
        >
            <div className="relative h-[60%] w-full bg-gray-50 flex-shrink-0">
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
                        <PackageSearch className="w-12 h-12 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sin Foto</span>
                    </div>
                )}

                {/* Badge de Estado */}
                <div className="absolute top-3 right-3 flex space-x-2">
                    <div className={`${config.color}/90 backdrop-blur-sm text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-sm flex items-center`}>
                        <Icono className="w-3 h-3 mr-1" />
                        {config.texto}
                    </div>
                </div>
            </div>

            <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                    <h3 className="font-black text-lg text-gray-900 leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {producto.nombre_rapido || producto.codigo_trazabilidad}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md tracking-wider">
                            {producto.codigo_trazabilidad}
                        </p>
                        <p className="text-sm font-medium text-gray-500 line-clamp-1">
                            {producto.proveedor || 'Sin proveedor'}
                        </p>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-2">
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ref.</p>
                        <p className="text-xl font-black text-gray-900">
                            <span className="text-sm mr-1">{producto.moneda || 'USD'}</span>
                            {precio}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 max-w-[120px] truncate">
                            {producto.departamento || 'Sin depto'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}