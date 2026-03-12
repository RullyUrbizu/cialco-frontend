// hooks/useColectas.ts
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/api";
import type { Colecta } from "../Modelo/Colecta";

interface PaginatedResponse {
  data: Colecta[];
  total: number;
  page: number;
  lastPage: number;
}

export const useColectas = (initialLimit: number = 20) => {
  const [colectas, setColectas] = useState<Colecta[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [total, setTotal] = useState(0);

  const fetchColectas = async (currentPage: number, search: string, isLoadMore: boolean = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    setError(null);

    try {
      const res = await api.get<PaginatedResponse>("/colectas", {
        params: {
          page: currentPage,
          limit: initialLimit,
          search: search || undefined
        }
      });
      
      const { data, total, lastPage } = res.data;
      
      setColectas(current => isLoadMore ? [...current, ...data] : data);
      setTotal(total);
      setHasMore(currentPage < lastPage);
    } catch (err) {
      setError("Error cargando colectas");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounce search
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      setPage(1);
      fetchColectas(1, searchTerm);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchColectas(nextPage, searchTerm, true);
    }
  }, [loading, loadingMore, hasMore, page, searchTerm]);

  const deleteColecta = async (id: string) => {
    try {
      await api.delete(`/colectas/${id}`);
      setColectas(current => current.filter(c => c.id !== id));
      setTotal(prev => prev - 1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al eliminar colecta";
      throw new Error(message);
    }
  };

  const updateColecta = (updatedColecta: Colecta) => {
    setColectas(current =>
      current.map(c => c.id === updatedColecta.id ? updatedColecta : c)
    );
  };

  const refetch = () => {
    setPage(1);
    fetchColectas(1, searchTerm);
  };

  return { 
    colectas, 
    loading, 
    loadingMore, 
    error, 
    refetch, 
    deleteColecta, 
    updateColecta, 
    loadMore, 
    hasMore, 
    searchTerm, 
    setSearchTerm,
    total
  };
};
