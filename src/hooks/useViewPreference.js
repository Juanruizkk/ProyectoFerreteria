import { useEffect, useState } from "react";

export function useViewPreference(storageKey, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // si falla (modo privado, etc), no rompemos la app
    }
  }, [storageKey, value]);

  return [value, setValue];
}