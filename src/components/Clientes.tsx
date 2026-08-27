import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import { Sidebar } from "../components/Sidebar"; // Eliminado
import { Lista } from "../components/lista/Lista";
import { useClientes } from "../hooks/useClientes";
import type { Cliente } from "../Modelo/Cliente";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { UserPlus, Search } from "lucide-react";
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
    <div className="p-6 text-terracotta bg-terracotta-light rounded-xl border border-terracotta/20 text-center font-medium">
      {error}
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 animate-fade-up">
        <div>
          <p className="eyebrow mb-2">Cialco · Clientes</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight">Clientes</h1>
          <p className="text-sm text-ink-muted mt-1.5">Base de datos de clientes.</p>
        </div>
        <Link to="/crear-cliente" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Card className="mb-8 p-2 animate-fade-up" padding="p-2">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Buscar por razón social o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-0 bg-transparent rounded-xl pl-11 pr-4 py-3.5 focus:ring-0 focus:outline-none text-[15px] placeholder:text-ink-faint/80"
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0 animate-fade-up" padding="p-0">
        {clientesFiltrados.length > 0 ? (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block">
              <Lista
                items={clientesFiltrados}
                columns={["Razón Social", "CUIT", "Acciones"]}
                renderCells={(c) => [
                  <Link to={`/clientes/${c.id}`} className="font-semibold text-cialco hover:underline">{c.razonSocial}</Link>,
                  <span className="font-mono text-ink-muted">{c.cuit || '-'}</span>,
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
            <div className="md:hidden p-4 space-y-4">
              {clientesFiltrados.map((c: Cliente) => (
                <div
                  key={c.id}
                  className="bg-paper border border-hairline rounded-xl p-4 shadow-soft active:scale-[0.98] transition-all relative overflow-hidden"
                >
                  {/* Indicador lateral de color cliente */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: c.razonSocial ? `hsl(${stringToHue(c.razonSocial)}, 55%, 55%)` : '#D8CCB8' }}
                  />

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/clientes/${c.id}`}
                        className="font-serif text-xl font-semibold text-ink hover:text-cialco truncate block mb-1.5"
                      >
                        {c.razonSocial}
                      </Link>
                      <div
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: `hsl(${stringToHue(c.razonSocial)}, 55%, 96%)`,
                          borderColor: `hsl(${stringToHue(c.razonSocial)}, 40%, 88%)`,
                          color: `hsl(${stringToHue(c.razonSocial)}, 60%, 30%)`
                        }}
                      >
                        CUIT {c.cuit?.replace(/-/g, '') || "-"}
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-hairline/70">
                    <Link to={`/clientes/${c.id}`} className="w-full">
                      <Button size="sm" variant="info" className="w-full h-9 text-[10px] font-bold uppercase tracking-tighter">VER</Button>
                    </Link>
                    <Link to={`/editar-cliente/${c.id}`} className="w-full">
                      <Button size="sm" variant="warning" className="w-full h-9 text-[10px] font-bold uppercase tracking-tighter">EDITAR</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      className="w-full h-9 text-[10px] font-bold uppercase tracking-tighter"
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
          <div className="p-14 text-center text-ink-faint">
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
