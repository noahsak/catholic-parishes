// src/hooks/useLiturgicalSeason.js
import { useEffect, useState } from "react";

export function useLiturgicalSeason() {
  const [season, setSeason] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchSeason = async () => {
      try {
        const res = await fetch("/data/romcal2025-2050.json");
        if (!res.ok) throw new Error("Could not load calendar");
        const data = await res.json();

        if (!mounted) return;

        // Standardized date format (YYYY-MM-DD)
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const todayEntry = Array.isArray(data) 
          ? data.find((e) => e.date === todayStr) 
          : null;

        if (todayEntry) {
          // Priority: 1. Display value, 2. Key (formatted), 3. Fallback
          const rawSeason = todayEntry.seasons?.[0]?.value || todayEntry.seasons?.[0]?.key;
          
          if (rawSeason) {
            // Converts "ORDINARY_TIME" to "Ordinary Time"
            const formatted = rawSeason
              .toLowerCase()
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            setSeason(formatted);
          } else {
            setSeason("Ordinary Time");
          }
        } else {
          setSeason("Ordinary Time");
        }
      } catch (error) {
        console.error("Failed to load liturgical season:", error);
        if (mounted) setSeason("Ordinary Time");
      }
    };

    fetchSeason();
    return () => { mounted = false; };
  }, []);

  return season;
}