import { useState, useEffect } from "react";
import { api } from "../api/api";
import type { Termo } from "../Modelo/Termo";

export const useTermos = () => {
  const [termos, setTermos] = useState<Termo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTermos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/termos");
      setTermos(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTermos();
  }, []);

  const createTermo = async (data: { codigo: string }) => {
    try {
      const res = await api.post("/termos", data);
      setTermos(prev => [...prev, res.data]);
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al crear termo");
    }
  };

  const toggleTermoActivo = async (id: string, estado: boolean) => {
    try {
      await api.put(`/termos/${id}`, { activo: estado });
      setTermos(current => current.map(t => t.id === id ? { ...t, activo: estado } : t));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al actualizar estado del termo");
    }
  };

  const deleteTermo = async (id: string) => {
    try {
      await api.delete(`/termos/${id}`);
      setTermos(current => current.filter(t => t.id !== id));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "No se puede eliminar el termo porque tiene datos asociados");
    }
  };

  return { termos, loading, error, createTermo, toggleTermoActivo, deleteTermo, refetch: fetchTermos };
};
