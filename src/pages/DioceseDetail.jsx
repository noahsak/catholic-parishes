import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import externalLinkIcon from "../assets/external_link_white.png";
import { useLightbox, Lightbox } from "../hooks/lightbox";
import { usePageMeta } from "../hooks/usePageMeta"; // Import the hook
import CollapsibleSection from "../hooks/CollapsibleSection"; 

export default function DioceseDetail() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { openLightbox } = useLightbox();

  const [diocese, setDiocese] = useState(undefined);
  const [parishes, setParishes] = useState([]); 
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // --- NEW: SEO & META DATA HOOK ---
  const firstPhoto = useMemo(() => {
    return diocese?.diocesePhotos ? diocese.diocesePhotos.split(/;|\n/)[0].trim() : null;
  }, [diocese]);

  usePageMeta(
    diocese?.dioceseName,
    diocese ? `Information for the ${diocese.dioceseName}. Bishop: ${diocese.bishop}. View mass statistics, parishes, and deaneries.` : null,
    firstPhoto
  );

  // Dark Mode detection
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Load Data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const dioRes = await fetch("/data/dioceses.json");
        const parRes = await fetch("/data/parishes.json");
        if (!dioRes.ok || !parRes.ok) throw new Error("File load error");

        const dioList = await dioRes.json();
        const parishList = await parRes.json();
        if (!mounted) return;

        setParishes(parishList);

        const found = dioList.find((d) => {
          const generatedSlug = String(d.dioceseSlug || d.dioceseName || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          return generatedSlug === slug;
        });

        setDiocese(found ?? null);

        // --- JSON-LD remains here for Diocese-specific Schema ---
        if (found && mounted) {
          const schemaId = "diocese-ld-json";
          let scriptTag = document.getElementById(schemaId);
          if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.id = schemaId;
            scriptTag.type = "application/ld+json";
            document.head.appendChild(scriptTag);
          }
          const schemaData = {
            "@context": "https://schema.org",
            "@type": "GovernmentOrganization", 
            "name": found.dioceseName,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": found.dioceseAddress || ""
            },
            "url": window.location.href,
            "description": `Roman Catholic ${found.dioceseName}.`
          };
          scriptTag.text = JSON.stringify(schemaData);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setDiocese(null);
      }
    };

    load();
    return () => (mounted = false);
  }, [slug]);

  const photos = useMemo(() => {
    if (!diocese) return [];
    return String(diocese.diocesePhotos || "").split(/;|\n/).map((p) => p.trim()).filter(Boolean);
  }, [diocese]);

  const banner = useMemo(() => {
      if (!diocese || !parishes.length) return null;
      let b = null;
      if (diocese.dioceseCathedralSlug) {
        const cathedralParish = parishes.find((p) => p.parishSlug === diocese.dioceseCathedralSlug);
        if (cathedralParish?.parishPhotos) {
          b = cathedralParish.parishPhotos.split(";")[0].trim();
        }
      }
      if (!b && photos.length > 0) b = photos[0];
      return b;
    }, [diocese, parishes, photos]);

  const listFromRow = (namesStr, slugsStr) => {
    const names = String(namesStr || "").split(";").map((s) => s.trim()).filter(Boolean);
    const slugs = String(slugsStr || "").split(";").map((s) => s.trim());
    return names.map((name, i) => {
      const slugValue = slugs[i] || null;
      let city = null;
      if (slugValue) {
        const fullParish = parishes.find((p) => p.parishSlug === slugValue);
        if (fullParish?.parishCityCounty) city = fullParish.parishCityCounty;
      }
      return { name, slug: slugValue, city };
    });
  };

  // Show on Map button handler
  const handleShowOnMap = () => {
    if (diocese.dioLat && diocese.dioLong) {
      navigate("/", { 
        state: { 
          jumpTo: [diocese.dioLat, diocese.dioLong],
          zoom: 15 // Slightly zoomed out compared to a Parish
        } 
      });
    }
  };

  if (diocese === undefined) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (diocese === null) return <div className="min-h-screen flex items-center justify-center text-center">Diocese not found.<br /><Link to="/" className="underline">Back to Map</Link></div>;

  const parishListFromRow = listFromRow(diocese?.parishesListInDioceseByAlpha, diocese?.parishesSlugListInDioceseByAlpha);
  const familiesListFromRow = listFromRow(diocese?.familiesListByDioceseAlpha, diocese?.familiesListByDioceseAlphaSlug);
  const deaneriesListFromRow = listFromRow(diocese?.deaneriesListInDioceseByAlpha, diocese?.deaneriesListInDioceseByAlphaSlug);
  const uniqueFamilies = Array.from(new Map(familiesListFromRow.map(f => [f.slug, f])).values());

  return (
    <div className="min-h-screen relative flex flex-col text-white">
      {/* Background Section */}
      <div className="fixed inset-0 bg-center bg-cover"
        style={{ backgroundImage: banner ? `url('${banner}')` : "none", backgroundColor: banner ? undefined : "#00000040" }} />
      <div className="fixed inset-0 bg-black/50" />

      {/* Hero Header */}
      <div className="relative h-64 md:h-80 flex items-end">
        <div className="w-full p-6">
          <div className="max-w-5xl mx-auto flex flex-col">
            <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {diocese.dioceseName}
            </h1>
            {diocese.dioceseAddress && (
              <p className="text-sm md:text-lg text-white mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center gap-2 font-medium opacity-90">
                <span>{diocese.dioceseAddress}</span>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(diocese.dioceseAddress)}`} target="_blank" rel="noreferrer">
                  <img src={externalLinkIcon} className="w-4 h-4" alt="Map" />
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <main className="relative max-w-5xl mx-4 md:mx-auto p-6 space-y-10 bg-[color-mix(in_srgb,var(--accent)_50%,transparent)] backdrop-blur-xl rounded-2xl mt-6 mb-20 shadow-2xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} 
          className="text-sm font-bold opacity-70 hover:opacity-100 transition"
        >
          ← Back
        </button>
        
        <button 
          onClick={handleShowOnMap}
          className="text-sm bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:bg-white/10 px-4 py-2 rounded-lg border border-white/20 transition flex items-center gap-2 font-bold"
        >
          Show on Map
        </button>
      </div>

      <section>
        <h2 className="text-2xl font-black mb-6 border-b border-white/20 pb-2">Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Diocese Details */}
          <div className="space-y-3">
            {diocese.dioceseCathedral && (
              <div><strong>Cathedral:</strong> <Link to={`/parish/${diocese.dioceseCathedralSlug}`} className="text-blue-300">{diocese.dioceseCathedral}</Link></div>
            )}
            {diocese.dioceseProvinceState && <div><strong>Province:</strong> {diocese.dioceseProvinceState}</div>}
            {diocese.dioceseCountry && <div><strong>Country:</strong> {diocese.dioceseCountry}</div>}
            {diocese.DioceseEstablishedDate && <div><strong>Established:</strong> {diocese.DioceseEstablishedDate}</div>}
            {diocese.dioceseUrl && (
              <div><strong>Website:</strong> <a href={diocese.dioceseUrl} target="_blank" rel="noreferrer" className="text-blue-300">Visit</a></div>
            )}
          </div>

          {/* Column 2: Personnel */}
          <div className="space-y-3">
            {diocese.bishop && <div><strong>Bishop:</strong> {diocese.bishop}</div>}
            {diocese.bishopPhone && <div><strong>Bishop Phone:</strong> {diocese.bishopPhone}</div>}
            {diocese.bishopEmail && (
              <div>
                <strong>Bishop Email:</strong>{" "}
                <a href={`mailto:${diocese.bishopEmail}`} className="text-blue-300 hover:text-blue-200 transition-colors">
                  {diocese.bishopEmail}
                </a>
              </div>
            )}
            {diocese.vicarGeneral && <div><strong>Vicar General:</strong> {diocese.vicarGeneral}</div>}
            {diocese.vicarGeneralPhone && <div><strong>Vicar General Phone:</strong> {diocese.vicarGeneralPhone}</div>}
            {diocese.vicarGeneralEmail && (
              <div><strong>Vicar General Email:</strong>{" "}
                <a href={`mailto:${diocese.vicarGeneralEmail}`} className="underline text-blue-300 hover:text-blue-200 transition-colors">
                  {diocese.vicarGeneralEmail}
                </a>
              </div>
            )}
          </div>

          {/* Column 3: Visuals */}
          <div className="flex flex-col items-center">
            {diocese.bishopPhoto && (
              <div className="flex flex-col items-center">
                <img 
                  src={diocese.bishopPhoto} 
                  alt={diocese.bishop || "Bishop"} 
                  className="w-32 md:w-40 rounded-xl shadow-2xl border-2 border-white/20" 
                  style={{ boxShadow: "0 0 30px rgba(0,0,0,0.5)" }} 
                />
                {diocese.bishop && (
                  <p className="text-[10px] uppercase font-black tracking-widest mt-3 opacity-60">{diocese.bishop}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

        <section>
          <h2 className="text-2xl font-black mb-6 border-b border-white/20 pb-2">Mass Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Total Weekly", diocese.numMassesPerWeekInDiocese],
              ["Sunday Masses", diocese.numSundayMassInDiocese],
              ["Daily Masses", diocese.numDailyMassesPerWeekInDiocese],
              ["Parishes", diocese.numParishesInDiocese]
            ].map(([label, value], i) => (
              <div key={i} className="p-5 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] border-white/10">
                <div className="text-xs uppercase font-black tracking-widest opacity-50 mb-1">{label}</div>
                <div className="text-3xl font-black">{value || "0"}</div>
              </div>
            ))}
          </div>
        </section>

        <CollapsibleSection title="Parishes and Catholic Communities" count={parishListFromRow.length} id={`diocese-${slug}-parishes`}>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-2">
            {parishListFromRow.map((p, i) => (
              <li key={i} className="text-sm font-medium">
                {p.slug ? <Link to={`/parish/${p.slug}`} className="hover:text-blue-300 transition">→ {p.name}{p.city && <span className="opacity-50">, {p.city}</span>}</Link> : `• ${p.name}`}
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {uniqueFamilies.length > 0 && (
          <CollapsibleSection title="Family of Parishes" count={uniqueFamilies.length} id={`diocese-${slug}-families`}>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {uniqueFamilies.map((f) => (
                <li key={f.slug} className="text-sm font-medium"><Link to={`/family/${f.slug}`} className="hover:text-blue-300 transition">→ {f.name}</Link></li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
        
        {deaneriesListFromRow.length > 0 && (
          <CollapsibleSection title="Deaneries" count={deaneriesListFromRow.length} id={`diocese-${slug}-deaneries`}>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {deaneriesListFromRow.map((d, i) => (
                <li key={i} className="text-sm font-medium">{d.slug ? <Link to={`/deanery/${d.slug}`} className="hover:text-blue-300 transition">→ {d.name}</Link> : `• ${d.name}`}</li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {photos.length > 0 && (
          <CollapsibleSection title="Photos" count={photos.length} id={`diocese-${slug}-photos`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {photos.map((u, i) => (
                <button key={i} onClick={() => openLightbox(i, photos)} className="rounded-xl overflow-hidden h-32 bg-black/20 hover:opacity-80 transition">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </CollapsibleSection>
        )}

        <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
          <Link to="/" className="text-sm bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:bg-white/10 px-4 py-2 rounded-lg border border-white/20 transition flex items-center gap-2 font-bold">
            ← Back to Map
          </Link>
          <Link to="/contact" className="text-sm bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:bg-white/10 px-4 py-2 rounded-lg border border-white/20 transition flex items-center gap-2 font-bold">
            Report Error
          </Link>
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/about" className="text-sm bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:bg-white/10 px-4 py-2 rounded-lg border border-white/20 transition flex items-center gap-2 font-bold">
            About Catholic Parishes
          </Link>
        </div>
      </main>

      <Lightbox />
    </div>
  );
}