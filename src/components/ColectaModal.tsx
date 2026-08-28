// components/ColectaModal.tsx
import { useState, useMemo, useEffect } from "react";
import Select from "react-select";
import { api } from "../api/api";
import type { Colecta } from "../Modelo/Colecta";
import { useTermos } from "../hooks/useTermos";
import { useToros } from "../hooks/useToros";
import { useClientes } from "../hooks/useClientes";
import { Button } from "./ui/Button";
import { toast } from "sonner";

interface ColectaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (colecta: Colecta) => void;
  colectaToEdit?: Colecta;
  onUpdated?: (colecta: Colecta) => void;
}

interface Contenedor {
  termoId: string;
  canastilloCodigo: string;
  cantidad: string;
}

export const ColectaModal = ({ isOpen, onClose, onCreated, colectaToEdit, onUpdated }: ColectaModalProps) => {
  const { termos } = useTermos();
  const { toros } = useToros();
  const { clientes } = useClientes();

  const [form, setForm] = useState({
    toroId: "",
    clienteId: "",
    fecha: new Date().toLocaleDateString('sv-SE'),
    vigor: "",
    motilidad: "",
    color: "",
  });

  const [contenedores, setContenedores] = useState<Contenedor[]>([
    { termoId: "", canastilloCodigo: "", cantidad: "" }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opciones para react-select
  const toroOptions = useMemo(() =>
    toros.map(t => ({ value: t.id, label: `${t.nombre} (${t.raza})` })),
    [toros]);

  const clienteOptions = useMemo(() =>
    clientes.map(c => ({ value: c.id, label: c.razonSocial })),
    [clientes]);

  // Cargar datos de la colecta cuando se abre en modo edición
  useEffect(() => {
    if (colectaToEdit) {
      // Separar vigor y motilidad del campo vigorMot
      const [vigor, motilidad] = colectaToEdit.vigorMot?.split('/') || ['', ''];

      setForm({
        toroId: colectaToEdit.toro?.id || "",
        clienteId: colectaToEdit.cliente?.id || "",
        fecha: colectaToEdit.fecha ? new Date(colectaToEdit.fecha).toISOString().split('T')[0] : new Date().toLocaleDateString('sv-SE'),
        vigor: vigor || "",
        motilidad: motilidad || "",
        color: colectaToEdit.color || "",
      });

      // Cargar contenedores desde la colecta
      if (colectaToEdit.contenedores && colectaToEdit.contenedores.length > 0) {
        setContenedores(
          colectaToEdit.contenedores.map(c => ({
            termoId: c.termo?.id || "",
            canastilloCodigo: c.canastillo?.codigo || "",
            cantidad: c.cantidad?.toString() || ""
          }))
        );
      }
    } else {
      // Resetear formulario cuando no hay colecta para editar
      setForm({
        toroId: "",
        clienteId: "",
        fecha: new Date().toLocaleDateString('sv-SE'),
        vigor: "",
        motilidad: "",
        color: "",
      });
      setContenedores([{ termoId: "", canastilloCodigo: "", cantidad: "" }]);
    }
  }, [colectaToEdit]);

  const handleAgregarContenedor = () => {
    setContenedores([...contenedores, { termoId: "", canastilloCodigo: "", cantidad: "" }]);
  };

  const handleEliminarContenedor = (index: number) => {
    if (contenedores.length > 1) {
      setContenedores(contenedores.filter((_, i) => i !== index));
    }
  };

  const handleContenedorChange = (index: number, field: keyof Contenedor, value: string) => {
    // Si el campo es canastilloCodigo y contiene comas, dividir en múltiples contenedores
    if (field === 'canastilloCodigo' && value.includes(',')) {
      const codigos = value.split(',').map(c => c.trim()).filter(c => c !== '');

      if (codigos.length > 1) {
        const contenedorActual = contenedores[index];
        const nuevosContenedores = [...contenedores];

        // Actualizar el contenedor actual con el primer código
        nuevosContenedores[index] = {
          ...contenedorActual,
          canastilloCodigo: codigos[0]
        };

        // Crear nuevos contenedores para los códigos restantes
        const contenedoresAdicionales = codigos.slice(1).map(codigo => ({
          termoId: contenedorActual.termoId,
          canastilloCodigo: codigo,
          cantidad: contenedorActual.cantidad
        }));

        // Insertar los nuevos contenedores después del actual
        nuevosContenedores.splice(index + 1, 0, ...contenedoresAdicionales);

        setContenedores(nuevosContenedores);
        return;
      }
    }

    // Comportamiento normal para otros campos
    const nuevosContenedores = [...contenedores];
    nuevosContenedores[index][field] = value;
    setContenedores(nuevosContenedores);
  };

  const calcularTotalPajuelas = () => {
    return contenedores.reduce((sum, c) => sum + (parseInt(c.cantidad) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Combinar vigor y motilidad en formato: vigor/motilidad
      const vigorMot = `${form.vigor}/${form.motilidad}`;

      // Validar que todos los contenedores tengan datos
      const contenedoresValidos = contenedores.every(c =>
        c.termoId && c.canastilloCodigo && c.cantidad && parseInt(c.cantidad) > 0
      );

      if (!contenedoresValidos) {
        setError("Todos los contenedores deben tener termo, canastillo y cantidad válidos");
        setLoading(false);
        return;
      }

      const payload = {
        toroId: form.toroId,
        clienteId: form.clienteId,
        fecha: form.fecha,
        vigorMot: vigorMot,
        contenedores: contenedores.map(c => ({
          termoId: c.termoId,
          canastilloCodigo: c.canastilloCodigo,
          cantidad: parseInt(c.cantidad)
        })),
        color: form.color
      };

      let response;
      if (colectaToEdit) {
        // Modo edición
        response = await api.put(`/colectas/${colectaToEdit.id}`, payload);
        toast.success("Colecta actualizada correctamente");
        onUpdated?.(response.data);
      } else {
        // Modo creación
        response = await api.post("/colectas", payload);
        toast.success("Colecta registrada correctamente");
        onCreated?.(response.data);
      }

      setForm({
        toroId: "",
        clienteId: "",
        fecha: new Date().toLocaleDateString('sv-SE'),
        vigor: "",
        motilidad: "",
        color: "",
      });
      setContenedores([{ termoId: "", canastilloCodigo: "", cantidad: "" }]);
      onClose();
    } catch (err: any) {
      const action = colectaToEdit ? "actualizar" : "crear";
      const errorMsg = `Error al ${action} la colecta: ` + (err.response?.data?.message || err.message || "");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: '0.5rem',
      borderColor: '#D8CCB8',
      boxShadow: 'none',
      padding: '2px',
      fontSize: '0.875rem',
      '&:hover': { borderColor: '#A4863F' }
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: '0.875rem',
      backgroundColor: state.isSelected ? '#1F4A36' : state.isFocused ? '#F6F1E8' : 'transparent',
      color: state.isSelected ? '#FFFDF8' : '#1D2923',
    }),
    menu: (base: any) => ({
      ...base,
      border: '1px solid #E9E1D2',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: '0 16px 40px -12px rgba(29,41,35,0.18)',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
  };

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-paper rounded-2xl shadow-lift w-full max-w-3xl overflow-hidden border border-hairline transform transition-all animate-scale-in">
        <div className="p-6 border-b border-hairline flex justify-between items-center bg-ivory-100">
          <h2 className="font-serif text-xl font-semibold text-ink">{colectaToEdit ? 'Editar Colecta' : 'Registrar Colecta'}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="mb-4 p-3 bg-terracotta-light border border-terracotta/20 text-terracotta rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 mb-6">
            {/* Toro con Buscador */}
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className="field-label !mb-0">Toro</label>
                <span className="text-[10px] text-cialco font-medium">Si es nuevo, agrégalo en la sección Toros</span>
              </div>
              <Select
                options={toroOptions}
                value={toroOptions.find(opt => opt.value === form.toroId) || null}
                placeholder="Buscar toro..."
                isSearchable
                styles={selectStyles}
                onChange={(opt: any) => setForm({ ...form, toroId: opt ? opt.value : "" })}
                noOptionsMessage={() => "No se encontraron resultados"}
                required
              />
            </div>

            {/* Cliente con Buscador */}
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className="field-label !mb-0">Cliente</label>
                <span className="text-[10px] text-cialco font-medium">Si es nuevo, agrégalo en la sección Clientes</span>
              </div>
              <Select
                options={clienteOptions}
                value={clienteOptions.find(opt => opt.value === form.clienteId) || null}
                placeholder="Buscar cliente..."
                isSearchable
                styles={selectStyles}
                onChange={(opt: any) => setForm({ ...form, clienteId: opt ? opt.value : "" })}
                noOptionsMessage={() => "No se encontraron resultados"}
                required
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="field-label">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="field"
                required
              />
            </div>

            {/* Vigor y Motilidad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Vigor (0-5)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="5"
                  value={form.vigor}
                  onChange={(e) => setForm({ ...form, vigor: e.target.value })}
                  className="field"
                  placeholder="Ej: 3.5"
                  required
                />
              </div>

              <div>
                <label className="field-label">Motilidad (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.motilidad}
                  onChange={(e) => setForm({ ...form, motilidad: e.target.value })}
                  className="field"
                  placeholder="Ej: 75"
                  required
                />
              </div>
            </div>

            {/* Selector de Color */}
            <div>
              <label className="field-label">Color de Identificación</label>
              <div className="flex flex-wrap gap-3 p-3 bg-ivory-100 rounded-xl border border-hairline">
                {[
                  { name: 'Sin Color', value: '' },
                  { name: 'Blanco', value: '#ffffff' },
                  { name: 'Azul', value: '#3b82f6' },
                  { name: 'Verde', value: '#22c55e' },
                  { name: 'Amarillo', value: '#eab308' },
                ].map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setForm({ ...form, color: color.value })}
                    className={`group relative flex flex-col items-center gap-1 transition-all ${form.color === color.value ? 'scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all ${form.color === color.value ? 'border-brass ring-2 ring-brass/25' : 'border-white'
                        }`}
                      style={{ backgroundColor: color.value || '#ffffff' }}
                    >
                      {!color.value && (
                        <div className="w-full h-full flex items-center justify-center text-ink-faint text-xs">/</div>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold ${form.color === color.value ? 'text-brass-dark' : 'text-ink-faint'}`}>
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sección de Contenedores */}
          <div className="border-t border-hairline pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold text-ink">Contenedores</h3>
              <button
                type="button"
                onClick={handleAgregarContenedor}
                className="px-3 py-1.5 bg-pine text-white text-sm rounded-lg hover:bg-pine-600 transition-colors"
              >
                + Agregar Contenedor
              </button>
            </div>

            <div className="space-y-3">
              {contenedores.map((contenedor, index) => (
                <div key={index} className="flex gap-3 items-start p-4 bg-ivory-100/60 rounded-lg border border-hairline">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    {/* Termo */}
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-soft mb-1">Termo</label>
                      <select
                        value={contenedor.termoId}
                        onChange={(e) => handleContenedorChange(index, 'termoId', e.target.value)}
                        className="field !py-1.5 !px-2.5 text-xs"
                        required
                      >
                        <option value="">Seleccione...</option>
                        {termos.filter(t => t.activo).map((t) => (
                          <option key={t.id} value={t.id}>{t.codigo}</option>
                        ))}
                      </select>
                    </div>

                    {/* Canastillo */}
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-soft mb-1">
                        Canastillo (#)
                        <span className="text-[10px] text-cialco font-medium ml-1">(usa comas para múltiples)</span>
                      </label>
                      <input
                        type="text"
                        value={contenedor.canastilloCodigo}
                        onChange={(e) => handleContenedorChange(index, 'canastilloCodigo', e.target.value)}
                        className="field !py-1.5 !px-2.5 text-xs"
                        placeholder="Ej: 1 o 5,2,8"
                        required
                      />
                    </div>

                    {/* Cantidad */}
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-soft mb-1">Pajuelas</label>
                      <input
                        type="number"
                        min="1"
                        value={contenedor.cantidad}
                        onChange={(e) => handleContenedorChange(index, 'cantidad', e.target.value)}
                        className="field !py-1.5 !px-2.5 text-xs"
                        placeholder="Ej: 50"
                        required
                      />
                    </div>
                  </div>

                  {/* Botón Eliminar */}
                  {contenedores.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarContenedor(index)}
                      className="mt-6 p-2 text-terracotta hover:bg-terracotta-light rounded-lg transition-colors"
                      title="Eliminar contenedor"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total de Pajuelas */}
            <div className="mt-4 p-3 bg-cialco-50 border border-cialco/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-ink-soft">Total de Pajuelas:</span>
                <span className="text-lg font-semibold text-cialco">{calcularTotalPajuelas()}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3"
            >
              {loading ? "Procesando..." : (colectaToEdit ? "Actualizar Colecta" : "Registrar Colecta")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
