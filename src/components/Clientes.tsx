import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { Sidebar } from "../components/Sidebar"; // Eliminado
import { Lista } from "../components/lista/Lista";
import { useClientes } from "../hooks/useClientes";
import type { Cliente } from "../Modelo/Cliente";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton, CardSkeleton, TableSkeleton } from "./ui/Skeleton";

export const Clientes = () => {
  const { clientes, loading, error, deleteCliente } = useClientes();

  const [clientesFiltrados, setClientesFiltrados] = useState(clientes || []);
  const [razonSocialFiltro, setRazonSocialFiltro] = useState("");
  const [cuitFiltro, setCuitFiltro] = useState("");

  // Sincronizamos clientes originales con filtrados
  useEffect(() => {
    setClientesFiltrados(clientes);
  }, [clientes]);

  // Filtrado en frontend
  useEffect(() => {
    const filtrados = clientes.filter((c) => {
      const matchRazonSocial = c.razonSocial.toLowerCase().includes(razonSocialFiltro.toLowerCase());
      const matchCuit = (c.cuit ?? "").toLowerCase().includes(cuitFiltro.toLowerCase());
      return matchRazonSocial && matchCuit;
    });
    setClientesFiltrados(filtrados);
  }, [razonSocialFiltro, cuitFiltro, clientes]);

  const handleDelete = async (cliente: Cliente) => {
    if (cliente.colectas && cliente.colectas.length > 0) {
      alert(`No se puede eliminar el cliente "${cliente.razonSocial}" porque tiene ${cliente.colectas.length} colectas asociadas.`);
      return;
    }

    if (window.confirm(`¿Seguro que deseas eliminar al cliente "${cliente.razonSocial}"?`)) {
      try {
        await deleteCliente(cliente.id);
        toast.success(`Cliente "${cliente.razonSocial}" eliminado correctamente`);
      } catch (err: any) {
        toast.error(err.message || "Error al eliminar el cliente");
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <CardSkeleton />
        <Card className="p-6">
          <TableSkeleton rows={8} />
        </Card>
      </div>
    );
  }

  if (error) return (
    <div className="p-6 text-red-600 bg-red-50 rounded-lg border border-red-100 text-center font-medium">
      {error}
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Lista de Clientes</h1>
          <p className="text-gray-500 mt-1">Gestiona la base de datos de clientes.</p>
        </div>
        <Link to="/crear-cliente">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Card className="mb-8 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
            <input
              type="text"
              placeholder="Ej: Agroganadera..."
              value={razonSocialFiltro}
              onChange={(e) => setRazonSocialFiltro(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
            <input
              type="text"
              placeholder="Ej: 30-..."
              value={cuitFiltro}
              onChange={(e) => setCuitFiltro(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {clientesFiltrados.length > 0 ? (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block">
              <Lista
                items={clientesFiltrados}
                columns={["Razón Social", "CUIT", "Acciones"]}
                renderCells={(c) => [
                  <Link to={`/clientes/${c.id}`} className="font-medium text-blue-600 hover:underline">{c.razonSocial}</Link>,
                  <span className="font-mono text-gray-600">{c.cuit}</span>,
                  <div className="flex gap-2">
                    <Link to={`/clientes/${c.id}`}>
                      <Button size="sm" variant="info">Ver</Button>
                    </Link>
                    <Link to={`/editar-cliente/${c.id}`}>
                      <Button size="sm" variant="warning">Editar</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(c)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ]}
              />
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden p-4 space-y-3">
              {clientesFiltrados.map((c: Cliente) => (
                <div
                  key={c.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-3">
                    <Link
                      to={`/clientes/${c.id}`}
                      className="font-bold text-lg text-blue-600 hover:underline block mb-1"
                    >
                      {c.razonSocial}
                    </Link>
                    <span className="font-mono text-sm text-gray-600">{c.cuit}</span>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <Link to={`/clientes/${c.id}`} className="flex-1">
                      <Button size="sm" variant="info" className="w-full">Ver</Button>
                    </Link>
                    <Link to={`/editar-cliente/${c.id}`} className="flex-1">
                      <Button size="sm" variant="warning" className="w-full">Editar</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleDelete(c)}
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
            No se encontraron clientes que coincidan con los filtros.
          </div>
        )}
      </Card>
    </>
  );
};
