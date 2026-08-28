import { useState } from "react";
import { Button } from "./ui/Button";
import { toast } from "sonner";
import { useTermos } from "../hooks/useTermos";

interface TermoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: (termo: any) => void;
}

export const TermoModal = ({ isOpen, onClose, onCreated }: TermoModalProps) => {
    const { createTermo } = useTermos();
    const [codigo, setCodigo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codigo.trim()) {
            setError("El código es obligatorio");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const nuevoTermo = await createTermo({ codigo });
            toast.success("Termo creado correctamente");
            onCreated?.(nuevoTermo);
            setCodigo("");
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al crear el termo");
            toast.error(err.message || "Error al crear el termo");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-paper rounded-2xl shadow-lift border border-hairline w-full max-w-md overflow-hidden transform transition-all animate-scale-in">
                <div className="p-6 border-b border-hairline flex justify-between items-center bg-ivory-100">
                    <h2 className="font-serif text-xl font-semibold text-ink">Nuevo Termo</h2>
                    <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors text-2xl">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-terracotta-light border border-terracotta/20 text-terracotta rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="field-label">
                            Código del Termo
                        </label>
                        <input
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            className="field text-lg"
                            placeholder="Ej: Termo V, 47/12, etc."
                            autoFocus
                            required
                        />
                        <p className="mt-2 text-xs text-ink-muted">
                            Ingresa un identificador único para el termo.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            isLoading={loading}
                        >
                            Crear Termo
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
