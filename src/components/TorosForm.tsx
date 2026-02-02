import { useState, useEffect } from "react";
import { RazaEnum } from "../Modelo/RazaEnum";
import { api } from "../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

export const ToroForm = () => {
  const [nombre, setNombre] = useState("");
  const [raza, setRaza] = useState<RazaEnum>(RazaEnum.AA);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing && id) {
      setInitialLoading(true);
      api.get(`/toros/${id}`)
        .then((res) => {
          setNombre(res.data.nombre);
          setRaza(res.data.raza);
        })
        .catch((err) => {
          console.error(err);
          setMensaje("Error al cargar el toro ❌");
        })
        .finally(() => setInitialLoading(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    const data = { nombre, raza };

    try {
      let res;
      if (isEditing) {
        res = await api.put(`/toros/${id}`, data); // O patch
      } else {
        res = await api.post("/toros", data);
      }

      if (res.status === 201 || res.status === 200) {
        setMensaje(isEditing ? "Toro actualizado correctamente ✅" : "Toro creado correctamente ✅");
        if (!isEditing) {
          setNombre("");
          setRaza(RazaEnum.AA);
        }
        setTimeout(() => navigate("/Toros"), 1500);
      } else {
        setMensaje("Error al guardar el toro ❌");
      }
    } catch (err: any) {
      console.error(err);
      setMensaje("Error de conexión: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-8 text-center text-gray-500">Cargando datos del toro...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/Toros")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {isEditing ? "Editar Toro" : "Agregar Toro"}
        </h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ej: Toro Campeón"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raza
            </label>
            <select
              value={raza}
              onChange={(e) => setRaza(e.target.value as RazaEnum)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {Object.values(RazaEnum).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <Button type="button" variant="secondary" onClick={() => navigate("/Toros")}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={loading}>
              {isEditing ? "Guardar Cambios" : "Crear Toro"}
            </Button>
          </div>
        </form>
        {mensaje && (
          <div className={`mt-4 p-3 rounded-md text-sm ${mensaje.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {mensaje}
          </div>
        )}
      </Card>
    </div>
  );
};
