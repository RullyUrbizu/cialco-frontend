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
import { toast } from "sonner";

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

    const getCliente = (m: Movimiento) =>
        m.cliente?.razonSocial || m.inventario?.colecta?.cliente?.razonSocial || "-";

    const formatFecha = (fecha: unknown): string => {
        const str = String(fecha ?? "");
        const parts = str.split("T")[0].split("-");
        if (parts.length === 3) {
            const [y, m, d] = parts;
            return `${d}/${m}/${y}`;
        }
        return str || "-";
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const w = doc.internal.pageSize.getWidth();
            const pine = [31, 74, 54];
            const grisOscuro = [50, 50, 50];
            const grisClaro = [180, 180, 180];
            const grisBorde = [220, 220, 220];

            // --- BARRA SUPERIOR ---
            doc.setFillColor(pine[0], pine[1], pine[2]);
            doc.rect(0, 0, w, 36, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text("CIALCO", 14, 16);

            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(200, 220, 210);
            doc.text("Agregá valor a tu producción", 14, 23);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(`Exp.: ${new Date().toLocaleDateString("es-AR")}`, w - 14, 16, { align: "right" });
            doc.text(`Confidencial`, w - 14, 23, { align: "right" });

            // --- LÍNEA DE ACENTO ---
            doc.setFillColor(164, 134, 63);
            doc.rect(0, 36, w, 1.5, "F");

            // --- TÍTULO ---
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(pine[0], pine[1], pine[2]);
            doc.text("HISTORIAL DE MOVIMIENTOS", 14, 48);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(grisOscuro[0], grisOscuro[1], grisOscuro[2]);
            doc.text(`Fecha de emisión: ${new Date().toLocaleString("es-AR")}`, 14, 53);

            // --- FILTROS ---
            let tableStartY = 60;
            if (searchTerm || filterTipo !== "todos" || fechaDesde || fechaHasta) {
                doc.setFillColor(246, 241, 232);
                doc.roundedRect(14, 56, w - 28, 8, 1.5, 1.5, "F");
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8);
                doc.setTextColor(grisOscuro[0], grisOscuro[1], grisOscuro[2]);
                doc.text("FILTROS ACTIVOS:", 18, 61.2);
                let filtroStr = "";
                if (searchTerm) filtroStr += `Búsqueda "${searchTerm}" `;
                if (filterTipo !== "todos") filtroStr += `| Tipo: ${filterTipo} `;
                if (fechaDesde) filtroStr += `| Desde: ${fechaDesde} `;
                if (fechaHasta) filtroStr += `| Hasta: ${fechaHasta}`;
                doc.setFont("helvetica", "normal");
                doc.text(filtroStr, 52, 61.2);
                tableStartY = 68;
            }

            // --- TABLA ---
            const tableData = historialFiltrado.map(m => [
                formatFecha(m.fecha),
                m.tipo === "ingreso" ? "INGRESO" : "SALIDA",
                m.inventario?.colecta?.toro?.nombre || "-",
                String(m.cantidad),
                getCliente(m),
                m.remito || "-",
            ]);

            autoTable(doc, {
                startY: tableStartY,
                head: [["FECHA", "TIPO", "TORO", "CANT.", "CLIENTE", "REMITO"]],
                body: tableData,
                theme: "grid",
                headStyles: {
                    fillColor: pine as [number, number, number],
                    textColor: 255,
                    fontSize: 7.5,
                    fontStyle: "bold",
                    halign: "center",
                    cellPadding: 3,
                    lineColor: grisBorde,
                    lineWidth: 0.3,
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5,
                    valign: "middle",
                    lineColor: grisBorde,
                    lineWidth: 0.2,
                    textColor: grisOscuro,
                },
                columnStyles: {
                    0: { cellWidth: 24, halign: "center" },
                    1: { halign: "center", fontStyle: "bold", cellWidth: 20 },
                    3: { halign: "center", fontStyle: "bold" },
                    4: { cellWidth: 40 },
                    5: { cellWidth: 26 },
                },
                alternateRowStyles: { fillColor: [248, 249, 253] },
                margin: { left: 14, right: 14, bottom: 35 },
                didDrawPage: () => {
                    const ph = doc.internal.pageSize.getHeight();

                    doc.setDrawColor(grisClaro[0], grisClaro[1], grisClaro[2]);
                    doc.setLineWidth(0.3);
                    doc.line(14, ph - 28, w - 14, ph - 28);

                    doc.setFontSize(7);
                    doc.setTextColor(grisClaro[0], grisClaro[1], grisClaro[2]);
                    doc.text("Av. 25 de Mayo 659, Gral. Belgrano, Buenos Aires", 14, ph - 23);
                    doc.text("Tel: +54 22 4154-5133  |  cialco107@yahoo.com.ar", 14, ph - 19);

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(7);
                    doc.setTextColor(grisClaro[0], grisClaro[1], grisClaro[2]);
                    const pageNum = (doc as any).internal.getNumberOfPages();
                    doc.text(`Pág. ${pageNum}`, w - 14, ph - 19, { align: "right" });

                    doc.setFillColor(pine[0], pine[1], pine[2]);
                    doc.rect(0, ph - 8, w, 8, "F");
                    doc.setFontSize(6);
                    doc.setTextColor(255, 255, 255);
                    doc.text("Stock Cialco  —  Sistema de Gestión de Inventario", 14, ph - 3);
                },
            });

            // --- RESUMEN ---
            const finalY = (doc as any).lastAutoTable.finalY || 100;
            const totalIngresos = historialFiltrado.filter(m => m.tipo === "ingreso").reduce((acc, m) => acc + m.cantidad, 0);
            const totalSalidas = historialFiltrado.filter(m => m.tipo === "salida").reduce((acc, m) => acc + m.cantidad, 0);

            if (finalY < 240) {
                const boxY = finalY + 10;

                doc.setFillColor(246, 241, 232);
                doc.roundedRect(14, boxY, w - 28, 20, 2, 2, "F");
                doc.setDrawColor(164, 134, 63);
                doc.setLineWidth(0.4);
                doc.roundedRect(14, boxY, w - 28, 20, 2, 2, "S");

                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(pine[0], pine[1], pine[2]);
                doc.text("RESUMEN DEL REPORTE", 20, boxY + 7);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(grisOscuro[0], grisOscuro[1], grisOscuro[2]);
                doc.text(`Movimientos: ${historialFiltrado.length} registros`, 20, boxY + 14);
                doc.text(`Ingresos: ${totalIngresos} dosis  |  Salidas: ${totalSalidas} dosis`, 20, boxY + 19);

                doc.setFont("helvetica", "bold");
                doc.setFontSize(16);
                doc.setTextColor(pine[0], pine[1], pine[2]);
                doc.text(`${totalIngresos - totalSalidas}`, w - 20, boxY + 15, { align: "right" });
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(grisOscuro[0], grisOscuro[1], grisOscuro[2]);
                doc.text("SALDO NETO", w - 20, boxY + 19, { align: "right" });
            }

            const timestamp = new Date().toISOString().split("T")[0];
            doc.save(`historial-movimientos-${timestamp}.pdf`);
        } catch {
            toast.error("Error al generar el reporte PDF");
        }
    };

    const exportToXLSX = () => {
        try {
            const data = historialFiltrado.map(m => ({
                "Fecha": formatFecha(m.fecha),
                "Tipo": m.tipo.toUpperCase(),
                "Toro": m.inventario?.colecta?.toro?.nombre || "-",
                "Cantidad": m.cantidad || 0,
                "Cliente": getCliente(m),
                "Remito": m.remito || "-"
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Historial");

            ws['!cols'] = [
                { wch: 15 },
                { wch: 10 },
                { wch: 20 },
                { wch: 10 },
                { wch: 30 },
                { wch: 15 },
            ];

            const timestamp = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `historial-movimientos-${timestamp}.xlsx`);
        } catch {
            toast.error("Error al generar el archivo Excel");
        }
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
