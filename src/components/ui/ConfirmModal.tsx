import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'success';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const isDanger = variant === 'danger';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[70] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDanger ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                        }`}>
                        {isDanger ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">
                        {title}
                    </h2>
                    <div className="text-sm text-gray-500 font-medium">
                        {description}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 flex justify-center items-center text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-70 ${isDanger
                            ? "bg-red-600 hover:bg-red-700 shadow-red-100"
                            : "bg-green-600 hover:bg-green-700 shadow-green-100"
                            }`}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}