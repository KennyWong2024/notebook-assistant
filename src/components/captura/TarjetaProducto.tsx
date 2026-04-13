"use client";

import { DollarSign, AlignLeft, Trash2, Camera } from "lucide-react";
import CamaraWidget from "./CamaraWidget";
import GaleriaMiniaturas from "./GaleriaMiniaturas";

type ProductoTemp = {
    tempId: number;
    nombre: string;
    precio: string;
    moneda: string;
    descripcion: string;
    prioridad: number | null;
    fotos: File[];
};

interface Props {
    index: number;
    producto: ProductoTemp;
    totalProductos: number;
    onUpdate: (field: keyof ProductoTemp, value: any) => void;
    onRemove: () => void;
    onAddFoto: (file: File) => void;
    onRemoveFoto: (index: number) => void;
}

export default function TarjetaProducto({ index, producto, totalProductos, onUpdate, onRemove, onAddFoto, onRemoveFoto }: Props) {
    const prioridades = [1, 2, 3, 4];

    return (
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-200 space-y-6 relative">
            {totalProductos > 1 && (
                <button type="button" onClick={onRemove} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            )}

            {/* Nombre del Producto - Padding aumentado para armonía */}
            <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Producto {index + 1} <span className="text-[10px] normal-case font-medium text-gray-400 ml-1">(Opcional)</span>
                </label>
                <input
                    type="text"
                    value={producto.nombre}
                    onChange={(e) => onUpdate('nombre', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-bold text-gray-800 transition-all"
                    placeholder="¿Qué artículo es?"
                />
            </div>

            {/* Prioridad - Diseño de pastillas */}
            <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Prioridad de interés</label>
                <div className="flex justify-between gap-2">
                    {prioridades.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onUpdate('prioridad', p)}
                            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border-2 ${producto.prioridad === p
                                    ? 'bg-red-600 border-red-600 text-white shadow-md'
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between px-1 mt-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Top</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Bajo</span>
                </div>
            </div>

            <div className="flex space-x-3">
                <div className="flex-1">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Precio</label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                        <input
                            type="number"
                            step="0.01"
                            value={producto.precio}
                            onChange={(e) => onUpdate('precio', e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-bold text-gray-800"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div className="w-1/3">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Moneda</label>
                    <select
                        value={producto.moneda}
                        onChange={(e) => onUpdate('moneda', e.target.value)}
                        className="w-full px-3 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-bold appearance-none bg-white text-gray-800"
                    >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="RMB">RMB</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center space-x-1">
                    <AlignLeft className="w-3 h-3" /> <span>Observaciones</span>
                </label>
                <textarea
                    rows={2}
                    value={producto.descripcion}
                    onChange={(e) => onUpdate('descripcion', e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm resize-none text-gray-700"
                    placeholder="Materiales, MOQ, notas rápidas..."
                />
            </div>

            <div className="pt-2 border-t border-gray-100">
                <GaleriaMiniaturas fotos={producto.fotos} onRemover={onRemoveFoto} />
                <CamaraWidget label="Foto del Producto" onImageCaptured={onAddFoto} />
            </div>
        </div>
    );
}