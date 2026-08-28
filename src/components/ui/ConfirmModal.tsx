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
            case 'trash': return <div className="h-12 w-12 bg-terracotta-light text-terracotta rounded-full flex items-center justify-center mb-4"><Trash2 size={24} /></div>;
            case 'alert': return <div className="h-12 w-12 bg-harvest-light text-harvest rounded-full flex items-center justify-center mb-4"><AlertTriangle size={24} /></div>;
            case 'info': return <div className="h-12 w-12 bg-cialco-50 text-cialco rounded-full flex items-center justify-center mb-4"><Info size={24} /></div>;
            default: return null;
        }
    };

    const isOnlyNotice = !onConfirm;

    return (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div
                className="bg-paper rounded-3xl shadow-lift w-full max-w-sm overflow-hidden border border-hairline animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative p-8 flex flex-col items-center text-center">
                    {/* Botón cerrar esquina */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-ink-faint hover:text-ink transition-colors p-1 rounded-full hover:bg-ivory-100"
                    >
                        <X size={18} />
                    </button>

                    {getIcon()}

                    <h3 className="font-serif text-2xl font-semibold text-ink mb-2 tracking-tight">{title}</h3>
                    <p className="text-ink-muted text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex w-full gap-3">
                        {!isOnlyNotice && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1 h-11 font-bold text-xs uppercase tracking-wider"
                                disabled={isLoading}
                            >
                                {cancelText}
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant={variant === 'info' ? 'primary' : variant}
                            onClick={onConfirm || onClose}
                            className="flex-1 h-11 font-bold text-xs uppercase tracking-wider shadow-sm"
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
