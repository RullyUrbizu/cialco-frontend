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
                <p className="eyebrow mb-2">Cialco · Trazabilidad</p>
                <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-pine-light text-pine border border-pine/15">
                        <FileText size={28} />
                    </span>
                    Gestión de Remitos
                </h1>
                <p className="text-ink-muted mt-1.5">
                    Visualiza los movimientos de stock agrupados por número de remito.
                </p>
            </div>

            <Card className="mb-6 p-2">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por número de remito o cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent pl-10 pr-4 py-2.5 outline-none text-sm placeholder:text-ink-faint"
                    />
                </div>
            </Card>

            {remitosAgrupados.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="bg-ivory-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-ink-faint" size={32} />
                    </div>
                    <p className="text-ink-muted">No se encontraron movimientos con número de remito registrado.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {remitosAgrupados.map((group) => (
                        <Card key={group.numero} className="overflow-hidden border-hairline shadow-sm hover:shadow-md transition-shadow">
                            {/* Cabecera del Remito */}
                            <div
                                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer bg-paper hover:bg-ivory-100 transition-colors"
                                onClick={() => toggleExpand(group.numero)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${group.tipo === 'ingreso' ? 'bg-moss-light text-pine border border-moss/20' : 'bg-terracotta-light text-terracotta border border-terracotta/20'}`}>
                                        <TermoIcon size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="eyebrow !text-ink-faint">Remito</span>
                                            <h2 className="text-xl font-semibold text-ink font-mono">{group.numero}</h2>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-ink-faint" />
                                                {new Date(group.fecha).toLocaleDateString('es-AR')}
                                            </div>
                                            {group.cliente && (
                                                <div className="flex items-center gap-1.5">
                                                    <User size={14} className="text-ink-faint" />
                                                    <span className="font-semibold text-ink">{group.cliente}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6">
                                    <div className="text-right">
                                        <div className="text-xs text-ink-faint uppercase font-semibold tracking-widest">Pajuelas</div>
                                        <div className={`font-serif text-2xl font-semibold tabular ${group.tipo === 'ingreso' ? 'text-pine' : 'text-terracotta'}`}>
                                            {group.tipo === 'ingreso' ? '+' : '-'}{group.movimientos.reduce((acc, m) => acc + m.cantidad, 0)}
                                        </div>
                                    </div>
                                    <div className="text-ink-faint">
                                        {expandedRemitos.has(group.numero) ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                    </div>
                                </div>
                            </div>

                            {/* Detalle de Movimientos (Expandible) */}
                            {expandedRemitos.has(group.numero) && (
                                <div className="border-t border-hairline bg-ivory-100/60 p-4 md:p-6 animate-scale-in">
                                    <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-widest mb-4 text-center md:text-left">Detalle de mercadería</h3>

                                    {/* Versión Mobile: Lista de Tarjetas Compactas */}
                                    <div className="md:hidden space-y-3">
                                        {group.movimientos.map((m) => (
                                            <div key={m.id} className="bg-paper p-4 rounded-lg border border-hairline shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <ToroIcon size={18} className="text-cialco" />
                                                        <span className="font-semibold text-ink">
                                                            {m.inventario?.colecta?.toro?.nombre || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div className={`font-serif font-semibold text-lg tabular ${group.tipo === 'ingreso' ? 'text-pine' : 'text-terracotta'}`}>
                                                        {group.tipo === 'ingreso' ? '+' : '-'}{m.cantidad}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-ink-muted mb-3 ml-6 font-medium">
                                                    Colecta: {m.inventario?.colecta?.fecha ? new Date(m.inventario.colecta.fecha).toLocaleDateString() : 'N/A'}
                                                </div>
                                                {m.notas && (
                                                    <div className="bg-ivory-100 p-2 rounded text-xs text-ink-muted italic mb-3">
                                                        {m.notas}
                                                    </div>
                                                )}
                                                <Link to={`/colectas/${m.inventario?.colecta.id}`} className="block">
                                                    <Button size="sm" variant="ghost" className="w-full text-pine border border-pine/20 hover:bg-pine-light">
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
                                                <tr className="text-xs text-ink-faint uppercase font-semibold border-b border-hairline">
                                                    <th className="pb-2 px-2">Toro / Colecta</th>
                                                    <th className="pb-2 px-2 text-right">Cantidad</th>
                                                    <th className="pb-2 px-2">Notas</th>
                                                    <th className="pb-2 px-2 text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-hairline">
                                                {group.movimientos.map((m) => (
                                                    <tr key={m.id} className="text-sm">
                                                        <td className="py-3 px-2">
                                                            <div className="flex items-center gap-2">
                                                                <ToroIcon size={16} className="text-cialco" />
                                                                <div>
                                                                    <div className="font-semibold text-ink">
                                                                        {m.inventario?.colecta?.toro?.nombre || "N/A"}
                                                                    </div>
                                                                    <div className="text-xs text-ink-muted">
                                                                        Colecta: {m.inventario?.colecta?.fecha ? new Date(m.inventario.colecta.fecha).toLocaleDateString() : 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={`py-3 px-2 text-right font-semibold font-serif tabular ${group.tipo === 'ingreso' ? 'text-pine' : 'text-terracotta'}`}>
                                                            {group.tipo === 'ingreso' ? '+' : '-'}{m.cantidad}
                                                        </td>
                                                        <td className="py-3 px-2 text-ink-muted italic max-w-xs truncate">
                                                            {m.notas || '-'}
                                                        </td>
                                                        <td className="py-3 px-2 text-right">
                                                            <Link to={`/colectas/${m.inventario?.colecta.id}`}>
                                                                <Button size="sm" variant="ghost" className="text-pine hover:text-pine hover:bg-pine-light">
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
