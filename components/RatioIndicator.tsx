
import React from 'react';

interface RatioIndicatorProps {
  logicScore: number;
  chaosScore: number;
  category?: 'PRODUCT' | 'MEDIA' | 'LIFE' | 'TECH' | 'RELATIONAL' | 'KNOWLEDGE' | 'FUTURE' | 'BOOKS' | 'MUSIC' | 'ARCHITECTURE' | 'GAMING' | 'SCIENCE' | 'GASTRONOMY';
  theme?: 'SUPREMATIST' | 'IMPRESSIONIST';
  language?: 'EN' | 'RU';
}

const LABELS = {
  EN: {
    logicOrder: "Logic (Order)",
    rationality: "Rationality (Security)",
    chaosRisk: "Chaos (Risk)",
    emotion: "Emotion (Spontaneity)"
  },
  RU: {
    logicOrder: "Логика (Порядок)",
    rationality: "Рациональность",
    chaosRisk: "Хаос (Риск)",
    emotion: "Эмоции"
  }
};

export const RatioIndicator: React.FC<RatioIndicatorProps> = ({ logicScore, chaosScore, category, theme = 'SUPREMATIST', language = 'EN' }) => {
  const isRenoir = theme === 'IMPRESSIONIST';
  const isRelational = category === 'RELATIONAL';
  
  const lang = (language && LABELS[language]) ? language : 'EN';
  const t = LABELS[lang];

  const logicLabel = isRelational ? t.rationality : t.logicOrder;
  const chaosLabel = isRelational ? t.emotion : t.chaosRisk;

  const borderColor = isRenoir ? 'border-amber-900/50' : 'border-black';
  const logicBarColor = isRenoir ? 'bg-amber-900' : 'bg-black';
  const chaosTextColor = isRenoir ? 'text-amber-500' : 'text-red-600';
  const chaosBarColor = isRenoir ? 'bg-amber-600' : 'bg-red-600';
  const textColor = isRenoir ? 'text-amber-100/80' : 'text-black';

  return (
    <div className={`w-full max-w-sm mx-auto mb-4 md:mb-6 ${textColor}`}>
      <div className="flex justify-between text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-1.5">
        <span>{logicLabel} {logicScore}%</span>
        <span className={chaosTextColor}>{chaosLabel} {chaosScore}%</span>
      </div>
      <div className={`h-3 md:h-4 w-full flex border p-0.5 ${borderColor} overflow-hidden`}>
        <div 
          className={`h-full transition-all duration-1000 ease-out ${logicBarColor}`} 
          style={{ width: `${logicScore}%` }}
        />
        <div 
          className={`h-full transition-all duration-1000 ease-out ${chaosBarColor}`} 
          style={{ width: `${chaosScore}%` }}
        />
      </div>
    </div>
  );
};
