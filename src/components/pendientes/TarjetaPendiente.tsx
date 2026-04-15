import Image from "next/image";
import { ProductoPendiente } from "@/types/database";
import { PackageSearch, Clock } from "lucide-react";

interface TarjetaPendienteProps {
    producto: ProductoPendiente;
    onClick: (id: string) => void;
}

export default function TarjetaPendiente({ producto, onClick }: TarjetaPendienteProps) {
    const tieneFoto = Boolean(producto.foto_url);
    const precio = producto.precio_referencia ? Number(producto.precio_referencia).toFixed(2) : '--';

    return (
        <div
            onClick={() => onClick(producto.id)}
            className="group bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-300 transition-all cursor-pointer overflow-hidden flex flex-row p-2 md:p-3 items-center gap-3 md:gap-5"
        >
            {/* Thumbnail Izquierdo */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-xl md:rounded-2xl flex-shrink-0 overflow-hidden border border-gray-100">
                {tieneFoto ? (
                    <Image
                        src={producto.foto_url!}
                        alt={producto.nombre_rapido || 'Producto pendiente'}
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

                {/* Fila 1: Título y Badge "Por Enriquecer" */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-sm md:text-lg text-gray-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                        {producto.nombre_rapido || producto.codigo_trazabilidad}
                    </h3>
                    <div className="bg-red-500 text-white text-[9px] md:text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center whitespace-nowrap flex-shrink-0 shadow-sm">
                        <Clock className="w-3 h-3 md:mr-1" />
                        <span className="hidden md:inline">Por Enriquecer</span>
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

                {/* Fila 3: Precio y Feria (Contexto) */}
                <div className="flex items-end justify-between mt-2 md:mt-3">
                    <div className="flex items-baseline space-x-1">
                        <span className="text-[10px] md:text-xs font-bold text-gray-400">{producto.moneda || 'USD'}</span>
                        <span className="text-sm md:text-lg font-black text-gray-900">{precio}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded-md truncate max-w-[120px] md:max-w-[180px]">
                            {producto.feria || 'Sin feria'}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}