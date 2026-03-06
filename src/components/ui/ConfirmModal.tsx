import { Button } from "./Button";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void; // Opcional para cuando solo se quiere mostrar un aviso
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'danger' | 'info' | 'warning';
    isLoading?: boolean;
    icon?: 'trash' | 'alert' | 'info';
}

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "primary",
    isLoading = false,
    icon
}: ConfirmModalProps) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (icon) {
            case 'trash': return <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4"><Trash2 size={24} /></div>;
            case 'alert': return <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={24} /></div>;
            case 'info': return <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4"><Info size={24} /></div>;
            default: return null;
        }
    };

    const isOnlyNotice = !onConfirm;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative p-8 flex flex-col items-center text-center">
                    {/* Botón cerrar esquina */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>

                    {getIcon()}

                    <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex w-full gap-3">
                        {!isOnlyNotice && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1 h-11 font-bold text-xs uppercase"
                                disabled={isLoading}
                            >
                                {cancelText}
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant={variant === 'info' ? 'primary' : variant}
                            onClick={onConfirm || onClose}
                            className="flex-1 h-11 font-bold text-xs uppercase shadow-sm"
                            isLoading={isLoading}
                        >
                            {isOnlyNotice ? "ENTENDIDO" : confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
