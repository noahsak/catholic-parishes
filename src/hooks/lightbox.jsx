import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const LightboxContext = createContext();

export function LightboxProvider({ children }) {
  const [photos, setPhotos] = useState(null);
  const [index, setIndex] = useState(0);

  const openLightbox = (i, list) => {
    if (!list?.length) return;
    setPhotos(list);
    setIndex(i);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = useCallback(() => {
    setPhotos(null);
    document.body.style.overflow = "";
  }, []);

  const showPrev = useCallback((e) => {
    e?.stopPropagation();
    if (!photos) return;
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos]);

  const showNext = useCallback((e) => {
    e?.stopPropagation();
    if (!photos) return;
    setIndex((i) => (i + 1) % photos.length);
  }, [photos]);

  // Keyboard navigation
  useEffect(() => {
    if (!photos) return;

    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrev(e);
      if (e.key === "ArrowRight") showNext(e);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos, closeLightbox, showPrev, showNext]);

  return (
    <LightboxContext.Provider
      value={{ photos, index, openLightbox, closeLightbox, showPrev, showNext }}
    >
      {children}
    </LightboxContext.Provider>
  );
}

export function useLightbox() {
  const context = useContext(LightboxContext);
  if (!context) throw new Error("useLightbox must be used within LightboxProvider");
  return context;
}

export function Lightbox() {
  const { photos, index, closeLightbox, showPrev, showNext } = useLightbox();

  if (!photos?.length) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-200"
      onClick={closeLightbox}
    >
      {/* Navigation Layer */}
      <div className="absolute inset-0 flex items-center justify-between px-4 md:px-10 pointer-events-none">
        <button
          onClick={showPrev}
          aria-label="Previous image"
          className="pointer-events-auto p-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-3xl transition-all"
        >
          ‹
        </button>
        <button
          onClick={showNext}
          aria-label="Next image"
          className="pointer-events-auto p-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-3xl transition-all"
        >
          ›
        </button>
      </div>

      {/* Close Button */}
      <button
        onClick={closeLightbox}
        aria-label="Close lightbox"
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-20"
      >
        ✕
      </button>

      {/* Main image container */}
      <div className="relative flex flex-col items-center gap-4">
        <img
          src={photos[index]}
          alt={`Gallery image ${index + 1}`}
          className="max-w-[95vw] max-h-[80vh] object-contain rounded-sm shadow-2xl select-none"
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Progress Counter */}
        <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono tracking-widest text-white/80">
          {index + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
}