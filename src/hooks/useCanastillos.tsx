import { useState, useEffect } from "react";
import { api } from "../api/api";
import type { Canastillo } from "../Modelo/Canastillo";

export const useCanastillos = () => {
  const [canastillos, setCanastillos] = useState<Canastillo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/canastillos")
      .then(res => setCanastillos(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { canastillos, loading, error };
};
