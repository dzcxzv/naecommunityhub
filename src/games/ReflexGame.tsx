import { useState, useRef, useEffect } from 'react';
import { Zap, RotateCcw } from 'lucide-react';

interface Props {
  onExit: () => void;
  onSaveScore: (score: number) => void;
}

export function ReflexGame({ onExit, onSaveScore }: Props) {
  const [state, setState] = useState<'idle' | 'waiting' | 'ready' | 'result' | 'tooSoon'>('idle');
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const startTime = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const start = () => {
    setState('waiting');
    const delay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      startTime.current = performance.now();
      setState('ready');
    }, delay);
  };

  const click = () => {
    if (state === 'waiting') {
      clearTimeout(timeoutRef.current);
      setState('tooSoon');
    } else if (state === 'ready') {
      const time = Math.round(performance.now() - startTime.current);
      setReactionTime(time);
      setState('result');
      onSaveScore(Math.max(0, 1000 - time));
      if (!bestTime || time < bestTime) setBestTime(time);
    }
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2"><Zap className="w-6 h-6 text-pink-400" /> Test refleksu</h2>
      <p className="text-slate-400 mb-6">Kliknij jak najszybciej gdy ekran zrobi się zielony!</p>

      <div
        onClick={click}
        className={`w-full max-w-2xl h-80 mx-auto rounded-2xl flex items-center justify-center cursor-pointer transition-colors duration-100 ${
          state === 'ready' ? 'bg-emerald-500' :
          state === 'waiting' ? 'bg-rose-500' :
          state === 'tooSoon' ? 'bg-amber-500' :
          'bg-slate-800 border border-white/10'
        }`}
      >
        {state === 'idle' && <button onClick={start} className="px-6 py-3 rounded-xl gradient-bg gradient-bg-hover text-white font-medium">Start</button>}
        {state === 'waiting' && <p className="text-white text-xl font-bold">Czekaj na zielony...</p>}
        {state === 'ready' && <p className="text-white text-3xl font-bold">KLIKNIJ!</p>}
        {state === 'result' && (
          <div>
            <p className="text-white text-4xl font-bold">{reactionTime}ms</p>
            {bestTime && <p className="text-slate-300 mt-2">Najlepszy: {bestTime}ms</p>}
            <button onClick={start} className="mt-4 px-4 py-2 rounded-lg gradient-bg gradient-bg-hover text-white flex items-center gap-1.5 mx-auto"><RotateCcw className="w-4 h-4" /> Spróbuj ponownie</button>
          </div>
        )}
        {state === 'tooSoon' && (
          <div>
            <p className="text-white text-2xl font-bold">Za wcześnie!</p>
            <button onClick={start} className="mt-4 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center gap-1.5 mx-auto"><RotateCcw className="w-4 h-4" /> Spróbuj ponownie</button>
          </div>
        )}
      </div>
      <button onClick={onExit} className="mt-6 text-sm text-slate-400 hover:text-slate-200">Wyjście</button>
    </div>
  );
}
