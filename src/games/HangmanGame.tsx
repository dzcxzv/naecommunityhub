import { useEffect, useState, useRef } from 'react';
import { Send, Users, BookOpen, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import type { GameRoom, Profile } from '../lib/types';

const WORDS = ['javascript', 'hangman', 'computer', 'keyboard', 'internet', 'program', 'algorithm', 'database', 'network', 'function', 'variable', 'browser', 'platform', 'community', 'gaming'];

interface Member { user_id: string; profile?: Profile; }
interface ChatMsg { user_id: string; username: string; content: string; timestamp: number; }

export function HangmanGame({ room, onProfileClick }: { room: GameRoom; onProfileClick: (id: string) => void }) {
  const { profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const maxWrong = 6;
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load members
    (async () => {
      const { data } = await supabase.from('game_room_members').select('user_id').eq('room_id', room.id);
      if (data) {
        const ids = data.map(d => d.user_id);
        const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
        setMembers((profs || []).map(p => ({ user_id: p.id, profile: p as Profile })));
      }
    })();

    // Load game state
    if (room.game_state && (room.game_state as any).word) {
      setWord((room.game_state as any).word);
      setGuessed(new Set((room.game_state as any).guessed || []));
      setWrong((room.game_state as any).wrong || 0);
    } else {
      const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
      setWord(newWord);
      supabase.from('game_rooms').update({ game_state: { word: newWord, guessed: [], wrong: 0 } }).eq('id', room.id);
    }

    // Realtime
    const channel = supabase
      .channel(`hangman-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const gs = (payload.new as GameRoom).game_state as any;
        if (gs) {
          if (gs.word) setWord(gs.word);
          if (gs.guessed) setGuessed(new Set(gs.guessed));
          if (gs.wrong !== undefined) setWrong(gs.wrong);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_room_members', filter: `room_id=eq.${room.id}` }, () => {
        (async () => {
          const { data } = await supabase.from('game_room_members').select('user_id').eq('room_id', room.id);
          if (data) {
            const ids = data.map(d => d.user_id);
            const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
            setMembers((profs || []).map(p => ({ user_id: p.id, profile: p as Profile })));
          }
        })();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const saveState = async (newWord: string, newGuessed: Set<string>, newWrong: number) => {
    await supabase.from('game_rooms').update({ game_state: { word: newWord, guessed: Array.from(newGuessed), wrong: newWrong } }).eq('id', room.id);
  };

  const guess = async (letter: string) => {
    if (guessed.has(letter) || !word) return;
    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);
    const newWrong = word.includes(letter) ? wrong : wrong + 1;
    setWrong(newWrong);
    await saveState(word, newGuessed, newWrong);
  };

  const newRound = async () => {
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(newWord);
    setGuessed(new Set());
    setWrong(0);
    await saveState(newWord, new Set(), 0);
  };

  const sendChat = async () => {
    if (!profile || !chatInput.trim()) return;
    const msg: ChatMsg = { user_id: profile.id, username: profile.username, content: chatInput.trim(), timestamp: Date.now() };
    setChat(prev => [...prev, msg]);
    setChatInput('');
  };

  const won = word.length > 0 && word.split('').every(l => guessed.has(l));
  const lost = wrong >= maxWrong;
  const display = word.split('').map(l => guessed.has(l) ? l : '_').join(' ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Game area */}
      <div className="lg:col-span-2 p-6 rounded-2xl glass-dark border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><BookOpen className="w-5 h-5 text-pink-400" /> {room.name}</h2>
          <span className="flex items-center gap-1 text-sm text-slate-400"><Users className="w-4 h-4" /> {members.length}/{room.max_players}</span>
        </div>

        <div className="mb-6 text-center">
          <p className={`text-3xl font-mono font-bold tracking-widest ${lost ? 'text-rose-400' : 'text-pink-400'}`}>{lost ? word : display}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: maxWrong }, (_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full ${i < wrong ? 'bg-rose-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        {won || lost ? (
          <div className="text-center py-4">
            <Trophy className={`w-12 h-12 mx-auto mb-2 ${won ? 'text-amber-400' : 'text-slate-500'}`} />
            <p className={`text-xl font-bold ${won ? 'text-emerald-400' : 'text-rose-400'}`}>{won ? 'Słowo odgadnięte!' : 'Koniec gry!'}</p>
            <button onClick={newRound} className="mt-3 px-4 py-2 rounded-lg gradient-bg gradient-bg-hover text-white text-sm">Nowa runda</button>
          </div>
        ) : (
          <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 max-w-lg mx-auto">
            {'abcdefghijklmnopqrstuvwxyz'.split('').map(l => (
              <button key={l} onClick={() => guess(l)} disabled={guessed.has(l)}
                className={`aspect-square rounded-lg font-bold uppercase text-sm transition-colors ${guessed.has(l) ? (word.includes(l) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400 line-through') : 'bg-slate-800 text-slate-300 hover:gradient-bg hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Members + Chat */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl glass-dark border border-white/10">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Gracze ({members.length})</h3>
          <div className="space-y-2">
            {members.map(m => m.profile && (
              <button key={m.user_id} onClick={() => onProfileClick(m.user_id)} className="w-full flex items-center gap-2 hover:bg-white/5 rounded-lg p-1">
                <Avatar username={m.profile.username} avatarUrl={m.profile.avatar_url} size="sm" />
                <span className="text-sm text-slate-200">{m.profile.username}</span>
                {m.user_id === room.owner_id && <span className="ml-auto text-xs text-amber-400">Host</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-dark border border-white/10 flex flex-col h-64">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Czat pokoju</h3>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 mb-2">
            {chat.map((m, i) => (
              <div key={i} className="text-sm"><span className="font-medium text-pink-400">{m.username}:</span> <span className="text-slate-300">{m.content}</span></div>
            ))}
            {chat.length === 0 && <p className="text-xs text-slate-500">Brak wiadomości</p>}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Czat..." className="flex-1 bg-[#0a0a14] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-pink-400" />
            <button onClick={sendChat} className="p-1.5 rounded-lg gradient-bg text-white"><Send className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
