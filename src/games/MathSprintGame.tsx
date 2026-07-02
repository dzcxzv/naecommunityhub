import { useState, useEffect, useRef, useCallback } from 'react';
import { Calculator, RotateCcw, Timer } from 'lucide-react';

interface Props {
  onExit: () => void;
  onSaveScore: (score: number) => void;
}

function generateProblem(): { text: string; answer: number } {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * 20) + 1;
  let b = Math.floor(Math.random() * 20) + 1;
  if (op === '-' && b > a) [a, b] = [b, a];
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
  return { text: `${a} ${op} ${b}`, answer };
}

export function MathSprintGame({ onExit, onSaveScore }: Props) {
  const [problem, setProblem] = useState(generateProblem());
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'done'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(() => {
    if (Number(answer) === problem.answer) {
      setScore(s => s + 1);
      setProblem(generateProblem());
    }
    setAnswer('');
  }, [answer, problem]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameState('done');
          onSaveScore(score * 10);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, score, onSaveScore]);

  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) inputRef.current.focus();
  }, [gameState, problem]);

  const start = () => {
    setScore(0);
    setTimeLeft(30);
    setProblem(generateProblem());
    setGameState('playing');
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2"><Calculator className="w-6 h-6 text-pink-400" /> Matematyczny sprint</h2>

      {gameState === 'idle' && (
        <div className="py-8">
          <p className="text-slate-400 mb-6">Rozwiąż jak najwięcej zadań w 30 sekund!</p>
          <button onClick={start} className="px-6 py-3 rounded-xl gradient-bg gradient-bg-hover text-white font-medium">Start</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="py-8">
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className="flex items-center gap-1.5 text-slate-400"><Timer className="w-5 h-5 text-amber-400" /> {timeLeft}s</span>
            <span className="text-slate-400">Wynik: <span className="font-bold text-pink-400">{score}</span></span>
          </div>
          <p className="text-5xl font-bold text-white mb-6 font-mono">{problem.text} = ?</p>
          <input
            ref={inputRef}
            type="number"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="w-32 text-center text-2xl font-bold bg-slate-900/60 border-2 border-pink-400/40 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-pink-400 mx-auto block"
            placeholder="?"
          />
        </div>
      )}

      {gameState === 'done' && (
        <div className="py-8">
          <p className="text-4xl font-bold text-pink-400 mb-2">{score}</p>
          <p className="text-slate-300 mb-4">zadań rozwiązanych!</p>
          <button onClick={start} className="px-4 py-2 rounded-lg gradient-bg gradient-bg-hover text-white flex items-center gap-1.5 mx-auto"><RotateCcw className="w-4 h-4" /> Zagraj ponownie</button>
        </div>
      )}
      <button onClick={onExit} className="mt-6 text-sm text-slate-400 hover:text-slate-200">Wyjście</button>
    </div>
  );
}
