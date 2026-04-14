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
            className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-red-100 transition-all cursor-pointer overflow-hidden flex flex-col h-[340px]"
        >
            <div className="relative h-[60%] w-full bg-gray-50 flex-shrink-0">
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
                        <PackageSearch className="w-12 h-12 mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sin Foto</span>
                    </div>
                )}

                <div className="absolute top-3 right-3 flex space-x-2">
                    <div className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-sm flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Por Enriquecer
                    </div>
                </div>
            </div>

            <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                    <h3 className="font-black text-lg text-gray-900 leading-tight line-clamp-1 group-hover:text-red-600 transition-colors">
                        {producto.nombre_rapido || producto.codigo_trazabilidad}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 mt-1 line-clamp-1">
                        {producto.proveedor || 'Sin proveedor'}
                    </p>
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
                        <p className="text-[10px] font-bold text-gray-400 max-w-[100px] truncate">
                            {producto.feria || 'Sin feria'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}