import { useState, useEffect } from "react";
import { useToros } from "../hooks/useToros";
import type { Toro } from "../Modelo/Toro";
// import { Sidebar } from "../components/Sidebar"; // Eliminado
import { Lista } from "../components/lista/Lista";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Skeleton, CardSkeleton, TableSkeleton } from "./ui/Skeleton";
import { ConfirmModal } from "./ui/ConfirmModal";

export const Toros = () => {
  const { toros, loading, error, deleteToro } = useToros(); // <-- deleteToro

  const [torosFiltrados, setTorosFiltrados] = useState(toros || []);
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

  // Sincronizamos toros originales con filtrados
  useEffect(() => {
    setTorosFiltrados(toros);
  }, [toros]);

  // Filtrado en frontend
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtrados = toros.filter((t) => {
      const matchNombre = t.nombre.toLowerCase().includes(term);
      const matchRaza = t.raza.toLowerCase().includes(term);
      return matchNombre || matchRaza;
    });
    setTorosFiltrados(filtrados);
  }, [searchTerm, toros]);

  const handleDelete = (toro: Toro) => {
    if (toro.colectas && toro.colectas.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: "No se puede eliminar",
        message: `El toro "${toro.nombre}" tiene ${toro.colectas.length} colectas asociadas. Debes eliminar o mover las colectas primero para poder borrar al toro.`,
        icon: 'alert',
        variant: 'info'
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Toro",
      message: `¿Estás seguro de que deseas eliminar al toro "${toro.nombre}"? Esta acción es permanente.`,
      icon: 'trash',
      variant: 'danger',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteToro(toro.id);
          toast.success(`Toro "${toro.nombre}" eliminado correctamente`);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          // Si falla, mostramos el modal informativo de "No se puede eliminar"
          setConfirmConfig({
            isOpen: true,
            title: "No se puede eliminar",
            message: `Hubo un error al intentar eliminar al toro "${toro.nombre}". Esto ocurre usualmente si tiene colectas o registros asociados que dependen de él.`,
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
          <p className="eyebrow mb-2">Cialco · Reproductores</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight">Toros</h1>
          <p className="text-sm text-ink-muted mt-1.5">Catálogo de toros disponibles.</p>
        </div>
        <Link to="/crear-toro" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Toro
          </Button>
        </Link>
      </div>

      <Card className="mb-8 p-2 animate-fade-up" padding="p-2">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Buscar por nombre o raza..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-0 bg-transparent rounded-xl pl-11 pr-4 py-3.5 focus:ring-0 focus:outline-none text-[15px] placeholder:text-ink-faint/80"
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0 animate-fade-up" padding="p-0">
        {torosFiltrados.length > 0 ? (
          <>
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block">
              <Lista
                items={torosFiltrados}
                columns={["Nombre", "Raza", "Acciones"]}
                renderCells={(t) => [
                  <Link to={`/toros/${t.id}`} className="font-semibold text-cialco hover:underline">{t.nombre}</Link>,
                  <span className="chip chip-brass">{t.raza}</span>,
                  <div className="flex gap-2">
                    <Link to={`/toros/${t.id}`}>
                      <Button size="sm" variant="info">Ver</Button>
                    </Link>
                    <Link to={`/editar-toro/${t.id}`}>
                      <Button size="sm" variant="warning">Editar</Button>
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
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden p-4 space-y-4">
              {torosFiltrados.map((t: Toro) => (
                <div
                  key={t.id}
                  className="bg-paper border border-hairline rounded-xl p-4 shadow-soft active:scale-[0.98] transition-all relative"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/toros/${t.id}`}
                        className="font-serif text-xl font-semibold text-ink hover:text-cialco truncate block"
                      >
                        {t.nombre}
                      </Link>
                      <div className="mt-1.5">
                        <span className="chip chip-brass uppercase tracking-widest">
                          {t.raza}
                        </span>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-ivory-100 border border-hairline flex items-center justify-center text-ink-faint font-semibold text-xs uppercase">
                      ID:{String(t.id).slice(-2)}
                    </div>
                  </div>

                  {/* Botones de acción en grid */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-hairline/70">
                    <Link to={`/toros/${t.id}`} className="w-full">
                      <Button size="sm" variant="info" className="w-full h-9 text-[10px] font-bold uppercase tracking-tighter">VER</Button>
                    </Link>
                    <Link to={`/editar-toro/${t.id}`} className="w-full">
                      <Button size="sm" variant="warning" className="w-full h-9 text-[10px] font-bold uppercase tracking-tighter">EDITAR</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      className="w-full h-9 text-[10px] font-bold uppercase tracking-tighter"
                      onClick={() => handleDelete(t)}
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
            No se encontraron toros que coincidan con los filtros.
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
