import { useEffect, useState, useMemo } from "react";
import { api } from "../api/api";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Calendar, User, FileText, Search, ArrowUpCircle, ArrowDownCircle, Download } from "lucide-react";
import { ToroIcon } from "./ui/ToroIcon";
import { TableSkeleton } from "./ui/Skeleton";
import type { Movimiento } from "../Modelo/Movimiento";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 8 }
        });

        doc.save(`historial-movimientos-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) return <div className="p-6"><TableSkeleton rows={10} /></div>;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Historial de Movimientos</h1>
                    <p className="text-gray-500 mt-1">Auditoría completa de ingresos y salidas de stock.</p>
                </div>
                <Button onClick={exportToPDF} variant="secondary" className="flex items-center gap-2 w-full lg:w-auto justify-center">
                    <Download size={18} />
                    Exportar PDF
                </Button>
            </div>

            {/* Filtros */}
            <Card className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Búsqueda</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Toro, cliente o remito..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo</label>
                        <select
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value as any)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="todos">Todos los tipos</option>
                            <option value="ingreso">Ingresos</option>
                            <option value="salida">Salidas</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Desde</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Hasta</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </Card>

            {/* Lista de Movimientos */}
            <div className="space-y-4">
                {/* Desktop Table View */}
                <Card className="hidden md:block overflow-hidden border-none shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Toro</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Cant.</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Remito</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {historialFiltrado.length > 0 ? (
                                    historialFiltrado.map((m) => (
                                        <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                                    <Calendar size={16} className="text-gray-400" />
                                                    {new Date(m.fecha).toLocaleDateString('es-AR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${m.tipo === 'ingreso'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {m.tipo === 'ingreso' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                                    {m.tipo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 font-semibold text-gray-900">
                                                    <ToroIcon size={18} className="text-blue-500" />
                                                    {m.inventario?.colecta?.toro?.nombre || "N/A"}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-black text-lg ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {m.cantidad}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <User size={16} className="text-gray-400" />
                                                    {m.cliente?.razonSocial || m.inventario?.colecta?.cliente?.razonSocial || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {m.remito ? (
                                                    <div className="flex items-center gap-2 text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                                        <FileText size={14} />
                                                        {m.remito}
                                                    </div>
                                                ) : "-"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
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
                            <Card key={m.id} className="p-4 border-none shadow-md space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                            <Calendar size={14} />
                                            {new Date(m.fecha).toLocaleDateString('es-AR')}
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${m.tipo === 'ingreso'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {m.tipo === 'ingreso' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                                            {m.tipo}
                                        </span>
                                    </div>
                                    <div className={`text-2xl font-black ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.cantidad}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-100 pb-2">
                                        <ToroIcon size={18} className="text-blue-500" />
                                        {m.inventario?.colecta?.toro?.nombre || "N/A"}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Cliente</span>
                                            <div className="flex items-center gap-1 text-gray-700">
                                                <User size={14} className="text-gray-400 shrink-0" />
                                                <span className="truncate">{m.cliente?.razonSocial || m.inventario?.colecta?.cliente?.razonSocial || "-"}</span>
                                            </div>
                                        </div>
                                        {m.remito && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Remito</span>
                                                <div className="flex items-center gap-1 text-blue-600 font-mono text-xs">
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
                        <div className="bg-white p-8 rounded-xl text-center text-gray-500 italic shadow-sm border border-gray-100">
                            No se encontraron movimientos.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
