"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Factory } from "lucide-react";

interface Props {
    value: string;
    onChange: (val: string) => void;
}

export default function BuscadorProveedor({ value, onChange }: Props) {
    const [sugerencias, setSugerencias] = useState<any[]>([]);
    const [showSugerencias, setShowSugerencias] = useState(false);

    useEffect(() => {
        if (value.length < 2) {
            setSugerencias([]);
            return;
        }

        const buscar = async () => {
            const { data } = await supabase.schema('sourcing')
                .from('proveedores')
                .select('nombre_empresa')
                .ilike('nombre_empresa', `%${value}%`)
                .limit(5);

            setSugerencias(data || []);
        };

        const timer = setTimeout(buscar, 300);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="relative">
            <input
                type="text"
                required
                value={value}
                onFocus={() => setShowSugerencias(true)}
                onBlur={() => setTimeout(() => setShowSugerencias(false), 200)}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-lg font-medium shadow-sm"
                placeholder="Nombre"
            />

            {showSugerencias && sugerencias.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {sugerencias.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-left transition-colors border-b border-gray-50 last:border-0"
                            onClick={() => {
                                onChange(s.nombre_empresa);
                                setShowSugerencias(false);
                            }}
                        >
                            <Factory className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-700">{s.nombre_empresa}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}