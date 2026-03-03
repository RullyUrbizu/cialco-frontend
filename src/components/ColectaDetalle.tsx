import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import type { Colecta } from "../Modelo/Colecta";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ArrowLeft, FileText, ExternalLink, Hash, Layers, TrendingDown, Edit, History, TrendingUp } from "lucide-react";
import { MovimientoModal } from "./MovimientoModal";
import { ColectaModal } from "./ColectaModal";
import { useMovimientos } from "../hooks/useMovimientos";
import { Skeleton, CardSkeleton } from "./ui/Skeleton";
import { toast } from "sonner";

export const ColectaDetalle = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [colecta, setColecta] = useState<Colecta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [ingresoModalOpen, setIngresoModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const { movimientos, loading: loadingMovimientos, refetch: refetchMovimientos } = useMovimientos(
        colecta?.inventario?.id
    );

    const fetchColecta = () => {
        if (id) {
            setLoading(true);
            api.get(`/colectas/${id}`)
                .then((res) => setColecta(res.data))
                .catch((err) => {
                    console.error(err);
                    const msg = "Error al cargar la colecta.";
                    setError(msg);
                    toast.error(msg);
                })
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchColecta();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-0 space-y-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                </div>
                <Card className="p-6">
                    <Skeleton className="h-6 w-32 mb-6" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    if (error) return (
        <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
            <div className="text-red-600 font-medium">{error}</div>
            <Button variant="secondary" onClick={fetchColecta}>Reintentar</Button>
        </div>
    );

    if (!colecta) return <div className="p-8 text-center text-gray-500">No se encontró la colecta.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-0">
            {/* Botón volver */}
            <div className="mb-4">
                <Button variant="ghost" onClick={() => navigate("/")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Volver al Stock</span>
                    <span className="sm:hidden">Volver</span>
                </Button>
            </div>

            {/* Header: Título y botón editar */}
            <div className="mb-3 flex items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Detalle de Colecta</h1>

                <Button
                    onClick={() => setEditModalOpen(true)}
                    variant="ghost"
                    className="text-gray-500 hover:text-blue-600 flex-shrink-0"
                >
                    <Edit className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                </Button>
            </div>

            {/* Botones de movimientos */}
            <div className="mb-6 flex gap-2">
                <Button
                    onClick={() => setIngresoModalOpen(true)}
                    variant="secondary"
                    className="flex-1"
                >
                    <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                    Ingreso
                </Button>
                <Button
                    onClick={() => setModalOpen(true)}
                    variant="primary"
                    className="flex-1"
                    disabled={!colecta || (colecta.inventario?.stockActual ?? colecta.cantidad ?? 0) <= 0}
                >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Entrega
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Datos Principales */}
                <Card className="p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FileText className="text-blue-600" size={24} />
                        Información General
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Fecha</label>
                            <p className="text-lg text-gray-900 font-medium">
                                {colecta.fecha ? (() => {
                                    // Formatear fecha localmente sin desfase UTC
                                    const dStr = String(colecta.fecha).split('T')[0];
                                    if (dStr.includes('-')) {
                                        const [y, m, d] = dStr.split('-');
                                        return `${d}/${m}/${y}`;
                                    }
                                    return new Date(colecta.fecha).toLocaleDateString('es-AR');
                                })() : "-"}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Cantidad</label>
                            <p className="text-lg text-blue-600 font-bold">{colecta.cantidad}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Vigor / Motilidad</label>
                            <p className="text-lg text-gray-900">{colecta.vigorMot || "-"}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Stock Actual</label>
                            <p className="text-lg text-green-600 font-bold">
                                {colecta.inventario?.stockActual ?? colecta.cantidad ?? 0}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Datos del Toro */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="bg-orange-100 p-1 rounded-md">🐂</span>
                        Datos del Toro
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
                            <span className="text-gray-600">Nombre</span>
                            <Link to={`/toros/${colecta.toro?.id}`} className="group flex items-center gap-1 hover:text-blue-600 transition-colors">
                                <span className="font-medium text-gray-900 group-hover:text-blue-600">{colecta.toro?.nombre}</span>
                                <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500" />
                            </Link>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Raza</span>
                            <span className="font-medium text-gray-900">{colecta.toro?.raza}</span>
                        </div>
                    </div>
                </Card>

                {/* Datos del Cliente */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="bg-green-100 p-1 rounded-md">👤</span>
                        Datos del Cliente
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
                            <span className="text-gray-600">Razón Social</span>
                            <Link to={`/clientes/${colecta.cliente?.id}`} className="group flex items-center gap-1 hover:text-green-600 transition-colors">
                                <span className="font-medium text-gray-900 group-hover:text-green-600">{colecta.cliente?.razonSocial}</span>
                                <ExternalLink size={14} className="text-gray-300 group-hover:text-green-500" />
                            </Link>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">CUIT</span>
                            <span className="font-mono text-gray-900">{colecta.cliente?.cuit || colecta.cuit || "-"}</span>
                        </div>
                    </div>
                </Card>

                {/* Ubicación (Contenedores) */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Layers className="text-purple-600" size={20} />
                        Contenedores ({colecta.contenedores?.length || 0})
                    </h2>
                    {colecta.contenedores && colecta.contenedores.length > 0 ? (
                        <div className="space-y-3">
                            {colecta.contenedores.map((contenedor, index) => (
                                <div key={contenedor.id || index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase block mb-1">Termo</label>
                                            <span className="font-mono font-semibold text-gray-800">
                                                {contenedor.termo?.codigo || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase block mb-1">Canastillo</label>
                                            <span className="font-mono font-semibold text-gray-800">
                                                {contenedor.canastillo?.codigo || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase block mb-1">Stock Actual</label>
                                            <span className={`font-bold ${(contenedor.stockActual ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {contenedor.stockActual ?? 0}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase block mb-1">Inicial</label>
                                            <span className="font-semibold text-gray-600">
                                                {contenedor.cantidad || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            No hay contenedores registrados
                        </div>
                    )}
                </Card>

                {/* Movimientos Resumen */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Hash className="text-gray-600" size={20} />
                        Resumen de Pajuelas
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Ingreso Inicial</span>
                            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                {colecta.inventario?.cantidadInicial ?? colecta.cantidad ?? 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Ingresos Adicionales</span>
                            <span className="font-medium text-gray-900 bg-green-50 text-green-700 px-2 py-1 rounded">
                                {colecta.inventario?.ingresosTotal ?? 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Salidas</span>
                            <span className="font-medium text-gray-900 bg-red-50 text-red-700 px-2 py-1 rounded">
                                {colecta.inventario?.salidasTotal ?? 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                            <span className="text-gray-800 font-semibold">Stock Actual</span>
                            <span className="font-bold text-blue-600 text-lg">
                                {colecta.inventario?.stockActual ?? colecta.cantidad ?? 0}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Historial de Movimientos */}
            <Card className="p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <History className="text-gray-600" size={20} />
                    Historial de Movimientos
                </h2>

                {loadingMovimientos ? (
                    <div className="text-center py-4 text-gray-500">Cargando movimientos...</div>
                ) : movimientos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No hay movimientos registrados para esta colecta
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipo</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Remito</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cantidad</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimientos.map((mov) => (
                                    <tr key={mov.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {(() => {
                                                if (!mov.fecha) return "-";
                                                // Formatear hora localmente
                                                return new Date(mov.fecha).toLocaleString('es-AR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                });
                                            })()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mov.tipo === 'ingreso'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {mov.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Salida'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-mono text-gray-700">
                                            {mov.remito || '-'}
                                        </td>
                                        <td className={`py-3 px-4 text-sm font-semibold text-right ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {mov.tipo === 'ingreso' ? '+' : '-'}{mov.cantidad}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate" title={mov.notas || ''}>
                                            {mov.notas || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modales */}
            {colecta && (
                <MovimientoModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    colectaId={colecta.id}
                    stockDisponible={colecta.inventario?.stockActual ?? colecta.cantidad ?? 0}
                    tipo="salida"
                    onSuccess={() => {
                        fetchColecta();
                        refetchMovimientos();
                    }}
                />
            )}

            {colecta && (
                <MovimientoModal
                    isOpen={ingresoModalOpen}
                    onClose={() => setIngresoModalOpen(false)}
                    colectaId={colecta.id}
                    stockDisponible={colecta.inventario?.stockActual ?? colecta.cantidad ?? 0}
                    tipo="ingreso"
                    onSuccess={() => {
                        fetchColecta();
                        refetchMovimientos();
                    }}
                />
            )}

            {colecta && (
                <ColectaModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    colectaToEdit={colecta}
                    onUpdated={() => {
                        fetchColecta();
                        setEditModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};
