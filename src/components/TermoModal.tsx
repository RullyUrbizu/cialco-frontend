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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">Nuevo Termo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código del Termo
                        </label>
                        <input
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-lg"
                            placeholder="Ej: Termo V, 47/12, etc."
                            autoFocus
                            required
                        />
                        <p className="mt-2 text-xs text-gray-500">
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
