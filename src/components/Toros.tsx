import { useState, useEffect } from "react";
import { useToros } from "../hooks/useToros";
import type { Toro } from "../Modelo/Toro";
// import { Sidebar } from "../components/Sidebar"; // Eliminado
import { Lista } from "../components/lista/Lista";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export const Toros = () => {
  const { toros, loading, error, deleteToro } = useToros(); // <-- deleteToro

  const [torosFiltrados, setTorosFiltrados] = useState(toros || []);
  const [nombreFiltro, setNombreFiltro] = useState("");
  const [razaFiltro, setRazaFiltro] = useState("");

  // Sincronizamos toros originales con filtrados
  useEffect(() => {
    setTorosFiltrados(toros);
  }, [toros]);

  // Filtrado en frontend
  useEffect(() => {
    const filtrados = toros.filter((t) => {
      const matchNombre = t.nombre.toLowerCase().includes(nombreFiltro.toLowerCase());
      const matchRaza = t.raza.toLowerCase().includes(razaFiltro.toLowerCase());
      return matchNombre && matchRaza;
    });
    setTorosFiltrados(filtrados);
  }, [nombreFiltro, razaFiltro, toros]);

  const handleDelete = async (toro: Toro) => {
    if (toro.colectas && toro.colectas.length > 0) {
      alert(`No se puede eliminar el toro "${toro.nombre}" porque tiene ${toro.colectas.length} colectas (pajuelas) asociadas. Debes eliminar las colectas primero.`);
      return;
    }

    if (window.confirm(`¿Seguro que deseas eliminar al toro "${toro.nombre}"?`)) {
      try {
        await deleteToro(toro.id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando toros...</div>;
  if (error) return <div className="p-6 text-red-600 bg-red-50 rounded-lg">{error}</div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Lista de Toros</h1>
          <p className="text-gray-500 mt-1">Administra el catálogo de toros disponibles.</p>
        </div>
        <Link to="/crear-toro">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Toro
          </Button>
        </Link>
      </div>

      <Card className="mb-8 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por Nombre</label>
            <input
              type="text"
              placeholder="Ej: Toro Campeón..."
              value={nombreFiltro}
              onChange={(e) => setNombreFiltro(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por Raza</label>
            <input
              type="text"
              placeholder="Ej: Brangus..."
              value={razaFiltro}
              onChange={(e) => setRazaFiltro(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {torosFiltrados.length > 0 ? (
          <Lista
            items={torosFiltrados}
            columns={["Nombre", "Raza", "Acciones"]}
            renderCells={(t) => [
              <Link to={`/toros/${t.id}`} className="font-medium text-blue-600 hover:underline">{t.nombre}</Link>,
              <span className="text-gray-600 px-2 py-1 bg-gray-100 rounded-md text-sm">{t.raza}</span>,
              <div className="flex gap-2">
                <Link to={`/toros/${t.id}`}>
                  <Button size="sm" variant="secondary">Ver</Button>
                </Link>
                <Link to={`/editar-toro/${t.id}`}>
                  <Button size="sm" variant="secondary">Editar</Button>
                </Link>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(t)}
                >
                  Eliminar
                </Button>
              </div>
            ]}
          />
        ) : (
          <div className="p-12 text-center text-gray-500">
            No se encontraron toros que coincidan con los filtros.
          </div>
        )}
      </Card>
    </>
  );
};
