import { useEffect, useState } from "react";

/**
 * A hook that persists a boolean toggle state in sessionStorage.
 * Optimized for React 19 to prevent hydration mismatches.
 */
export function usePersistentToggle(key, defaultValue = false) {
  // 1. Initial state always uses the default to ensure consistent first render
  const [open, setOpen] = useState(defaultValue);

  // 2. Load from sessionStorage ONLY after the component mounts
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        setOpen(JSON.parse(saved));
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key]);

  // 3. Save to sessionStorage whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(open));
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, open]);

  return [open, setOpen];
}