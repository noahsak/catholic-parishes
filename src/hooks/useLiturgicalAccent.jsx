// src/hooks/useLiturgicalAccent.js
import { useEffect } from "react";
import { accentColors, darkAccentColors } from "@/liturgicalColors.jsx";
import { iconPaths } from "@/data/iconPaths.jsx";

function hexToRgbValues(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

export function useLiturgicalAccent() {
  useEffect(() => {
    const setAccentForToday = async () => {
      try {
        // 1. Fetch Romcal Data from public/data
        const res = await fetch("/data/romcal2025-2050.json");
        if (!res.ok) throw new Error("Romcal file not found");
        const data = await res.json();

        // 2. Determine Today's Date String (ISO Format: YYYY-MM-DD)
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // 3. Match Liturgical Color from Romcal JSON
        const todayEntry = Array.isArray(data) ? data.find((e) => e.date === todayStr) : null;
        const colorKey = (todayEntry?.liturgicalColors?.key || "PURPLE").toUpperCase();

        // 4. Handle Theme Detection (Dark vs Light mode)
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        
        // Pick Hex from your config files
        const colorHex = isDark
          ? darkAccentColors[colorKey] || "#BB86FC"
          : accentColors[colorKey] || "#6200EE";

        // 5. Update CSS Variables on <html> element
        const root = document.documentElement;
        
        // Standard Hex Variable
        root.style.setProperty("--accent", colorHex);
        
        // RGB Space-separated values for Tailwind (e.g. "128 0 128")
        const rgbValues = hexToRgbValues(colorHex);
        if (rgbValues) {
          root.style.setProperty("--accent-rgb", rgbValues);
        }

        // Contrast Variable (Black text if background is white and in light mode)
        const isWhite = colorKey === "WHITE";
        const contrastText = (isWhite && !isDark) ? "#1a1a1a" : "#ffffff";
        root.style.setProperty("--accent-contrast", contrastText);

        // 6. Dynamic Favicon & Apple Icon Update
        const iconEntry = iconPaths[colorKey] || iconPaths["PURPLE"];
        const iconHref = iconEntry?.[isDark ? "dark" : "light"];

        if (iconHref) {
          const updateLink = (rel) => {
            let link = document.querySelector(`link[rel*="${rel}"]`);
            if (!link) {
              link = document.createElement("link");
              link.rel = rel;
              document.head.appendChild(link);
            }
            link.href = iconHref;
          };
          updateLink("icon");
          updateLink("apple-touch-icon");
        }
      } catch (err) {
        console.error("Liturgical Accent Hook Error:", err);
        // Fallback: Set a default purple theme if everything fails
        document.documentElement.style.setProperty("--accent", "#800080");
        document.documentElement.style.setProperty("--accent-rgb", "128 0 128");
      }
    };

    // Run immediately on mount
    setAccentForToday();

    // Re-run if the user changes their System Dark/Light mode settings
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setAccentForToday();
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);
}