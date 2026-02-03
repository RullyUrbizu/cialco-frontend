import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ArrowLeft, FileText, History, Database, ExternalLink } from "lucide-react";

interface ToroDetalleData {
    id: string;
    nombre: string;
    raza: string;
    colectas: any[];
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
                    setError("Error al cargar los detalles del toro.");
                })
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchToro();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando detalles del toro...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!toro) return <div className="p-8 text-center text-gray-500">No se encontró el toro.</div>;

    // Calcular stock total sumando el stockActual de cada colecta
    const stockTotal = toro.colectas?.reduce((acc, c) => acc + (c.inventario?.stockActual ?? 0), 0) || 0;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/Toros")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Toros
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Detalle del Toro</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Información del Toro */}
                <Card className="p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FileText className="text-blue-600" size={24} />
                        Información General
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
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
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Termo</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Vigor/Mot</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Stock Actual</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {toro.colectas?.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((c) => (
                                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 text-sm text-gray-900 font-medium">
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
                                            {c.cliente ? (
                                                <Link to={`/clientes/${c.cliente.id}`} className="group flex items-center gap-1 hover:text-green-600 transition-colors">
                                                    <span className="text-gray-600 group-hover:text-green-600">{c.cliente.razonSocial}</span>
                                                    <ExternalLink size={12} className="text-gray-300 group-hover:text-green-500" />
                                                </Link>
                                            ) : "-"}
                                        </td>
                                        <td className="py-4 px-4 text-sm font-mono text-gray-500">
                                            {c.termo?.codigo || "-"}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-right text-gray-600 font-medium">
                                            {c.vigorMot || "-"}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className={`text-sm font-bold ${(c.inventario?.stockActual ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {c.inventario?.stockActual ?? 0}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <Link to={`/colectas/${c.id}`}>
                                                <Button size="sm" variant="secondary">Detalle</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};
