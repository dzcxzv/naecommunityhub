import { useState, useEffect } from 'react';
import { Brain, RotateCcw, Trophy } from 'lucide-react';

interface Props {
  onExit: () => void;
  onSaveScore: (score: number) => void;
}

const EMOJIS = ['🎮', '🎯', '🎨', '🎵', '🚀', '⚡', '🔥', '💎'];

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean; }

export function MemoryGame({ onExit, onSaveScore }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [won, setWon] = useState(false);

  const init = () => {
    const deck = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setWon(false);
  };

  useEffect(init, []);

  const flip = (id: number) => {
    if (flipped.length === 2 || cards[id].flipped || cards[id].matched) return;
    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, matched: true } : c));
          setMatches(m => m + 1);
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 800);
      }
    }
  };

  useEffect(() => {
    if (matches === EMOJIS.length) {
      setWon(true);
      const score = Math.max(0, 1000 - moves * 20);
      onSaveScore(score);
    }
  }, [matches, moves, onSaveScore]);

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2"><Brain className="w-6 h-6 text-pink-400" /> Pamięć</h2>
      <div className="flex items-center justify-center gap-6 mb-6">
        <span className="text-sm text-slate-400">Ruchy: <span className="font-bold text-slate-200">{moves}</span></span>
        <span className="text-sm text-slate-400">Pary: <span className="font-bold text-slate-200">{matches}/{EMOJIS.length}</span></span>
      </div>

      {won ? (
        <div className="py-8">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <p className="text-2xl font-bold text-white">Wygrałeś w {moves} ruchach!</p>
          <button onClick={init} className="mt-4 px-4 py-2 rounded-lg gradient-bg gradient-bg-hover text-white flex items-center gap-1.5 mx-auto"><RotateCcw className="w-4 h-4" /> Zagraj ponownie</button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
          {cards.map(c => (
            <button
              key={c.id}
              onClick={() => flip(c.id)}
              className={`aspect-square rounded-xl flex items-center justify-center text-3xl transition-all ${c.flipped || c.matched ? 'bg-pink-500/20 border border-pink-400/40' : 'bg-slate-800 border border-white/10 hover:border-pink-400/30'}`}
            >
              {c.flipped || c.matched ? c.emoji : '?'}
            </button>
          ))}
        </div>
      )}
      <button onClick={onExit} className="mt-6 text-sm text-slate-400 hover:text-slate-200">Wyjście</button>
    </div>
  );
}
