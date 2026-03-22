import { useCallback, useState } from "react";

/**
 * Hook genérico para ejecutar operaciones async (CRUD o similares) con loading,
 * y callbacks comunes (onSuccess/onError/onFinally).
 */
export function useCrud({ onSuccess, onError, onFinally } = {}) {
  const [loading, setLoading] = useState({
    create: false,
    update: false,
    remove: false,
    toggle: false,
  });

  const run = useCallback(
    async ({ key, fn, args = [], successMessage, errorMessage }) => {
      setLoading((prev) => ({ ...prev, [key]: true }));
      try {
        const result = await fn(...args);
        if (successMessage) onSuccess?.({ key, result, message: successMessage });
        else onSuccess?.({ key, result });
        return result;
      } catch (error) {
        onError?.({ key, error, message: errorMessage });
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
        onFinally?.({ key });
      }
    },
    [onSuccess, onError, onFinally]
  );

  const create = useCallback(
    (fn, payload, opts = {}) =>
      run({ key: "create", fn, args: [payload], ...opts }),
    [run]
  );

  const update = useCallback(
    (fn, payload, opts = {}) =>
      run({ key: "update", fn, args: [payload], ...opts }),
    [run]
  );

  const remove = useCallback(
    (fn, id, opts = {}) =>
      run({ key: "remove", fn, args: [id], ...opts }),
    [run]
  );

  const toggle = useCallback(
    (fn, id, opts = {}) =>
      run({ key: "toggle", fn, args: [id], ...opts }),
    [run]
  );

  return {
    loading,
    create,
    update,
    remove,
    toggle,
  };
}