// src/pages/Contact.jsx
import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta.jsx";

export default function Contact() {
  const navigate = useNavigate();
  const email = "photos@catholicparishes.org";
  const contactEmail = "contact@catholicparishes.org";
  const banner = "https://images.catholicparishes.org/canada/ontario/diocese_of_london/windsor/olph1.webp";
  const googleFormURL = "https://docs.google.com/forms/d/e/1FAIpQLSfutTTbPnDW-GP0wMhvJw4Lyst98XJm_gGZ6V3uTnw_5yAr1g/viewform?embedded=true";

  // --- 1. SEO & META DATA HOOK ---
  usePageMeta(
    "Contact & Feedback",
    "Report errors, suggest improvements, or submit photos for Catholic parishes across Ontario.",
    banner
  );

  // --- 2. JSON-LD SCHEMA ---
  // Keep this in a separate useEffect or as a component because it's specific to ContactPage
  React.useEffect(() => {
    const scriptId = "contact-jsonld";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ContactPage", // More specific than Organization for this URL
      "name": "Contact Catholic Parishes",
      "description": "Feedback and support page for the Ontario Catholic Parishes map.",
      "mainEntity": {
        "@type": "Organization",
        "name": "Catholic Parishes",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Technical Support",
          "email": contactEmail
        }
      }
    });
    return () => { if (script) script.remove(); };
  }, [contactEmail]);

  return (
    <div className="min-h-screen relative flex flex-col text-white">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <div
          className="w-full h-full bg-center bg-cover transition-opacity duration-700"
          style={{ backgroundImage: `url('${banner}')` }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Hero Header - No black banner, matches About.jsx */}
      <header className="relative z-10 h-48 md:h-64 flex items-end px-6">
        <div className="max-w-5xl mx-auto w-full pb-6">
          <h1 className="text-3xl md:text-5xl font-black drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
            Contact & Suggestions
          </h1>
          <p className="text-lg opacity-90 mt-2 drop-shadow-md">
            Have feedback, corrections, or photos? Let me know!
          </p>
        </div>
      </header>

      {/* Main Content Card - Uses color-mix background */}
      <main className="relative z-10 max-w-4xl mx-4 md:mx-auto p-6 md:p-10 mb-20 rounded-2xl
          bg-[color-mix(in_srgb,var(--accent)_40%,transparent)]
          dark:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]
          backdrop-blur-md shadow-2xl space-y-8"
      >
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          className="text-sm font-bold opacity-70 hover:opacity-100 transition flex items-center gap-2"
        >
          ← Back
        </button>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Report an Error or Suggest an Improvement</h2>
          <p className="leading-relaxed text-white">
            To report an error or suggest a feature, please fill out the form below. If the form doesn't work for whatever
            reason, you can use this{" "}
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfutTTbPnDW-GP0wMhvJw4Lyst98XJm_gGZ6V3uTnw_5yAr1g/viewform"
              target="_blank"
              rel="noreferrer"
              className="text-blue-300 hover:text-blue-400 font-bold"
            >
              link
            </a>
            .
          </p>
          <p className="leading-relaxed text-white">
            Alternatively, email me directly at:{" "}
            <a href={`mailto:${contactEmail}`} className="text-blue-300 hover:text-blue-400 font-bold">
              {contactEmail}
            </a>.
          </p>
        </section>

        {/* Google Form Embed - Themed Border */}
        <div className="w-full flex justify-center py-4">
          <iframe
            src={googleFormURL}
            className="rounded-2xl shadow-2xl w-full"
            style={{
              height: "800px",
              maxWidth: "750px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "2px solid var(--accent)",
              boxShadow: "0 0 12px var(--accent)",
            }}
            title="Contact Form"
          >
            Loading…
          </iframe>
        </div>

        {/* Info Box - Now matches the Celebration Box on About page exactly */}
        <section 
          className="p-6 rounded-xl shadow text-white transition-all duration-500"
          style={{
            border: "2px solid var(--accent)",
            boxShadow: "0 0 12px var(--accent)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            Uploading a Photo
          </h2>
          <p className="text-white leading-relaxed">
            If a parish does not have a photo or has an outdated photo and you would like to provide one, please email it to{" "}
            <a 
              href={`mailto:${email}`} 
              className="= text-blue-300 hover:text-blue-400 font-extrabold transition-colors"
            >
              {email}
            </a>.
          </p>
          
          {/* Divider line using a faint version of the accent or white opacity */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-sm opacity-80 italic">
              Please include the <strong>Parish Name</strong>, <strong>City</strong>, and <strong>Diocese</strong> so I can attribute it correctly.
            </p>
          </div>
        </section>

        <div className="flex justify-center pt-6">
          <Link
            to="/"
            className="px-8 py-3 rounded-lg text-white font-bold hover:bg-white/20 transition shadow-lg border border-white/10"
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
          >
            ← Return to Map
          </Link>
        </div>
      </main>
    </div>
  );
}