import React, { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster'; 
import L from "leaflet";
import { Link, useLocation } from "react-router-dom";
import Fuse from "fuse.js";

// Standardized imports
import { iconPaths, dioIconPaths, accentColors, darkAccentColors } from "@/liturgicalColors.jsx";
import { useLiturgical } from "@/context/LiturgicalContext.jsx"; 
import { usePageMeta } from "@/hooks/usePageMeta.jsx"; 
import RunningJesus from "@/components/RunningJesus.jsx"; 

const key = import.meta.env.VITE_STADIA_API_KEY;

const FILTER_TYPE_KEY = "filterType";
const FILTER_DAY_KEY = "filterDay";
const CLUSTERING_TOGGLE_KEY = "clusteringEnabled"; 
const DARK_MODE_OVERRIDE_KEY = "isDarkModeOverride"; 

// --- HELPERS ---

const hexToRgba = (hex, alpha = 0.7) => {
  if (!hex || !hex.startsWith('#')) return `rgba(128, 0, 128, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  return L.latLng(lat1, lon1).distanceTo(L.latLng(lat2, lon2));
};

const matchesDay = (times, day) => {
  if (!times?.length) return false;
  day = day.toLowerCase();
  const daysOfWeek = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  return times.some(t => {
    const lower = t.toLowerCase();
    if (lower.includes(day)) return true;
    if (lower.includes("overnight")) {
      const startDayMatch = /(\w+)\s+\d{1,2}:\d{2}/.exec(lower);
      if (startDayMatch) {
        const startDay = startDayMatch[1].toLowerCase();
        const startIdx = daysOfWeek.indexOf(startDay);
        const nextIdx = (startIdx + 1) % 7;
        if (daysOfWeek[nextIdx] === day) return true;
      }
    }
    return false;
  });
};

const getInitialDarkModeOverride = () => {
    const saved = sessionStorage.getItem(DARK_MODE_OVERRIDE_KEY);
    if (saved !== null) return saved === 'true'; 
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
};

function getPopupText(colorKey) {
  if (colorKey === "WHITE" || colorKey === "ROSE") return "#000000"; 
  return "#ffffff"; 
}

// --- SEO COMPONENTS ---

const StructuredData = () => {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Catholic Parishes",
      "url": "https://www.catholicparishes.org",
      "description": "Find Catholic Masses, Confession, and Adoration times in Ontario.",
      "applicationCategory": "DirectoryService",
      "browserRequirements": "Requires JavaScript and a modern web browser.",
      "permissions": "Geolocation (optional)",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": "https://www.catholicparishes.org",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.catholicparishes.org/?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ];

  return (
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  );
};

// --- UI COMPONENTS ---

const FloatingTitle = ({ prefersDark, colorKey, triggerEasterEgg }) => (
  <div className="fixed top-0 left-0 z-[1010] p-4 flex items-center gap-2 pointer-events-auto">
    {/* Negative margin applied to button to visually nudge icon up */}
    <button onClick={triggerEasterEgg} className="-mt-2 p-0 border-none bg-transparent cursor-pointer hover:scale-110 transition-transform active:scale-95 focus:outline-none">
      <img src={iconPaths[colorKey]?.[prefersDark ? "dark" : "light"]} alt="Church icon" className="w-8 h-8 drop-shadow-md" />
    </button>
    <h1 className={`text-xl font-black tracking-tight drop-shadow-md ${prefersDark ? "text-white" : "text-gray-900"}`}>Catholic Parishes</h1>
  </div>
);

const FloatingThemeToggle = ({ isDarkModeOverride, setIsDarkModeOverride, badgeActive }) => {
  return (
    <div 
      className={`fixed left-3 z-[1010] transition-all duration-500 pointer-events-auto`}
      style={{ 
        // Mobile: Moves up if badge is active. Desktop (md): Stays at 64px.
        bottom: badgeActive ? 'clamp(64px, 20vh, 90px)' : '64px' 
      }}
    >  
      <div 
        onClick={() => setIsDarkModeOverride(prev => !prev)}
        className={`relative w-28 h-8 rounded-full font-medium shadow-xl backdrop-blur-sm transition flex items-center justify-between cursor-pointer p-[2px] ${isDarkModeOverride ? "bg-white/25" : "bg-white/70"}`}
      >
        <div className={`absolute h-6 w-1/2 rounded-full shadow-md transform transition-transform duration-300 ease-in-out z-10 ${isDarkModeOverride ? "translate-x-[calc(92%)] bg-white" : "translate-x-0 bg-gray-900"}`} />
        <span className={`w-1/2 text-center text-xs font-bold transition-opacity duration-300 z-20 ${isDarkModeOverride ? 'text-white opacity-50' : 'text-gray-900 opacity-100'}`}>Light</span>
        <span className={`w-1/2 text-center text-xs font-bold transition-opacity duration-300 z-20 ${isDarkModeOverride ? 'text-white opacity-100' : 'text-gray-900 opacity-50'}`}>Dark</span>
      </div>
    </div>
  );
};

const FloatingClusterToggle = ({ isClusteringEnabled, setIsClusteringEnabled, prefersDark, badgeActive }) => {
  return (
    <div 
      className="fixed left-3 z-[1010] transition-all duration-500 pointer-events-auto"
      style={{ 
        // Mobile: If badge is active, slide up to 48px to clear it. Else 12px.
        bottom: badgeActive ? '48px' : '12px' 
      }}
    >
      <button
        onClick={() => setIsClusteringEnabled(prev => !prev)}
        className={`px-4 py-2 rounded-lg text-xs font-bold shadow-xl backdrop-blur-sm transition flex items-center ${prefersDark ? "bg-white/25 text-white hover:bg-white/40" : "bg-white/70 text-gray-900 hover:bg-white/90"}`} 
      >
        <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${isClusteringEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {isClusteringEnabled ? "CLUSTERING: ON" : "CLUSTERING: OFF"}
      </button>
    </div>
  );
};

const TransparentNavbar = ({ 
  prefersDark, filterType, setFilterType, filterDay, setFilterDay, showFilter, setShowFilter, 
  clearFilters, searchQuery, setSearchQuery, searchResults, onSelectResult, isLoading, 
  bgColor, textColor, colorKey 
}) => {
  const [isSearchMobileOpen, setIsSearchMobileOpen] = useState(false);

  const btnClass = prefersDark ? "bg-white/25 text-white hover:bg-white/40" : "bg-white/70 text-gray-900 hover:bg-white/90";
  const dropdownBg = hexToRgba(bgColor, 0.5);

  const responsiveBtn = `px-2 md:px-4 py-2 rounded-lg font-bold backdrop-blur-sm text-sm md:text-base transition shadow-lg`;

  const toggleSearch = () => {
    if (isSearchMobileOpen) {
      setSearchQuery("");
    }
    setIsSearchMobileOpen(!isSearchMobileOpen);
  };

  useEffect(() => {
    sessionStorage.setItem(FILTER_TYPE_KEY, filterType);
  }, [filterType]);

  useEffect(() => {
    sessionStorage.setItem(FILTER_DAY_KEY, filterDay);
  }, [filterDay]);

  useEffect(() => {
    if (filterType !== "mass" && filterDay === "saturday-vigil") {
      setFilterDay("any");
    }
    sessionStorage.setItem(FILTER_TYPE_KEY, filterType);
  }, [filterType]);

  return (
    <nav className="fixed top-0 right-0 z-[1010] p-3 pointer-events-none">
      <div className="flex flex-col md:flex-row items-end md:items-center gap-3 md:gap-2 pointer-events-auto">
        
        {/* FILTERS BUTTON */}
        <div className="relative order-1 md:order-3">
          <button 
            onClick={() => setShowFilter(!showFilter)} 
            className={`${responsiveBtn} w-24 md:w-auto ${btnClass}`}
          >
            FILTERS
          </button>
          
          {showFilter && (
            <div 
              style={{ backgroundColor: dropdownBg, color: textColor, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderColor: `${textColor}33` }}
              className="absolute right-0 mt-2 w-64 p-4 rounded-xl shadow-2xl border transition-all animate-in fade-in zoom-in-95 duration-200 z-[1020]"
            >
              <div className="mb-2 text-xs font-bold uppercase opacity-60">Event type</div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full mb-4 p-2 rounded-lg bg-black/10 dark:bg-white/10 border border-white/10 focus:outline-none">
                <option value="any">Any</option><option value="mass">Mass</option><option value="confession">Confession</option><option value="adoration">Adoration</option>
              </select>
              <div className="mb-2 text-xs font-bold uppercase opacity-60">Day</div>
              <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="w-full mb-4 p-2 rounded-lg bg-black/10 dark:bg-white/10 border border-white/10 focus:outline-none">
                <option value="any">Any</option><option value="monday">Monday</option><option value="tuesday">Tuesday</option><option value="wednesday">Wednesday</option><option value="thursday">Thursday</option><option value="friday">Friday</option><option value="saturday">Saturday</option>
                {filterType === "mass" && <option value="saturday-vigil">Saturday Vigil</option>}
                <option value="sunday">Sunday</option>
              </select>
              <div className="flex justify-between items-center mt-2">
                <button onClick={clearFilters} className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity">CLEAR</button>
                <button onClick={() => setShowFilter(false)} style={{ backgroundColor: textColor, color: bgColor }} className="px-4 py-1.5 rounded-lg text-xs font-bold shadow-md transition hover:scale-105 active:scale-95">APPLY</button>
              </div>
            </div>
          )}
        </div>

        {/* ABOUT BUTTON */}
        <Link 
          to="/about" 
          className={`${responsiveBtn} no-underline text-center w-24 md:w-auto order-2 md:order-2 ${btnClass}`}
        >
          ABOUT
        </Link>

        {/* SEARCH SECTION */}
        <div className="flex flex-col items-end md:flex-row md:items-center order-3 md:order-1 relative">
          
          {/* Magnifier Toggle (Mobile) */}
          <button 
            onClick={toggleSearch}
            className={`md:hidden p-2 rounded-lg backdrop-blur-sm shadow-lg transition w-10 h-10 flex items-center justify-center ${btnClass}`}
          >
            {isSearchMobileOpen ? <span className="text-xl leading-none">×</span> : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex relative items-center">
            <input
              type="text"
              placeholder="Search parishes, dioceses, and places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-4 py-2 pr-10 rounded-lg font-bold backdrop-blur-sm transition-all duration-500 w-48 focus:w-[350px] text-sm shadow-lg border-none outline-none ${btnClass}`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 opacity-50 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>

          {/* Mobile Search Input Wrapper */}
          <div className="md:hidden flex flex-col items-end">
            <div 
              className={`
                flex items-center transition-all duration-500 ease-in-out overflow-hidden
                ${isSearchMobileOpen ? 'w-[80vw] opacity-100 mt-2' : 'w-0 opacity-0 mt-0'}
              `}
            >
              <input
                autoFocus={isSearchMobileOpen}
                type="text"
                placeholder="Search parishes, dioceses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`
                  px-4 py-3 rounded-xl font-bold backdrop-blur-md shadow-2xl 
                  border border-white/20 w-full outline-none
                  text-[16px] scale-90 origin-right
                  ${btnClass}
                `}
              />
            </div>
          </div>

          {/* SEARCH RESULTS SECTION */}
          {searchQuery.length > 1 && (
            <div 
              onPointerDown={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{ 
                backgroundColor: dropdownBg, 
                color: textColor, 
                backdropFilter: 'blur(16px)', 
                WebkitBackdropFilter: 'blur(16px)',
                touchAction: 'pan-y' 
              }}
              className="absolute top-full right-0 mt-2 w-[85vw] max-w-sm rounded-xl shadow-2xl overflow-hidden border border-white/20 max-h-[60vh] overflow-y-auto z-[1050] animate-in fade-in slide-in-from-top-2"
            >
              {searchResults.length > 0 ? (() => {
                const priority = searchResults
                  .filter(r => r.type === 'parish' || r.type === 'diocese')
                  .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
                  .slice(0, 5);

                const places = searchResults
                  .filter(r => r.type !== 'parish' && r.type !== 'diocese')
                  .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
                  .slice(0, 3);

                const combinedResults = [...priority, ...places];

                return combinedResults.map((res, i) => (
                  <button 
                    key={i} 
                    onClick={() => { 
                      onSelectResult(res); 
                      setIsSearchMobileOpen(false); 
                      setSearchQuery(""); 
                    }} 
                    style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }} 
                    className="w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-black/10 dark:hover:bg-white/10 transition flex flex-col"
                  >
                    <span className="font-bold text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2 overflow-hidden">
                        {res.type === 'parish' && <img src={iconPaths[colorKey]?.[prefersDark ? "dark" : "light"]} alt="icon" className="w-4 h-4 object-contain shrink-0" />}
                        {res.type === 'diocese' && <img src={dioIconPaths[colorKey]?.[prefersDark ? "dark" : "light"]} alt="icon" className="w-4 h-4 object-contain shrink-0" />}
                        {res.type === 'location' && <span className="shrink-0 text-xs">📍</span>} 
                        <span className="truncate">{res.label}</span>
                      </span>
                      {res.distance !== undefined && (
                        <span className="text-[10px] opacity-60 font-normal shrink-0 ml-2">
                          {(res.distance / 1000).toFixed(1)} km
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] opacity-70 truncate">{res.sublabel}</span>
                  </button>
                ));
              })() : !isLoading && (
                <div className="p-4 text-xs italic opacity-70 text-center">No results found</div>
              )}
            </div>
          )}
        </div> {/* Closed the Search Section Div */}
      </div> {/* Closed the Parent Container Div */}
    </nav>
  );
};

const SetView = ({ coords, zoom, onComplete }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, zoom, { animate: true, duration: 1.8, easeLinearity: 0.25 });
      const timer = setTimeout(() => { if (onComplete) onComplete(); }, 1800);
      return () => clearTimeout(timer);
    }
  }, [coords, zoom, map, onComplete]);
  return null;
};

const DioceseMarkers = ({ dioceses, dioIcon, popupTextColor, popupBgColor }) => {
  const transparentBg = hexToRgba(popupBgColor, 0.7); 
  return (
    <>
      {dioceses.map((dio, idx) => (
        <Marker 
          key={`dio-${idx}`} 
          position={[dio.dioLat, dio.dioLong]} 
          icon={dioIcon} 
          zIndexOffset={1000} 
        >
          <Popup className="custom-accent-popup" maxWidth={340} minWidth={200} autoPanPadding={[20, 20]}>
            <style>{`
              .custom-accent-popup .leaflet-popup-content-wrapper,
              .custom-accent-popup .leaflet-popup-tip {
                background-color: ${transparentBg} !important;
                color: ${popupTextColor} !important;
                backdrop-filter: blur(4px);
              }
              .link-hover-effect:hover .arrow-move {
                transform: translateX(4px);
              }
            `}</style>
            <div style={{ color: popupTextColor }}>
              {dio.dioceseSlug ? (
                <Link 
                  to={`/diocese/${dio.dioceseSlug}`} 
                  style={{ color: popupTextColor }} 
                  className="group link-hover-effect no-underline block mb-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-black text-xl leading-tight hover:underline">
                      {dio.dioceseName}
                    </span>
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-black bg-white/20 px-2 py-1 rounded mt-1 transition-all group-hover:bg-white/40">
                      MORE INFO <span className="arrow-move transition-transform inline-block">→</span>
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="font-black text-xl leading-tight mb-2">{dio.dioceseName}</div>
              )}

              <div className="mb-2 text-sm opacity-90">{dio.dioceseAddress}</div>
              
              <div className="h-px w-full bg-current opacity-20 my-3" />

              <div className="space-y-3">
                {dio.bishop && (
                  <div className="text-sm">
                    <span className="opacity-70 uppercase text-[10px] font-bold block">Bishop</span>
                    <span className="font-bold">{dio.bishop}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 bg-black/10 rounded-lg p-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold opacity-60">Parishes</span>
                    <span className="text-xl font-black leading-none">{dio.numParishesInDiocese || "—"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold opacity-60">Masses Per Week</span>
                    <span className="text-xl font-black leading-none">{dio.numMassesPerWeekInDiocese || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const ParishMarkers = ({ parishes, churchIcon, popupTextColor, popupBgColor }) => {
  const transparentBg = hexToRgba(popupBgColor, 0.7);
  return (
    <>
      {parishes.map((parish, idx) => (
        <Marker key={`${idx}-${popupBgColor}`} position={[parish.lat, parish.long]} icon={churchIcon}>
          <Popup className="custom-accent-popup" maxWidth={340} minWidth={200} autoPanPadding={[20, 20]}>
            <style>{`
              .custom-accent-popup .leaflet-popup-content-wrapper,
              .custom-accent-popup .leaflet-popup-tip {
                background-color: ${transparentBg} !important;
                color: ${popupTextColor} !important;
                backdrop-filter: blur(4px);
              }
              .link-hover-effect:hover .arrow-move {
                transform: translateX(4px);
              }
            `}</style>
            <div style={{ color: popupTextColor }}>
              {parish.parishSlug ? (
                <Link 
                  to={`/parish/${parish.parishSlug}`} 
                  style={{ color: popupTextColor }} 
                  className="group link-hover-effect no-underline block mb-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-black text-xl leading-tight hover:underline">
                      {parish.parishName}
                    </span>
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-black bg-white/20 px-2 py-1 rounded mt-1 transition-all group-hover:bg-white/40">
                      MORE INFO <span className="arrow-move transition-transform inline-block">→</span>
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="font-black text-xl leading-tight mb-2">{parish.parishName}</div>
              )}

              <div className="mb-3 text-sm opacity-90">{parish.parishAddress}</div>
              
              <div className="space-y-2 border-t border-white/10 pt-2">
                {parish._sunday?.length > 0 && <div className="text-xs"><strong>Sunday:</strong> {parish._sunday.join(", ")}</div>}
                {parish._daily?.length > 0 && <div className="text-xs"><strong>Daily:</strong> {parish._daily.join(", ")}</div>}
                {parish._confession?.length > 0 && <div className="text-xs"><strong>Confession:</strong> {parish._confession.join(", ")}</div>}
                {parish._adoration?.length > 0 && <div className="text-xs"><strong>Adoration:</strong> {parish._adoration.join(", ")}</div>}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const Map = () => {
  const { colorKey } = useLiturgical();
  usePageMeta("", "Find Mass, Confession, and Adoration times.");
  const mapRef = useRef(null);
  const location = useLocation();

  const [parishes, setParishes] = useState([]);
  const [dioceses, setDioceses] = useState([]);
  const [isDarkModeOverride, setIsDarkModeOverride] = useState(getInitialDarkModeOverride);
  const [filterType, setFilterType] = useState(sessionStorage.getItem(FILTER_TYPE_KEY) || "any");
  const [filterDay, setFilterDay] = useState(sessionStorage.getItem(FILTER_DAY_KEY) || "any");
  const [showFilter, setShowFilter] = useState(false);
  const [isClusteringEnabled, setIsClusteringEnabled] = useState(() => sessionStorage.getItem(CLUSTERING_TOGGLE_KEY) !== 'false');
  
  const [userLocation, setUserLocation] = useState(null);
  const [hasPunchedIn, setHasPunchedIn] = useState(false);
  const [activeEggs, setActiveEggs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jumpTarget, setJumpTarget] = useState(null);

  const { name, season, loading } = useLiturgical();

  const prefersDark = isDarkModeOverride;
  const popupTextColor = useMemo(() => getPopupText(colorKey), [colorKey]);
  const popupBgColor = useMemo(() => (
    prefersDark ? (darkAccentColors[colorKey] || darkAccentColors.GREEN) : (accentColors[colorKey] || accentColors.GREEN)
  ), [colorKey, prefersDark]);

  const fuse = useMemo(() => new Fuse(parishes, {
    keys: ["parishName", "parishAddress", "city"],
    threshold: 0.3,
  }), [parishes]);

  const fuseDiocese = useMemo(() => new Fuse(dioceses, {
    keys: ["dioceseName", "dioceseAddress", "city"],
    threshold: 0.3,
  }), [dioceses]);

  // Sync Search Query with URL Params on Load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get("search");
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, []);

  // Update URL Params when searching (using replaceState to keep history clean)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    const newPath = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newPath);
  }, [searchQuery]);

  useEffect(() => {
    if (location.state?.jumpTo) {
      setJumpTarget({
        coords: location.state.jumpTo,
        zoom: location.state.zoom || 15
      });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    document.body.classList.toggle("dark", prefersDark);
    document.body.classList.toggle("liturgical-white", colorKey === "WHITE" || colorKey === "ROSE");
    document.documentElement.style.setProperty('--accent', popupBgColor);
    sessionStorage.setItem(DARK_MODE_OVERRIDE_KEY, isDarkModeOverride.toString());
  }, [prefersDark, isDarkModeOverride, colorKey, popupBgColor]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) { performSearch(searchQuery); }
      else { setSearchResults([]); }
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsLoading(true);
    const center = mapRef.current ? mapRef.current.getCenter() : { lat: 0, lng: 0 };

    const parishMatches = fuse.search(query).map(res => ({
      type: 'parish', 
      label: res.item.parishName, 
      sublabel: res.item.parishAddress, 
      coords: [res.item.lat, res.item.long], 
      distance: getDistance(center.lat, center.lng, res.item.lat, res.item.long)
    }));

    const dioceseMatches = fuseDiocese.search(query).map(res => ({
      type: 'diocese', 
      label: res.item.dioceseName, 
      sublabel: `Diocese Office • ${res.item.dioceseAddress}`, 
      coords: [res.item.dioLat, res.item.dioLong], 
      distance: getDistance(center.lat, center.lng, res.item.dioLat, res.item.dioLong)
    }));

    const combinedLocal = [...parishMatches, ...dioceseMatches].sort((a, b) => a.distance - b.distance);

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3`, { headers: { 'User-Agent': 'Catholic-Parishes-App' } });
      const geoData = await geoRes.json();
      const geoMatches = geoData.map(item => ({
        type: 'location', label: item.display_name.split(',')[0], sublabel: item.display_name.split(',').slice(1, 3).join(','),
        coords: [parseFloat(item.lat), parseFloat(item.lon)], distance: getDistance(center.lat, center.lng, parseFloat(item.lat), parseFloat(item.lon))
      }));
      
      setSearchResults([...combinedLocal.slice(0, 6), ...geoMatches]);
    } catch { 
      setSearchResults(combinedLocal.slice(0, 6)); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const onSelectResult = (result) => {
    let zoomLevel = 13;
    if (result.type === 'parish') zoomLevel = 15;
    if (result.type === 'diocese') zoomLevel = 15;

    setJumpTarget({ coords: result.coords, zoom: zoomLevel });
    setSearchQuery("");
    setSearchResults([]);
  };

  useEffect(() => {
    fetch("/data/parishes.json").then(res => res.json()).then(data => {
      const normalize = raw => !raw ? [] : (Array.isArray(raw) ? raw.map(s => s.trim()) : String(raw).replace(/\\/g, "").split(/;|\r?\n/).map(s => s.trim())).filter(Boolean);
      setParishes(data.map(p => ({
        ...p, _sunday: normalize(p.sundayMassTimes || p.sunday_mass_times), _daily: normalize(p.dailyMassTimes || p.weekdayMassTimes), _confession: normalize(p.confessionTimes), _adoration: normalize(p.adorationTimes),
      })));
    });

    fetch("/data/dioceses.json").then(res => res.json()).then(data => {
      setDioceses(data.filter(d => d.dioLat && d.dioLong));
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        err => console.warn("Location error:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const filteredParishes = useMemo(() => {
    return parishes.filter(p => {
      let typeMatch = (filterType === "any") || (filterType === "mass" && (p._sunday.length || p._daily.length)) || (filterType === "confession" && p._confession.length) || (filterType === "adoration" && p._adoration.length);
      if (!typeMatch) return false;
      if (filterDay === "any") return true;
      const d = filterDay.toLowerCase();
      if (filterType === "mass") {
        if (d === "saturday-vigil") return p._sunday.some(t => t.toLowerCase().includes("saturday"));
        if (d === "sunday") return p._sunday.some(t => t.toLowerCase().includes(d));
        return p._daily.some(t => t.toLowerCase().includes(d));
      }
      return (filterType === "confession") ? p._confession.some(t => t.toLowerCase().includes(d)) : matchesDay(p._adoration, d);
    });
  }, [parishes, filterType, filterDay]);

  const churchIcon = useMemo(() => new L.Icon({
    iconUrl: iconPaths[colorKey]?.[prefersDark ? "dark" : "light"] || iconPaths.DEFAULT?.light,
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -28],
  }), [colorKey, prefersDark]);

  const dioIcon = useMemo(() => new L.Icon({
    iconUrl: dioIconPaths[colorKey]?.[prefersDark ? "dark" : "light"] || dioIconPaths.WHITE.light,
    iconSize: [50, 50], iconAnchor: [20, 40], popupAnchor: [0, -35],
  }), [colorKey, prefersDark]);

  const MapInstanceCapture = () => {
    const map = useMapEvents({
      moveend: () => {
        const center = map.getCenter();
        sessionStorage.setItem("mapCenter", JSON.stringify([center.lat, center.lng]));
        sessionStorage.setItem("mapZoom", map.getZoom());
      }
    });
    useEffect(() => { mapRef.current = map; }, [map]);
    return null;
  };

const LiturgicalMapBadge = ({ name, season, loading, prefersDark }) => {
  if (loading || !name) return null;

  // BACKGROUND: Dynamic glass effect
  const bgClass = prefersDark 
    ? "bg-white/25 hover:bg-white/35" 
    : "bg-white/70 hover:bg-white/85";

  // TEXT: White for dark mode, Black for light mode
  const textClass = prefersDark ? "text-white" : "text-black";

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 z-[1010] w-max max-w-[calc(100%-40px)] md:max-w-none pointer-events-auto"
      style={{ 
        bottom: 'env(safe-area-inset-bottom, 0px)',
        marginBottom: 'env(safe-area-inset-bottom, 12px)',
      }}
    >
      <Link 
        to="/about"
        className={`
          ${bgClass} ${textClass} px-4 md:px-8 py-1.5 transition-all duration-500 border overflow-hidden block no-underline
          rounded-xl border-b
          md:rounded-t-xl md:rounded-b-none md:border-b-0
          active:scale-95 transition-transform
          backdrop-blur-sm shadow-lg
        `}
        style={{
          borderColor: "var(--accent)",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1), 0 -2px 12px var(--accent)",
        }}
      >
        <div className="flex items-center justify-center gap-2 md:gap-10 w-full relative">
          
          {/* Column 1: Today's Celebration */}
          <div className="flex flex-col items-center flex-1 md:flex-none min-w-0">
            <span className="text-[8px] font-black uppercase tracking-tight opacity-60 leading-none whitespace-nowrap">
              Today's Celebration
            </span>
            <span className="text-[11px] md:text-xs font-bold truncate md:whitespace-nowrap block w-full md:w-auto text-center">
              {name}
            </span>
          </div>
          
          {/* Divider: bg-current makes it match the text color automatically */}
          <div className="shrink-0 w-px h-5 bg-current opacity-20" />
          
          {/* Column 2: Season */}
          <div className="flex flex-col items-center flex-1 md:flex-none min-w-0">
            <span className="text-[8px] font-black uppercase tracking-tight opacity-60 leading-none whitespace-nowrap">
              Season
            </span>
            <span className="text-[11px] md:text-xs font-bold truncate md:whitespace-nowrap block w-full md:w-auto text-center">
              {season}
            </span>
          </div>

        </div>
      </Link>
    </div>
  );
};

  const savedCenter = sessionStorage.getItem("mapCenter");
  const initialCenter = savedCenter ? JSON.parse(savedCenter) : [42.7258, -81.9591];
  const initialZoom = parseInt(sessionStorage.getItem("mapZoom")) || 8;
  const tileUrl = prefersDark ? `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${key}` : `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${key}`;
  const badgeActive = !loading && name;

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden transition-colors">
      <StructuredData />
      
      {activeEggs.map(id => <RunningJesus key={id} onAnimationEnd={() => setActiveEggs(p => p.filter(i => i !== id))} />)}
      
      <FloatingTitle prefersDark={prefersDark} colorKey={colorKey} triggerEasterEgg={() => setActiveEggs(p => [...p, Date.now()])} />
      
      <TransparentNavbar 
        prefersDark={prefersDark} colorKey={colorKey} filterType={filterType} setFilterType={setFilterType} filterDay={filterDay} setFilterDay={setFilterDay} 
        showFilter={showFilter} setShowFilter={setShowFilter} clearFilters={() => {setFilterType("any"); setFilterDay("any"); sessionStorage.setItem(FILTER_TYPE_KEY, "any"); sessionStorage.setItem(FILTER_DAY_KEY, "any");}}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} onSelectResult={onSelectResult}
        isLoading={isLoading} bgColor={popupBgColor} textColor={popupTextColor}
      />
      
      <LiturgicalMapBadge 
        name={name} 
        season={season} 
        loading={loading} 
        prefersDark={prefersDark} 
      />
      <LiturgicalMapBadge name={name} season={season} loading={loading} prefersDark={prefersDark} />

      <FloatingThemeToggle 
        isDarkModeOverride={isDarkModeOverride} 
        setIsDarkModeOverride={setIsDarkModeOverride} 
        badgeActive={badgeActive} 
      />
      
      <FloatingClusterToggle 
        isClusteringEnabled={isClusteringEnabled} 
        setIsClusteringEnabled={setIsClusteringEnabled} 
        prefersDark={prefersDark} 
        badgeActive={badgeActive}
      />
      
      <div className="absolute inset-0 z-0">
        <MapContainer center={initialCenter} zoom={initialZoom} className="h-full w-full" zoomControl={false}>
          <TileLayer url={tileUrl} />
          <ZoomControl position="topleft" />
          <MapInstanceCapture />
          
          {jumpTarget && <SetView coords={jumpTarget.coords} zoom={jumpTarget.zoom} onComplete={() => setJumpTarget(null)} />}
          
          {!savedCenter && userLocation && !hasPunchedIn && <SetView coords={userLocation} zoom={14} onComplete={() => setHasPunchedIn(true)} />}
          
          {userLocation && <Marker position={userLocation} icon={L.divIcon({ className: "user-location-dot", iconSize: [16, 16], iconAnchor: [8, 8], html: '' })} />}
          
          <DioceseMarkers dioceses={dioceses} dioIcon={dioIcon} popupTextColor={popupTextColor} popupBgColor={popupBgColor} />

          {isClusteringEnabled ? (
            <MarkerClusterGroup 
              key={`cluster-${popupBgColor}`} disableClusteringAtZoom={12} chunkedLoading
              iconCreateFunction={(cluster) => {
                const count = cluster.getChildCount();
                const sizeClass = count >= 100 ? 'large' : count >= 20 ? 'medium' : 'small';
                return L.divIcon({
                  html: `<div><span>${count}</span></div>`,
                  className: `marker-cluster marker-cluster-${sizeClass}`,
                  iconSize: L.point(46, 46),
                });
              }}
            >
              <ParishMarkers parishes={filteredParishes} churchIcon={churchIcon} popupTextColor={popupTextColor} popupBgColor={popupBgColor} />
            </MarkerClusterGroup>
          ) : <ParishMarkers parishes={filteredParishes} churchIcon={churchIcon} popupTextColor={popupTextColor} popupBgColor={popupBgColor} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;