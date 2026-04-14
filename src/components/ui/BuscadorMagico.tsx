import { Search, X } from "lucide-react";

interface BuscadorMagicoProps {
    valor: string;
    onChange: (valor: string) => void;
    placeholder?: string;
}

export default function BuscadorMagico({ valor, onChange, placeholder = "Buscar..." }: BuscadorMagicoProps) {
    return (
        <div className="relative w-full max-w-2xl group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-red-600 transition-colors" />
            </div>

            <input
                type="text"
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-600 outline-none transition-all text-base md:text-lg font-medium text-gray-900 placeholder-gray-400"
            />

            {valor && (
                <button
                    onClick={() => onChange("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                    <X className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}