import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import type { Colecta } from "../Modelo/Colecta";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ArrowLeft, FileText, ExternalLink, Hash, Layers, TrendingDown, Edit, History, TrendingUp, MoveHorizontal, Beef, Users } from "lucide-react";
import { MovimientoModal } from "./MovimientoModal";
import { ColectaModal } from "./ColectaModal";
import { TransferenciaModal } from "./TransferenciaModal";
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
    const [transferModal, setTransferModal] = useState<{ isOpen: boolean; origen: any }>({
        isOpen: false,
        origen: null
    });
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

    const colorName = useMemo(() => {
        if (!colecta?.color) return "Sin color";
        const colors: any = { '#ffffff': 'Blanco', '#3b82f6': 'Azul', '#22c55e': 'Verde', '#eab308': 'Amarillo' };
        return colors[colecta.color] || "Personalizado";
    }, [colecta?.color]);

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
            <div className="text-terracotta font-medium bg-terracotta-light p-6 rounded-xl border border-terracotta/20">{error}</div>
            <Button variant="secondary" onClick={fetchColecta}>Reintentar</Button>
        </div>
    );

    if (!colecta) return <div className="p-8 text-center text-ink-faint">No se encontró la colecta.</div>;

    const stockActual = colecta.inventario?.stockActual ?? colecta.cantidad ?? 0;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-0 animate-fade-up">
            {/* Botón volver */}
            <div className="mb-4">
                <Button variant="ghost" onClick={() => navigate("/")} className="-ml-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Volver al Stock</span>
                    <span className="sm:hidden text-sm">Volver al Stock</span>
                </Button>
            </div>

            {/* Header: Título y botón editar */}
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="eyebrow mb-1">Cialco · Detalle de Colecta</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Detalle de Colecta</h1>
                </div>

                <Button
                    onClick={() => setEditModalOpen(true)}
                    variant="ghost"
                    className="text-ink-faint hover:text-cialco flex-shrink-0 h-9 px-3"
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
                    className="flex-1 h-11"
                >
                    <TrendingUp className="mr-2 h-4 w-4 text-pine" />
                    Ingreso
                </Button>
                <Button
                    onClick={() => setModalOpen(true)}
                    variant="primary"
                    className="flex-1 h-11"
                    disabled={!colecta || stockActual <= 0}
                >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Entrega
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Datos Principales */}
                <Card className="p-4 sm:p-6 md:col-span-2">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
                        <FileText className="text-cialco" size={22} />
                        Información General
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.12em]">Fecha</label>
                            <p className="text-base sm:text-lg text-ink font-medium tabular">
                                {colecta.fecha ? (() => {
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
                            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.12em]">Cantidad</label>
                            <p className="text-base sm:text-lg text-cialco font-semibold tabular">{colecta.inventario?.cantidadInicial ?? colecta.cantidad ?? 0}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.12em]">Vigor / Motilidad</label>
                            <p className="text-base sm:text-lg text-ink">{colecta.vigorMot || "-"}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.12em]">Stock Actual</label>
                            <p className="text-base sm:text-lg text-pine font-semibold tabular">{stockActual}</p>
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.12em]">Color</label>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div
                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-ink/10 shadow-sm"
                                    style={{ backgroundColor: colecta.color || 'transparent' }}
                                />
                                <span className="text-xs sm:text-sm text-ink-soft">{colorName}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Datos del Toro */}
                <Card className="p-4 sm:p-6">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
                        <span className="p-1.5 rounded-md bg-brass-50 text-brass-dark"><Beef size={18} /></span>
                        Datos del Toro
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-hairline pb-2 items-center">
                            <span className="text-sm text-ink-muted">Nombre</span>
                            <Link to={`/toros/${colecta.toro?.id}`} className="group flex items-center gap-1 hover:text-cialco transition-colors">
                                <span className="text-sm sm:text-base font-medium text-ink group-hover:text-cialco">{colecta.toro?.nombre}</span>
                                <ExternalLink size={14} className="text-ink-faint group-hover:text-cialco" />
                            </Link>
                        </div>
                        <div className="flex justify-between border-b border-hairline pb-2">
                            <span className="text-sm text-ink-muted">Raza</span>
                            <span className="text-sm sm:text-base font-medium text-ink">{colecta.toro?.raza}</span>
                        </div>
                    </div>
                </Card>

                {/* Datos del Cliente */}
                <Card className="p-4 sm:p-6">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
                        <span className="p-1.5 rounded-md bg-moss-light text-pine"><Users size={18} /></span>
                        Datos del Cliente
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-hairline pb-2 items-center">
                            <span className="text-sm text-ink-muted">Razón Social</span>
                            <Link to={`/clientes/${colecta.cliente?.id}`} className="group flex items-center gap-1 hover:text-pine transition-colors">
                                <span className="text-sm sm:text-base font-medium text-ink group-hover:text-pine">{colecta.cliente?.razonSocial}</span>
                                <ExternalLink size={14} className="text-ink-faint group-hover:text-pine" />
                            </Link>
                        </div>
                        <div className="flex justify-between border-b border-hairline pb-2">
                            <span className="text-sm text-ink-muted">CUIT</span>
                            <span className="text-sm sm:text-base font-mono text-ink">{colecta.cliente?.cuit || colecta.cuit || "-"}</span>
                        </div>
                    </div>
                </Card>

                {/* Ubicación (Contenedores) */}
                <Card className="p-4 sm:p-6">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
                        <Layers className="text-cialco" size={20} />
                        Contenedores ({colecta.contenedores?.length || 0})
                    </h2>
                    {colecta.contenedores && colecta.contenedores.length > 0 ? (
                        <div className="space-y-4">
                            {colecta.contenedores.map((contenedor, index) => (
                                <div key={contenedor.id || index} className="bg-ivory-100/60 p-3 sm:p-4 rounded-xl border border-hairline">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <label className="text-[10px] text-ink-faint uppercase tracking-[0.12em] block mb-0.5">Termo</label>
                                            <span className="font-mono font-semibold text-ink">
                                                {contenedor.termo?.codigo || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-ink-faint uppercase tracking-[0.12em] block mb-0.5">Canastillo</label>
                                            <span className="font-mono font-semibold text-ink">
                                                {contenedor.canastillo?.codigo || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-ink-faint uppercase tracking-[0.12em] block mb-0.5">Stock Actual</label>
                                            <span className={`font-bold tabular ${(contenedor.stockActual ?? 0) > 0 ? 'text-pine' : 'text-terracotta'}`}>
                                                {contenedor.stockActual ?? 0}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-ink-faint uppercase tracking-[0.12em] block mb-0.5">Inicial</label>
                                            <span className="font-semibold text-ink-muted tabular">
                                                {contenedor.cantidad || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {(contenedor.stockActual ?? 0) > 0 && (
                                        <div className="mt-3 flex justify-end border-t border-hairline pt-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-cialco hover:bg-cialco-50 py-1 h-8"
                                                onClick={() => setTransferModal({
                                                    isOpen: true,
                                                    origen: {
                                                        id: contenedor.id,
                                                        termo: contenedor.termo?.codigo || "-",
                                                        canastillo: contenedor.canastillo?.codigo || "-",
                                                        stockActual: contenedor.stockActual
                                                    }
                                                })}
                                            >
                                                <MoveHorizontal className="mr-2 h-3.5 w-3.5" />
                                                <span className="text-xs">Mover</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-ink-faint text-sm italic">
                            No hay contenedores registrados
                        </div>
                    )}
                </Card>

                {/* Movimientos Resumen */}
                <Card className="p-4 sm:p-6">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
                        <Hash className="text-brass" size={20} />
                        Resumen de Pajuelas
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-hairline">
                            <span className="text-sm text-ink-muted">Ingreso Inicial</span>
                            <span className="text-sm font-medium text-ink bg-ivory-200/70 px-2 py-0.5 rounded tabular">
                                {colecta.inventario?.cantidadInicial ?? colecta.cantidad ?? 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-hairline">
                            <span className="text-sm text-ink-muted">Ingresos Adicionales</span>
                            <span className="chip chip-green tabular">
                                {colecta.inventario?.ingresosTotal ?? 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-hairline">
                            <span className="text-sm text-ink-muted">Salidas</span>
                            <span className="chip chip-red tabular">
                                {colecta.inventario?.salidasTotal ?? 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-ink font-semibold text-sm">Stock Actual</span>
                            <span className="font-serif font-semibold text-cialco text-2xl tabular">
                                {stockActual}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Historial de Movimientos */}
            <Card className="p-4 sm:p-6 mt-6">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
                    <History className="text-ink-muted" size={20} />
                    Historial de Movimientos
                </h2>

                {loadingMovimientos ? (
                    <div className="text-center py-8 text-ink-faint flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-pine border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Cargando movimientos...</span>
                    </div>
                ) : movimientos.length === 0 ? (
                    <div className="text-center py-10 text-ink-faint border-2 border-dashed border-hairline rounded-2xl">
                        No hay movimientos registrados para esta colecta
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Vista de Tabla para Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-hairline">
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Fecha</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Tipo</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Remito</th>
                                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Cantidad</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movimientos.map((mov) => (
                                        <tr key={mov.id} className="border-b border-hairline/60 hover:bg-ivory-100/60 transition-colors">
                                            <td className="py-3 px-4 text-sm text-ink-muted tabular">
                                                {(() => {
                                                    if (!mov.fecha) return "-";
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
                                                <span className={`chip ${mov.tipo === 'ingreso' ? 'chip-green' : 'chip-red'}`}>
                                                    {mov.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Salida'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm font-mono text-ink">
                                                {mov.remito || '-'}
                                            </td>
                                            <td className={`py-3 px-4 text-sm font-semibold text-right tabular ${mov.tipo === 'ingreso' ? 'text-pine' : 'text-terracotta'
                                                }`}>
                                                {mov.tipo === 'ingreso' ? '+' : '-'}{mov.cantidad}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-ink-faint max-w-xs truncate" title={mov.notas || ''}>
                                                {mov.notas || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Vista de Cards para Mobile */}
                        <div className="md:hidden space-y-3">
                            {movimientos.map((mov) => (
                                <div key={mov.id} className="p-3 bg-paper border border-hairline rounded-xl shadow-soft space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-ink-faint uppercase tracking-widest font-semibold">Fecha</span>
                                            <span className="text-xs font-semibold text-ink tabular">
                                                {mov.fecha ? new Date(mov.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </span>
                                        </div>
                                        <span className={`chip ${mov.tipo === 'ingreso' ? 'chip-green' : 'chip-red'}`}>
                                            {mov.tipo === 'ingreso' ? 'INGRESO' : 'SALIDA'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline/70">
                                        <div>
                                            <span className="text-[10px] text-ink-faint uppercase tracking-widest block">Remito</span>
                                            <span className="text-xs font-mono text-ink">{mov.remito || '-'}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-ink-faint uppercase tracking-widest block">Cantidad</span>
                                            <span className={`text-base font-bold tabular ${mov.tipo === 'ingreso' ? 'text-pine' : 'text-terracotta'}`}>
                                                {mov.tipo === 'ingreso' ? '+' : '-'}{mov.cantidad}
                                            </span>
                                        </div>
                                    </div>
                                    {mov.notas && (
                                        <div className="pt-2 border-t border-hairline/70">
                                            <span className="text-[10px] text-ink-faint uppercase tracking-widest block">Notas</span>
                                            <p className="text-xs text-ink-soft leading-relaxed italic">"{mov.notas}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Modales */}
            {colecta && (
                <MovimientoModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    colectaId={colecta.id}
                    stockDisponible={stockActual}
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
                    stockDisponible={stockActual}
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

            {transferModal.isOpen && transferModal.origen && (
                <TransferenciaModal
                    isOpen={transferModal.isOpen}
                    origen={transferModal.origen}
                    onClose={() => setTransferModal({ ...transferModal, isOpen: false })}
                    onSuccess={() => {
                        fetchColecta();
                        refetchMovimientos();
                    }}
                />
            )}
        </div>
    );
};
