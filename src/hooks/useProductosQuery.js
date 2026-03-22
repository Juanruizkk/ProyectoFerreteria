import { useEffect, useRef, useState, useCallback } from "react";
import { fetchProductsWithDetails } from "@/services/ProductQueries";

export function useProductosQuery({ activo, pageIndex, pageSize, searchTerm }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // cache: 2 buckets (activos/eliminados) -> por pageIndex
  const cacheRef = useRef({ activos: {}, eliminados: {} });

  // “token” para forzar reload sin cambiar deps
  const reloadTokenRef = useRef(0);

  const clearCache = useCallback(() => {
    cacheRef.current = { activos: {}, eliminados: {} };
  }, []);

  const reload = useCallback(() => {
    reloadTokenRef.current += 1;
    // truco: disparar effect con un state. Para mantener simple:
    // vamos a usar un state de versión.
    setVersion((v) => v + 1);
  }, []);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;

    async function run() {
      const cacheKey = activo ? "activos" : "eliminados";

      // cache solo cuando NO hay búsqueda
      if (!searchTerm && cacheRef.current[cacheKey][pageIndex]) {
        const data = cacheRef.current[cacheKey][pageIndex];
        setItems(data.items ?? []);
        setTotalPages(data.totalPages ?? 1);
        setHasPrev(Boolean(data.hasPrevioPage));
        setHasNext(Boolean(data.hasNextPage));
        return;
      }

      setLoading(true);
      try {
        const data = await fetchProductsWithDetails(
          activo,
          pageIndex,
          pageSize,
          searchTerm
        );

        if (!alive) return;

        // cachear solo si no hay búsqueda
        if (!searchTerm) {
          cacheRef.current[cacheKey][pageIndex] = data;
        }

        setItems(data.items ?? []);
        setTotalPages(data.totalPages ?? 1);
        setHasPrev(Boolean(data.hasPrevioPage));
        setHasNext(Boolean(data.hasNextPage));
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [activo, pageIndex, pageSize, searchTerm, version]);

  return {
    items,
    loading,
    totalPages,
    hasPrev,
    hasNext,
    clearCache,
    reload,
  };
}