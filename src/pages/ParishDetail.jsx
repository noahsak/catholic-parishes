import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

// Standardized Imports
import externalLinkIcon from "@/assets/external_link_white.png";
import { useLightbox, Lightbox } from "@/hooks/lightbox.jsx";
import { useLiturgical } from "@/context/LiturgicalContext.jsx";
import { usePageMeta } from "@/hooks/usePageMeta.jsx";
import { accentColors, darkAccentColors } from "@/liturgicalColors.jsx";

export default function ParishDetail() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [parish, setParish] = useState(undefined);
  const { openLightbox } = useLightbox();
  const { colorKey } = useLiturgical();

  // --- NEW: SEO & META DATA HOOK ---
  // We pass the dynamic values. If parish is null/undefined, the hook uses defaults.
  usePageMeta(
    parish?.parishName, 
    parish ? `Find Sunday and Daily Mass, confession, and adoration times for ${parish.parishName} at ${parish.parishAddress}.` : null,
    parish?.photos?.[0]
  );

  const iconPaths = {
    DEFAULT: { light: "/icons/church-light.png", dark: "/icons/church-dark.png" },
    PURPLE: { light: "/icons/church-purple-light.png", dark: "/icons/church-purple-dark.png" },
    GREEN: { light: "/icons/church-green-light.png", dark: "/icons/church-green-dark.png" },
    WHITE: { light: "/icons/church-white-light.png", dark: "/icons/church-white-dark.png" },
    RED: { light: "/icons/church-red-light.png", dark: "/icons/church-red-dark.png" },
  };

  const [isDark, setIsDark] = useState(window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (ev) => setIsDark(ev.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const accentColor = useMemo(() => (
    isDark ? (darkAccentColors[colorKey] || "#800080") : (accentColors[colorKey] || "#800080")
  ), [colorKey, isDark]);

  useEffect(() => {
    let alive = true;
    fetch(`/data/parishes.json?v=${new Date().getTime()}`)
      .then((r) => r.json())
      .then((list) => {
        if (!alive || !Array.isArray(list)) return;
        const found = list.find((p) => p.parishSlug === slug);
        if (!found) { setParish(null); return; }

        const normalizePhotos = (raw) => {
          if (!raw) return [];
          if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean);
          return String(raw).replace(/\\/g, "").split(/;|,|\||\r?\n/).map(s => s.trim()).filter(Boolean);
        };

        const normalizeTimes = (raw) => {
          if (!raw) return [];
          const items = Array.isArray(raw) ? raw : String(raw).replace(/\\/g, "").trim().split(/;|\r?\n/);
          return items.map(s => String(s).trim()).filter(Boolean).map(t => {
            const match = t.match(/^(.*)\s*\(([^)]+)\)\s*$/);
            return match ? { text: match[1].trim(), language: match[2].trim() } : { text: t };
          });
        };

        const normalizeList = (raw) => {
          if (!raw) return [];
          if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean);
          return String(raw).replace(/\\/g, "").split(/;|\r?\n|\|/).map(s => s.trim()).filter(Boolean);
        };

        const pData = {
          ...found,
          photos: normalizePhotos(found.parishPhotos || found.parishPhoto || found.parish_photos_url || ""),
          sundayMassTimes: normalizeTimes(found.sundayMassTimes || found.sunday_mass_times || ""),
          dailyMassTimes: normalizeTimes(found.dailyMassTimes || found.daily_mass_times || ""),
          confessionTimes: normalizeTimes(found.confessionTimes || ""),
          adorationTimes: normalizeTimes(found.adorationTimes || ""),
          benedictionTimes: normalizeTimes(found.benedictionTimes || ""),
          devotions: normalizeList(found.devotions || ""),
          notesList: normalizeList(found.parishesNotes || found.parishNotes || ""),
        };

        setParish(pData);

        // --- JSON-LD remains here as it's a specific data object update ---
        if (alive) {
          const schemaId = "parish-ld-json";
          let scriptTag = document.getElementById(schemaId);
          if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.id = schemaId;
            scriptTag.type = "application/ld+json";
            document.head.appendChild(scriptTag);
          }
          
          const schemaData = {
            "@context": "https://schema.org",
            "@type": "Church",
            "name": pData.parishName,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": pData.parishAddress
            },
            "url": window.location.href,
            "telephone": pData.parishPhone || ""
          };
          scriptTag.text = JSON.stringify(schemaData);
        }
      })
      .catch(() => alive && setParish(null));
    
    return () => { 
      alive = false; 
    };
  }, [slug]);

  const handleShowOnMap = () => {
    if (parish.lat && parish.long) {
      navigate("/", { 
        state: { 
          jumpTo: [parish.lat, parish.long],
          zoom: 15
        } 
      });
    }
  };

  const handlePrint = () => {
    const theme = isDark ? "dark" : "light";
    const currentIconPath = (iconPaths[colorKey] && iconPaths[colorKey][theme]) 
      ? iconPaths[colorKey][theme] 
      : (iconPaths.DEFAULT ? iconPaths.DEFAULT[theme] : "/logo.png");

    const absoluteIconUrl = currentIconPath.startsWith('http') 
      ? currentIconPath 
      : `${window.location.origin}${currentIconPath}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups to print the schedule.");
      return;
    }

    const sections = [
      { label: "Sunday Masses", data: parish.sundayMassTimes },
      { label: "Daily Masses", data: parish.dailyMassTimes },
      { label: "Confession", data: parish.confessionTimes },
      { label: "Adoration", data: parish.adorationTimes },
      { label: "Benediction", data: parish.benedictionTimes },
    ].filter(s => s.data && s.data.length > 0);

    const scheduleHtml = sections.map(s => `
      <div class="section-box">
        <h3 class="section-title">${s.label}</h3>
        <ul class="time-list">
          ${s.data.map(m => `
            <li>
              <span class="time-text">${m.text}</span>
              ${m.language ? `<span class="lang-tag">${m.language}</span>` : ""}
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${parish.parishName} Mass Times & Info</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #1a1a1a; background: white; }
            .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 50px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .brand-block { display: flex; align-items: center; gap: 12px; }
            .brand-icon { width: 50px; height: 50px; object-fit: contain; }
            .brand-name { font-weight: 900; text-transform: uppercase; font-size: 12px; color: #000; line-height: 1.1; }
            .parish-info { text-align: right; }
            h1 { font-weight: 900; font-size: 32px; margin: 0; letter-spacing: -0.02em; }
            .address { font-size: 16px; color: #444; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
            .section-box { break-inside: avoid; margin-bottom: 20px; }
            .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 12px; }
            .time-list { list-style: none; padding: 0; margin: 0; }
            .time-list li { font-size: 15px; font-weight: 700; padding: 6px 0; border-bottom: 1px solid #f9f9f9; display: flex; justify-content: space-between; }
            .lang-tag { font-size: 9px; background: #eee; padding: 2px 6px; border-radius: 4px; color: #333; }
            .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 15px; font-size: 10px; color: #aaa; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand-block">
              <img src="${absoluteIconUrl}" class="brand-icon" onerror="this.style.display='none'" />
              <div class="brand-name">Catholic<br/>Parishes.org</div>
            </div>
            <div class="parish-info">
              <h1>${parish.parishName}</h1>
              <div class="address">${parish.parishAddress}</div>
            </div>
          </div>
          <div class="grid">${scheduleHtml}</div>
          ${parish.notesList?.length > 0 ? `<div style="margin-top:30px; font-size:13px;"><strong>Notes:</strong><ul style="margin-top:5px;">${parish.notesList.map(n => `<li>${n}</li>`).join('')}</ul></div>` : ''}
          <div class="footer">catholicparishes.org • Generated ${new Date().toLocaleDateString()}</div>
          <script>
            window.onload = function() {
              setTimeout(() => { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (parish === undefined) return <div className="min-h-screen flex items-center justify-center text-white bg-[#0f0f0f]">Loading…</div>;
  if (parish === null) return <div className="min-h-screen flex items-center justify-center text-white">Parish not found.</div>;

  const banner = parish.photos?.[0] || null;

  return (
    <div className="min-h-screen relative flex flex-col text-white" style={{ "--accent": accentColor }}>
      {/* BACKGROUND BANNER */}
      <div className="fixed inset-0 z-0">
        {banner ? (
          <div className="w-full h-full bg-center bg-cover" style={{ backgroundImage: `url('${banner}')` }} />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, var(--accent) 0%, rgba(0,0,0,0.8) 100%)` }} />
        )}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* HERO */}
      <div className="h-64 md:h-80 flex items-end z-10 px-6">
        <div className="w-full max-w-4xl mx-auto pb-6">
          <h1 className="text-4xl md:text-5xl font-black drop-shadow-2xl">{parish.parishName}</h1>
          <p className="text-sm mt-2 flex items-center gap-2 opacity-90 drop-shadow-md">
            {parish.parishAddress}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parish.parishName + " " + parish.parishAddress)}`} target="_blank" rel="noreferrer">
               <img src={externalLinkIcon} alt="Maps" className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>

      <main className="relative z-10 max-w-4xl mx-4 md:mx-auto p-6 space-y-8 bg-[color-mix(in_srgb,var(--accent)_50%,transparent)] backdrop-blur-md rounded-2xl mt-6 mb-12 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-4">
          {/* Back Button - Always stays top-left */}
          <div className="flex justify-start w-full md:w-auto">
            <button 
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} 
              className="text-sm hover:underline opacity-80 flex items-center gap-1 whitespace-nowrap"
            >
              ← Back
            </button>
          </div>

          {/* Action Buttons - Centered on mobile, Right-aligned on desktop */}
          <div className="flex items-center justify-center md:justify-end gap-2 flex-nowrap w-full md:w-auto">
            <button 
              onClick={handleShowOnMap}
              className="text-[12px] sm:text-sm bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:bg-white/10 px-3 sm:px-4 py-2 rounded-lg border border-white/20 transition flex items-center gap-2 font-bold whitespace-nowrap"
            >
              Show Parish on Map
            </button>
            
            <button 
              onClick={handlePrint}
              className="text-[12px] sm:text-sm bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:bg-white/10 px-3 sm:px-4 py-2 rounded-lg border border-white/20 transition flex items-center gap-2 font-bold whitespace-nowrap"
            >
              Print Page
            </button>
          </div>
        </div>

        {/* Information Section */}
        <section>
          <h2 className="text-xl font-semibold border-b border-white/20 pb-1 mb-4">Information</h2>
          <div className="space-y-2 text-sm md:text-base">
            {parish.shareBuildingName && (
              <div>
                <strong>Shares Building with:</strong>{" "}
                {parish.shareBuildingName.split(";").map((name, i) => {
                  const slugs = (parish.shareBuildingSlug || "").split(";");
                  const s = slugs[i]?.trim();
                  return (
                    <React.Fragment key={i}>
                      {s ? <Link to={`/parish/${s}`} className="text-blue-300">{name.trim()}</Link> : name.trim()}
                      {i < parish.shareBuildingName.split(";").length - 1 ? ", " : ""}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
            {parish.parishDiocese && (
              <div>
                <strong>Diocese:</strong> {parish.parishDioceseSlug ? <Link to={`/diocese/${parish.parishDioceseSlug}`} className="text-blue-300">{parish.parishDiocese}</Link> : parish.parishDiocese}
              </div>
            )}
            {parish.parishDeanery && (
              <div>
                <strong>Deanery:</strong> {parish.parishDeanerySlug ? <Link to={`/deanery/${parish.parishDeanerySlug}`} className="text-blue-300">{parish.parishDeanery}</Link> : parish.parishDeanery}
              </div>
            )}
            {parish.parishFamily && (
              <div>
                <strong>Family of Parishes:</strong> {parish.parishFamilySlug ? <Link to={`/family/${parish.parishFamilySlug}`} className="text-blue-300">{parish.parishFamily}</Link> : parish.parishFamily}
              </div>
            )}
            {parish.website && <div><strong>Website:</strong> <a href={parish.website} target="_blank" rel="noreferrer" className="text-blue-300">Visit</a></div>}
            {parish.parishPhone && <div><strong>Phone:</strong> {parish.parishPhone}</div>}
            {parish.parishEmail && <div><strong>Email:</strong> <a href={`mailto:${parish.parishEmail}`} className="text-blue-300">{parish.parishEmail}</a></div>}
            {parish.parishNationality && <div><strong>Nationality:</strong> {parish.parishNationality}</div>}
          </div>
        </section>

        {/* Mass & Services Section */}
        <section>
          <h2 className="text-xl font-semibold border-b border-white/20 pb-1 mb-6">Mass & Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Sunday Masses", data: parish.sundayMassTimes },
              { label: "Daily Masses", data: parish.dailyMassTimes },
              { label: "Confession", data: parish.confessionTimes },
              { label: "Adoration", data: parish.adorationTimes },
              { label: "Benediction", data: parish.benedictionTimes },
              { label: "Devotions", data: parish.devotions?.map(d => ({ text: d })) }
            ].map((section, idx) => section.data?.length > 0 && (
              <div key={idx} className="bg-black/20 p-4 rounded-xl border border-white/5 h-full">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-3 border-b border-white/10 pb-1">{section.label}</h3>
                <ul className="space-y-2 text-sm md:text-base">
                  {section.data.map((m, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-300 shrink-0" />
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.text}</span>
                        {m.language && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight bg-white/10 border border-white/20">
                            {m.language}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Notes Section */}
        {parish.notesList?.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold border-b border-white/20 pb-1 mb-3">Notes</h2>
            <div className="bg-white/5 p-4 rounded-xl italic text-sm md:text-base">
              <ul className="list-disc ml-5 space-y-1">
                {parish.notesList.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          </section>
        )}

        {/* Photos Section */}
        {parish.photos?.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold border-b border-white/20 pb-1 mb-4">Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {parish.photos.map((url, i) => (
                <button key={i} onClick={() => openLightbox(i, parish.photos)} className="block w-full h-40 overflow-hidden rounded-lg border border-white/10 hover:border-white/40 transition group">
                  <img src={url} alt="Parish" className="w-full h-40 object-cover group-hover:scale-110 transition duration-500" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-6 border-t border-white/10 gap-8">
          <Link 
            to="/" 
            className="text-sm bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:bg-white/10 px-4 py-2 rounded-lg border border-white/20 transition flex items-center gap-2 font-bold"
          >
            ← Back to Map
          </Link>

          <div className="flex flex-col items-center md:items-end space-y-4">
            <div className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40">
              Data Last Updated: {parish.parishesLastUpdate ? new Date(parish.parishesLastUpdate).toLocaleString("en-US", { month: "long", year: "numeric" }) : "Recent"}
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/contact" className="text-sm bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:bg-white/10 px-4 py-2 rounded-lg border border-white/20 transition flex items-center gap-2 font-bold whitespace-nowrap">Report Error</Link>
              <Link to="/about" className="text-sm bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] hover:bg-white/10 px-4 py-2 rounded-lg border border-white/20 transition flex items-center gap-2 font-bold whitespace-nowrap">About</Link>
            </div>
          </div>
        </div>
      </main>
      <Lightbox />
    </div>
  );
}