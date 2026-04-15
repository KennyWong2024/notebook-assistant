"use client";

import { Camera, RefreshCw } from "lucide-react";
import { useState } from "react";
import { comprimirImagen } from "@/lib/image-utils";

interface Props {
    onCaptured: (file: File | null) => void;
}

export default function CapturaTarjeta({ onCaptured }: Props) {
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const imagenOptimizada = await comprimirImagen(file);
        setPreview(URL.createObjectURL(imagenOptimizada));
        onCaptured(imagenOptimizada as File);
        setLoading(false);
    };

    return (
        <div className="w-full">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                Tarjeta del Proveedor
            </label>
            <div className="relative w-full aspect-video bg-white rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
                {preview ? (
                    <>
                        <img src={preview} alt="Tarjeta" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-lg">
                                <RefreshCw className="w-4 h-4" />
                                <span>Retomar Foto</span>
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png, image/heic, image/heif, image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleCapture}
                                />
                            </label>
                        </div>
                    </>
                ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 transition-colors">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                            <Camera className={`w-8 h-8 ${loading ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className="text-sm font-bold text-gray-500">
                            {loading ? 'Procesando formato...' : 'Enfoca la tarjeta y toca aquí'}
                        </span>
                        <input
                            type="file"
                            accept="image/jpeg, image/png, image/heic, image/heif, image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleCapture}
                            disabled={loading}
                        />
                    </label>
                )}
            </div>
        </div>
    );
}