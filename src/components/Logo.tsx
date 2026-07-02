import { useState, useEffect } from 'react';

export function Logo({ size = 'md', showWave = true }: { size?: 'sm' | 'md' | 'lg'; showWave?: boolean }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!showWave) return;
    const i = setInterval(() => setPhase(p => (p + 1) % 100), 50);
    return () => clearInterval(i);
  }, [showWave]);

  const s = {
    sm: { box: 'w-8 h-8',  text: 'text-base', wave: 16 },
    md: { box: 'w-10 h-10', text: 'text-xl',  wave: 20 },
    lg: { box: 'w-14 h-14', text: 'text-2xl', wave: 28 },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl gradient-bg flex items-center justify-center relative overflow-hidden shrink-0 glow-pink`}>
        {showWave && (
          <svg width={s.wave} height={s.wave} viewBox="0 0 24 24" fill="none" className="text-white">
            <path d={`M2 ${8 + Math.sin(phase * 0.06) * 2} Q 6 ${4 + Math.sin(phase * 0.06 + 1) * 3}, 12 ${8 + Math.sin(phase * 0.06 + 2) * 2} T 22 ${8 + Math.sin(phase * 0.06 + 3) * 2}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d={`M2 ${14 + Math.sin(phase * 0.06 + 1.5) * 2} Q 6 ${10 + Math.sin(phase * 0.06 + 2.5) * 3}, 12 ${14 + Math.sin(phase * 0.06 + 3.5) * 2} T 22 ${14 + Math.sin(phase * 0.06 + 4.5) * 2}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d={`M2 ${20 + Math.sin(phase * 0.06 + 3) * 1.5} Q 6 ${17 + Math.sin(phase * 0.06 + 4) * 2}, 12 ${20 + Math.sin(phase * 0.06 + 5) * 1.5} T 22 ${20 + Math.sin(phase * 0.06 + 6) * 1.5}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
          </svg>
        )}
      </div>
      <span className={`${s.text} font-extrabold tracking-tight whitespace-nowrap leading-none`}>
        <span className="gradient-text">nae</span>
        <span className="text-white"> nexus</span>
      </span>
    </div>
  );
}
