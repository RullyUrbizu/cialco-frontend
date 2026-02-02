import { useState } from "react";
import { api } from "../api/api";
import { Button } from "./ui/Button";
import { X } from "lucide-react";

interface MovimientoModalProps {
    isOpen: boolean;
    onClose: () => void;
    colectaId: string;
    stockDisponible: number;
    onSuccess: () => void;
}

export const MovimientoModal = ({
    isOpen,
    onClose,
    colectaId,
    stockDisponible,
    onSuccess
}: MovimientoModalProps) => {
    const [cantidad, setCantidad] = useState("");
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [observaciones, setObservaciones] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const cantidadNum = parseInt(cantidad);

        // Validaciones
        if (!cantidadNum || cantidadNum <= 0) {
            setError("La cantidad debe ser mayor a 0");
            return;
        }

        if (cantidadNum > stockDisponible) {
            setError(`No hay suficiente stock. Disponible: ${stockDisponible}`);
            return;
        }

        setLoading(true);

        try {
            // Primero obtener el inventarioId desde el colectaId
            const inventarioResponse = await api.get(`/inventario/colecta/${colectaId}`);

            if (!inventarioResponse.data) {
                setError("No se encontró el inventario asociado a esta colecta");
                setLoading(false);
                return;
            }

            const inventarioId = inventarioResponse.data.id;

            // Crear el movimiento con los datos correctos
            await api.post("/movimientos", {
                inventarioId,
                tipo: "salida",
                cantidad: cantidadNum,
                notas: observaciones
            });

            // Resetear form
            setCantidad("");
            setObservaciones("");
            setFecha(new Date().toISOString().split('T')[0]);

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            if (err.response) {
                setError(err.response.data.message || "Error al registrar el movimiento");
            } else {
                setError("Error de conexión");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Registrar Salida</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad a entregar
                        </label>
                        <input
                            type="number"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            required
                            min="1"
                            max={stockDisponible}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: 10"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Stock disponible: <span className="font-semibold text-blue-600">{stockDisponible}</span>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de entrega
                        </label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Remito / Motivo
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            required
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            placeholder="Ej: Remito N° 12345 o 'Sin remito - Entrega directa'"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            Registrar Salida
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
