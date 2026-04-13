"use client";

import { X } from "lucide-react";

interface Props {
    fotos: File[];
    onRemover: (index: number) => void;
}

export default function GaleriaMiniaturas({ fotos, onRemover }: Props) {
    if (fotos.length === 0) return null;

    return (
        <div className="flex items-center space-x-3 overflow-x-auto py-2 pb-4">
            {fotos.map((foto, index) => {
                const previewUrl = URL.createObjectURL(foto);
                return (
                    <div key={index} className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                        <img src={previewUrl} alt={`Captura ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                            type="button"
                            onClick={() => onRemover(index)}
                            className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full backdrop-blur-sm transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}