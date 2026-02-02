import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { Sidebar } from "../components/Sidebar"; // Eliminado
import { Lista } from "../components/lista/Lista";
import { useClientes } from "../hooks/useClientes";
import type { Cliente } from "../Modelo/Cliente";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { UserPlus } from "lucide-react";

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
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando clientes...</div>;
  if (error) return <div className="p-6 text-red-600 bg-red-50 rounded-lg">{error}</div>;

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
        <Lista
          items={clientesFiltrados}
          columns={["Razón Social", "CUIT", "Acciones"]}
          renderCells={(c) => [
            <span className="font-medium text-gray-900">{c.razonSocial}</span>,
            <span className="font-mono text-gray-600">{c.cuit}</span>,
            <div className="flex gap-2">
              <Link to={`/editar-cliente/${c.id}`}>
                <Button size="sm" variant="secondary">Editar</Button>
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
      </Card>
    </>
  );
};
