import { useState, useEffect } from 'react';
import { Hash, RotateCcw } from 'lucide-react';

interface Props {
  onExit: () => void;
  onSaveScore: (score: number) => void;
}

const WORDS = ['gaming', 'music', 'cinema', 'rocket', 'forest', 'puzzle', 'wizard', 'island', 'castle', 'planet', 'dragon', 'silver', 'galaxy', 'thunder', 'crystal'];

export function WordGuessGame({ onExit, onSaveScore }: Props) {
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const maxWrong = 6;

  const init = () => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuessed(new Set());
    setWrong(0);
  };

  useEffect(init, []);

  const guess = (letter: string) => {
    if (guessed.has(letter)) return;
    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);
    if (!word.includes(letter)) setWrong(w => w + 1);
  };

  const won = word.length > 0 && word.split('').every(l => guessed.has(l));
  const lost = wrong >= maxWrong;

  useEffect(() => {
    if (won) onSaveScore(Math.max(0, 1000 - wrong * 100));
  }, [won, wrong, onSaveScore]);

  const display = word.split('').map(l => guessed.has(l) ? l : '_').join(' ');

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2"><Hash className="w-6 h-6 text-pink-400" /> Zgadnij słowo</h2>
      <p className="text-slate-400 mb-6">Odgadnij ukryte słowo!</p>

      <div className="mb-6">
        <p className={`text-3xl font-mono font-bold tracking-widest ${lost ? 'text-rose-400' : 'text-pink-400'}`}>{lost ? word : display}</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: maxWrong }, (_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${i < wrong ? 'bg-rose-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {won || lost ? (
        <div className="py-4">
          <p className={`text-2xl font-bold ${won ? 'text-emerald-400' : 'text-rose-400'}`}>{won ? 'Wygrałeś!' : 'Koniec gry!'}</p>
          <button onClick={init} className="mt-4 px-4 py-2 rounded-lg gradient-bg gradient-bg-hover text-white flex items-center gap-1.5 mx-auto"><RotateCcw className="w-4 h-4" /> Nowe słowo</button>
        </div>
      ) : (
        <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 max-w-lg mx-auto">
          {'abcdefghijklmnopqrstuvwxyz'.split('').map(l => (
            <button
              key={l}
              onClick={() => guess(l)}
              disabled={guessed.has(l)}
              className={`aspect-square rounded-lg font-bold uppercase text-sm transition-colors ${
                guessed.has(l) ? (word.includes(l) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400 line-through') : 'bg-slate-800 text-slate-300 gradient-bg-hover hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      <button onClick={onExit} className="mt-6 text-sm text-slate-400 hover:text-slate-200">Wyjście</button>
    </div>
  );
}
