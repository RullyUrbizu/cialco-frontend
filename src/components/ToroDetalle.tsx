import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ArrowLeft, FileText, History, Database, ExternalLink } from "lucide-react";
import type { Toro } from "../Modelo/Toro";
import type { Colecta, ColectaContenedor } from "../Modelo/Colecta";
import { Skeleton, CardSkeleton, TableSkeleton } from "./ui/Skeleton";
import { toast } from "sonner";

interface ToroDetalleData extends Toro {
    colectas: Colecta[];
}

export const ToroDetalle = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [toro, setToro] = useState<ToroDetalleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchToro = () => {
        if (id) {
            setLoading(true);
            api.get(`/toros/${id}`)
                .then((res) => setToro(res.data))
                .catch((err) => {
                    console.error(err);
                    const msg = "Error al cargar los detalles del toro.";
                    setError(msg);
                    toast.error(msg);
                })
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchToro();
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
            <Button variant="secondary" onClick={fetchToro}>Reintentar</Button>
        </div>
    );

    if (!toro) return <div className="p-8 text-center text-ink-faint">No se encontró el toro.</div>;

    // Calcular stock total
    const stockTotal = toro.colectas?.reduce((acc: number, c: Colecta) => {
        const stockColecta = c.contenedores?.reduce((sum: number, cont: ColectaContenedor) => sum + (cont.stockActual ?? 0), 0) || 0;
        return acc + stockColecta;
    }, 0) || 0;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-0 animate-fade-up">
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button variant="ghost" onClick={() => navigate("/Toros")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
                <div>
                    <p className="eyebrow mb-1">Cialco · Reproductores</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">Detalle del Toro</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Información del Toro */}
                <Card className="p-6 md:col-span-2">
                    <h2 className="text-base font-semibold mb-5 flex items-center gap-2 text-ink">
                        <FileText className="text-pine" size={20} />
                        Información General
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.14em]">Nombre</label>
                            <p className="font-serif text-2xl font-semibold text-ink mt-1">{toro.nombre}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-[0.14em]">Raza</label>
                            <p className="text-xl text-ink-soft mt-1">{toro.raza}</p>
                        </div>
                    </div>
                </Card>

                {/* Resumen de Stock */}
                <Card className="p-6 flex flex-col justify-center items-center bg-gradient-to-br from-moss-light to-ivory-100 border-moss/20">
                    <Database className="text-pine mb-2" size={32} />
                    <label className="text-[10px] font-semibold text-pine uppercase tracking-[0.14em]">Stock Total Disponible</label>
                    <p className="font-serif text-5xl font-semibold text-pine mt-1 tabular">{stockTotal}</p>
                    <p className="text-xs text-ink-muted mt-2">Pajuelas en inventario</p>
                </Card>
            </div>

            {/* Historial de Colectas */}
            <Card className="p-6 mt-6">
                <h2 className="text-base font-semibold mb-6 flex items-center gap-2 text-ink">
                    <History className="text-brass" size={20} />
                    Historial de Colectas
                </h2>

                {toro.colectas?.length === 0 ? (
                    <div className="text-center py-12 bg-ivory-100/60 rounded-xl border-2 border-dashed border-hairline">
                        <p className="text-ink-faint">Este toro aún no tiene colectas registradas.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-hairline">
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Fecha</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Cliente</th>
                                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Color</th>
                                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Vigor/Mot</th>
                                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Stock Actual</th>
                                        <th className="text-center py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...toro.colectas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((c) => {
                                        const stockColecta = c.contenedores?.reduce((sum: number, cont: ColectaContenedor) => sum + (cont.stockActual ?? 0), 0) || 0;
                                        return (
                                            <tr key={c.id} className="border-b border-hairline/60 hover:bg-ivory-100/60 transition-colors">
                                                <td className="py-4 px-4 text-sm text-ink font-medium tabular">
                                                    {c.fecha ? (() => {
                                                        const parts = String(c.fecha).split('T')[0].split('-');
                                                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(c.fecha);
                                                    })() : "-"}
                                                </td>
                                                <td className="py-4 px-4 text-sm">
                                                    {c.cliente ? (
                                                        <Link to={`/clientes/${c.cliente.id}`} className="group flex items-center gap-1 hover:text-pine transition-colors">
                                                            <span className="text-ink-soft group-hover:text-pine">{c.cliente.razonSocial}</span>
                                                            <ExternalLink size={12} className="text-ink-faint group-hover:text-pine" />
                                                        </Link>
                                                    ) : "-"}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex justify-center">
                                                        {c.color ? (
                                                            <div
                                                                className="w-4 h-4 rounded-full border border-ink/10 shadow-sm"
                                                                style={{ backgroundColor: c.color }}
                                                                title={`Color: ${c.color}`}
                                                            />
                                                        ) : (
                                                            <span className="text-ink-faint">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-right text-ink-muted font-medium">{c.vigorMot || "-"}</td>
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

                        {/* Vista móvil */}
                        <div className="md:hidden space-y-3">
                            {[...toro.colectas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((c) => {
                                const stockColecta = c.contenedores?.reduce((sum: number, cont: ColectaContenedor) => sum + (cont.stockActual ?? 0), 0) || 0;
                                return (
                                    <div key={c.id} className="p-4 border border-hairline rounded-xl bg-paper shadow-soft">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="text-[10px] text-ink-faint uppercase tracking-widest mb-1">Fecha</div>
                                                <div className="font-semibold text-ink tabular">
                                                    {c.fecha ? (() => {
                                                        const parts = String(c.fecha).split('T')[0].split('-');
                                                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(c.fecha);
                                                    })() : "-"}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                {c.color ? (
                                                    <>
                                                        <div
                                                            className="w-5 h-5 rounded-full border border-ink/10 shadow-sm mb-1"
                                                            style={{ backgroundColor: c.color }}
                                                        />
                                                        <div className="text-[8px] text-ink-faint font-bold uppercase">Color</div>
                                                    </>
                                                ) : (
                                                    <span className="text-ink-faint">-</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-ink-faint uppercase tracking-widest mb-1">Stock</div>
                                                <div className={`font-serif text-lg font-semibold tabular ${stockColecta > 0 ? 'text-pine' : 'text-terracotta'}`}>{stockColecta}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            <div>
                                                <div className="text-[10px] text-ink-faint uppercase tracking-widest">Cliente</div>
                                                {c.cliente ? (
                                                    <Link to={`/clientes/${c.cliente.id}`} className="text-pine font-medium hover:underline">{c.cliente.razonSocial}</Link>
                                                ) : "-"}
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
