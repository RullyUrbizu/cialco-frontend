// components/ColectaModal.tsx
import { useState, useMemo, useEffect } from "react";
import Select from "react-select";
import { api } from "../api/api";
import type { Colecta } from "../Modelo/Colecta";
import { useTermos } from "../hooks/useTermos";
import { useToros } from "../hooks/useToros";
import { useClientes } from "../hooks/useClientes";
import { Button } from "./ui/Button";

interface ColectaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (colecta: Colecta) => void;
  colectaToEdit?: Colecta;
  onUpdated?: (colecta: Colecta) => void;
}

export const ColectaModal = ({ isOpen, onClose, onCreated, colectaToEdit, onUpdated }: ColectaModalProps) => {
  const { termos } = useTermos();
  const { toros } = useToros();
  const { clientes } = useClientes();

  const [form, setForm] = useState({
    termoId: "",
    canastilloId: "",
    canastilloCodigo: "",
    toroId: "",
    clienteId: "",
    cantidad: "",
    fecha: new Date().toLocaleDateString('sv-SE'),
    vigor: "",
    motilidad: "",
  });

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
        termoId: colectaToEdit.termo?.id || "",
        canastilloId: colectaToEdit.canastillo?.id || "",
        canastilloCodigo: colectaToEdit.canastillo?.codigo || "",
        toroId: colectaToEdit.toro?.id || "",
        clienteId: colectaToEdit.cliente?.id || "",
        cantidad: colectaToEdit.cantidad?.toString() || "",
        fecha: colectaToEdit.fecha ? new Date(colectaToEdit.fecha).toISOString().split('T')[0] : new Date().toLocaleDateString('sv-SE'),
        vigor: vigor || "",
        motilidad: motilidad || "",
      });
    } else {
      // Resetear formulario cuando no hay colecta para editar
      setForm({
        termoId: "",
        canastilloId: "",
        canastilloCodigo: "",
        toroId: "",
        clienteId: "",
        cantidad: "",
        fecha: new Date().toLocaleDateString('sv-SE'),
        vigor: "",
        motilidad: "",
      });
    }
  }, [colectaToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Combinar vigor y motilidad en formato: vigor/motilidad
      const vigorMot = `${form.vigor}/${form.motilidad}`;

      const payload = {
        termoId: form.termoId,
        canastilloId: form.canastilloId || undefined,
        canastilloCodigo: form.canastilloCodigo,
        toroId: form.toroId,
        clienteId: form.clienteId,
        cantidad: parseInt(form.cantidad),
        fecha: form.fecha,
        vigorMot: vigorMot,
      };

      let response;
      if (colectaToEdit) {
        // Modo edición
        response = await api.put(`/colectas/${colectaToEdit.id}`, payload);
        onUpdated?.(response.data);
      } else {
        // Modo creación
        response = await api.post("/colectas", payload);
        onCreated?.(response.data);
      }

      setForm({
        termoId: "",
        canastilloId: "",
        canastilloCodigo: "",
        toroId: "",
        clienteId: "",
        cantidad: "",
        fecha: new Date().toLocaleDateString('sv-SE'),
        vigor: "",
        motilidad: "",
      });
      onClose();
    } catch (err: any) {
      const action = colectaToEdit ? "actualizar" : "crear";
      setError(`Error al ${action} la colecta: ` + (err.response?.data?.message || err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: '0.5rem',
      borderColor: '#d1d5db',
      padding: '2px',
      '&:hover': { borderColor: '#3b82f6' }
    })
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">{colectaToEdit ? 'Editar Colecta' : 'Registrar Colecta'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Termo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Termo</label>
              <select
                value={form.termoId}
                onChange={(e) => setForm({ ...form, termoId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              >
                <option value="">Seleccione...</option>
                {termos.map((t) => (
                  <option key={t.id} value={t.id}>{t.codigo}</option>
                ))}
              </select>
            </div>

            {/* Canastillo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canastillo (#)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.canastilloCodigo}
                onChange={(e) => setForm({ ...form, canastilloCodigo: e.target.value, canastilloId: "" })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: 1"
                required
              />
            </div>

            {/* Toro con Buscador */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">Toro</label>
                <span className="text-[10px] text-blue-600 font-medium">Si es nuevo, agrégalo en la sección Toros</span>
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
            <div className="md:col-span-2">
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <span className="text-[10px] text-blue-600 font-medium">Si es nuevo, agrégalo en la sección Clientes</span>
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

            {/* Vigor y Motilidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vigor (0-5)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="5"
                value={form.vigor}
                onChange={(e) => setForm({ ...form, vigor: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: 3.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motilidad (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.motilidad}
                onChange={(e) => setForm({ ...form, motilidad: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: 75"
                required
              />
            </div>

            {/* Cantidad y Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cant. Pajuelas</label>
              <input
                type="number"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                min={0}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="mt-8">
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3"
            >
              {loading ? "Procesando..." : "Registrar Colecta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
