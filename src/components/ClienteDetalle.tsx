import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ArrowLeft, User, History, Database, CreditCard, ExternalLink } from "lucide-react";
import { Skeleton, CardSkeleton, TableSkeleton } from "./ui/Skeleton";
import { toast } from "sonner";
import type { Cliente } from "../Modelo/Cliente";
import type { Colecta } from "../Modelo/Colecta";

interface ClienteDetalleData extends Cliente {
    colectas: Colecta[];
}

export const ClienteDetalle = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [cliente, setCliente] = useState<ClienteDetalleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCliente = useCallback(() => {
        if (id) {
            setLoading(true);
            api.get<ClienteDetalleData>(`/clientes/${id}`)
                .then((res) => setCliente(res.data))
                .catch((err) => {
                    console.error(err);
                    const msg = "Error al cargar los detalles del cliente.";
                    setError(msg);
                    toast.error(msg);
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    useEffect(() => {
        fetchCliente();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4 md:p-0 space-y-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
                <Card className="p-6">
                    <Skeleton className="h-6 w-32 mb-6" />
                    <TableSkeleton rows={5} />
                </Card>
            </div>
        );
    }

    if (error) return (
        <div className="max-w-5xl mx-auto p-8 text-center space-y-4">
            <div className="text-terracotta font-medium bg-terracotta-light p-6 rounded-xl border border-terracotta/20">{error}</div>
            <Button variant="secondary" onClick={fetchCliente}>Reintentar</Button>
        </div>
    );

    if (!cliente) return <div className="p-8 text-center text-ink-faint">No se encontró el cliente.</div>;

    // Calcular stock total sumando el stockActual de todos los contenedores
    const stockTotal = cliente.colectas?.reduce((acc, c) => {
        const stockColecta = c.contenedores?.reduce((sum: number, cont) => sum + (cont.stockActual ?? 0), 0) || 0;
        return acc + stockColecta;
    }, 0) || 0;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-0 animate-fade-up">
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button variant="ghost" onClick={() => navigate("/Clientes")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
                <div>
                    <p className="eyebrow mb-1">Cialco · Clientes</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Detalle del Cliente</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Información del Cliente */}
                <Card className="p-6 md:col-span-2">
                    <h2 className="text-base font-semibold mb-5 flex items-center gap-2 text-ink">
                        <User className="text-cialco" size={20} />
                        Información General
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.14em]">Razón Social</label>
                            <p className="font-serif text-2xl font-semibold text-ink mt-1">{cliente.razonSocial}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.14em]">CUIT / Identificación</label>
                            <div className="flex items-center gap-2 text-xl text-ink-soft mt-1">
                                <CreditCard size={18} className="text-ink-faint" />
                                <span className="font-mono">{cliente.cuit || "-"}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Resumen de Stock */}
                <Card className="p-6 flex flex-col justify-center items-center bg-gradient-to-br from-moss-light to-ivory-100 border-moss/20">
                    <Database className="text-pine mb-2" size={32} />
                    <label className="text-[10px] font-semibold text-pine uppercase tracking-[0.14em]">Stock Total en Planta</label>
                    <p className="font-serif text-5xl font-semibold text-pine mt-1 tabular">{stockTotal}</p>
                    <p className="text-xs text-ink-muted mt-2">Pajuelas almacenadas</p>
                </Card>
            </div>

            {/* Historial de Colectas del Cliente */}
            <Card className="p-6 mt-6">
                <h2 className="text-base font-semibold mb-6 flex items-center gap-2 text-ink">
                    <History className="text-brass" size={20} />
                    Inventario de Colectas
                </h2>

                {cliente.colectas?.length === 0 ? (
                    <div className="text-center py-12 bg-ivory-100/60 rounded-xl border-2 border-dashed border-hairline">
                        <p className="text-ink-faint">Este cliente aún no tiene stock registrado.</p>
                    </div>
                ) : (
                    <>
                        {/* Vista de tabla para desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-hairline">
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Fecha</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Toro</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Contenedores</th>
                                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Vigor/Mot</th>
                                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Stock Actual</th>
                                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cliente.colectas?.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((c) => {
                                        const stockColecta = c.contenedores?.reduce((sum: number, cont) => sum + (cont.stockActual ?? 0), 0) || 0;
                                        return (
                                            <tr key={c.id} className="border-b border-hairline/60 hover:bg-ivory-100/60 transition-colors">
                                                <td className="py-4 px-4 text-sm text-ink font-medium tabular">
                                                    {(() => {
                                                        if (!c.fecha) return "-";
                                                        const parts = String(c.fecha).split('T')[0].split('-');
                                                        if (parts.length === 3) {
                                                            const [y, m, d] = parts;
                                                            return `${d}/${m}/${y}`;
                                                        }
                                                        return String(c.fecha);
                                                    })()}
                                                </td>
                                                <td className="py-4 px-4 text-sm">
                                                    {c.toro ? (
                                                        <Link to={`/toros/${c.toro.id}`} className="group flex flex-col hover:text-cialco transition-colors">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-semibold text-ink group-hover:text-cialco">{c.toro.nombre}</span>
                                                                <ExternalLink size={12} className="text-ink-faint group-hover:text-cialco" />
                                                            </div>
                                                            <span className="text-xs text-ink-faint group-hover:text-cialco">{c.toro.raza}</span>
                                                        </Link>
                                                    ) : "-"}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-mono text-ink-muted">
                                                    {c.contenedores && c.contenedores.length > 0
                                                        ? `${c.contenedores.length} cont. (${c.contenedores.map((cont) => `${cont.termo?.codigo ?? "-"} (${cont.canastillo?.codigo ?? "-"})`).join(', ')})`
                                                        : "-"}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-right text-ink-muted font-medium">
                                                    {c.vigorMot || "-"}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className={`text-sm font-bold tabular ${stockColecta > 0 ? 'text-pine' : 'text-terracotta'}`}>
                                                        {stockColecta}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <Link to={`/colectas/${c.id}`}>
                                                        <Button size="sm" variant="secondary">Detalle</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Vista de tarjetas para móvil */}
                        <div className="md:hidden space-y-3">
                            {cliente.colectas?.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((c) => {
                                const stockColecta = c.contenedores?.reduce((sum: number, cont) => sum + (cont.stockActual ?? 0), 0) || 0;
                                return (
                                    <div key={c.id} className="p-4 border border-hairline rounded-xl bg-paper shadow-soft">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="text-[10px] text-ink-faint uppercase tracking-widest mb-1">Fecha</div>
                                                <div className="font-semibold text-ink tabular">
                                                    {(() => {
                                                        if (!c.fecha) return "-";
                                                        const parts = String(c.fecha).split('T')[0].split('-');
                                                        if (parts.length === 3) {
                                                            const [y, m, d] = parts;
                                                            return `${d}/${m}/${y}`;
                                                        }
                                                        return String(c.fecha);
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-ink-faint uppercase tracking-widest mb-1">Stock</div>
                                                <div className={`font-serif text-lg font-semibold tabular ${stockColecta > 0 ? 'text-pine' : 'text-terracotta'}`}>
                                                    {stockColecta}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            <div>
                                                <div className="text-[10px] text-ink-faint uppercase tracking-widest">Toro</div>
                                                {c.toro ? (
                                                    <Link to={`/toros/${c.toro.id}`} className="text-cialco font-medium hover:underline">
                                                        {c.toro.nombre} <span className="text-ink-faint text-sm">({c.toro.raza})</span>
                                                    </Link>
                                                ) : <span className="text-ink-faint">-</span>}
                                            </div>

                                            <div>
                                                <div className="text-[10px] text-ink-faint uppercase tracking-widest">Contenedores</div>
                                                <div className="text-sm font-mono text-ink-soft">
                                                    {c.contenedores && c.contenedores.length > 0
                                                        ? `${c.contenedores.length} cont. (${c.contenedores.map((cont) => `${cont.termo?.codigo ?? "-"} (${cont.canastillo?.codigo ?? "-"})`).join(', ')})`
                                                        : "-"}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] text-ink-faint uppercase tracking-widest">Vigor/Motilidad</div>
                                                <div className="text-sm text-ink-soft">{c.vigorMot || "-"}</div>
                                            </div>
                                        </div>

                                        <Link to={`/colectas/${c.id}`} className="block">
                                            <Button size="sm" variant="secondary" className="w-full">Ver Detalle</Button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};
