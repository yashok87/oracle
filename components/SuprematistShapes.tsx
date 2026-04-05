
import React from 'react';

export const FloatingCircle: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`absolute rounded-full bg-red-600 opacity-80 mix-blend-multiply ${className}`} />
);

export const FloatingRect: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`absolute ${className}`} />
);

export const FloatingCross: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`absolute flex items-center justify-center ${className}`}>
    <div className="w-full h-1/4 bg-blue-600 absolute"></div>
    <div className="h-full w-1/4 bg-blue-600 absolute"></div>
  </div>
);
