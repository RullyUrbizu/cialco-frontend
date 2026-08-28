import { useState, useEffect } from "react";
import { api } from "../api/api";
import { Button } from "./ui/Button";
import { X } from "lucide-react";
import { TermoIcon } from "./ui/TermoIcon";
import type { ColectaContenedor } from "../Modelo/Colecta";

interface MovimientoModalProps {
    isOpen: boolean;
    onClose: () => void;
    colectaId: string;
    stockDisponible: number;
    onSuccess: () => void;
    tipo: 'ingreso' | 'salida';
}

interface ContenedorDistribucion {
    contenedorId: string;
    cantidad: number;
}

export const MovimientoModal = ({
    isOpen,
    onClose,
    colectaId,
    stockDisponible,
    onSuccess,
    tipo
}: MovimientoModalProps) => {
    const [contenedores, setContenedores] = useState<ColectaContenedor[]>([]);
    const [distribucion, setDistribucion] = useState<Record<string, string>>({});
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [remito, setRemito] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingContenedores, setLoadingContenedores] = useState(false);
    const [error, setError] = useState("");

    // Cargar contenedores cuando se abre el modal
    useEffect(() => {
        if (isOpen && colectaId) {
            fetchContenedores();
        }
    }, [isOpen, colectaId]);

    const fetchContenedores = async () => {
        setLoadingContenedores(true);
        try {
            const response = await api.get(`/colectas/${colectaId}`);
            const colecta = response.data;

            if (colecta.contenedores && colecta.contenedores.length > 0) {
                setContenedores(colecta.contenedores);

                // Inicializar distribución con 0 para cada contenedor
                const initialDistribucion: Record<string, string> = {};
                colecta.contenedores.forEach((cont: ColectaContenedor) => {
                    initialDistribucion[cont.id] = "0";
                });
                setDistribucion(initialDistribucion);
            }
        } catch (err) {
            console.error("Error al cargar contenedores:", err);
            setError("Error al cargar los contenedores");
        } finally {
            setLoadingContenedores(false);
        }
    };

    const handleDistribucionChange = (contenedorId: string, value: string) => {
        setDistribucion(prev => ({
            ...prev,
            [contenedorId]: value
        }));
    };

    const calcularTotal = (): number => {
        return Object.values(distribucion).reduce((sum, val) => {
            const num = parseInt(val) || 0;
            return sum + num;
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const total = calcularTotal();

        // Validaciones
        if (total <= 0) {
            setError("Debes especificar al menos 1 pajuela en algún contenedor");
            return;
        }

        // Validar que no se exceda el stock de cada contenedor para salidas
        if (tipo === 'salida') {
            for (const contenedor of contenedores) {
                const cantidadSolicitada = parseInt(distribucion[contenedor.id]) || 0;
                if (cantidadSolicitada > contenedor.stockActual) {
                    setError(`Contenedor ${contenedor.termo?.codigo}-${contenedor.canastillo?.codigo}: stock insuficiente (disponible: ${contenedor.stockActual})`);
                    return;
                }
            }
        }

        setLoading(true);

        try {
            // Obtener inventarioId
            const inventarioResponse = await api.get(`/inventario/colecta/${colectaId}`);

            if (!inventarioResponse.data) {
                setError("No se encontró el inventario asociado a esta colecta");
                setLoading(false);
                return;
            }

            const inventarioId = inventarioResponse.data.id;

            // Construir array de contenedoresDistribucion solo con los que tienen cantidad > 0
            const contenedoresDistribucion: ContenedorDistribucion[] = [];

            for (const [contenedorId, cantidadStr] of Object.entries(distribucion)) {
                const cantidad = parseInt(cantidadStr) || 0;
                if (cantidad > 0) {
                    contenedoresDistribucion.push({
                        contenedorId,
                        cantidad
                    });
                }
            }

            // Crear el movimiento
            await api.post("/movimientos", {
                inventarioId,
                tipo: tipo,
                cantidad: total,
                notas: observaciones,
                remito: remito || null,
                fecha: new Date().toLocaleString('sv-SE').replace(' ', 'T'),
                contenedoresDistribucion
            });

            // Resetear form
            setObservaciones("");
            setRemito("");
            setFecha(new Date().toISOString().split('T')[0]);

            const resetDistribucion: Record<string, string> = {};
            contenedores.forEach(cont => {
                resetDistribucion[cont.id] = "0";
            });
            setDistribucion(resetDistribucion);

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

    const total = calcularTotal();

    return (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-paper rounded-2xl shadow-lift border border-hairline max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-hairline sticky top-0 bg-paper z-10">
                    <h2 className="font-serif text-xl font-semibold text-ink">
                        {tipo === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Salida'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-ink-faint hover:text-ink transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Distribución por contenedores */}
                    <div>
                        <label className="field-label">
                            <TermoIcon className="inline mr-2" size={16} />
                            Distribución por contenedores
                        </label>

                        {loadingContenedores ? (
                            <div className="text-center py-8 text-ink-faint">
                                Cargando contenedores...
                            </div>
                        ) : contenedores.length === 0 ? (
                            <div className="text-center py-8 text-ink-faint">
                                No hay contenedores disponibles
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {contenedores.map((contenedor) => (
                                    <div
                                        key={contenedor.id}
                                        className="flex items-center gap-3 p-4 bg-ivory-100/60 rounded-lg border border-hairline"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-semibold text-ink">
                                                    {contenedor.termo?.codigo} - C{contenedor.canastillo?.codigo}
                                                </span>
                                            </div>
                                            <div className="text-xs text-ink-muted mt-1">
                                                Stock: <span className={`font-semibold ${contenedor.stockActual > 0 ? 'text-pine' : 'text-terracotta'}`}>
                                                    {contenedor.stockActual}
                                                </span> / {contenedor.cantidad} pajuelas
                                            </div>
                                        </div>

                                        <div className="w-24">
                                            <input
                                                type="number"
                                                min="0"
                                                max={tipo === 'salida' ? contenedor.stockActual : undefined}
                                                value={distribucion[contenedor.id] || "0"}
                                                onChange={(e) => handleDistribucionChange(contenedor.id, e.target.value)}
                                                className="field px-2.5 py-1.5 text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Total */}
                        <div className="mt-4 p-4 bg-cialco-50 rounded-lg border border-cialco/20">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-ink-soft">
                                    Total {tipo === 'ingreso' ? 'a ingresar' : 'a entregar'}:
                                </span>
                                <span className="text-2xl font-semibold text-cialco">
                                    {total}
                                </span>
                            </div>
                            {tipo === 'salida' && (
                                <p className="text-xs text-cialco mt-1">
                                    Stock disponible total: {stockDisponible}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="field-label">
                            {tipo === 'ingreso' ? 'Fecha de ingreso' : 'Fecha de entrega'}
                        </label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            required
                            className="field"
                        />
                    </div>

                    <div>
                        <label className="field-label">
                            N° de Remito
                        </label>
                        <input
                            type="text"
                            value={remito}
                            onChange={(e) => setRemito(e.target.value)}
                            className="field"
                            placeholder="Ej: 0001-00001234"
                            maxLength={50}
                        />
                    </div>

                    <div>
                        <label className="field-label">
                            Motivo / Observaciones
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            rows={2}
                            className="field resize-none"
                            placeholder="Notas adicionales..."
                        />
                    </div>

                    {error && (
                        <div className="bg-terracotta-light text-terracotta p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={loading} disabled={total === 0}>
                            {tipo === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Salida'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
