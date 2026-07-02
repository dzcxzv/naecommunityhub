import { useEffect, useState } from 'react';
import { Gamepad2, Trophy, Users, Lock, Plus, ArrowLeft, Play, Zap, Brain, Hash, Calculator, Ghost as SnakeIcon, BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import type { GameRoom, GameScore } from '../lib/types';
import { HangmanGame } from '../games/HangmanGame';
import { PictionaryGame } from '../games/PictionaryGame';
import { ReflexGame } from '../games/ReflexGame';
import { MemoryGame } from '../games/MemoryGame';
import { WordGuessGame } from '../games/WordGuessGame';
import { MathSprintGame } from '../games/MathSprintGame';
import { SnakeGame } from '../games/SnakeGame';

export const GAME_TYPES = [
  { id: 'hangman', name: 'Wisielec', icon: BookOpen, multiplayer: true, desc: 'Odgadywanie słów, pokoje do 10 graczy' },
  { id: 'pictionary', name: 'Pictionary', icon: Gamepad2, multiplayer: true, desc: 'Rysuj i zgaduj z przyjaciółmi' },
  { id: 'reflex', name: 'Refleks', icon: Zap, multiplayer: false, desc: 'Przetestuj szybkość reakcji' },
  { id: 'memory', name: 'Pamięć', icon: Brain, multiplayer: false, desc: 'Znajdź pasujące pary kart' },
  { id: 'wordguess', name: 'Zgadnij słowo', icon: Hash, multiplayer: false, desc: 'Odgadnij ukryte słowo' },
  { id: 'mathsprint', name: 'Matematyczny sprint', icon: Calculator, multiplayer: false, desc: 'Rozwiązuj zadania na czas' },
  { id: 'snake', name: 'Snake', icon: SnakeIcon, multiplayer: false, desc: 'Klasyczna gra w węża' },
];

export function GamesPage({ onProfileClick }: { onProfileClick: (id: string) => void }) {
  const { profile } = useAuth();
  const [view, setView] = useState<'hub' | 'leaderboard' | 'room' | 'game'>('hub');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [scoreGame, setScoreGame] = useState<string>('reflex');

  const loadRooms = async () => {
    const { data } = await supabase
      .from('game_rooms')
      .select('*, owner_profile:profiles!owner_id(username, avatar_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) {
      const roomsWithCounts = await Promise.all((data as unknown as GameRoom[]).map(async r => {
        const { count } = await supabase.from('game_room_members').select('*', { count: 'exact', head: true }).eq('room_id', r.id);
        return { ...r, member_count: count || 0 };
      }));
      setRooms(roomsWithCounts);
    }
  };

  useEffect(() => {
    loadRooms();
    const channel = supabase
      .channel('game-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms' }, () => loadRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_room_members' }, () => loadRooms())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadLeaderboard = async (game: string) => {
    const { data } = await supabase.from('game_scores').select('*, profile:profiles!user_id(username, avatar_url)').eq('game_type', game).order('score', { ascending: false }).limit(20);
    if (data) setScores(data as unknown as GameScore[]);
  };

  useEffect(() => { if (view === 'leaderboard') loadLeaderboard(scoreGame); }, [scoreGame, view]);

  const playSolo = (gameId: string) => { setSelectedGame(gameId); setView('game'); };

  const saveScore = async (gameType: string, score: number) => {
    if (!profile) return;
    await supabase.from('game_scores').insert({ user_id: profile.id, game_type: gameType, score });
  };

  if (view === 'game' && selectedGame) {
    const gameProps = { onExit: () => { setView('hub'); setSelectedGame(null); }, onSaveScore: (score: number) => saveScore(selectedGame, score), profile };
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={gameProps.onExit} className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Wróć do gier</button>
        {selectedGame === 'reflex' && <ReflexGame {...gameProps} />}
        {selectedGame === 'memory' && <MemoryGame {...gameProps} />}
        {selectedGame === 'wordguess' && <WordGuessGame {...gameProps} />}
        {selectedGame === 'mathsprint' && <MathSprintGame {...gameProps} />}
        {selectedGame === 'snake' && <SnakeGame {...gameProps} />}
      </div>
    );
  }

  if (view === 'room' && activeRoom) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => { setView('hub'); setActiveRoom(null); }} className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Wróć do gier</button>
        {activeRoom.game_type === 'hangman' && <HangmanGame room={activeRoom} onProfileClick={onProfileClick} />}
        {activeRoom.game_type === 'pictionary' && <PictionaryGame room={activeRoom} onProfileClick={onProfileClick} />}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {view === 'leaderboard' ? (
        <>
          <button onClick={() => setView('hub')} className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Wróć do gier</button>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-400" /> Ranking</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {GAME_TYPES.filter(g => !g.multiplayer).map(g => (
              <button key={g.id} onClick={() => setScoreGame(g.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${scoreGame === g.id ? 'gradient-bg text-white' : 'glass-dark border border-white/10 text-slate-400 hover:text-white'}`}>{g.name}</button>
            ))}
          </div>
          <div className="rounded-2xl glass-dark border border-white/10 overflow-hidden">
            {scores.length === 0 ? <p className="text-center text-slate-400 py-12">Brak wyników. Zagraj w grę!</p> : scores.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 ${i === 0 ? 'bg-amber-500/5' : ''}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-400'}`}>{i + 1}</span>
                <Avatar username={s.profile?.username || ''} avatarUrl={s.profile?.avatar_url} size="sm" onClick={() => onProfileClick(s.user_id)} />
                <button onClick={() => onProfileClick(s.user_id)} className="flex-1 text-sm font-medium text-white hover:text-pink-400 text-left">{s.profile?.username}</button>
                <span className="font-bold gradient-text">{s.score} pkt</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Gamepad2 className="w-6 h-6 gradient-text" /> Mini-gry</h2>
            <button onClick={() => setView('leaderboard')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-dark border border-white/10 text-sm text-slate-300 hover:border-pink-400/50 transition-colors">
              <Trophy className="w-4 h-4 text-amber-400" /> Ranking
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {GAME_TYPES.map((g, i) => {
              const Icon = g.icon;
              return (
                <div key={g.id} className="p-5 rounded-2xl glass-dark border border-white/10 hover:border-pink-400/30 transition-all animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center gradient-glow">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {g.multiplayer && <span className="px-2 py-0.5 rounded text-xs bg-cyan-400/20 text-cyan-400">Multiplayer</span>}
                  </div>
                  <h3 className="font-semibold text-white">{g.name}</h3>
                  <p className="text-sm text-slate-400 mt-1 mb-4">{g.desc}</p>
                  <button onClick={() => playSolo(g.id)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg gradient-bg gradient-bg-hover text-white text-sm font-medium transition-all">
                    <Play className="w-3.5 h-3.5" /> Graj
                  </button>
                </div>
              );
            })}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 gradient-text" /> Pokoje multiplayer</h3>
            </div>
            <div className="space-y-3">
              {rooms.filter(r => GAME_TYPES.find(g => g.id === r.game_type)?.multiplayer).map(r => (
                <div key={r.id} className="p-4 rounded-xl glass-dark border border-white/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                    {(() => { const g = GAME_TYPES.find(g => g.id === r.game_type); return g ? <g.icon className="w-5 h-5 text-white" /> : null; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="text-xs text-slate-400">{GAME_TYPES.find(g => g.id === r.game_type)?.name} • Host: {r.owner_profile?.username}</p>
                  </div>
                  {r.password && <Lock className="w-4 h-4 text-slate-400" />}
                  <span className="text-xs text-slate-400">{r.member_count}/{r.max_players}</span>
                  <JoinRoomButton room={r} onJoin={(room) => { setActiveRoom(room); setView('room'); }} />
                </div>
              ))}
              {rooms.filter(r => GAME_TYPES.find(g => g.id === r.game_type)?.multiplayer).length === 0 && (
                <p className="text-center text-slate-400 py-6">Brak aktywnych pokoi. Utwórz pierwszy!</p>
              )}
            </div>
            <button onClick={() => setShowCreate(true)} className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-bg gradient-bg-hover text-white text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> Utwórz pokój
            </button>
          </div>
        </>
      )}

      {showCreate && profile && <CreateRoomModal onClose={() => setShowCreate(false)} onCreated={(room) => { setActiveRoom(room); setView('room'); setShowCreate(false); }} />}
    </div>
  );
}

function JoinRoomButton({ room, onJoin }: { room: GameRoom; onJoin: (r: GameRoom) => void }) {
  const { profile } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [pass, setPass] = useState('');

  const join = async () => {
    if (!profile) return;
    if (room.password && room.password !== pass) return;
    await supabase.from('game_room_members').insert({ room_id: room.id, user_id: profile.id });
    onJoin(room);
  };

  if (room.password && !showPass) return <button onClick={() => setShowPass(true)} className="px-3 py-1.5 rounded-lg gradient-bg gradient-bg-hover text-white text-sm">Dołącz</button>;
  if (room.password && showPass) return (
    <div className="flex gap-1">
      <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Hasło" className="w-24 bg-[#0a0a14] border border-white/10 rounded-lg px-2 py-1 text-sm text-white" />
      <button onClick={join} className="px-3 py-1.5 rounded-lg gradient-bg text-white text-sm">Wejdź</button>
    </div>
  );
  return <button onClick={join} className="px-3 py-1.5 rounded-lg gradient-bg gradient-bg-hover text-white text-sm">Dołącz</button>;
}

function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: GameRoom) => void }) {
  const { profile } = useAuth();
  const [gameType, setGameType] = useState('hangman');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const create = async () => {
    if (!profile || !name.trim()) return;
    setError('');
    setLoading(true);

    // Step 1: insert the room — omit owner_id, let DEFAULT auth.uid() handle it
    const { data, error: insertError } = await supabase
      .from('game_rooms')
      .insert({
        game_type: gameType,
        name: name.trim(),
        password: password || null,
        max_players: maxPlayers,
        is_active: true,
        game_state: {},
      })
      .select('id, owner_id, game_type, name, password, max_players, is_active, game_state, created_at')
      .maybeSingle();

    if (insertError || !data) {
      setError(insertError?.message || 'Nie udało się utworzyć pokoju');
      setLoading(false);
      return;
    }

    // Step 2: join the room as a member — omit user_id, let DEFAULT auth.uid() handle it
    const { error: memberError } = await supabase
      .from('game_room_members')
      .insert({ room_id: data.id });

    if (memberError) {
      console.warn('Failed to join room as member:', memberError.message);
    }

    // Fetch the owner profile
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', profile.id)
      .maybeSingle();

    onCreated({ ...data, owner_profile: ownerProfile as any, member_count: 1 } as unknown as GameRoom);
    setLoading(false);
  };

  const mpGames = GAME_TYPES.filter(g => g.multiplayer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md glass-dark rounded-2xl border border-white/10 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-4">Utwórz pokój</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Gra</label>
            <select value={gameType} onChange={e => setGameType(e.target.value)} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400">
              {mpGames.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nazwa pokoju</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Mój super pokój" className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Hasło (opcjonalne)</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Zostaw puste dla publicznego" className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Maks. graczy: {maxPlayers}</label>
            <input type="range" min="2" max="10" value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} className="w-full accent-pink-400" />
          </div>
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-sm text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl glass-dark border border-white/10 text-slate-300 text-sm">Anuluj</button>
            <button onClick={create} disabled={!name.trim() || loading} className="flex-1 py-2 rounded-xl gradient-bg gradient-bg-hover disabled:opacity-50 text-white text-sm">{loading ? 'Tworzenie...' : 'Utwórz'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
