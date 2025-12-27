import React from "react";
import { usePersistentToggle } from "@/hooks/usePersistentToggle";

export default function CollapsibleSection({ title, count, id, children }) {
  // Persistent open/closed state using your custom hook
  const [open, setOpen] = usePersistentToggle(`collapse-${id}`, false);

  return (
    <section
      className="overflow-hidden rounded-2xl border-2 transition-all duration-300"
      style={{
        borderColor: "var(--accent)",
        boxShadow: open ? "0 0 20px var(--accent)" : "none",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-white/5 transition-colors"
        aria-expanded={open}
      >
        <h2 className="text-lg md:text-xl font-bold tracking-tight">
          {title} {count !== undefined && <span className="opacity-60 ml-1">— {count}</span>}
        </h2>
        <span 
          className={`text-sm transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        >
          ▼
        </span>
      </button>

      <div
        className={`transition-all duration-500 ease-in-out scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent ${
          open 
            ? "max-h-[70vh] opacity-100 overflow-y-auto px-6 pb-6" 
            : "max-h-0 opacity-0 overflow-hidden px-6 pb-0"
        }`}
      >
        <div className="border-t border-white/10 pt-4">
          {children}
        </div>
      </div>
    </section>
  );
}