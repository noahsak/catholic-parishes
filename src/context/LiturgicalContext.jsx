import React, { createContext, useContext, useState, useEffect } from 'react';
import { accentColors, darkAccentColors } from "@/liturgicalColors";

const LiturgicalContext = createContext();

export function LiturgicalProvider({ children }) {
  const [data, setData] = useState({
    colorKey: "GREEN",
    name: "Loading...",
    season: "Ordinary Time",
    loading: true
  });

  const updateGlobalStyles = (key) => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const colorHex = isDark ? (darkAccentColors[key] || darkAccentColors.GREEN) : (accentColors[key] || accentColors.GREEN);
    
    const root = document.documentElement;
    root.style.setProperty("--accent", colorHex);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorHex);
    if (result) {
      const rgb = `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
      root.style.setProperty("--accent-rgb", rgb);
    }
  };

  useEffect(() => {
    const fetchLiturgicalData = async () => {
      try {
        const res = await fetch("/data/romcal2025-2050.json");
        const romcal = await res.json();

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const entry = romcal.find(e => e.date === todayStr);
        
        if (entry) {
          const key = (entry.liturgicalColors?.key || "GREEN").toUpperCase();
          
          // Handle the Object structure: {"seasons": {"key": "Advent"}}
          const seasonData = Array.isArray(entry.seasons) ? entry.seasons[0] : entry.seasons;
          const rawSeason = seasonData?.key || seasonData?.value || "Ordinary Time";
          
          setData({
            colorKey: key,
            name: entry.name,
            season: rawSeason,
            loading: false
          });

          updateGlobalStyles(key);
        }
      } catch (err) {
        console.error("Failed to sync Liturgical Context:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchLiturgicalData();
  }, []); // Run once on mount

  // Separate effect for Theme changes to avoid re-fetching data
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => updateGlobalStyles(data.colorKey);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [data.colorKey]);

  return (
    <LiturgicalContext.Provider value={data}>
      {children}
    </LiturgicalContext.Provider>
  );
}

export const useLiturgical = () => useContext(LiturgicalContext);