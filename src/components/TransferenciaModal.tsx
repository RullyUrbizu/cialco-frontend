import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { useTermos } from "../hooks/useTermos";
import { api } from "../api/api";
import { toast } from "sonner";
import { MoveHorizontal } from "lucide-react";

interface TransferenciaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    origen: {
        id: string;
        termo: string;
        canastillo: string;
        stockActual: number;
    };
}

export const TransferenciaModal = ({ isOpen, onClose, onSuccess, origen }: TransferenciaModalProps) => {
    const { termos } = useTermos();
    const [cantidad, setCantidad] = useState<number>(1);
    const [termoDestinoId, setTermoDestinoId] = useState("");
    const [canastilloCodigo, setCanastilloCodigo] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCantidad(1);
            setTermoDestinoId("");
            setCanastilloCodigo("");
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cantidad > origen.stockActual) {
            toast.error("La cantidad supera el stock disponible en el origen");
            return;
        }

        setLoading(true);
        try {
            await api.post("/colectas/transferencia", {
                origenContenedorId: origen.id,
                cantidad,
                termoDestinoId,
                canastilloCodigoDestino: canastilloCodigo
            });

            toast.success("Stock transferido correctamente");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al transferir stock");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 shadow-2xl backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MoveHorizontal className="h-6 w-6" />
                        <h2 className="text-xl font-bold">Mover Stock</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Origen</label>
                        <p className="text-sm text-blue-900 font-medium">
                            Termo <span className="font-mono font-bold">{origen.termo}</span> /
                            Canastillo <span className="font-mono font-bold">{origen.canastillo}</span>
                        </p>
                        <p className="text-xs text-blue-700">Disponible: <span className="font-bold">{origen.stockActual}</span> pajuelas</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Cantidad a mover
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={origen.stockActual}
                                value={cantidad}
                                onChange={(e) => setCantidad(parseInt(e.target.value))}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Termo Destino
                                </label>
                                <select
                                    value={termoDestinoId}
                                    onChange={(e) => setTermoDestinoId(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    {termos.filter(t => t.activo).map((t) => (
                                        <option key={t.id} value={t.id}>{t.codigo}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Canastillo Destino
                                </label>
                                <input
                                    type="text"
                                    value={canastilloCodigo}
                                    onChange={(e) => setCanastilloCodigo(e.target.value)}
                                    placeholder="Ej: C1"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-mono"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
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
                            variant="primary"
                            className="flex-1"
                            isLoading={loading}
                        >
                            Confirmar Mover
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
