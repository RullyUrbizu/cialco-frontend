import { useState, useEffect, useRef } from "react";
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
import { Search, PackageOpen, Plus } from "lucide-react";

export const Home = () => {
  const {
    colectas,
    loading,
    loadingMore,
    error,
    deleteColecta,
    updateColecta,
    loadMore,
    hasMore,
    searchTerm,
    setSearchTerm,
    total: totalRecords
  } = useColectas();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [colectaToEdit, setColectaToEdit] = useState<Colecta | undefined>();

  // --- estados para confirmación de borrado ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Infinite Scroll Observer ---
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);



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
    const tableData = colectas.map(c => [
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
    const totalDosis = colectas.reduce((acc: number, c: Colecta) => acc + (c.cantidad || 0), 0);

    if (finalY < 250) { // Evitar pisar el footer
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(azulCialco[0], azulCialco[1], azulCialco[2]);
      doc.text(`Stock Total del Reporte: ${totalDosis} dosis`, 14, finalY + 15);
      doc.setFontSize(8);
      doc.setTextColor(grisOscuro[0], grisOscuro[1], grisOscuro[2]);
      doc.text(`Total de registros: ${totalRecords} colectas`, 14, finalY + 20);
    }

    // Guardar PDF
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`cialco-reporte-stock-${timestamp}.pdf`);
  };

  const exportToXLSX = () => {
    const data = colectas.map(c => ({
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

  // Skeleton de carga inicial (solo cuando no hay datos cargados todavía)
  if (loading && colectas.length === 0) {
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
      <div className="text-terracotta font-medium bg-terracotta-light p-6 rounded-xl border border-terracotta/20">{error}</div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8 animate-fade-up relative z-10">
        <div className="w-full lg:w-auto">
          <p className="eyebrow mb-2">Cialco · Inventario de Stock</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
            Lista de Stock
            <span className="ml-3 align-middle text-xs font-semibold text-brass-dark bg-brass-50 border border-brass/20 px-2.5 py-1 rounded-full">
              {totalRecords} totales
            </span>
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">Inventario de colectas de genética.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
          <ExportMenu
            onExportPDF={exportToPDF}
            onExportXLSX={exportToXLSX}
            className="w-full sm:w-auto"
          />
          <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm py-2 px-3 sm:px-4">
            <Plus size={16} className="mr-1.5" />
            <span className="hidden sm:inline">Registrar nueva colecta</span>
            <span className="sm:hidden">+ Nueva Colecta</span>
          </Button>
        </div>
      </div>

      <Card className="mb-8 p-2 animate-fade-up" padding="p-2">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Buscar por toro, cliente, termo o canastillo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-0 bg-transparent rounded-xl pl-11 pr-10 py-3.5 focus:ring-0 focus:outline-none text-[15px] placeholder:text-ink-faint/80"
          />
          {/* Spinner sutil durante búsqueda sin cortar la vista */}
          {loading && colectas.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-brass border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0 shadow-soft animate-fade-up" padding="p-0">
        {colectas.length > 0 ? (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block">
              <Lista
                items={colectas}
                columns={["Termos", "Toro", "Raza", "Cant.", "Fecha", "Color", "Cliente", "Acciones"]}
                onRowClick={(c: Colecta) => navigate(`/colectas/${c.id}`)}
                getRowStyle={(c: Colecta) => {
                  const nombre = c.cliente?.razonSocial || "";
                  if (!nombre) return {};
                  const hue = stringToHue(nombre);
                  return { backgroundColor: `hsl(${hue}, 40%, 96%)` };
                }}
                renderCells={(c: Colecta) => [
                  <div key="termos" className="flex flex-col gap-1 min-w-[120px]">
                    {c.contenedores?.map((cont, idx) => (
                      <div key={idx} className="font-mono text-[10px] text-ink-soft bg-ivory-100 border border-hairline px-1.5 py-0.5 rounded-md flex justify-between gap-2">
                        <span className="font-semibold text-ink">{cont.termo?.codigo ?? "-"}</span>
                        <span className="text-ink-faint">({cont.canastillo?.codigo ?? "-"})</span>
                      </div>
                    )) || "-"}
                  </div>,
                  <Link key="toro" to={`/toros/${c.toro?.id}`} className="font-semibold text-cialco hover:underline" onClick={(e) => e.stopPropagation()}>
                    {c.toro?.nombre ?? "-"}
                  </Link>,
                  <span key="raza" className="text-ink-muted">{c.toro?.raza ?? "-"}</span>,
                  <span key="cant" className="font-semibold text-cialco tabular">{c.inventario?.cantidadInicial ?? c.cantidad ?? 0}</span>,
                  <span key="fecha" className="text-ink-muted text-sm whitespace-nowrap tabular">
                    {c.fecha ? (() => {
                      const parts = String(c.fecha).split('T')[0].split('-');
                      if (parts.length === 3) {
                        const [y, m, d] = parts;
                        return `${d}/${m}/${y}`;
                      }
                      return String(c.fecha);
                    })() : "-"}
                  </span>,
                  <div key="color" className="flex justify-center">
                    {c.color ? (
                      <div
                        className="w-4 h-4 rounded-full border border-ink/10 shadow-sm"
                        style={{ backgroundColor: c.color }}
                        title={`Color: ${c.color}`}
                      />
                    ) : (
                      <span className="text-ink-faint">-</span>
                    )}
                  </div>,
                  <span
                    key="cliente"
                    className="px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 55%, 92%)` : '#F6F1E8',
                      color: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 60%, 28%)` : '#6E7C72'
                    }}
                  >
                    {c.cliente?.razonSocial ?? "-"}
                  </span>,
                  <div key="acciones" className="flex gap-2 whitespace-nowrap">
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
            <div className="md:hidden p-4 space-y-4">
              {colectas.map((c: Colecta) => (
                <div
                  key={c.id}
                  className="bg-paper border border-hairline rounded-xl p-4 shadow-soft active:scale-[0.98] transition-all relative overflow-hidden"
                  onClick={() => navigate(`/colectas/${c.id}`)}
                >
                  {/* Indicador lateral de color cliente */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 55%, 55%)` : '#D8CCB8' }}
                  />

                  {/* Header: Toro y Cantidad */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link
                          to={`/toros/${c.toro?.id}`}
                          className="font-serif font-semibold text-lg text-ink truncate hover:text-cialco block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.toro?.nombre ?? "-"}
                        </Link>
                        <span className="px-1.5 py-0.5 bg-brass-50 text-brass-dark text-[10px] font-bold rounded uppercase tracking-wider">
                          {c.toro?.raza ?? "-"}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-faint font-medium">
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
                        className="w-5 h-5 rounded-full border border-ink/10 shadow-sm mb-1"
                        style={{ backgroundColor: c.color || 'transparent' }}
                      />
                      <div className="text-[8px] text-ink-faint font-bold uppercase tracking-tighter">Color</div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="text-[10px] text-ink-faint uppercase font-semibold tracking-widest mb-[-4px]">Dosis</div>
                      <div className="font-serif text-2xl font-semibold text-cialco tabular">
                        {c.inventario?.cantidadInicial ?? c.cantidad ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Detalles con diseño de etiquetas */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <div className="flex items-center gap-1.5 bg-ivory-100 px-2 py-1 rounded-md border border-hairline">
                      <span className="text-ink-faint text-[10px]">📍</span>
                      <span className="font-mono text-[11px] font-semibold text-ink-soft">
                        {c.contenedores?.map(cont => cont.termo?.codigo ?? "-").filter((v, i, a) => a.indexOf(v) === i).join('-') || "-"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
                      style={{
                        backgroundColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 60%, 96%)` : '#F6F1E8',
                        borderColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 45%, 88%)` : '#E9E1D2',
                        color: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 60%, 30%)` : '#6E7C72'
                      }}
                    >
                      <span className="text-[10px]">👤</span>
                      <span className="text-[11px] font-bold truncate max-w-[120px]">
                        {c.cliente?.razonSocial ?? "-"}
                      </span>
                    </div>
                  </div>

                  {/* Acciones compactas */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-hairline/70">
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

            {/* Elemento para observar el scroll */}
            <div ref={observerTarget} className="h-10 flex items-center justify-center p-4">
              {loadingMore && (
                <div className="flex items-center gap-2 text-pine font-medium animate-pulse">
                  <div className="w-2 h-2 bg-pine rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-pine rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-pine rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs uppercase tracking-widest ml-1">Cargando más...</span>
                </div>
              )}
              {!hasMore && colectas.length > 0 && (
                <span className="text-ink-faint text-xs uppercase tracking-widest">Fin de la lista</span>
              )}
            </div>
          </>
        ) : (
          <div className="p-14 text-center text-ink-faint">
            <PackageOpen size={40} className="mx-auto mb-3 text-sand" />
            <p className="font-medium text-ink-soft">No se encontraron colectas con los filtros aplicados.</p>
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
          // Nota: lo ideal sería un refetch o insertar si cumple los filtros
          // Por simplicidad insertamos al inicio
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
