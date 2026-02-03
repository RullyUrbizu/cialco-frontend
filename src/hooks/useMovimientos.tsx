import { useEffect, useState } from "react";
import { api } from "../api/api";
import type { Movimiento } from "../Modelo/Movimiento";

export const useMovimientos = (inventarioId?: string) => {
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMovimientos = async () => {
        if (!inventarioId) {
            setMovimientos([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await api.get(`/movimientos/inventario/${inventarioId}`);
            setMovimientos(res.data);
        } catch (err: any) {
            setError("Error cargando movimientos");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovimientos();
    }, [inventarioId]);

    return { movimientos, loading, error, refetch: fetchMovimientos };
};
