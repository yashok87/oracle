
import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  theme?: 'SUPREMATIST' | 'IMPRESSIONIST';
  language?: 'EN' | 'RU';
}

const PROCESS_STEPS = {
  EN: [
    "Consulting The Archives...",
    "Assembling The Council...",
    "Analyzing Ontological Vectors...",
    "Synthesizing Soviet Mysticism...",
    "Calculating Post-Modern Simulation...",
    "Decoding The Void...",
    "Manifesting Visual Revelation...",
    "Finalizing The Decree..."
  ],
  RU: [
    "Обращение к Архивам...",
    "Сбор Совета...",
    "Анализ онтологических векторов...",
    "Синтез советского мистицизма...",
    "Расчет постмодернистской симуляции...",
    "Декодирование Пустоты...",
    "Проявление визуального откровения...",
    "Оформление вердикта..."
  ]
};

const MESSAGES = {
  EN: {
    suprematist: "Oracle is Processing...",
    impressionist: "Ether is Aligning..."
  },
  RU: {
    suprematist: "Оракул обрабатывает...",
    impressionist: "Эфир выравнивается..."
  }
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ theme = 'SUPREMATIST', language = 'EN' }) => {
  const [rotation, setRotation] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const lang = (language && MESSAGES[language]) ? language : 'EN';
  const t = MESSAGES[lang];
  const steps = PROCESS_STEPS[lang as keyof typeof PROCESS_STEPS] || PROCESS_STEPS.EN;

  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setRotation(r => r + 45);
    }, 800);

    const stepInterval = setInterval(() => {
      setStepIndex(s => (s + 1) % steps.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + (Math.random() * 5), 98));
    }, 500);

    return () => {
      clearInterval(rotateInterval);
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [steps.length]);

  const ProgressBar = (
    <div className="fixed bottom-12 left-6 right-6 flex flex-col items-center">
      <div className={`w-full max-w-md h-1.5 border mb-3 overflow-hidden ${theme === 'IMPRESSIONIST' ? 'border-amber-900/40 bg-black/40' : 'border-black/10 bg-zinc-100'}`}>
        <div 
          className={`h-full transition-all duration-700 ease-out ${theme === 'IMPRESSIONIST' ? 'bg-amber-600' : 'bg-red-600'}`} 
          style={{ width: `${progress}%` }} 
        />
      </div>
      <p className={`text-[10px] font-black uppercase tracking-[0.4em] animate-pulse ${theme === 'IMPRESSIONIST' ? 'text-amber-100/40' : 'text-black/40'}`}>
        {steps[stepIndex]}
      </p>
    </div>
  );

  if (theme === 'IMPRESSIONIST') {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden bg-[#0f0505]">
           <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#7c2d12] rounded-full blur-[80px] opacity-40 animate-pulse" />
           <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-[#1e1b4b] rounded-full blur-[60px] opacity-50 animate-bounce" style={{ animationDuration: '3s' }} />
           
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-ping" />
             <h2 className="text-xl font-serif italic text-amber-100/80 tracking-widest mt-12 animate-pulse">
                {t.impressionist}
             </h2>
           </div>
           {ProgressBar}
        </div>
     );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative overflow-hidden bg-white">
      <div 
        className="w-24 h-24 bg-black mb-8 transition-transform duration-700 ease-in-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      />
      
      <div className="absolute top-1/4 left-10 w-12 h-12 bg-red-600 rounded-full animate-bounce delay-100" />
      <div className="absolute bottom-1/4 right-10 w-48 h-8 bg-blue-600 -rotate-12 animate-pulse" />
      
      <h2 className="text-xl font-bold tracking-widest uppercase mt-12 animate-pulse">
        {t.suprematist}
      </h2>
      {ProgressBar}
    </div>
  );
};
