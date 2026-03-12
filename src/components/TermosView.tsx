import { useEffect, useState } from "react";
import { useColectas } from "../hooks/useColectas";
import { useTermos } from "../hooks/useTermos";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { TermoModal } from "./TermoModal";
import { ConfirmModal } from "./ui/ConfirmModal";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Colecta } from "../Modelo/Colecta";

interface TermoOcupacion {
    id: string;
    codigo: string;
    capacidadTotal: number;
    ocupado: number;
    porcentaje: number;
    activo: boolean;
}

export const TermosView = () => {
    const { colectas, loading: loadingColectas, error: errorColectas, refetch: refetchColectas } = useColectas(1000); // Fetch up to 1000 records for occupation
    const { termos, loading: loadingTermos, error: errorTermos, refetch: refetchTermos, toggleTermoActivo, deleteTermo } = useTermos();
    const [termosData, setTermosData] = useState<TermoOcupacion[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; codigo: string }>({
        isOpen: false,
        id: "",
        codigo: ""
    });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!termos) return;

        // 1. Mapa de ocupación desde colectas
        const ocupacionMap = new Map<string, number>();
        if (colectas) {
            colectas.forEach((c: Colecta) => {
                if (c.contenedores && c.contenedores.length > 0) {
                    c.contenedores.forEach(contenedor => {
                        const codigo = contenedor.termo?.codigo;
                        if (codigo) {
                            const stockActual = contenedor.stockActual ?? 0;
                            ocupacionMap.set(codigo, (ocupacionMap.get(codigo) || 0) + stockActual);
                        }
                    });
                }
            });
        }

        // 2. Calcular capacidad según el código del termo
        const getCapacidad = (codigo: string): number => {
            const codigoUpper = codigo.toUpperCase();
            if (codigoUpper === "CH I" || codigoUpper === "CH II" || codigoUpper === "CH III" || codigoUpper === "CH IV" || codigoUpper === "ChH II" || codigoUpper === "47/11") {
                return 3990; // 665 pajuelas x 6 canastillos
            }
            return 1140; // 190 pajuelas x 6 canastillos
        };

        // 3. Crear array usando TODOS los termos registrados en la base de datos
        const termosArray: TermoOcupacion[] = termos.map((t) => {
            const ocupado = ocupacionMap.get(t.codigo) || 0;
            const capacidadTotal = getCapacidad(t.codigo);
            const porcentaje = Math.round((ocupado / capacidadTotal) * 100);
            return {
                id: t.id,
                codigo: t.codigo,
                capacidadTotal,
                ocupado,
                porcentaje,
                activo: t.activo
            };
        });

        // Ordenar por código
        termosArray.sort((a, b) => a.codigo.localeCompare(b.codigo));

        setTermosData(termosArray);
    }, [colectas, termos]);

    const getColorByPercentage = (porcentaje: number): string => {
        if (porcentaje >= 90) return "bg-red-500";
        if (porcentaje >= 70) return "bg-orange-500";
        if (porcentaje >= 50) return "bg-yellow-500";
        return "bg-green-500";
    };

    const handleTermoCreated = () => {
        refetchColectas();
        refetchTermos();
    };

    const handleToggleActivo = async (id: string, actual: boolean) => {
        try {
            await toggleTermoActivo(id, !actual);
            toast.success(`Termo ${!actual ? 'activado' : 'desactivado'} correctamente`);
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDeleteTermo = async () => {
        if (!confirmDelete.id) return;

        setIsDeleting(true);
        try {
            await deleteTermo(confirmDelete.id);
            toast.success("Termo eliminado correctamente");
            setConfirmDelete({ isOpen: false, id: "", codigo: "" });
            refetchColectas();
        } catch (err: any) {
            toast.error(err.message || "No se pudo eliminar el termo");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loadingColectas || loadingTermos) return <div className="p-8 text-center text-gray-500">Cargando termos...</div>;
    if (errorColectas || errorTermos) return <div className="p-6 text-red-600 bg-red-50 rounded-lg">{errorColectas || errorTermos}</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ocupación de Termos</h1>
                    <p className="text-gray-500 mt-1">Visualiza el estado de capacidad de cada termo.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Termo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {termosData.map((termo) => (
                    <Card
                        key={termo.id}
                        className={`p-6 transition-all duration-300 ${!termo.activo ? 'grayscale opacity-60 bg-gray-50' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                <h3 className="text-xl font-bold text-gray-900">{termo.codigo}</h3>
                                {!termo.activo && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Desactivado</span>}
                            </div>
                            <span className={`text-2xl font-bold ${!termo.activo ? 'text-gray-400' : 'text-blue-600'}`}>{termo.porcentaje}%</span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                                <div
                                    className={`h-full ${termo.activo ? getColorByPercentage(termo.porcentaje) : 'bg-gray-400'} transition-all duration-500 flex items-center justify-center text-white text-xs font-semibold`}
                                    style={{ width: `${Math.min(termo.porcentaje, 100)}%` }}
                                >
                                    {termo.porcentaje > 10 && `${termo.porcentaje}%`}
                                </div>
                            </div>
                        </div>

                        {/* Información detallada */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ocupado:</span>
                                <span className="font-semibold text-gray-900">{termo.ocupado} pajuelas</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Disponible:</span>
                                <span className={`font-semibold ${!termo.activo ? 'text-gray-500' : 'text-green-600'}`}>
                                    {termo.capacidadTotal - termo.ocupado} pajuelas
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-100 pt-2">
                                <span className="text-gray-600">Capacidad Total:</span>
                                <span className="font-semibold text-gray-900">{termo.capacidadTotal} pajuelas</span>
                            </div>
                        </div>

                        {/* Indicador visual de estado y Botón de Acción */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex-1">
                                {termo.activo ? (
                                    <>
                                        {termo.porcentaje >= 100 && (
                                            <div className="text-xs text-red-600 font-semibold">⚠️ Lleno</div>
                                        )}
                                        {termo.porcentaje >= 90 && termo.porcentaje < 100 && (
                                            <div className="text-xs text-red-600 font-semibold">⚠️ Casi lleno</div>
                                        )}
                                        {termo.porcentaje >= 70 && termo.porcentaje < 90 && (
                                            <div className="text-xs text-orange-600 font-semibold">⚡ Alta ocupación</div>
                                        )}
                                        {termo.porcentaje < 70 && (
                                            <div className="text-xs text-green-600 font-semibold">✓ Espacio disponible</div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-xs text-gray-500 font-medium italic">Fuera de servicio</div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={termo.activo ? "ghost" : "primary"}
                                    onClick={() => handleToggleActivo(termo.id, termo.activo)}
                                    className="text-xs py-1"
                                >
                                    {termo.activo ? "Desactivar" : "Activar"}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setConfirmDelete({ isOpen: true, id: termo.id, codigo: termo.codigo })}
                                    className="text-red-500 hover:bg-red-50 py-1 px-2"
                                    title="Eliminar termo"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {termosData.length === 0 && (
                <Card className="p-8 text-center text-gray-500">
                    No hay termos registrados.
                </Card>
            )}

            <TermoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={handleTermoCreated}
            />

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
                onConfirm={handleDeleteTermo}
                title="Eliminar Termo"
                message={`¿Estás seguro de que quieres eliminar el termo "${confirmDelete.codigo}"? Esta acción no se puede deshacer y fallará si el termo tiene colectas asociadas.`}
                confirmText="ELIMINAR"
                variant="danger"
                icon="trash"
                isLoading={isDeleting}
            />
        </div>
    );
};
