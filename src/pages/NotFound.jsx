import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from "@/hooks/usePageMeta.jsx";

export default function NotFound() {
  usePageMeta(
    "404 Not Found", 
    "The page you are looking for does not exist on catholicparishes.org."
  );

  useEffect(() => {
    // 1. Prevent indexing
    const metaRobots = document.createElement('meta');
    metaRobots.name = "robots";
    metaRobots.content = "noindex, nofollow";
    document.head.appendChild(metaRobots);

    // 2. Lock body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.head.removeChild(metaRobots);
      document.body.style.overflow = 'unset';
    };
  }, []);

  // 2. Lock body scroll only while on this page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // --- Tailwind Class Helpers ---
  const blurbStyle = `
    text-xl md:text-2xl mb-8 max-w-[600px] 
    bg-[#ffc155]/50 p-4 md:p-6 rounded-xl 
    text-white shadow-lg backdrop-blur-md px-6 
    border border-white/20
  `;
  
  const btnStyle = `
    no-underline text-white bg-[#ffc155]/60 
    hover:bg-[#ffc155]/80 transition-all duration-300 
    py-3 px-8 rounded-lg text-lg font-bold 
    cursor-pointer shadow-md hover:scale-105 active:scale-95
  `;

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-start items-center text-center text-white pt-[10vh] md:pt-[15vh] px-4"
      style={{
        // Using the public folder path for your 404 image
        background: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url('/404notfound.png')`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        textShadow: '1px 1px 5px rgba(0,0,0,0.7)'
      }}
    >
      {/* 404 Blurb */}
      <div className={blurbStyle}>
        <h1 className="text-4xl md:text-5xl font-black mb-4">404 Not Found</h1>
        <p className="leading-relaxed">
          The page you are looking for does not exist. If you think this is an inherent website error, 
          please reach out to let me know using the button below. God Bless!
        </p>
      </div>
      
      {/* Button Group */}
      <div className="flex flex-col md:flex-row gap-4">
        <Link to="/" className={btnStyle}>
          Return to Map
        </Link> 
        <Link to="/contact" className={btnStyle}>
          Report an Error
        </Link>
      </div>
    </div>
  );
}