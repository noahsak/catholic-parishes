// src/components/RunningJesus.jsx
import React, { useEffect, useState, useMemo } from 'react';

// Vite handles these imports as hashed URLs
import runningJesusGif from '@/assets/runningJesus.gif';
import fishGif from '@/assets/fish.gif';
import breadGif from '@/assets/bread.gif';
import angel from '@/assets/angel.png';
import MotherMary from '@/assets/mothermary.png';

const ANIMATION_DURATION_MS = 3000;

const GIF_ASSETS = [
  { src: runningJesusGif, alt: "Jesus Running" },
  { src: fishGif, alt: "Fish Swimming" },
  { src: breadGif, alt: "Bread Floating" },
  { src: angel, alt: "Angel Flying" },
  { src: MotherMary, alt: "Mother Mary" },
];

const RunningJesus = ({ onAnimationEnd }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const { animationStyle, selectedAsset } = useMemo(() => {
    const asset = GIF_ASSETS[Math.floor(Math.random() * GIF_ASSETS.length)];

    // Random vertical start/end (10vh to 90vh)
    const startY = Math.floor(Math.random() * 80) + 10; 
    const direction = Math.random() > 0.5 ? 1 : 0; 
    const endY = direction === 1 
      ? Math.floor(Math.random() * 30) + 10 
      : Math.floor(Math.random() * 30) + 60;
      
    const deltaY = endY - startY;
    const angle = Math.atan2(deltaY, 100) * (180 / Math.PI);
    
    return { 
      selectedAsset: asset,
      animationStyle: {
        '--startY': `${startY}vh`,
        '--endY': `${endY}vh`,
        '--angle': `${angle}deg`,
      }
    };
  }, []);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, ANIMATION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <img 
      src={selectedAsset.src} 
      alt={selectedAsset.alt} 
      className="fixed z-[9999] w-[60px] h-auto pointer-events-none"
      style={{
        ...animationStyle,
        opacity: isVisible ? 1 : 0,
        // We use the 'run-across' keyframe defined in your index.css
        animation: `run-across ${ANIMATION_DURATION_MS}ms linear forwards`,
      }} 
    />
  );
};

export default RunningJesus;