// src/hooks/useLiturgicalAccentKey.js
import { useEffect, useState } from "react";

/**
 * Returns the current Liturgical Color Key (e.g., "PURPLE", "WHITE", "GREEN")
 * for use in text labels and UI logic.
 */
export function useLiturgicalAccentKey() {
  const [colorKey, setColorKey] = useState("Loading...");

  useEffect(() => {
    let mounted = true;

    const fetchToday = async () => {
      try {
        const res = await fetch("/data/romcal2025-2050.json");
        if (!res.ok) throw new Error("Failed to load calendar");
        const data = await res.json();
        
        if (!mounted) return;

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const todayEntry = Array.isArray(data) 
          ? data.find((entry) => entry.date === todayStr) 
          : null;
          
        // We only update the state key here. 
        // The CSS variables are handled by useLiturgicalAccent.js
        setColorKey(todayEntry?.liturgicalColors?.key?.toUpperCase() || "GREEN");
      } catch (err) {
        console.error("useLiturgicalAccentKey Error:", err);
        if (mounted) setColorKey("GREEN");
      }
    };

    fetchToday();
    return () => { mounted = false; };
  }, []);

  return colorKey;
}