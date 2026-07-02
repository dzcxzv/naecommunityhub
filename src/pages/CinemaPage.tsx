import { useEffect, useState, useRef } from 'react';
import { Film, Plus, Lock, ArrowLeft, Send, Users, Link as LinkIcon, X, Armchair } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { youtubeId } from '../lib/utils';
import type { CinemaRoom, CinemaSeat, ChatMessage } from '../lib/types';

export function CinemaPage({ onProfileClick }: { onProfileClick: (id: string) => void }) {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<CinemaRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<CinemaRoom | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [seats, setSeats] = useState<CinemaSeat[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadRooms = async () => {
    const { data } = await supabase
      .from('cinema_rooms')
      .select('*, owner_profile:profiles!owner_id(username, avatar_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setRooms(data as unknown as CinemaRoom[]);
  };

  useEffect(() => {
    loadRooms();
    const channel = supabase
      .channel('cinema-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cinema_rooms' }, () => loadRooms())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const joinRoom = async (room: CinemaRoom, password?: string) => {
    if (room.password && room.password !== password) return;
    setActiveRoom(room);
    setVideoUrl(room.video_url || '');
    // Load seats
    const { data: seatData } = await supabase
      .from('cinema_seats')
      .select('*, profile:profiles!user_id(username, avatar_url)')
      .eq('room_id', room.id);
    if (seatData) setSeats(seatData as unknown as CinemaSeat[]);
    setChat(room.chat_messages || []);
    // Realtime
    const ch = supabase
      .channel(`cinema-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cinema_seats', filter: `room_id=eq.${room.id}` }, async () => {
        const { data } = await supabase.from('cinema_seats').select('*, profile:profiles!user_id(username, avatar_url)').eq('room_id', room.id);
        if (data) setSeats(data as unknown as CinemaSeat[]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cinema_rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const r = payload.new as CinemaRoom;
        setActiveRoom(r);
        setVideoUrl(r.video_url || '');
        setChat(r.chat_messages || []);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  };

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const takeSeat = async (seatNum: number) => {
    if (!profile || !activeRoom) return;
    const occupied = seats.find(s => s.seat_number === seatNum);
    if (occupied) return;
    // Leave current seat
    await supabase.from('cinema_seats').delete().eq('room_id', activeRoom.id).eq('user_id', profile.id);
    await supabase.from('cinema_seats').insert({ room_id: activeRoom.id, user_id: profile.id, seat_number: seatNum });
  };

  const leaveSeat = async () => {
    if (!profile || !activeRoom) return;
    await supabase.from('cinema_seats').delete().eq('room_id', activeRoom.id).eq('user_id', profile.id);
  };

  const updateVideo = async () => {
    if (!activeRoom) return;
    await supabase.from('cinema_rooms').update({ video_url: videoUrl }).eq('id', activeRoom.id);
  };

  const sendChat = async () => {
    if (!profile || !activeRoom || !chatInput.trim()) return;
    const msg: ChatMessage = { user_id: profile.id, username: profile.username, content: chatInput.trim(), timestamp: Date.now() };
    const newChat = [...chat, msg];
    setChat(newChat);
    setChatInput('');
    await supabase.from('cinema_rooms').update({ chat_messages: newChat }).eq('id', activeRoom.id);
  };

  const mySeat = seats.find(s => s.user_id === profile?.id);

  if (activeRoom) {
    const ytId = youtubeId(videoUrl);
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => setActiveRoom(null)} className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"><ArrowLeft className="w-4 h-4" /> Wróć do pokoi</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video + Seats */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl glass-dark border border-white/10 p-4">
              <h2 className="text-lg font-bold text-white mb-3">{activeRoom.name}</h2>
              {ytId ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media; fullscreen" title="cinema" />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-slate-900 flex items-center justify-center">
                  <p className="text-slate-400">Brak wideo</p>
                </div>
              )}

              {/* Video URL input (host only) */}
              {profile?.id === activeRoom.owner_id && (
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Wklej link YouTube" className="w-full bg-[#0a0a14] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-400" />
                  </div>
                  <button onClick={updateVideo} className="px-3 py-2 gradient-bg gradient-bg-hover text-white rounded-lg text-sm">Ustaw</button>
                </div>
              )}
            </div>

            {/* Virtual seats - 2 rows x 5 seats */}
            <div className="rounded-2xl glass-dark border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Armchair className="w-5 h-5 text-pink-400" /> Wybierz miejsce</h3>
                {mySeat && <button onClick={leaveSeat} className="text-xs text-slate-400 hover:text-rose-400">Opuść miejsce</button>}
              </div>
              {/* Screen */}
              <div className="mx-auto w-3/4 h-2 bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded-full mb-6 opacity-60" />
              <p className="text-center text-xs text-slate-500 mb-6">EKRAN</p>

              <div className="space-y-3">
                {[0, 1].map(row => (
                  <div key={row} className="flex items-center justify-center gap-3">
                    {Array.from({ length: 5 }, (_, i) => row * 5 + i + 1).map(seatNum => {
                      const seat = seats.find(s => s.seat_number === seatNum);
                      const isMine = seat?.user_id === profile?.id;
                      return (
                        <button
                          key={seatNum}
                          onClick={() => seat ? (isMine ? leaveSeat() : null) : takeSeat(seatNum)}
                          disabled={!!seat && !isMine}
                          className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                            seat ? (isMine ? 'gradient-bg' : 'bg-slate-700 cursor-not-allowed') : 'bg-slate-800 border border-white/10 hover:border-pink-400/50 hover:bg-pink-500/10'
                          }`}
                          title={seat ? seat.profile?.username : `Miejsce ${seatNum}`}
                        >
                          {seat ? (
                            <Avatar username={seat.profile?.username || ''} avatarUrl={seat.profile?.avatar_url} size="xs" onClick={() => onProfileClick(seat.user_id)} />
                          ) : (
                            <span className="text-xs text-slate-500">{seatNum}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="rounded-2xl glass-dark border border-white/10 flex flex-col h-[500px]">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2"><Users className="w-4 h-4 text-pink-400" /> Czat pokoju</h3>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
              {chat.map((m, i) => (
                <div key={i} className="text-sm">
                  <button onClick={() => onProfileClick(m.user_id)} className="font-medium text-pink-400 hover:underline">{m.username}:</button>
                  <span className="text-slate-300"> {m.content}</span>
                </div>
              ))}
              {chat.length === 0 && <p className="text-xs text-slate-500">Brak wiadomości</p>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Wiadomość..." className="flex-1 bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-400" />
                <button onClick={sendChat} className="p-2 rounded-lg gradient-bg text-white"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Film className="w-6 h-6 text-pink-400" /> Kino</h2>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-bg gradient-bg-hover text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Utwórz pokój
        </button>
      </div>

      <div className="space-y-3">
        {rooms.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Brak pokoi kinowych. Utwórz pierwszy i zaproś znajomych!</p>
        ) : rooms.map(r => (
          <div key={r.id} className="p-4 rounded-xl glass-dark border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center"><Film className="w-5 h-5 text-pink-400" /></div>
            <div className="flex-1">
              <p className="font-medium text-slate-200">{r.name}</p>
              <p className="text-xs text-slate-400">Host: {r.owner_profile?.username}</p>
            </div>
            {r.password && <Lock className="w-4 h-4 text-slate-400" />}
            <JoinCinemaButton room={r} onJoin={(pw) => joinRoom(r, pw)} />
          </div>
        ))}
      </div>

      {showCreate && profile && <CreateCinemaModal onClose={() => setShowCreate(false)} onCreated={(room) => { setShowCreate(false); joinRoom(room); }} />}
    </div>
  );
}

function JoinCinemaButton({ room, onJoin }: { room: CinemaRoom; onJoin: (pw?: string) => void }) {
  const [showPass, setShowPass] = useState(false);
  const [pass, setPass] = useState('');
  if (room.password && !showPass) {
    return <button onClick={() => setShowPass(true)} className="px-3 py-1.5 rounded-lg gradient-bg gradient-bg-hover text-white text-sm">Dołącz</button>;
  }
  if (room.password && showPass) {
    return (
      <div className="flex gap-1">
        <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="Hasło" className="w-24 bg-[#0a0a14] border border-white/10 rounded-lg px-2 py-1 text-sm text-slate-200" />
        <button onClick={() => onJoin(pass)} className="px-3 py-1.5 rounded-lg gradient-bg text-white text-sm">Wejdź</button>
      </div>
    );
  }
  return <button onClick={() => onJoin()} className="px-3 py-1.5 rounded-lg gradient-bg gradient-bg-hover text-white text-sm">Dołącz</button>;
}

function CreateCinemaModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: CinemaRoom) => void }) {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const create = async () => {
    if (!profile || !name.trim()) return;
    const { data } = await supabase
      .from('cinema_rooms')
      .insert({ owner_id: profile.id, name: name.trim(), password: password || null, video_url: videoUrl || '', is_active: true, chat_messages: [] })
      .select('*, owner_profile:profiles!owner_id(username, avatar_url)')
      .single();
    if (data) onCreated(data as unknown as CinemaRoom);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md glass-dark rounded-2xl border border-white/10 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Utwórz pokój kinowy</h2>
          <button onClick={onClose} className="text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nazwa pokoju</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Movie Night" className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Link YouTube (opcjonalne)</label>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Hasło (opcjonalne)</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Zostaw puste dla publicznego" className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-400" />
          </div>
          <button onClick={create} disabled={!name.trim()} className="w-full py-2.5 rounded-xl gradient-bg gradient-bg-hover disabled:opacity-50 text-white font-medium">Utwórz pokój</button>
        </div>
      </div>
    </div>
  );
}
