import { useState, useEffect, useCallback } from 'react';
import { Calculator, RotateCcw, Timer } from 'lucide-react';

interface Props {
  onExit: () => void;
  onSaveScore: (score: number) => void;
}

function generateProblem(): { text: string; answer: number; options: number[] } {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * 20) + 1;
  let b = Math.floor(Math.random() * 20) + 1;
  if (op === '-' && b > a) [a, b] = [b, a];
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;

  // Generate 3 wrong options, making sure they're different from the answer
  const options: number[] = [answer];
  while (options.length < 3) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrongAnswer = answer + (offset === 0 ? (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1) : offset);
    if (wrongAnswer !== answer && wrongAnswer >= 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  // Shuffle options
  options.sort(() => Math.random() - 0.5);

  return { text: `${a} ${op} ${b}`, answer, options };
}

export function MathSprintGame({ onExit, onSaveScore }: Props) {
  const [problem, setProblem] = useState(generateProblem());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'done'>('idle');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const selectAnswer = useCallback((selected: number) => {
    if (feedback) return; // Prevent clicking during feedback
    if (selected === problem.answer) {
      setFeedback('correct');
      setScore(s => s + 1);
      setTimeout(() => {
        setFeedback(null);
        setProblem(generateProblem());
      }, 200);
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
      }, 300);
    }
  }, [problem, feedback]);

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

  const start = () => {
    setScore(0);
    setTimeLeft(30);
    setProblem(generateProblem());
    setGameState('playing');
    setFeedback(null);
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
          <p className="text-5xl font-bold text-white mb-8 font-mono">{problem.text} = ?</p>

          <div className="flex justify-center gap-4">
            {problem.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(opt)}
                className={`w-20 h-20 rounded-2xl text-3xl font-bold transition-all duration-150 ${
                  feedback === 'correct' && opt === problem.answer
                    ? 'bg-emerald-500 text-white scale-110'
                    : feedback === 'wrong' && opt === problem.answer
                    ? 'bg-emerald-500 text-white'
                    : feedback === 'wrong'
                    ? 'bg-rose-500/30 text-rose-300 scale-90'
                    : 'bg-slate-800 border-2 border-white/10 text-white hover:border-pink-400 hover:scale-105'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
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
