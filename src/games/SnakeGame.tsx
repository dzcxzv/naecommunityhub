import { useState, useEffect, useRef } from 'react';
import { Ghost as SnakeIcon, RotateCcw, Trophy } from 'lucide-react';

interface Props {
  onExit: () => void;
  onSaveScore: (score: number) => void;
}

const GRID = 15;
type Point = { x: number; y: number };

export function SnakeGame({ onExit, onSaveScore }: Props) {
  const [snake, setSnake] = useState<Point[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Point>({ x: 10, y: 10 });
  const [dir, setDir] = useState<Point>({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle');
  const dirRef = useRef(dir);
  dirRef.current = dir;

  const start = () => {
    setSnake([{ x: 7, y: 7 }]);
    setFood({ x: 10, y: 10 });
    setDir({ x: 1, y: 0 });
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };
        if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID || prev.some(p => p.x === newHead.x && p.y === newHead.y)) {
          setGameState('dead');
          onSaveScore(score * 10);
          return prev;
        }
        const ate = newHead.x === food.x && newHead.y === food.y;
        const newSnake = [newHead, ...prev];
        if (!ate) newSnake.pop();
        else {
          setScore(s => s + 1);
          let nf: Point;
          do { nf = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
          while (newSnake.some(p => p.x === nf.x && p.y === nf.y));
          setFood(nf);
        }
        return newSnake;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [gameState, food, score, onSaveScore]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      const d = dirRef.current;
      // Arrow keys
      if (e.key === 'ArrowUp' && d.y === 0) setDir({ x: 0, y: -1 });
      if (e.key === 'ArrowDown' && d.y === 0) setDir({ x: 0, y: 1 });
      if (e.key === 'ArrowLeft' && d.x === 0) setDir({ x: -1, y: 0 });
      if (e.key === 'ArrowRight' && d.x === 0) setDir({ x: 1, y: 0 });
      // WASD keys
      if ((e.key === 'w' || e.key === 'W') && d.y === 0) setDir({ x: 0, y: -1 });
      if ((e.key === 's' || e.key === 'S') && d.y === 0) setDir({ x: 0, y: 1 });
      if ((e.key === 'a' || e.key === 'A') && d.x === 0) setDir({ x: -1, y: 0 });
      if ((e.key === 'd' || e.key === 'D') && d.x === 0) setDir({ x: 1, y: 0 });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState]);

  const setDirSafe = (nx: number, ny: number) => {
    const d = dirRef.current;
    if (nx !== 0 && d.x === 0) setDir({ x: nx, y: 0 });
    if (ny !== 0 && d.y === 0) setDir({ x: 0, y: ny });
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2"><SnakeIcon className="w-6 h-6 text-pink-400" /> Snake</h2>
      <p className="text-slate-400 mb-2">Wynik: <span className="font-bold text-pink-400">{score}</span></p>

      {gameState === 'idle' && (
        <div className="py-8">
          <button onClick={start} className="px-6 py-3 rounded-xl gradient-bg gradient-bg-hover text-white font-medium">Start</button>
          <p className="text-xs text-slate-500 mt-3">Użyj strzałek, WASD lub przycisków</p>
        </div>
      )}

      {gameState !== 'idle' && (
        <>
          <div className="inline-grid gap-0.5 p-2 bg-slate-900 rounded-xl border border-white/10" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
            {Array.from({ length: GRID * GRID }, (_, i) => {
              const x = i % GRID, y = Math.floor(i / GRID);
              const isSnake = snake.some(p => p.x === x && p.y === y);
              const isFood = food.x === x && food.y === y;
              return <div key={i} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm ${isSnake ? 'gradient-bg' : isFood ? 'bg-rose-500' : 'bg-slate-800'}`} />;
            })}
          </div>

          {gameState === 'dead' && (
            <div className="mt-4">
              <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Koniec gry! Wynik: {score}</p>
              <button onClick={start} className="mt-3 px-4 py-2 rounded-lg gradient-bg gradient-bg-hover text-white flex items-center gap-1.5 mx-auto"><RotateCcw className="w-4 h-4" /> Zagraj ponownie</button>
            </div>
          )}

          {/* Mobile controls */}
          <div className="mt-4 sm:hidden grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
            <div /><button onClick={() => setDirSafe(0, -1)} className="p-3 rounded-lg bg-slate-800 text-slate-200">↑</button><div />
            <button onClick={() => setDirSafe(-1, 0)} className="p-3 rounded-lg bg-slate-800 text-slate-200">←</button>
            <button onClick={() => setDirSafe(0, 1)} className="p-3 rounded-lg bg-slate-800 text-slate-200">↓</button>
            <button onClick={() => setDirSafe(1, 0)} className="p-3 rounded-lg bg-slate-800 text-slate-200">→</button>
          </div>
        </>
      )}
      <button onClick={onExit} className="mt-6 text-sm text-slate-400 hover:text-slate-200">Wyjście</button>
    </div>
  );
}
