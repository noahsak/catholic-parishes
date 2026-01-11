import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLightbox, Lightbox } from "@/hooks/lightbox.jsx";
import { usePageMeta } from "@/hooks/usePageMeta.jsx";

export default function FamilyDetail() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { openLightbox } = useLightbox();
  const [family, setFamily] = useState(undefined);

  // 1. --- SEO & META DATA HOOK ---
  // Memoize these so the hook only triggers when data actually changes
  const banner = useMemo(() => {
    const photos = String(family?.familyPhotos || "").split(/;|\n/).map(p => p.trim()).filter(Boolean);
    return photos.length > 0 ? photos[0] : null;
  }, [family]);

  usePageMeta(
    family ? family.familyName : null,
    family ? `Find the parishes, Mass statistics, and contact information for the ${family.familyName} in ${family.familyDeanery}, ${family.familyProvince}, ${family.familyCountry}.` : null,
    banner
  );

  // 2. 🔍 Fetch Data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/data/families.json");
        if (!res.ok) throw new Error("Failed to load families.json");
        const list = await res.json();
        
        if (!mounted) return;

        const found = list.find((f) => {
          const generatedSlug = String(f.familySlug || f.familyName || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          return generatedSlug === slug;
        });

        setFamily(found ?? null);
      } catch (err) {
        console.error("Error loading families:", err);
        if (mounted) setFamily(null);
      }
    };

    load();
    return () => { mounted = false; };
  }, [slug]);

  // --- JSON-LD remains here for Family-specific Schema ---
  useEffect(() => {
    if (!family) return;
    const schemaId = "family-jsonld";
    let script = document.getElementById(schemaId);
    if (!script) {
      script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Church",
      name: family.familyName,
      address: {
          "@type": "PostalAddress",
          addressRegion: family.familyProvince,
          addressCountry: family.familyCountry,
      },
      url: window.location.href
    });
    return () => { if (script) script.remove(); };
  }, [family]);

  if (family === undefined)
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  
  if (family === null)
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>Family not found.<br /><Link to="/" className="underline">Back to Map</Link></div>
      </div>
    );

  // --- Normalization ---
  const photos = String(family.familyPhotos || "").split(/;|\n/).map(p => p.trim()).filter(Boolean);
  // NOTE: 'banner' is already declared via useMemo at the top, so we don't declare it again here.

  const parishNames = String(family.parishesListByFamilyAlpha || "").split(/;|\n/).map(p => p.trim()).filter(Boolean);
  const parishSlugs = String(family.parishesListByFamilyAlphaSlug || "").split(/;|\n/).map(p => p.trim()).filter(Boolean);
  const parishList = parishNames.map((name, idx) => ({
    name,
    slug: parishSlugs[idx] || null,
  }));

  return (
    <div className="min-h-screen relative flex flex-col text-white">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        {banner ? (
          <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url('${banner}')` }} />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, var(--accent) 0%, rgba(0,0,0,0.25) 100%)` }} />
        )}
        <div className="absolute inset-0 bg-black/50" />
      </div>
      
      {/* Title Header */}
      <div className="relative z-10 h-64 md:h-80 flex items-end">
        <div className="w-full p-6"> {/* Removed bg-gradient and black/60 classes */}
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {family.familyName}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <main className="relative z-10 max-w-4xl mx-4 md:mx-auto p-6 space-y-8 my-8 bg-[color-mix(in_srgb,var(--accent)_50%,transparent)] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
        
        <button onClick={() => navigate(-1)} className="text-sm font-medium hover:underline opacity-80">← Back</button>

        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold border-b border-white/20 pb-1 mb-3">Information</h2>
            <div className="space-y-2 text-sm md:text-base">
              <div><strong>Diocese:</strong> <Link to={`/diocese/${family.familyDioceseSlug}`} className="text-blue-300">{family.familyDiocese}</Link></div>
              <div><strong>Deanery:</strong> <Link to={`/deanery/${family.familyDeanerySlug}`} className="text-blue-300">{family.familyDeanery}</Link></div>
              {family.familyWebsite && (
                <div><strong>Website:</strong> <a href={family.familyWebsite} target="_blank" rel="noreferrer" className="text-blue-300">Visit</a></div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold border-b border-white/20 pb-1 mb-3">Parishes and Catholic Communities — {family.numParishesInFamily ?? parishList.length}</h2>
            <ul className="grid grid-cols-1 gap-1">
              {parishList.map((p, i) => (
                <li key={i}>
                  {p.slug ? (
                    <Link to={`/parish/${p.slug}`} className="text-blue-300 hover:text-white transition-colors">→ {p.name}</Link>
                  ) : (
                    <span className="opacity-70">→ {p.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mass Statistics */}
        <section>
          <h2 className="text-xl font-bold border-b border-white/20 pb-1 mb-4">Weekly Mass Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Sunday", family.numSundayMassInFamily],
              ["Sat Vigil", family.numSaturdayVigilMassInFamily],
              ["Weekday", family.numDailyMassesPerWeekInFamily],
              ["Total", family.numMassesPerWeekInFamily],
            ].map(([label, value], idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] border-white/10">
                <div className="text-xs uppercase font-black tracking-widest opacity-50 mb-1">{label}</div>
                <div className="text-3xl font-black">{value ?? 0}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Nationalities */}
        {family.familyNationalities && (
          <section>
            <h2 className="text-xl font-bold border-b border-white/20 pb-1 mb-3">Community Nationalities</h2>
            <div className="flex flex-wrap gap-2">
              {String(family.familyNationalities).split(/[,;|\n]/).map(n => n.trim()).filter(Boolean).map((n, i) => (
                <span key={i} className="bg-white/10 px-3 py-1 rounded-full text-xs capitalize">{n}</span>
              ))}
            </div>
          </section>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <section>
            <h2 className="text-xl font-bold border-b border-white/20 pb-1 mb-4">Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((u, i) => (
                <button key={i} onClick={() => openLightbox(i, photos)} className="group overflow-hidden rounded-xl bg-black">
                  <img src={u} alt="Family photo" className="w-full h-40 object-cover group-hover:scale-110 transition duration-500 opacity-90 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </section>
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