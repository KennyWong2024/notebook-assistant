import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    isSubmitting: boolean;
    modalError: string;
    successMessage: string;
}

export default function UserFormModal({ isOpen, onClose, onSubmit, isSubmitting, modalError, successMessage }: Props) {
    const [password, setPassword] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
            let pass = "";
            for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
            setPassword(pass);
            setCopied(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-end md:justify-center md:items-center z-[60] p-0 md:p-4 items-end">
            <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 md:fade-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Nuevo Acceso</h2>
                    <button onClick={() => !isSubmitting && onClose()} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }} className="p-6 md:p-8 space-y-5 max-h-[85vh] overflow-y-auto">
                    {modalError && (
                        <div className="flex items-center space-x-3 text-red-600 text-sm bg-red-50 p-4 rounded-2xl border border-red-100">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-bold">{modalError}</p>
                        </div>
                    )}
                    {successMessage && (
                        <div className="flex items-center space-x-3 text-green-700 text-sm bg-green-50 p-4 rounded-2xl border border-green-100">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <p className="font-bold">{successMessage}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                            <input type="text" name="nombre" required placeholder="Nombre del colaborador" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all" />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Correo Pequeño Mundo</label>
                            <input type="email" name="email" required placeholder="usuario@pequenomundo.com" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium transition-all" />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Rol</label>
                            <select name="rol" required className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-bold text-gray-700 transition-all">
                                <option value="comprador">Comprador</option>
                                <option value="gerente">Gerente</option>
                                <option value="director">Director</option>
                                <option value="it">IT</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Contraseña Autogenerada</label>
                            <div className="flex space-x-2">
                                <input type="text" name="password" readOnly value={password} className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl outline-none font-mono text-gray-700 font-bold" />
                                <button type="button" onClick={handleCopy} className={`px-4 rounded-2xl flex items-center justify-center transition-all border ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}>
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 ml-1">Cópiala y envíasela al colaborador. El sistema no envía correos.</p>
                        </div>
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button type="button" disabled={isSubmitting} onClick={onClose} className="flex-1 bg-white border border-gray-200 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex justify-center items-center">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Crear Acceso</span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}