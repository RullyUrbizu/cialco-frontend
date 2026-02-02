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

export const Home = () => {
  const { colectas, loading, error, deleteColecta } = useColectas();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  // --- estados para filtrado ---
  const [razonSocial, setRazonSocial] = useState("");
  const [nombreToro, setNombreToro] = useState("");
  const [colectasFiltradas, setColectasFiltradas] = useState<Colecta[]>([]);

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
      } catch (err: any) {
        alert(err.message);
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
      c.termo?.codigo || "-",
      c.canastillo?.codigo || "-",
      c.toro?.nombre || "-",
      c.toro?.raza || "-",
      c.cantidad?.toString() || "0",
      c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : "-",
      c.cliente?.razonSocial || "-"
    ]);

    // Generar tabla
    autoTable(doc, {
      startY: razonSocial || nombreToro ? 38 : 32,
      head: [["Termo", "Canastillo", "Toro", "Raza", "Cant.", "Fecha", "Cliente"]],
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

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando colectas...</div>;
  if (error) return <div className="p-6 text-red-600 bg-red-50 rounded-lg">{error}</div>;

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
          <Lista
            items={colectasFiltradas}
            columns={["Termo", "Canastillo", "Toro", "Raza", "Cant.", "Fecha", "Cliente", "Acciones"]}
            onRowClick={(c: Colecta) => navigate(`/colectas/${c.id}`)}
            getRowStyle={(c: Colecta) => {
              const nombre = c.cliente?.razonSocial || "";
              if (!nombre) return { backgroundColor: '#f9fafb' };
              const hue = stringToHue(nombre);
              return { backgroundColor: `hsl(${hue}, 45%, 95%)` };
            }}
            renderCells={(c: Colecta) => [
              <span className="font-mono text-gray-600">{c.termo?.codigo ?? "-"}</span>,
              <span className="font-mono text-gray-600">{c.canastillo?.codigo ?? "-"}</span>,
              <span className="font-medium text-gray-900">{c.toro?.nombre ?? "-"}</span>,
              <span className="text-gray-600">{c.toro?.raza ?? "-"}</span>,
              <span className="font-semibold text-blue-600">{c.cantidad ?? 0}</span>,
              <span className="text-gray-500 text-sm">{c.fecha ? new Date(c.fecha).toLocaleDateString() : "-"}</span>,
              <span
                className="px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 60%, 90%)` : '#f3f4f6',
                  color: c.cliente?.razonSocial ? `hsl(${stringToHue(c.cliente.razonSocial)}, 70%, 30%)` : '#1f2937'
                }}
              >
                {c.cliente?.razonSocial ?? "-"}
              </span>,
              <div className="flex gap-2">
                <Link to={`/colectas/${c.id}`}>
                  <Button size="sm" variant="secondary">Ver</Button>
                </Link>
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
        ) : (
          <div className="p-12 text-center text-gray-500">
            No se encontraron colectas con los filtros aplicados.
          </div>
        )}
      </Card>

      <ColectaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(nuevaColecta) => {
          colectas.unshift(nuevaColecta);
          setColectasFiltradas([nuevaColecta, ...colectasFiltradas]);
        }}
      />
    </>
  );
};
