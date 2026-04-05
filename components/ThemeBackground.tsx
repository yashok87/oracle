
import React from 'react';
import { FloatingRect, FloatingCircle, FloatingCross } from './SuprematistShapes';

interface ThemeBackgroundProps {
  theme: 'SUPREMATIST' | 'IMPRESSIONIST';
}

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ theme }) => {
  if (theme === 'SUPREMATIST') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Main subtle floating shapes */}
        <FloatingRect className="top-10 left-10 w-20 h-20 rotate-12 bg-blue-600 animate-broken-light" />
        <FloatingCircle className="bottom-20 right-10 w-32 h-32 opacity-5" />
        <FloatingCross className="top-1/3 right-1/4 w-16 h-16 rotate-45 opacity-5" />
      </div>
    );
  }

  // Dark Renoir / Impressionist Background
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep Midnight Blue & Burgundy Wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1a0505] to-[#271005]" />
      
      {/* Heavy Canvas Texture Overlay */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
             filter: 'contrast(150%) brightness(100%)'
           }} 
      />

      {/* Atmospheric Light "Blobs" (Amber/Sienna) */}
      <div className="absolute top-[-20%] left-[-10%] w-[80vh] h-[80vh] bg-[#7c2d12] rounded-full blur-[150px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[70vh] h-[70vh] bg-[#1e1b4b] rounded-full blur-[150px] opacity-40" />
      
      {/* Golden Highlight (Candlelight feel) */}
      <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-[#d97706] rounded-full blur-[100px] opacity-10 mix-blend-color-dodge" />
    </div>
  );
};
