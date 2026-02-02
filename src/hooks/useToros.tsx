import { useState, useEffect } from "react";
import { api } from "../api/api";
import type { Toro } from "../Modelo/Toro";

export const useToros = () => {
  const [toros, setToros] = useState<Toro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToros = async () => {
    setLoading(true);
    try {
      const res = await api.get("/toros");
      setToros(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToros();
  }, []);

  const deleteToro = async (id: string) => {
    try {
      await api.delete(`/toros/${id}`);
      setToros(current => current.filter(t => t.id !== id));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al eliminar toro");
    }
  };

  return { toros, loading, error, refetch: fetchToros, deleteToro };
};
