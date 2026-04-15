"use client";

import { Camera, Loader2 } from "lucide-react";
import { useState } from "react";
import { comprimirImagen } from "@/lib/image-utils";

interface Props {
    onImageCaptured: (file: File) => void;
    label: string;
}

export default function CamaraWidget({ onImageCaptured, label }: Props) {
    const [loading, setLoading] = useState(false);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const imagenOptimizada = await comprimirImagen(file);
        onImageCaptured(imagenOptimizada as File);
        setLoading(false);

        e.target.value = '';
    };

    return (
        <label className={`cursor-pointer w-full py-3.5 border-2 border-dashed bg-white rounded-2xl font-bold transition-all flex flex-col items-center justify-center space-y-1.5 ${loading ? 'border-red-200 text-red-400' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-red-300 hover:text-red-500'
            }`}>
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                    <span className="text-[10px] uppercase tracking-widest">Procesando...</span>
                </>
            ) : (
                <>
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-widest">{label}</span>
                </>
            )}
            <input
                type="file"
                accept="image/jpeg, image/png, image/webp, image/heic, image/heif, image/*"
                capture="environment"
                className="hidden"
                onChange={handleCapture}
                disabled={loading}
            />
        </label>
    );
}