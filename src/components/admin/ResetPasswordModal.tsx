import { useState, useEffect } from "react";
import { X, Loader2, Copy, Check, KeyRound } from "lucide-react";
import { Profile } from "@/types/database";

interface Props {
    isOpen: boolean;
    user: Profile | null;
    onClose: () => void;
    onConfirm: (userId: string, newPassword: string) => Promise<void>;
    isSubmitting: boolean;
}

export default function ResetPasswordModal({ isOpen, user, onClose, onConfirm, isSubmitting }: Props) {
    const [newPassword, setNewPassword] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
            let pass = "";
            for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
            setNewPassword(pass);
            setCopied(false);
        }
    }, [isOpen]);

    if (!isOpen || !user) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(newPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[70] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <KeyRound className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Restablecer Contraseña</h2>
                    <p className="text-sm text-gray-500 font-medium mb-6">
                        Se generará una nueva contraseña para <strong>{user.nombre_completo}</strong>.
                    </p>

                    <div className="flex space-x-2 mb-2">
                        <input type="text" readOnly value={newPassword} className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl outline-none font-mono text-gray-700 font-bold text-center" />
                        <button type="button" onClick={handleCopy} className={`px-4 rounded-xl flex items-center justify-center transition-all border ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}>
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-6">¡Cópiala antes de guardar!</p>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
                    <button onClick={onClose} disabled={isSubmitting} className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50">
                        Cancelar
                    </button>
                    <button onClick={() => onConfirm(user.id, newPassword)} disabled={isSubmitting} className="flex-1 flex justify-center items-center bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 font-bold py-3 rounded-xl transition-all disabled:opacity-70">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}