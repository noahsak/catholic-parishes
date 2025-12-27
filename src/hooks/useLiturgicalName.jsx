// src/hooks/useLiturgicalName.js
import { useEffect, useState } from "react";

export function useLiturgicalName() {
  const [todayName, setTodayName] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchToday = async () => {
      try {
        const res = await fetch("/data/romcal2025-2050.json");
        if (!res.ok) throw new Error("Could not fetch Romcal data");
        const data = await res.json();

        if (!mounted) return;

        // Construct YYYY-MM-DD manually to be 100% environment-agnostic
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // Find today's entry
        const todayEntry = Array.isArray(data) 
          ? data.find((e) => e.date === todayStr) 
          : null;

        if (todayEntry) {
          setTodayName(todayEntry.name);
        } else {
          setTodayName("Ordinary Time");
        }
      } catch (error) {
        console.error("Failed to load liturgical name:", error);
        if (mounted) setTodayName("Mass of the Day");
      }
    };

    fetchToday();
    
    // Cleanup to prevent setting state on an unmounted component
    return () => { mounted = false; };
  }, []);

  return todayName;
}