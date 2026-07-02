import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Users, Pencil, Eraser, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import type { GameRoom, Profile } from '../lib/types';

const WORDS = ['kot', 'dom', 'drzewo', 'słońce', 'księżyc', 'samochód', 'pizza', 'gitara', 'robot', 'rakieta', 'kwiat', 'motyl', 'parasol', 'kanapka', 'teleskop', 'ptak', 'ryba', 'samolot', 'pociąg', 'statek', 'góry', 'rzeka', 'plaża', 'las', 'most', 'zamek', 'wieża', 'gwiazda', 'serce', 'tęcza'];

interface Member { user_id: string; profile?: Profile; }
interface ChatMsg { user_id: string; username: string; content: string; correct?: boolean; timestamp: number; }

export function PictionaryGame({ room, onProfileClick }: { room: GameRoom; onProfileClick: (id: string) => void }) {
  const { profile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#33a4ff');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [members, setMembers] = useState<Member[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [roundEnd, setRoundEnd] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const isDrawer = profile?.id === drawerId;

  // Load initial state
  useEffect(() => {
    (async () => {
      const { data: memberData } = await supabase.from('game_room_members').select('user_id').eq('room_id', room.id);
      if (memberData) {
        const ids = memberData.map(d => d.user_id);
        const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
        const mems = (profs || []).map(p => ({ user_id: p.id, profile: p as Profile }));
        setMembers(mems);
        const gs = room.game_state as any;
        if (gs && gs.word) {
          setCurrentWord(gs.word);
          setDrawerId(gs.drawerId || room.owner_id);
          setRoundEnd(!!gs.roundEnd);
        } else {
          // Initialize: pick a word and drawer
          const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
          setCurrentWord(newWord);
          setDrawerId(room.owner_id);
          await supabase.from('game_rooms').update({ game_state: { word: newWord, drawerId: room.owner_id, roundEnd: false } }).eq('id', room.id);
        }
      }
    })();

    const channel = supabase
      .channel(`pictionary-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const gs = (payload.new as GameRoom).game_state as any;
        if (gs) {
          if (gs.word) setCurrentWord(gs.word);
          if (gs.drawerId) setDrawerId(gs.drawerId);
          if (gs.roundEnd !== undefined) setRoundEnd(gs.roundEnd);
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

  // Canvas drawing - fixed cursor alignment
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();
    const pos = getPos(e);
    if (!pos) return;
    setDrawing(true);
    lastPos.current = pos;
    draw(e);
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const pos = getPos(e);
    if (!canvas || !ctx || !pos || !lastPos.current) return;
    ctx.strokeStyle = tool === 'eraser' ? '#1e293b' : color;
    ctx.lineWidth = tool === 'eraser' ? 20 : brushSize;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawer, drawing, color, brushSize, tool]);

  const stopDraw = () => { setDrawing(false); lastPos.current = null; };

  const clearCanvas = () => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const newRound = async () => {
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(newWord);
    setRoundEnd(false);
    clearCanvas();
    await supabase.from('game_rooms').update({ game_state: { word: newWord, drawerId: drawerId, roundEnd: false } }).eq('id', room.id);
  };

  const sendChat = async () => {
    if (!profile || !chatInput.trim()) return;
    const isCorrect = chatInput.trim().toLowerCase() === currentWord.toLowerCase();
    const msg: ChatMsg = { user_id: profile.id, username: profile.username, content: chatInput.trim(), correct: isCorrect, timestamp: Date.now() };
    setChat(prev => [...prev, msg]);
    setChatInput('');
    if (isCorrect && !isDrawer) {
      // Round won
      setRoundEnd(true);
      await supabase.from('game_rooms').update({ game_state: { word: currentWord, drawerId, roundEnd: true } }).eq('id', room.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Drawing area */}
      <div className="lg:col-span-2 p-4 rounded-2xl glass-dark border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-100">{room.name}</h2>
          <span className="flex items-center gap-1 text-sm text-slate-400"><Users className="w-4 h-4" /> {members.length}/{room.max_players}</span>
        </div>

        {/* Word display */}
        <div className="mb-3 text-center">
          {isDrawer ? (
            <p className="text-sm text-slate-400">Rysuj: <span className="font-bold text-pink-400 text-lg">{currentWord}</span></p>
          ) : (
            <p className="text-sm text-slate-400">{roundEnd ? <>Słowo to: <span className="font-bold text-slate-200">{currentWord}</span></> : 'Odgadnij rysunek!'}</p>
          )}
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className={`w-full rounded-xl bg-slate-900 border border-white/10 ${isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
        />

        {/* Tools */}
        {isDrawer && !roundEnd && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button onClick={() => setTool('pen')} className={`p-2 rounded-lg ${tool === 'pen' ? 'gradient-bg text-white' : 'bg-slate-800 text-slate-400'}`}><Pencil className="w-4 h-4" /></button>
            <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg ${tool === 'eraser' ? 'gradient-bg text-white' : 'bg-slate-800 text-slate-400'}`}><Eraser className="w-4 h-4" /></button>
            <div className="flex gap-1">
              {['#33a4ff', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#ffffff'].map(c => (
                <button key={c} onClick={() => { setColor(c); setTool('pen'); }} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`} style={{ background: c }} />
              ))}
            </div>
            <input type="range" min="1" max="10" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="accent-pink-400" />
            <button onClick={clearCanvas} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}

        {roundEnd && (
          <div className="mt-3 text-center">
            <button onClick={newRound} className="px-4 py-2 rounded-lg gradient-bg gradient-bg-hover text-white text-sm flex items-center gap-1.5 mx-auto"><Check className="w-4 h-4" /> Nowa runda</button>
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
                {m.user_id === drawerId && <span className="ml-auto text-xs text-pink-400">Rysuje</span>}
                {m.user_id === room.owner_id && <span className="ml-auto text-xs text-amber-400">Host</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-dark border border-white/10 flex flex-col h-72">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Czat zgadywania</h3>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 mb-2">
            {chat.map((m, i) => (
              <div key={i} className={`text-sm ${m.correct ? 'text-emerald-400 font-medium' : ''}`}>
                <span className="font-medium text-pink-400">{m.username}:</span> {m.correct ? 'odgadł słowo!' : m.content}
              </div>
            ))}
            {chat.length === 0 && <p className="text-xs text-slate-500">Wpisz swoje odpowiedzi tutaj</p>}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} disabled={isDrawer} placeholder={isDrawer ? "Rysujesz..." : "Zgadnij..."} className="flex-1 bg-[#0a0a14] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-pink-400 disabled:opacity-50" />
            <button onClick={sendChat} disabled={isDrawer} className="p-1.5 rounded-lg gradient-bg text-white disabled:opacity-50"><Send className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
