import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ArrowLeft, User, History, Database, CreditCard, ExternalLink } from "lucide-react";

interface ClienteDetalleData {
    id: string;
    razonSocial: string;
    cuit: string;
    colectas: any[];
}

export const ClienteDetalle = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [cliente, setCliente] = useState<ClienteDetalleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCliente = () => {
        if (id) {
            setLoading(true);
            api.get(`/ clientes / ${id} `)
                .then((res) => setCliente(res.data))
                .catch((err) => {
                    console.error(err);
                    setError("Error al cargar los detalles del cliente.");
                })
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchCliente();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando detalles del cliente...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!cliente) return <div className="p-8 text-center text-gray-500">No se encontró el cliente.</div>;

    // Calcular stock total sumando el stockActual de cada colecta del cliente
    const stockTotal = cliente.colectas?.reduce((acc, c) => acc + (c.inventario?.stockActual ?? 0), 0) || 0;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/Clientes")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Clientes
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Detalle del Cliente</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Información del Cliente */}
                <Card className="p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <User className="text-green-600" size={24} />
                        Información General
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Razón Social</label>
                            <p className="text-2xl font-bold text-gray-900">{cliente.razonSocial}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">CUIT / Identificación</label>
                            <div className="flex items-center gap-2 text-xl text-gray-700">
                                <CreditCard size={18} className="text-gray-400" />
                                <span className="font-mono">{cliente.cuit || "-"}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Resumen de Stock */}
                <Card className="p-6 flex flex-col justify-center items-center bg-green-50 border-green-100">
                    <Database className="text-green-600 mb-2" size={32} />
                    <label className="text-xs font-semibold text-green-800 uppercase">Stock Total en Planta</label>
                    <p className="text-4xl font-black text-green-700 mt-1">{stockTotal}</p>
                    <p className="text-xs text-green-600 mt-2">Pajuelas almacenadas</p>
                </Card>
            </div>

            {/* Historial de Colectas del Cliente */}
            <Card className="p-6 mt-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <History className="text-gray-600" size={20} />
                    Inventario de Colectas
                </h2>

                {cliente.colectas?.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500">Este cliente aún no tiene stock registrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Toro</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Termo</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Vigor/Mot</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Stock Actual</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cliente.colectas?.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((c) => (
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
                                            {c.toro ? (
                                                <Link to={`/toros/${c.toro.id}`} className="group flex flex-col hover:text-blue-600 transition-colors">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold text-gray-900 group-hover:text-blue-600">{c.toro.nombre}</span>
                                                        <ExternalLink size={12} className="text-gray-300 group-hover:text-blue-500" />
                                                    </div>
                                                    <span className="text-xs text-gray-500 group-hover:text-blue-400">{c.toro.raza}</span>
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
                                            <span className={`text - sm font - bold ${(c.inventario?.stockActual ?? 0) > 0 ? 'text-green-600' : 'text-red-500'} `}>
                                                {c.inventario?.stockActual ?? 0}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <Link to={`/ colectas / ${c.id} `}>
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
