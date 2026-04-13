"use client";

import { Camera, X, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { comprimirImagen } from "@/lib/image-utils";

interface Props {
    onImageCaptured: (file: File) => void;
    label: string;
}

export default function CamaraWidget({ onImageCaptured, label }: Props) {
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const imagenOptimizada = await comprimirImagen(file);
        setPreview(URL.createObjectURL(imagenOptimizada));
        onImageCaptured(imagenOptimizada as File);
        setLoading(false);
    };

    return (
        <div className="flex flex-col space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                {label}
            </label>

            <div className="relative h-40 w-full bg-gray-100 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                        <button
                            onClick={() => setPreview(null)}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center space-y-2">
                        <Camera className={`w-8 h-8 ${loading ? 'animate-pulse text-red-400' : 'text-gray-400'}`} />
                        <span className="text-xs font-bold text-gray-400">
                            {loading ? 'Comprimiendo...' : 'Tocar para capturar'}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleCapture}
                        />
                    </label>
                )}
            </div>
        </div>
    );
}