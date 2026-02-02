import { useState, useEffect } from "react";
import { api } from "../api/api";
import type { Termo } from "../Modelo/Termo";

export const useTermos = () => {
  const [termos, setTermos] = useState<Termo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/termos")
      .then(res => setTermos(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { termos, loading, error };
};
