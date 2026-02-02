// hooks/useColectas.ts
import { useEffect, useState } from "react";
import { api } from "../api/api";
import type { Colecta } from "../Modelo/Colecta";

export const useColectas = () => {
  const [colectas, setColectas] = useState<Colecta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColectas = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/colectas");
      setColectas(res.data);
    } catch (err: any) {
      setError("Error cargando colectas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColectas();
  }, []);

  const deleteColecta = async (id: string) => {
    try {
      await api.delete(`/colectas/${id}`);
      setColectas(current => current.filter(c => c.id !== id));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al eliminar colecta");
    }
  };

  return { colectas, loading, error, refetch: fetchColectas, deleteColecta };
};
