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
        }))
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
      borderColor: '#d1d5db',
      padding: '2px',
      '&:hover': { borderColor: '#3b82f6' }
    })
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all">
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

          <div className="grid grid-cols-1 gap-4 mb-6">
            {/* Toro con Buscador */}
            <div>
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
            <div>
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

            {/* Fecha */}
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

            {/* Vigor y Motilidad */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Sección de Contenedores */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Contenedores</h3>
              <button
                type="button"
                onClick={handleAgregarContenedor}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                + Agregar Contenedor
              </button>
            </div>

            <div className="space-y-3">
              {contenedores.map((contenedor, index) => (
                <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    {/* Termo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Termo</label>
                      <select
                        value={contenedor.termoId}
                        onChange={(e) => handleContenedorChange(index, 'termoId', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Canastillo (#)
                        <span className="text-[10px] text-blue-500 ml-1">(usa comas para múltiples)</span>
                      </label>
                      <input
                        type="text"
                        value={contenedor.canastilloCodigo}
                        onChange={(e) => handleContenedorChange(index, 'canastilloCodigo', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ej: 1 o 5,2,8"
                        required
                      />
                    </div>

                    {/* Cantidad */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Pajuelas</label>
                      <input
                        type="number"
                        min="1"
                        value={contenedor.cantidad}
                        onChange={(e) => handleContenedorChange(index, 'cantidad', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                      className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total de Pajuelas:</span>
                <span className="text-lg font-bold text-blue-600">{calcularTotalPajuelas()}</span>
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
