import { useState, useEffect } from "react";
import { useColectas } from "../hooks/useColectas";
import { ColectaModal } from "../components/ColectaModal";
import type { Colecta } from "../Modelo/Colecta";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Lista } from "./lista/Lista";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { Skeleton, CardSkeleton, TableSkeleton } from "./ui/Skeleton";
import { ConfirmModal } from "./ui/ConfirmModal";
import * as XLSX from "xlsx";
import { ExportMenu } from "./ui/ExportMenu";

export const Home = () => {
  const { colectas, loading, error, deleteColecta, updateColecta } = useColectas();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  // --- estados para filtrado ---
  const [searchTerm, setSearchTerm] = useState("");
  const [colectasFiltradas, setColectasFiltradas] = useState<Colecta[]>([]);
  const [colectaToEdit, setColectaToEdit] = useState<Colecta | undefined>();

  // --- estados para confirmación de borrado ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- sincronizamos colectas originales con filtradas ---
  useEffect(() => {
    setColectasFiltradas(colectas || []);
  }, [colectas]);

  // --- filtrado en frontend ---
  useEffect(() => {
    if (!colectas) return;

    const term = searchTerm.toLowerCase();
    const colectasSorted = [...colectas].sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return dateB - dateA;
    });

    const filtradas = colectasSorted.filter((c) => {
      const matchCliente = c.cliente?.razonSocial?.toLowerCase().includes(term);
      const matchToro = c.toro?.nombre?.toLowerCase().includes(term);
      const matchRaza = c.toro?.raza?.toLowerCase().includes(term);

      // Búsqueda en contenedores (termos y canastillos)
      const matchContenedores = c.contenedores?.some(cont =>
        cont.termo?.codigo?.toLowerCase().includes(term) ||
        cont.canastillo?.codigo?.toString().toLowerCase().includes(term)
      );

      return matchCliente || matchToro || matchRaza || matchContenedores;
    });
    setColectasFiltradas(filtradas);
  }, [searchTerm, colectas]);



  const handleDeleteClick = (id: string) => {
    setIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;

    setIsDeleting(true);
    try {
      await deleteColecta(idToDelete);
      toast.success("Colecta eliminada correctamente");
      setIsConfirmOpen(false);
      setIdToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la colecta");
    } finally {
      setIsDeleting(false);
    }
  };


  // Genera un color único para cada cliente usando HSL
  const stringToHue = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const azulCialco = [0, 51, 153];
    const grisOscuro = [60, 60, 60];
    const grisClaro = [150, 150, 150];

    // --- ENCABEZADO CORPORATIVO ---
    // Nombre de la Empresa
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(azulCialco[0], azulCialco[1], azulCialco[2]);
    doc.text("CIALCO", 14, 22);

    // Eslogan
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(grisOscuro[0], grisOscuro[1], grisOscuro[2]);
    doc.text("Agregá valor a tu producción", 14, 28);

    // Título del Reporte e Info de Emisión
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(azulCialco[0], azulCialco[1], azulCialco[2]);
    doc.text("REPORTE DE STOCK DE COLECTAS", 14, 45);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grisOscuro[0], grisOscuro[1], grisOscuro[2]);
    doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-AR')}`, 14, 50);

    // Filtros aplicados
    if (searchTerm) {
      doc.setFont("helvetica", "bold");
      doc.text(`Filtros: `, 14, 56);
      doc.setFont("helvetica", "normal");
      doc.text(`Búsqueda "${searchTerm}"`, 26, 56);
    }

    // --- TABLA DE DATOS ---
    const tableData = colectasFiltradas.map(c => [
      c.contenedores?.map(cont => `${cont.termo?.codigo ?? "-"} (${cont.canastillo?.codigo ?? "-"})`).join(', ') || "-",
      c.toro?.nombre || "-",
      c.toro?.raza || "-",
      (c.inventario?.cantidadInicial ?? c.cantidad ?? 0).toString(),
      c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : "-",
      c.cliente?.razonSocial || "-"
    ]);

    autoTable(doc, {
      startY: 62,
      head: [["Ubicación (Termo/Canast)", "Toro", "Raza", "Cant.", "Fecha", "Cliente"]],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: azulCialco as [number, number, number],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle'
      },
      columnStyles: {
        3: { halign: 'center', fontStyle: 'bold' }, // Cantidad
        4: { halign: 'center' } // Fecha
      },
      alternateRowStyles: {
        fillColor: [245, 248, 255]
      },
      margin: { top: 62 },
      didDrawPage: () => {
        // --- PIE DE PÁGINA (Se repite en cada página) ---
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

        doc.setFontSize(8);
        doc.setTextColor(grisClaro[0], grisClaro[1], grisClaro[2]);

        // Línea divisoria
        doc.setDrawColor(grisClaro[0], grisClaro[1], grisClaro[2]);
        doc.line(14, pageHeight - 25, pageSize.width - 14, pageHeight - 25);

        // Información de contacto
        const contactY = pageHeight - 20;
        doc.text("Av. 25 de Mayo 659, Gral. Belgrano, Buenos Aires", 14, contactY);
        doc.text("Tel: +54 22 4154-5133 | cialco107@yahoo.com.ar", 14, contactY + 4);
        doc.text("www.cialco.netlify.app", 14, contactY + 8);

        // Numeración
        const str = "Página " + (doc as any).internal.getNumberOfPages();
        doc.text(str, pageSize.width - 30, contactY + 8);
      }
    });

    // Resumen Final
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    const totalDosis = colectasFiltradas.reduce((acc, c) => acc + (c.cantidad || 0), 0);

    if (finalY < 250) { // Evitar pisar el footer
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(azulCialco[0], azulCialco[1], azulCialco[2]);
      doc.text(`Stock Total del Reporte: ${totalDosis} dosis`, 14, finalY + 15);
      doc.setFontSize(8);
      doc.setTextColor(grisOscuro[0], grisOscuro[1], grisOscuro[2]);
      doc.text(`Total de registros: ${colectasFiltradas.length} colectas`, 14, finalY + 20);
    }

    // Guardar PDF
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`cialco-reporte-stock-${timestamp}.pdf`);
  };

  const exportToXLSX = () => {
    const data = colectasFiltradas.map(c => ({
      "Ubicación (Termo/Canast)": c.contenedores?.map(cont => `${cont.termo?.codigo ?? "-"} (${cont.canastillo?.codigo ?? "-"})`).join(', ') || "-",
      "Toro": c.toro?.nombre || "-",
      "Raza": c.toro?.raza || "-",
      "Cantidad": c.inventario?.cantidadInicial ?? c.cantidad ?? 0,
      "Fecha": c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : "-",
      "Cliente": c.cliente?.razonSocial || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");

    // Ajustar anchos de columna
    const wscols = [
      { wch: 30 }, // Ubicación
      { wch: 20 }, // Toro
      { wch: 15 }, // Raza
      { wch: 10 }, // Cantidad
      { wch: 15 }, // Fecha
      { wch: 30 }, // Cliente
    ];
    ws['!cols'] = wscols;

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `cialco-reporte-stock-${timestamp}.xlsx`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        <CardSkeleton />
        <Card className="p-6">
          <TableSkeleton rows={8} />
        </Card>
      </div>
    );
  }

  if (error) return (
    <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
      <div className="text-red-600 font-medium bg-red-50 p-6 rounded-lg border border-red-100">{error}</div>
      {/* Note: Colectas hook handles error state, but we provide a clean message */}
    </div>
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="w-full lg:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Lista de Stock</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Inventario de colectas.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
          <ExportMenu 
            onExportPDF={exportToPDF} 
            onExportXLSX={exportToXLSX} 
            className="w-full sm:w-auto"
          />
          <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm py-2 px-3 sm:px-4">
            <span className="hidden sm:inline">Registrar nueva colecta</span>
            <span className="sm:hidden">+ Nueva Colecta</span>
          </Button>
        </div>
      </div>

      <Card className="mb-8 p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por toro, cliente, termo o canastillo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-4 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-lg"
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {colectasFiltradas.length > 0 ? (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block">
              <Lista
                items={colectasFiltradas}
                columns={["Termos", "Toro", "Raza", "Cant.", "Fecha", "Color", "Cliente", "Acciones"]}
                onRowClick={(c: Colecta) => navigate(`/colectas/${c.id}`)}
                getRowStyle={(c: Colecta) => {
                  const nombre = c.cliente?.razonSocial || "";
                  if (!nombre) return { backgroundColor: '#f9fafb' };
                  const hue = stringToHue(nombre);
                  return { backgroundColor: `hsl(${hue}, 45%, 95%)` };
                }}
                renderCells={(c: Colecta) => [
                  <div className="flex flex-col gap-1 min-w-[120px]">
                    {c.contenedores?.map((cont, idx) => (
                      <div key={idx} className="font-mono text-gray-600 text-[10px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 flex justify-between">
                        <span className="font-bold">{cont.termo?.codigo ?? "-"}</span>
                        <span className="text-gray-400">({cont.canastillo?.codigo ?? "-"})</span>
                      </div>
                    )) || "-"}
                  </div>,
                  <Link to={`/toros/${c.toro?.id}`} className="font-medium text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    {c.toro?.nombre ?? "-"}
                  </Link>,
                  <span className="text-gray-600">{c.toro?.raza ?? "-"}</span>,
                  <span className="font-semibold text-blue-600">{c.inventario?.cantidadInicial ?? c.cantidad ?? 0}</span>,
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    {c.fecha ? (() => {
                      const parts = String(c.fecha).split('T')[0].split('-');
                      if (parts.length === 3) {
                        const [y, m, d] = parts;
                        return `${d}/${m}/${y}`;
                      }
                      return String(c.fecha);
                    })() : "-"}
                  </span>,
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
                  </div>,
                  <span
                    className="px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 60%, 90%)` : '#f3f4f6',
                      color: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 70%, 30%)` : '#1f2937'
                    }}
                  >
                    {c.cliente?.razonSocial ?? "-"}
                  </span>,
                  <div className="flex gap-2 whitespace-nowrap">
                    <Link to={`/colectas/${c.id}`}>
                      <Button size="sm" variant="info">Ver</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={(e) => {
                        e.stopPropagation();
                        setColectaToEdit(c);
                        setModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(c.id);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ]}
              />
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden p-3 space-y-4 bg-gray-50/50">
              {colectasFiltradas.map((c: Colecta) => (
                <div
                  key={c.id}
                  className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden"
                  onClick={() => navigate(`/colectas/${c.id}`)}
                >
                  {/* Indicador lateral de color cliente */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 60%, 60%)` : '#d1d5db' }}
                  />

                  {/* Header: Toro y Cantidad */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link
                          to={`/toros/${c.toro?.id}`}
                          className="font-bold text-base sm:text-lg text-gray-900 truncate hover:text-blue-600 block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.toro?.nombre ?? "-"}
                        </Link>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
                          {c.toro?.raza ?? "-"}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-medium">
                        📅 {c.fecha ? (() => {
                          const parts = String(c.fecha).split('T')[0].split('-');
                          if (parts.length === 3) {
                            const [y, m, d] = parts;
                            return `${d}/${m}/${y}`;
                          }
                          return String(c.fecha);
                        })() : "-"}
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-200 shadow-sm mb-1"
                        style={{ backgroundColor: c.color || 'transparent' }}
                      />
                      <div className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Color</div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-[-4px]">Dosis</div>
                      <div className="text-2xl font-black text-blue-600 tabular-nums">
                        {c.inventario?.cantidadInicial ?? c.cantidad ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Detalles con diseño de etiquetas */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      <span className="text-gray-400 text-[10px]">📍</span>
                      <span className="font-mono text-[11px] font-bold text-gray-600">
                        {c.contenedores?.map(cont => cont.termo?.codigo ?? "-").filter((v, i, a) => a.indexOf(v) === i).join('-') || "-"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
                      style={{
                        backgroundColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 70%, 97%)` : '#f9fafb',
                        borderColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 60%, 90%)` : '#f3f4f6',
                        color: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 70%, 35%)` : '#4b5563'
                      }}
                    >
                      <span className="text-[10px]">👤</span>
                      <span className="text-[11px] font-bold truncate max-w-[120px]">
                        {c.cliente?.razonSocial ?? "-"}
                      </span>
                    </div>
                  </div>

                  {/* Acciones compactas */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                    <Button
                      size="sm"
                      variant="info"
                      className="h-9 text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/colectas/${c.id}`);
                      }}
                    >
                      DETALLE
                    </Button>
                    <Button
                      size="sm"
                      variant="warning"
                      className="h-9 text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setColectaToEdit(c);
                        setModalOpen(true);
                      }}
                    >
                      EDITAR
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="h-9 text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(c.id);
                      }}
                    >
                      BORRAR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No se encontraron colectas con los filtros aplicados.
          </div>
        )}
      </Card>

      <ColectaModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setColectaToEdit(undefined);
        }}
        colectaToEdit={colectaToEdit}
        onCreated={(nuevaColecta) => {
          colectas.unshift(nuevaColecta);
          setColectasFiltradas([nuevaColecta, ...colectasFiltradas]);
        }}
        onUpdated={(colectaActualizada) => {
          updateColecta(colectaActualizada);
          setColectaToEdit(undefined);
        }}
      />
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Colecta"
        message="¿Estás seguro de que deseas eliminar esta colecta? Esta acción no se puede deshacer y afectará el stock actual."
        confirmText="ELIMINAR"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
      />
    </>
  );
};
