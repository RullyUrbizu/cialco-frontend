import { useEffect, useState, useMemo } from "react";
import { api } from "../api/api";
import { Card } from "./ui/Card";
import { Calendar, User, FileText, Search, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { ToroIcon } from "./ui/ToroIcon";
import { TableSkeleton } from "./ui/Skeleton";
import type { Movimiento } from "../Modelo/Movimiento";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { ExportMenu } from "./ui/ExportMenu";

export const HistorialView = () => {
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTipo, setFilterTipo] = useState<"todos" | "ingreso" | "salida">("todos");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    useEffect(() => {
        const fetchMovimientos = async () => {
            try {
                const response = await api.get("/movimientos");
                setMovimientos(response.data);
            } catch (error) {
                console.error("Error al cargar historial:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMovimientos();
    }, []);

    const historialFiltrado = useMemo(() => {
        return movimientos.filter(m => {
            const term = searchTerm.toLowerCase();
            const matchSearch =
                m.inventario?.colecta?.toro?.nombre?.toLowerCase().includes(term) ||
                m.cliente?.razonSocial?.toLowerCase().includes(term) ||
                m.remito?.toLowerCase().includes(term);

            const matchTipo = filterTipo === "todos" || m.tipo === filterTipo;

            let matchFecha = true;
            if (fechaDesde) {
                matchFecha = matchFecha && new Date(m.fecha) >= new Date(fechaDesde);
            }
            if (fechaHasta) {
                // Ajustar fecha hasta al final del día
                const finDia = new Date(fechaHasta);
                finDia.setHours(23, 59, 59, 999);
                matchFecha = matchFecha && new Date(m.fecha) <= finDia;
            }

            return matchSearch && matchTipo && matchFecha;
        });
    }, [movimientos, searchTerm, filterTipo, fechaDesde, fechaHasta]);

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Historial de Movimientos - Cialco", 14, 20);

        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 28);

        if (searchTerm || filterTipo !== "todos" || fechaDesde || fechaHasta) {
            let filtros = "Filtros: ";
            if (searchTerm) filtros += `Busq: ${searchTerm} | `;
            if (filterTipo !== "todos") filtros += `Tipo: ${filterTipo} | `;
            if (fechaDesde) filtros += `Desde: ${fechaDesde} | `;
            if (fechaHasta) filtros += `Hasta: ${fechaHasta}`;
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(filtros, 14, 34);
            doc.setTextColor(0);
        }

        const tableData = historialFiltrado.map(m => [
            new Date(m.fecha).toLocaleDateString('es-AR'),
            m.tipo.toUpperCase(),
            m.inventario?.colecta?.toro?.nombre || "-",
            m.cantidad.toString(),
            m.cliente?.razonSocial || "-",
            m.remito || "-"
        ]);

        autoTable(doc, {
            startY: 38,
            head: [["Fecha", "Tipo", "Toro", "Cant.", "Cliente", "Remito"]],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [31, 74, 54] },
            styles: { fontSize: 8 }
        });

        doc.save(`historial-movimientos-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToXLSX = () => {
        const data = historialFiltrado.map(m => ({
            "Fecha": new Date(m.fecha).toLocaleDateString('es-AR'),
            "Tipo": m.tipo.toUpperCase(),
            "Toro": m.inventario?.colecta?.toro?.nombre || "-",
            "Cantidad": m.cantidad || 0,
            "Cliente": m.cliente?.razonSocial || m.inventario?.colecta?.cliente?.razonSocial || "-",
            "Remito": m.remito || "-"
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Historial");

        // Ajustar anchos de columna
        const wscols = [
            { wch: 15 }, // Fecha
            { wch: 10 }, // Tipo
            { wch: 20 }, // Toro
            { wch: 10 }, // Cantidad
            { wch: 30 }, // Cliente
            { wch: 15 }, // Remito
        ];
        ws['!cols'] = wscols;

        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `historial-movimientos-${timestamp}.xlsx`);
    };

    if (loading) return <div className="p-6"><TableSkeleton rows={10} /></div>;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 relative z-10">
                <div>
                    <p className="eyebrow mb-2">Cialco · Auditoría</p>
                    <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight">Historial de Movimientos</h1>
                    <p className="text-ink-muted mt-1.5">Auditoría completa de ingresos y salidas de stock.</p>
                </div>
                <ExportMenu 
                    onExportPDF={exportToPDF} 
                    onExportXLSX={exportToXLSX} 
                    className="w-full lg:w-auto"
                />
            </div>

            {/* Filtros */}
            <Card className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <label className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-2">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                            <input
                                type="text"
                                placeholder="Toro, cliente o remito..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="field pl-10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-2">Tipo</label>
                        <select
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value as any)}
                            className="field"
                        >
                            <option value="todos">Todos los tipos</option>
                            <option value="ingreso">Ingresos</option>
                            <option value="salida">Salidas</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-2">Desde</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="field"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-2">Hasta</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="field"
                        />
                    </div>
                </div>
            </Card>

            {/* Lista de Movimientos */}
            <div className="space-y-4">
                {/* Desktop Table View */}
                <Card className="hidden md:block overflow-hidden border-hairline shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-ivory-100 border-b border-hairline">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-ink-faint uppercase tracking-widest">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-ink-faint uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-ink-faint uppercase tracking-widest">Toro</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-ink-faint uppercase tracking-widest text-right">Cant.</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-ink-faint uppercase tracking-widest">Cliente</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-ink-faint uppercase tracking-widest">Remito</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {historialFiltrado.length > 0 ? (
                                    historialFiltrado.map((m) => (
                                        <tr key={m.id} className="hover:bg-ivory-100/60 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 text-sm text-ink-muted font-medium">
                                                    <Calendar size={16} className="text-ink-faint" />
                                                    {new Date(m.fecha).toLocaleDateString('es-AR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${m.tipo === 'ingreso'
                                                    ? 'bg-moss-light text-pine border border-moss/20'
                                                    : 'bg-terracotta-light text-terracotta border border-terracotta/20'
                                                    }`}>
                                                    {m.tipo === 'ingreso' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                                    {m.tipo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 font-semibold text-ink">
                                                    <ToroIcon size={18} className="text-cialco" />
                                                    {m.inventario?.colecta?.toro?.nombre || "N/A"}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-serif font-semibold text-lg tabular ${m.tipo === 'ingreso' ? 'text-pine' : 'text-terracotta'
                                                }`}>
                                                {m.cantidad}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-ink-muted">
                                                    <User size={16} className="text-ink-faint" />
                                                    {m.cliente?.razonSocial || m.inventario?.colecta?.cliente?.razonSocial || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {m.remito ? (
                                                    <div className="flex items-center gap-2 text-sm font-mono text-cialco bg-cialco-light px-2 py-1 rounded w-fit">
                                                        <FileText size={14} />
                                                        {m.remito}
                                                    </div>
                                                ) : "-"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-ink-faint italic">
                                            No se encontraron movimientos con los filtros aplicados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {historialFiltrado.length > 0 ? (
                        historialFiltrado.map((m) => (
                            <Card key={m.id} className="p-4 border-hairline shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm text-ink-muted font-medium">
                                            <Calendar size={14} />
                                            {new Date(m.fecha).toLocaleDateString('es-AR')}
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider w-fit ${m.tipo === 'ingreso'
                                            ? 'bg-moss-light text-pine border border-moss/20'
                                            : 'bg-terracotta-light text-terracotta border border-terracotta/20'
                                            }`}>
                                            {m.tipo === 'ingreso' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                                            {m.tipo}
                                        </span>
                                    </div>
                                    <div className={`font-serif text-2xl font-semibold tabular ${m.tipo === 'ingreso' ? 'text-pine' : 'text-terracotta'}`}>
                                        {m.tipo === 'ingreso' ? '+' : '-'}{m.cantidad}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-ink border-b border-hairline pb-2">
                                        <ToroIcon size={18} className="text-cialco" />
                                        {m.inventario?.colecta?.toro?.nombre || "N/A"}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-semibold text-ink-faint uppercase">Cliente</span>
                                            <div className="flex items-center gap-1 text-ink-muted">
                                                <User size={14} className="text-ink-faint shrink-0" />
                                                <span className="truncate">{m.cliente?.razonSocial || m.inventario?.colecta?.cliente?.razonSocial || "-"}</span>
                                            </div>
                                        </div>
                                        {m.remito && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-semibold text-ink-faint uppercase">Remito</span>
                                                <div className="flex items-center gap-1 text-cialco font-mono text-xs">
                                                    <FileText size={14} />
                                                    {m.remito}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="p-8 rounded-xl text-center text-ink-faint italic border-hairline">
                            No se encontraron movimientos.
                        </Card>
                    )}
                </div>
            </div>

        </div>
    );
};
