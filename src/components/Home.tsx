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

export const Home = () => {
  const { colectas, loading, error, deleteColecta, updateColecta } = useColectas();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  // --- estados para filtrado ---
  const [razonSocial, setRazonSocial] = useState("");
  const [nombreToro, setNombreToro] = useState("");
  const [colectasFiltradas, setColectasFiltradas] = useState<Colecta[]>([]);
  const [colectaToEdit, setColectaToEdit] = useState<Colecta | undefined>();

  // --- sincronizamos colectas originales con filtradas ---
  useEffect(() => {
    setColectasFiltradas(colectas || []);
  }, [colectas]);

  // --- filtrado en frontend ---
  useEffect(() => {
    if (!colectas) return;

    const filtradas = colectas.filter((c) => {
      const matchCliente = c.cliente?.razonSocial
        ?.toLowerCase()
        .includes(razonSocial.toLowerCase());
      const matchToro = c.toro?.nombre
        ?.toLowerCase()
        .includes(nombreToro.toLowerCase());
      return matchCliente && matchToro;
    });
    setColectasFiltradas(filtradas);
  }, [razonSocial, nombreToro, colectas]);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar esta colecta?")) {
      try {
        await deleteColecta(id);
        toast.success("Colecta eliminada correctamente");
      } catch (err: any) {
        toast.error(err.message || "Error al eliminar la colecta");
      }
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

    // Título
    doc.setFontSize(18);
    doc.text("Stock de Colectas - Cialco", 14, 20);

    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 28);

    // Información de filtros aplicados
    if (razonSocial || nombreToro) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      let filtrosTexto = "Filtros aplicados: ";
      if (razonSocial) filtrosTexto += `Cliente: "${razonSocial}" `;
      if (nombreToro) filtrosTexto += `Toro: "${nombreToro}"`;
      doc.text(filtrosTexto, 14, 34);
      doc.setTextColor(0);
    }

    // Preparar datos para la tabla
    const tableData = colectasFiltradas.map(c => [
      c.contenedores?.length ? `${c.contenedores.length} contenedor(es)` : "-",
      c.contenedores?.map(cont => `${cont.termo?.codigo ?? "-"} (${cont.canastillo?.codigo ?? "-"})`).join(', ') || "-",
      c.toro?.nombre || "-",
      c.toro?.raza || "-",
      c.cantidad?.toString() || "0",
      c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : "-",
      c.cliente?.razonSocial || "-"
    ]);

    // Generar tabla
    autoTable(doc, {
      startY: razonSocial || nombreToro ? 38 : 32,
      head: [["Contenedores", "Termos", "Toro", "Raza", "Cant.", "Fecha", "Cliente"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    // Pie de página con total
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(10);
    doc.text(`Total de colectas: ${colectasFiltradas.length}`, 14, finalY + 10);

    // Guardar PDF
    const fileName = `stock-colectas-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Lista de Stock</h1>
          <p className="text-gray-500 mt-1">Gestiona el inventario de colectas.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="secondary">
            📄 Exportar PDF
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            Registrar nueva colecta
          </Button>
        </div>
      </div>

      <Card className="mb-8 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente</label>
            <input
              type="text"
              placeholder="Ej: Estancia El Rancho..."
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Toro</label>
            <input
              type="text"
              placeholder="Ej: Angus..."
              value={nombreToro}
              onChange={(e) => setNombreToro(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {colectasFiltradas.length > 0 ? (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block">
              <Lista
                items={colectasFiltradas}
                columns={["Contenedores", "Termos", "Toro", "Raza", "Cant.", "Fecha", "Cliente", "Acciones"]}
                onRowClick={(c: Colecta) => navigate(`/colectas/${c.id}`)}
                getRowStyle={(c: Colecta) => {
                  const nombre = c.cliente?.razonSocial || "";
                  if (!nombre) return { backgroundColor: '#f9fafb' };
                  const hue = stringToHue(nombre);
                  return { backgroundColor: `hsl(${hue}, 45%, 95%)` };
                }}
                renderCells={(c: Colecta) => [
                  <span className="font-semibold text-gray-700">{c.contenedores?.length || 0} cont.</span>,
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
                  <span className="font-semibold text-blue-600">{c.cantidad ?? 0}</span>,
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
                        handleDelete(c.id);
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
              {colectasFiltradas.map((c: Colecta) => (
                <div
                  key={c.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    backgroundColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 45%, 95%)` : '#f9fafb'
                  }}
                  onClick={() => navigate(`/colectas/${c.id}`)}
                >
                  {/* Header con Toro y Fecha */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Link
                        to={`/toros/${c.toro?.id}`}
                        className="font-bold text-lg text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.toro?.nombre ?? "-"}
                      </Link>
                      <div className="text-sm text-gray-600">{c.toro?.raza ?? "-"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {c.fecha ? (() => {
                          const parts = String(c.fecha).split('T')[0].split('-');
                          if (parts.length === 3) {
                            const [y, m, d] = parts;
                            return `${d}/${m}/${y}`;
                          }
                          return String(c.fecha);
                        })() : "-"}
                      </div>
                      <div className="font-bold text-blue-600 text-lg">{c.cantidad ?? 0}</div>
                    </div>
                  </div>

                  {/* Info de contenedores y cliente */}
                  <div className="space-y-2 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Contenedores:</span>
                      <span className="font-semibold">{c.contenedores?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Termos:</span>
                      <span className="font-mono text-xs">
                        {c.contenedores?.map(cont => `${cont.termo?.codigo ?? "-"} (${cont.canastillo?.codigo ?? "-"})`).join(', ') || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Cliente:</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 60%, 85%)` : '#e5e7eb',
                          color: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 70%, 30%)` : '#1f2937'
                        }}
                      >
                        {c.cliente?.razonSocial ?? "-"}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <Link to={`/colectas/${c.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="info" className="w-full">Ver</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="warning"
                      className="flex-1"
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
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
                      }}
                    >
                      Eliminar
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
    </>
  );
};
