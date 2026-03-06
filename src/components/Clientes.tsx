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
import { ConfirmModal } from "./ui/ConfirmModal";

export const Clientes = () => {
  const { clientes, loading, error, deleteCliente } = useClientes();

  const stringToHue = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
  };

  const [clientesFiltrados, setClientesFiltrados] = useState(clientes || []);
  const [searchTerm, setSearchTerm] = useState("");

  // --- estados para confirmación de borrado ---
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    icon?: 'trash' | 'alert' | 'info';
    onConfirm?: () => void;
    variant?: 'danger' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: "",
    message: ""
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Sincronizamos clientes originales con filtrados
  useEffect(() => {
    setClientesFiltrados(clientes);
  }, [clientes]);

  // Filtrado en frontend
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtrados = clientes.filter((c) => {
      const matchRazonSocial = c.razonSocial.toLowerCase().includes(term);
      const matchCuit = (c.cuit ?? "").toLowerCase().includes(term);
      return matchRazonSocial || matchCuit;
    });
    setClientesFiltrados(filtrados);
  }, [searchTerm, clientes]);

  const handleDelete = (cliente: Cliente) => {
    if (cliente.colectas && cliente.colectas.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: "No se puede eliminar",
        message: `El cliente "${cliente.razonSocial}" tiene ${cliente.colectas.length} colectas asociadas. Debes eliminar o reasignar las colectas primero.`,
        icon: 'alert',
        variant: 'info'
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Cliente",
      message: `¿Estás seguro de que deseas eliminar al cliente "${cliente.razonSocial}"? Esta acción no se puede deshacer.`,
      icon: 'trash',
      variant: 'danger',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteCliente(cliente.id);
          toast.success(`Cliente "${cliente.razonSocial}" eliminado correctamente`);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          // Si falla, mostramos el modal informativo de "No se puede eliminar"
          setConfirmConfig({
            isOpen: true,
            title: "No se puede eliminar",
            message: `Hubo un error al intentar eliminar al cliente "${cliente.razonSocial}". Asegúrate de que no tenga colectas o registros asociados antes de reintentar.`,
            icon: 'alert',
            variant: 'info'
          });
        } finally {
          setIsDeleting(false);
        }
      }
    });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Base de datos de clientes.</p>
        </div>
        <Link to="/crear-cliente" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Card className="mb-6 p-2 bg-gray-50/50 border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por razón social o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-4 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-none text-base"
          />
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
            <div className="md:hidden p-3 space-y-4 bg-gray-50/50">
              {clientesFiltrados.map((c: Cliente) => (
                <div
                  key={c.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden"
                >
                  {/* Indicador lateral de color cliente */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: c.razonSocial ? `hsl(${stringToHue(c.razonSocial)}, 60%, 60%)` : '#d1d5db' }}
                  />

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/clientes/${c.id}`}
                        className="font-black text-xl text-gray-900 hover:text-blue-600 truncate block mb-1 uppercase tracking-tight"
                      >
                        {c.razonSocial}
                      </Link>
                      <div
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-black uppercase tracking-wider"
                        style={{
                          backgroundColor: `hsl(${stringToHue(c.razonSocial)}, 70%, 97%)`,
                          borderColor: `hsl(${stringToHue(c.razonSocial)}, 60%, 90%)`,
                          color: `hsl(${stringToHue(c.razonSocial)}, 70%, 35%)`
                        }}
                      >
                        CUIT {c.cuit?.replace(/-/g, '') || "-"}
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                    <Link to={`/clientes/${c.id}`} className="w-full">
                      <Button size="sm" variant="info" className="w-full h-9 text-[10px] font-black uppercase tracking-tighter">VER</Button>
                    </Link>
                    <Link to={`/editar-cliente/${c.id}`} className="w-full">
                      <Button size="sm" variant="warning" className="w-full h-9 text-[10px] font-black uppercase tracking-tighter">EDITAR</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      className="w-full h-9 text-[10px] font-black uppercase tracking-tighter"
                      onClick={() => handleDelete(c)}
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
            No se encontraron clientes que coincidan con los filtros.
          </div>
        )}
      </Card>
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        icon={confirmConfig.icon}
        isLoading={isDeleting}
      />
    </>
  );
};
