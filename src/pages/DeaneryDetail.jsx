import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLightbox, Lightbox } from "../hooks/lightbox.jsx";
import { usePageMeta } from "../hooks/usePageMeta.jsx";
import CollapsibleSection from "../hooks/CollapsibleSection.jsx";

export default function DeaneryDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { openLightbox } = useLightbox();

  const [deanery, setDeanery] = useState(undefined);
  const [isDark, setIsDark] = useState(() => {
    return typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // --- NEW: SEO & META DATA HOOK ---
  const banner = useMemo(() => {
    const photos = String(deanery?.deaneryPhotos || "").split(/;|\n/).map(p => p.trim()).filter(Boolean);
    return photos.length > 0 ? photos[0] : null;
  }, [deanery]);

  usePageMeta(
    deanery ? `${deanery.deaneryName} Deanery` : null,
    deanery 
      ? `Explore parishes and Catholic communities in the ${deanery.deaneryName} Deanery, part of the ${deanery.deaneryDiocese}.` 
      : null,
    banner
  );

  // Dark mode detection
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (ev) => setIsDark(ev.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Load deaneries JSON
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/data/deaneries.json");
        if (!res.ok) throw new Error("Failed to load deaneries.json");
        const list = await res.json();
        if (!mounted) return;
        const found = list.find((d) => {
          const generatedSlug = String(d.deanerySlug || d.deaneryName || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          return generatedSlug === slug;
        });
        setDeanery(found ?? null);
      } catch (err) {
        console.error("Error loading deaneries:", err);
        if (mounted) setDeanery(null);
      }
    };
    load();
    return () => { mounted = false; };
  }, [slug]);

  if (deanery === undefined)
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (deanery === null)
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-white">
        Deanery not found. <br />
        <Link to="/" className="underline">Back to Map</Link>
      </div>
    );
  
  // Re-using the memoized banner for the UI as well
  const photos = String(deanery.deaneryPhotos || "").split(/;|\n/).map(p => p.trim()).filter(Boolean);

  const parishList = String(deanery.parishesListByDeaneryAlpha || "").split(/;|\n/).map((p, i) => ({
    name: p.trim(),
    slug: String(deanery.parishesListByDeaneryAlphaSlug || "").split(/;|\n/)[i]?.trim() || null
  }));

  const familyList = String(deanery.familyListByDeaneryAlpha || "").split(/;|\n/).map((f, i) => ({
    name: f.trim(),
    slug: String(deanery.familyListByDeaneryAlphaSlug || "").split(/;|\n/)[i]?.trim() || null
  }));

  const nationalitiesList = deanery.deaneryNationalities ? deanery.deaneryNationalities.split(/;|\n/).map(n => n.trim()).filter(Boolean) : [];

  return (
    <div className={`min-h-screen relative flex flex-col ${isDark ? "text-white" : "text-black"}`}>
      
      {/* Background Section */}
      <div className="fixed inset-0 bg-center bg-cover"
        style={{ backgroundImage: banner ? `url('${banner}')` : "none", backgroundColor: banner ? undefined : isDark ? "#80008048" : "#f9fafb" }} />
      <div className="fixed inset-0 bg-black/50" />

      {/* Hero Header */}
      <div className="relative h-64 md:h-80 flex items-end">
        <div className="w-full p-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {deanery.deaneryName} Deanery
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <main className="relative max-w-5xl mx-4 md:mx-auto p-6 space-y-6
        bg-[color-mix(in_srgb,var(--accent)_50%,transparent)]
        dark:bg-[color-mix(in_srgb,var(--accent)_50%,transparent)]
        backdrop-blur-md rounded-2xl mt-6 mb-12 shadow-2xl border border-white/10"
      >
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="text-sm font-bold opacity-70 hover:opacity-100 transition">← Back</button>

        {/* Information Section */}
        <section className="mb-6">
          <h2 className="text-xl font-black mb-6 border-b border-white/20 pb-2 text-center">Information</h2>
          <div className="md:flex md:justify-center md:items-start gap-6">
            <div className="space-y-1 md:text-left">
              <div><strong>Diocese:</strong> <Link to={`/diocese/${deanery.deaneryDioceseSlug}`} className="text-blue-300">{deanery.deaneryDiocese}</Link></div>
              <div><strong>Province:</strong> {deanery.deaneryProvince}</div>
              <div><strong>Country:</strong> {deanery.deaneryCountry}</div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="p-4 shadow-md rounded-xl text-center
                bg-[color-mix(in_srgb,var(--accent)_40%,transparent)]
                dark:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
                style={{ border: "2px solid var(--accent)", boxShadow: "0 0 12px var(--accent)", backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              >
                <div className="text-sm font-semibold text-white">Parishes in Deanery</div>
                <div className="text-3xl font-black mt-1 text-white">{deanery.numParishesInDeanery ?? 0}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Parishes Dropdown - Formatted like Diocese */}
        <CollapsibleSection title="Parishes and Catholic Communities" count={parishList.length} id={`deanery-${slug}-parishesdropdown`}>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-2">
            {parishList.map((p, i) => (
              <li key={i} className="text-sm font-medium">
                {p.slug ? (
                  <Link to={`/parish/${p.slug}`} className="hover:text-blue-300 transition-colors">
                    → {p.name}
                  </Link>
                ) : (
                  <span className="opacity-70">→ {p.name}</span>
                )}
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Families Dropdown - Formatted like Diocese */}
        {familyList.length > 0 && (
          <CollapsibleSection title="Family of Parishes" count={familyList.length} id={`deanery-${slug}-familiesdropdown`}>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {familyList.map((f, i) => (
                <li key={i} className="text-sm font-medium">
                  {f.slug ? (
                    <Link to={`/family/${f.slug}`} className="hover:text-blue-300 transition-colors">
                      → {f.name}
                    </Link>
                  ) : (
                    <span className="opacity-70">→ {f.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Nationalities Dropdown - Formatted like Diocese */}
        {nationalitiesList.length > 0 && (
          <CollapsibleSection title="Nationalities Represented" count={nationalitiesList.length} id={`deanery-${slug}-nationalitiesList`}>
            <div className="flex flex-wrap gap-2 mt-2">
              {nationalitiesList.map((n, i) => (
                <span key={i} className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/5 uppercase tracking-wider">
                  {n}
                </span>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Photos Dropdown - Formatted like Diocese */}
        {photos.length > 0 && (
          <CollapsibleSection title="Photos" count={photos.length} id={`deanery-${slug}-photos`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {photos.map((u, i) => (
                <button key={i} onClick={() => openLightbox(i, photos)} className="rounded-xl overflow-hidden h-32 bg-black/20 hover:opacity-80 transition">
                  <img src={u} alt={deanery.deaneryName} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
          <Link to="/" className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition font-bold text-sm">
            ← Back to Map
          </Link>
          <Link to="/contact" className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition font-bold text-sm">
            Report Error
          </Link>
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/about" className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition font-bold text-sm">
            About Catholic Parishes
          </Link>
        </div>
      </main>

      <Lightbox />
    </div>
  );
}