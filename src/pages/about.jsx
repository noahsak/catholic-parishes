// src/pages/About.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiturgical } from "@/context/LiturgicalContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function About() {
  const navigate = useNavigate();
  const banner = "https://images.catholicparishes.org/canada/ontario/diocese_of_london/windsor/olph1.webp";
  const email = "contact@catholicparishes.org";

  // 1. Pull shared data from Context
  const { colorKey, name, season, loading } = useLiturgical();

  // 2. SEO & Metadata via custom hook
  usePageMeta(
    "About the Project",
    "Learn about the mission of CatholicParishes.org.",
    banner
  );

  // 3. Structured Data (JSON-LD) for AboutPage
  useEffect(() => {
    const scriptId = "about-jsonld";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "mainEntity": {
        "@type": "Organization",
        "name": "Catholic Parishes",
        "description": "A project to map Catholic sacraments.",
        "knowsAbout": ["Catholicism", "Liturgical Calendar", "Sacraments"]
      },
      "accountablePerson": {
        "@type": "Person",
        "name": "Noah Sak"
      }
    });
    return () => { if (script) script.remove(); };
  }, []);
  
  // Format "PURPLE" -> "Purple"
  const displayColor = colorKey 
    ? colorKey.charAt(0) + colorKey.slice(1).toLowerCase() 
    : "Loading...";

  return (
    <div className="min-h-screen relative flex flex-col text-white">
      {/* Background Layer */}
      <div
        className="fixed inset-0 bg-center bg-cover transition-all duration-500 z-0"
        style={{ backgroundImage: `url('${banner}')` }}
      />
      {/* Dimmer overlay to ensure text readability */}
      <div className="fixed inset-0 bg-black/50 z-0" />

      {/* Header */}
      <div className="h-64 md:h-80 flex items-end relative z-10">
        <div className="w-full px-4 md:px-6"> {/* Updated px-4 here */}
          <div className="max-w-4xl mx-auto"> {/* Changed to max-w-4xl to match the main box */}
            <h1 className="text-4xl md:text-5xl font-black drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              About Catholic Parishes
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
        <main
          className="
            relative z-10 max-w-4xl mx-4 md:mx-auto p-6 space-y-8
            bg-[color-mix(in_srgb,var(--accent)_40%,transparent)]
            dark:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]
            backdrop-blur-md rounded-2xl mt-6 mb-20 shadow-2xl border border-white/10
          "
        >
        <button
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}
          className="text-sm font-bold opacity-70 hover:opacity-100 transition flex items-center gap-2"
        >
          ← Back
        </button>

        {/* Mission Section */}
        <section>
          <p className="mt-2 text-white leading-relaxed">
            Catholic Parishes is a project created by myself, Noah, a University student in Ontario, Canada. My goal for this website is to make it easier for people to participate in the sacraments and find the churches where they take place, whether at home or traveling.
            <br /><br />
            Currently, only the parishes in the Diocese of London have been inputted into the website's database, but I am slowly working on adding more. Eventually, I hope to include parishes from across the world.
            <br /><br />
            If you would like to contribute in any way (providing photos, data, website development, etc.), please reach out to me at {" "}
            <a
              href={`mailto:${email}`}
              className="text-blue-300 hover:text-blue-400 font-bold transition-colors"
            >
              {email}
            </a>.
            Thank you and God bless!
          </p>
        </section>

        {/* Why Liturgical Colour? */}
        <section>
          <h2 className="text-xl font-black mb-4 uppercase tracking-tight">Why <strong>{displayColor}</strong>?</h2>
          
          <div
            className="p-6 rounded-xl shadow text-white transition-all duration-500"
            style={{
              border: "2px solid var(--accent)",
              boxShadow: "0 0 12px var(--accent)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest opacity-60">
                  Today’s Celebration
                </h3>
                <p className="text-lg font-bold mt-1">
                  {loading ? "Loading..." : name}
                </p>
              </div>
              <div className="md:border-l md:border-white/20 md:pl-6">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-60">
                  Liturgical Season
                </h3>
                <p className="text-lg font-bold mt-1">
                  {loading ? "Loading..." : season}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-white leading-relaxed">
            As you can see, the site's accent colour is currently{" "}
            <span className="font-bold capitalize">{displayColor}</span>.
            <br /><br />
            The accent colour of this site changes according to the liturgical calendar of the Catholic Church. My goal is, for the most part, to have the colour match the vestments worn by the priest on any given day. 
            The logic is powered by the open-source {" "}
            <a 
              href="https://romcal.js.org" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline text-blue-300 hover:text-blue-400 font-bold"
            >
              romcal
            </a> database.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="text-xl font-black uppercase tracking-tight">Contact</h2>
          <p className="text-white leading-relaxed">
            Corrections, suggestions, or parish updates are always welcome. I am definitely not perfect, and I truly appreciate any help in making this project more accurate and useful.
          </p>

          <div className="flex justify-center pt-2">
            <Link
              to="/contact"
              className="px-8 py-3 rounded-lg text-white font-bold hover:bg-white/20 transition shadow-lg border border-white/10"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
            >
              Suggestions / Corrections
            </Link>
          </div>
        </section>

        {/* Roadmap */}
        <section>
          <h2 className="text-xl font-black uppercase tracking-tight">Upcoming Dioceses</h2>
          <div className="mt-4 text-white leading-relaxed">
            I am working on adding more parishes to the map. The parishes from these dioceses are next:
            <ul className="list-disc list-inside mt-3 space-y-2 font-medium opacity-90">
              <li>Diocese of Hamilton</li>
              <li>Diocese of St. Catharines</li>
              <li>Archdiocese of Toronto</li>
            </ul>
          </div>
        </section>

        <div className="pt-6 border-t border-white/10">
          <Link
            to="/"
            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition font-bold text-sm"
          >
            ← Back to Map
          </Link>
        </div>
      </main>
    </div>
  );
}