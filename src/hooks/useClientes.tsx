import { useState, useEffect } from "react";
import { api } from "../api/api";
import type { Cliente } from "../Modelo/Cliente";

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/clientes");
      console.log(res.data);

      setClientes(res.data);
    } catch (err: any) {
      setError("Error cargando clientes: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const deleteCliente = async (id: string) => {
    try {
      await api.delete(`/clientes/${id}`);
      setClientes(current => current.filter(c => c.id !== id));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al eliminar cliente");
    }
  };

  return { clientes, loading, error, refetch: fetchClientes, deleteCliente };
};
