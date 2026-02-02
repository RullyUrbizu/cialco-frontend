import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import type { Colecta } from "../Modelo/Colecta";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ArrowLeft, FileText, Hash, Layers, TrendingDown } from "lucide-react";
import { MovimientoModal } from "./MovimientoModal";

export const ColectaDetalle = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [colecta, setColecta] = useState<Colecta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchColecta = () => {
        if (id) {
            setLoading(true);
            api.get(`/colectas/${id}`)
                .then((res) => setColecta(res.data))
                .catch((err) => {
                    console.error(err);
                    setError("Error al cargar la colecta.");
                })
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchColecta();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando detalles...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!colecta) return <div className="p-8 text-center text-gray-500">No se encontró la colecta.</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Stock
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Detalle de Colecta</h1>
                </div>
                <Button
                    onClick={() => setModalOpen(true)}
                    variant="primary"
                    disabled={!colecta || (colecta.inventario?.stockActual ?? colecta.cantidad ?? 0) <= 0}
                >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Registrar Entrega
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
                            <p className="text-lg text-gray-900 font-medium">{colecta.fecha ? new Date(colecta.fecha).toLocaleDateString() : "-"}</p>
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
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Nombre</span>
                            <span className="font-medium text-gray-900">{colecta.toro?.nombre}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Raza</span>
                            <span className="font-medium text-gray-900">{colecta.toro?.raza}</span>
                        </div>
                        {/* ID del toro podría ir aquí si fuera relevante mostrarlo */}
                    </div>
                </Card>

                {/* Datos del Cliente */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="bg-green-100 p-1 rounded-md">👤</span>
                        Datos del Cliente
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Razón Social</span>
                            <span className="font-medium text-gray-900">{colecta.cliente?.razonSocial}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">CUIT</span>
                            <span className="font-mono text-gray-900">{colecta.cliente?.cuit || colecta.cuit || "-"}</span>
                        </div>
                    </div>
                </Card>

                {/* Ubicación (Termo/Canastillo) */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Layers className="text-purple-600" size={20} />
                        Ubicación
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <label className="text-xs text-gray-500 uppercase block mb-1">Termo</label>
                            <span className="text-xl font-bold text-gray-800">{colecta.termo?.codigo || "-"}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <label className="text-xs text-gray-500 uppercase block mb-1">Canastillo</label>
                            <span className="text-xl font-bold text-gray-800">{colecta.canastillo?.codigo || "-"}</span>
                        </div>
                    </div>
                </Card>

                {/* Movimientos */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Hash className="text-gray-600" size={20} />
                        Registro de Movimientos
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

            {/* Modal de Movimiento */}
            {colecta && (
                <MovimientoModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    colectaId={colecta.id}
                    stockDisponible={colecta.inventario?.stockActual ?? colecta.cantidad ?? 0}
                    onSuccess={fetchColecta}
                />
            )}
        </div>
    );
};
