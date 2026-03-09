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
            <div className="text-red-600 font-medium">{error}</div>
            <Button variant="secondary" onClick={fetchToro}>Reintentar</Button>
        </div>
    );

    if (!toro) return <div className="p-8 text-center text-gray-500">No se encontró el toro.</div>;

    // Calcular stock total
    const stockTotal = toro.colectas?.reduce((acc: number, c: Colecta) => {
        const stockColecta = c.contenedores?.reduce((sum: number, cont: ColectaContenedor) => sum + (cont.stockActual ?? 0), 0) || 0;
        return acc + stockColecta;
    }, 0) || 0;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-0">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button variant="ghost" onClick={() => navigate("/Toros")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Detalle del Toro</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Información del Toro */}
                <Card className="p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FileText className="text-blue-600" size={24} />
                        Información General
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Nombre</label>
                            <p className="text-2xl font-bold text-gray-900">{toro.nombre}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Raza</label>
                            <p className="text-xl text-gray-700">{toro.raza}</p>
                        </div>
                    </div>
                </Card>

                {/* Resumen de Stock */}
                <Card className="p-6 flex flex-col justify-center items-center bg-blue-50 border-blue-100">
                    <Database className="text-blue-600 mb-2" size={32} />
                    <label className="text-xs font-semibold text-blue-800 uppercase">Stock Total Disponible</label>
                    <p className="text-4xl font-black text-blue-700 mt-1">{stockTotal}</p>
                    <p className="text-xs text-blue-600 mt-2">Pajuelas en inventario</p>
                </Card>
            </div>

            {/* Historial de Colectas */}
            <Card className="p-6 mt-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <History className="text-gray-600" size={20} />
                    Historial de Colectas
                </h2>

                {toro.colectas?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500">Este toro aún no tiene colectas registradas.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Color</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Vigor/Mot</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Stock Actual</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...toro.colectas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((c) => {
                                        const stockColecta = c.contenedores?.reduce((sum: number, cont: ColectaContenedor) => sum + (cont.stockActual ?? 0), 0) || 0;
                                        return (
                                            <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                                                    {c.fecha ? (() => {
                                                        const parts = String(c.fecha).split('T')[0].split('-');
                                                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(c.fecha);
                                                    })() : "-"}
                                                </td>
                                                <td className="py-4 px-4 text-sm">
                                                    {c.cliente ? (
                                                        <Link to={`/clientes/${c.cliente.id}`} className="group flex items-center gap-1 hover:text-green-600 transition-colors">
                                                            <span className="text-gray-600 group-hover:text-green-600">{c.cliente.razonSocial}</span>
                                                            <ExternalLink size={12} className="text-gray-300 group-hover:text-green-500" />
                                                        </Link>
                                                    ) : "-"}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex justify-center">
                                                        {c.color ? (
                                                            <div
                                                                className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                                                                style={{ backgroundColor: c.color }}
                                                                title={`Color: ${c.color}`}
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-right text-gray-600 font-medium">{c.vigorMot || "-"}</td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className={`text-sm font-bold ${stockColecta > 0 ? 'text-green-600' : 'text-red-500'}`}>
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
                                    <div key={c.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">Fecha</div>
                                                <div className="font-semibold text-gray-900">
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
                                                            className="w-5 h-5 rounded-full border border-gray-200 shadow-sm mb-1"
                                                            style={{ backgroundColor: c.color }}
                                                        />
                                                        <div className="text-[8px] text-gray-400 font-bold uppercase">Color</div>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 mb-1">Stock</div>
                                                <div className={`text-lg font-bold ${stockColecta > 0 ? 'text-green-600' : 'text-red-500'}`}>{stockColecta}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            <div>
                                                <div className="text-xs text-gray-500">Cliente</div>
                                                {c.cliente ? (
                                                    <Link to={`/clientes/${c.cliente.id}`} className="text-green-600 font-medium hover:underline">{c.cliente.razonSocial}</Link>
                                                ) : "-"}
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Vigor/Motilidad</div>
                                                <div className="text-sm text-gray-700">{c.vigorMot || "-"}</div>
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
