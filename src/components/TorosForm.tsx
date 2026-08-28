import { useState, useEffect } from "react";
import { RazaEnum } from "../Modelo/RazaEnum";
import { api } from "../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { toast } from "sonner";

export const ToroForm = () => {
  const [nombre, setNombre] = useState("");
  const [raza, setRaza] = useState<RazaEnum>(RazaEnum.AA);
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
          toast.error("Error al cargar el toro");
        })
        .finally(() => setInitialLoading(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = { nombre, raza };

    try {
      let res;
      if (isEditing) {
        res = await api.put(`/toros/${id}`, data); // O patch
      } else {
        res = await api.post("/toros", data);
      }

      if (res.status === 201 || res.status === 200) {
        toast.success(isEditing ? "Toro actualizado correctamente" : "Toro creado correctamente");
        if (!isEditing) {
          setNombre("");
          setRaza(RazaEnum.AA);
        }
        setTimeout(() => navigate("/Toros"), 1500);
      } else {
        toast.error("Error al guardar el toro");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error de conexión: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-8 text-center text-ink-faint">Cargando datos del toro...</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/Toros")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <p className="eyebrow mb-1">Cialco · Reproducción</p>
          <h1 className="font-serif text-3xl font-semibold text-ink tracking-tight">
            {isEditing ? "Editar Toro" : "Agregar Toro"}
          </h1>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label htmlFor="nombre" className="field-label">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="field"
              placeholder="Ej: Toro Campeón"
            />
          </div>

          <div>
            <label htmlFor="raza" className="field-label">
              Raza
            </label>
            <select
              id="raza"
              value={raza}
              onChange={(e) => setRaza(e.target.value as RazaEnum)}
              className="field"
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
      </Card>
    </div>
  );
};
