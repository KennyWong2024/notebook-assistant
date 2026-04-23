"use client";

import { X } from "lucide-react";
import { useMemo, useEffect, useRef } from "react";

interface Props {
    fotos: File[];
    onRemover: (index: number) => void;
}

export default function GaleriaMiniaturas({ fotos, onRemover }: Props) {
    // Crear Object URLs una sola vez por foto, no en cada render
    const previewUrls = useMemo(() => {
        return fotos.map(foto => URL.createObjectURL(foto));
    }, [fotos]);

    // Limpiar Object URLs cuando el componente se desmonta o las fotos cambian
    const prevUrlsRef = useRef<string[]>([]);

    useEffect(() => {
        // Revocar URLs anteriores que ya no estén en uso
        prevUrlsRef.current.forEach(url => {
            if (!previewUrls.includes(url)) {
                URL.revokeObjectURL(url);
            }
        });
        prevUrlsRef.current = previewUrls;

        // Cleanup al desmontar
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    if (fotos.length === 0) return null;

    return (
        <div className="flex items-center space-x-3 overflow-x-auto py-2 pb-4">
            {previewUrls.map((url, index) => (
                <div key={index} className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                    <img src={url} alt={`Captura ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                        type="button"
                        onClick={() => onRemover(index)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full backdrop-blur-sm transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}
        </div>
    );
}