import { useEffect, useState, useMemo } from "react";
import { api } from "../api/api";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { FileText, ChevronDown, ChevronUp, Calendar, User, Search } from "lucide-react";
import { ToroIcon } from "./ui/ToroIcon";
import { TermoIcon } from "./ui/TermoIcon";
import { Skeleton, CardSkeleton } from "./ui/Skeleton";
import type { Movimiento } from "../Modelo/Movimiento";
import { Link } from "react-router-dom";

interface RemitoGroup {
    numero: string;
    fecha: string;
    movimientos: Movimiento[];
    tipo: 'ingreso' | 'salida';
    cliente?: string;
}

export const RemitosView = () => {
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRemitos, setExpandedRemitos] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setLoading(true);
        api.get<Movimiento[]>("/movimientos")
            .then(res => setMovimientos(res.data))
            .catch(err => console.error("Error cargando remitos:", err))
            .finally(() => setLoading(false));
    }, []);

    const remitosAgrupados = useMemo(() => {
        const groups: Record<string, RemitoGroup> = {};

        // Solo movimientos con remito
        const conRemito = movimientos.filter(m => m.remito && m.remito.trim() !== "");

        conRemito.forEach(m => {
            const num = m.remito!;
            if (!groups[num]) {
                groups[num] = {
                    numero: num,
                    fecha: m.fecha.toString(),
                    movimientos: [],
                    tipo: m.tipo,
                    cliente: m.cliente?.razonSocial || m.inventario?.colecta?.cliente?.razonSocial
                };
            }
            groups[num].movimientos.push(m);
        });

        // Convertir a array y filtrar si hay búsqueda
        const result = Object.values(groups).filter(group => {
            const matchNumero = group.numero.toLowerCase().includes(searchQuery.toLowerCase());
            const matchCliente = group.cliente?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchNumero || matchCliente;
        });

        // Ordenar por fecha (más reciente primero)
        return result.sort((a, b) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
    }, [movimientos, searchQuery]);

    const toggleExpand = (num: string) => {
        const next = new Set(expandedRemitos);
        if (next.has(num)) next.delete(num);
        else next.add(num);
        setExpandedRemitos(next);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-0">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <FileText className="text-blue-600" size={32} />
                    Gestión de Remitos
                </h1>
                <p className="text-gray-500 mt-1">
                    Visualiza los movimientos de stock agrupados por número de remito.
                </p>
            </div>

            <Card className="mb-6 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por número de remito o cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </Card>

            {remitosAgrupados.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-gray-300" size={32} />
                    </div>
                    <p className="text-gray-500">No se encontraron movimientos con número de remito registrado.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {remitosAgrupados.map((group) => (
                        <Card key={group.numero} className="overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            {/* Cabecera del Remito */}
                            <div
                                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors"
                                onClick={() => toggleExpand(group.numero)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${group.tipo === 'ingreso' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        <TermoIcon size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Remito</span>
                                            <h2 className="text-xl font-black text-gray-800 font-mono">{group.numero}</h2>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(group.fecha).toLocaleDateString('es-AR')}
                                            </div>
                                            {group.cliente && (
                                                <div className="flex items-center gap-1.5">
                                                    <User size={14} className="text-gray-400" />
                                                    <span className="font-semibold text-gray-700">{group.cliente}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6">
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 uppercase font-bold tracking-widest">Pajuelas</div>
                                        <div className={`text-2xl font-black ${group.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                            {group.tipo === 'ingreso' ? '+' : '-'}{group.movimientos.reduce((acc, m) => acc + m.cantidad, 0)}
                                        </div>
                                    </div>
                                    <div className="text-gray-300">
                                        {expandedRemitos.has(group.numero) ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                    </div>
                                </div>
                            </div>

                            {/* Detalle de Movimientos (Expandible) */}
                            {expandedRemitos.has(group.numero) && (
                                <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center md:text-left">Detalle de mercadería</h3>

                                    {/* Versión Mobile: Lista de Tarjetas Compactas */}
                                    <div className="md:hidden space-y-3">
                                        {group.movimientos.map((m) => (
                                            <div key={m.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <ToroIcon size={18} className="text-blue-500" />
                                                        <span className="font-bold text-gray-900">
                                                            {m.inventario?.colecta?.toro?.nombre || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div className={`font-black text-lg ${group.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {m.cantidad}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 mb-3 ml-6 font-medium">
                                                    Colecta: {m.inventario?.colecta?.fecha ? new Date(m.inventario.colecta.fecha).toLocaleDateString() : 'N/A'}
                                                </div>
                                                {m.notas && (
                                                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 italic mb-3">
                                                        {m.notas}
                                                    </div>
                                                )}
                                                <Link to={`/colectas/${m.inventario?.colecta.id}`} className="block">
                                                    <Button size="sm" variant="ghost" className="w-full text-blue-600 border border-blue-100 hover:bg-blue-50">
                                                        Ver Colecta
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Versión Desktop: Tabla Tradicional */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-xs text-gray-400 uppercase font-bold border-b border-gray-200">
                                                    <th className="pb-2 px-2">Toro / Colecta</th>
                                                    <th className="pb-2 px-2 text-right">Cantidad</th>
                                                    <th className="pb-2 px-2">Notas</th>
                                                    <th className="pb-2 px-2 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {group.movimientos.map((m) => (
                                                    <tr key={m.id} className="text-sm">
                                                        <td className="py-3 px-2">
                                                            <div className="flex items-center gap-2">
                                                                <ToroIcon size={16} className="text-blue-500" />
                                                                <div>
                                                                    <div className="font-bold text-gray-900">
                                                                        {m.inventario?.colecta?.toro?.nombre || "N/A"}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Colecta: {m.inventario?.colecta?.fecha ? new Date(m.inventario.colecta.fecha).toLocaleDateString() : 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={`py-3 px-2 text-right font-black ${group.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {m.cantidad}
                                                        </td>
                                                        <td className="py-3 px-2 text-gray-600 italic max-w-xs truncate">
                                                            {m.notas || '-'}
                                                        </td>
                                                        <td className="py-3 px-2 text-right">
                                                            <Link to={`/colectas/${m.inventario?.colecta.id}`}>
                                                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                                    Ir a Colecta
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
