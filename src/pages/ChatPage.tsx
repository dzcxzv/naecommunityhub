import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Hash, MessageSquare, Timer, Search, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { StatusDot, STATUS_CONFIG } from '../components/StatusDot';
import { formatTime, formatCountdown } from '../lib/utils';
import type { Profile, CommunityMessage, DirectMessage } from '../lib/types';

export function ChatPage({ onProfileClick, onUnreadChange }: { onProfileClick: (id: string) => void; onUnreadChange: (chat: number, dm: number) => void }) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'community' | 'dm'>('community');
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [input, setInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [nextDelete, setNextDelete] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const [dmUsers, setDmUsers] = useState<{ profile: Profile; lastMsg: DirectMessage; unread: number }[]>([]);
  const [activeDm, setActiveDm] = useState<Profile | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [dmInput, setDmInput] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dmEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from('community_messages').select('*, profile:profiles!user_id(username, avatar_url)').order('created_at', { ascending: true }).limit(200);
    if (data) { setMessages(data as unknown as CommunityMessage[]); if (data.length > 0) setNextDelete(new Date(data[0].expires_at)); }
  }, []);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel('community-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, (payload) => {
        (async () => {
          const { data: p } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.user_id).maybeSingle();
          setMessages(prev => [...prev, { ...payload.new, profile: p as unknown as Profile } as unknown as CommunityMessage]);
        })();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_messages' }, () => loadMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadMessages]);

  useEffect(() => {
    const timer = setInterval(() => { if (nextDelete) setCountdown(formatCountdown(nextDelete.getTime() - Date.now())); }, 1000);
    return () => clearInterval(timer);
  }, [nextDelete]);

  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) { const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200; if (isNearBottom) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!profile || (!input.trim() && !imageUrl)) return;
    const prevInput = input;
    const prevImage = imageUrl;
    setInput(''); setImageUrl(''); setShowImageInput(false);
    const { data } = await supabase
      .from('community_messages')
      .insert({ user_id: profile.id, content: prevInput.trim() || ' ', image_url: prevImage || null })
      .select('*, profile:profiles!user_id(username, avatar_url)')
      .maybeSingle();
    if (data) setMessages(prev => [...prev, data as unknown as CommunityMessage]);
  };

  const loadDmList = useCallback(async () => {
    if (!profile) return;
    const { data: msgs } = await supabase.from('direct_messages').select('*').or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`).order('created_at', { ascending: false });
    if (!msgs) return;
    const userMap = new Map<string, { lastMsg: DirectMessage; unread: number }>();
    for (const m of msgs as DirectMessage[]) {
      const otherId = m.sender_id === profile.id ? m.receiver_id : m.sender_id;
      const existing = userMap.get(otherId);
      if (!existing || new Date(m.created_at) > new Date(existing.lastMsg.created_at)) {
        userMap.set(otherId, { lastMsg: m, unread: m.receiver_id === profile.id && !m.read ? (existing?.unread || 0) + 1 : existing?.unread || 0 });
      } else if (m.receiver_id === profile.id && !m.read) { existing.unread += 1; }
    }
    const ids = Array.from(userMap.keys());
    if (ids.length === 0) { setDmUsers([]); return; }
    const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
    setDmUsers((profs || []).map(p => ({ profile: p as Profile, lastMsg: userMap.get(p.id)!.lastMsg, unread: userMap.get(p.id)!.unread })));
    const totalDmUnread = Array.from(userMap.values()).reduce((s, v) => s + v.unread, 0);
    onUnreadChange(0, totalDmUnread);
  }, [profile, onUnreadChange]);

  useEffect(() => {
    loadDmList();
    const channel = supabase.channel('dm-list').on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => loadDmList()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadDmList]);

  useEffect(() => {
    if (profile) { supabase.from('profiles').select('*').neq('id', profile.id).then(({ data }) => { if (data) setAllUsers(data as Profile[]); }); }
  }, [profile]);

  const openDm = async (other: Profile) => {
    setActiveDm(other); setDmSearch('');
    if (!profile) return;
    await loadDmMessages(other.id);
    await supabase.from('direct_messages').update({ read: true }).eq('receiver_id', profile.id).eq('sender_id', other.id).eq('read', false);
    loadDmList();
  };

  const loadDmMessages = async (otherId: string) => {
    if (!profile) return;
    const { data } = await supabase.from('direct_messages').select('*').or(`and(sender_id.eq.${profile.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${profile.id})`).order('created_at', { ascending: true }).limit(200);
    if (data) setDmMessages(data as DirectMessage[]);
  };

  useEffect(() => {
    if (dmEndRef.current) { const c = dmEndRef.current.parentElement; if (c) { const near = c.scrollHeight - c.scrollTop - c.clientHeight < 200; if (near) dmEndRef.current.scrollIntoView({ behavior: 'smooth' }); } }
  }, [dmMessages]);

  useEffect(() => {
    if (!profile || !activeDm) return;
    const channel = supabase.channel(`dm-${activeDm.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
      const m = payload.new as DirectMessage;
      if (m.sender_id === activeDm.id || m.receiver_id === activeDm.id) { setDmMessages(prev => [...prev, m]); if (m.sender_id === activeDm.id) supabase.from('direct_messages').update({ read: true }).eq('id', m.id); }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, activeDm]);

  const sendDm = async () => {
    if (!profile || !activeDm || !dmInput.trim()) return;
    const prev = dmInput; setDmInput('');
    const { data } = await supabase.from('direct_messages').insert({ sender_id: profile.id, receiver_id: activeDm.id, content: prev.trim() }).select('*').maybeSingle();
    if (data) { setDmMessages(prev => [...prev, data as DirectMessage]); await supabase.from('notifications').insert({ user_id: activeDm.id, type: 'dm', content: `${profile.username} wysłał Ci wiadomość`, from_user_id: profile.id }); }
  };

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex gap-1 p-1 glass-dark rounded-xl mb-4 w-fit shrink-0">
        <button onClick={() => setTab('community')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'community' ? 'gradient-bg text-white' : 'text-slate-400 hover:text-white'}`}>
          <Hash className="w-4 h-4" /> Społeczność
        </button>
        <button onClick={() => setTab('dm')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'dm' ? 'gradient-bg text-white' : 'text-slate-400 hover:text-white'}`}>
          <MessageSquare className="w-4 h-4" /> Wiadomości
          {dmUsers.reduce((s, u) => s + u.unread, 0) > 0 && (
            <span className="ml-1 min-w-[18px] h-[18px] px-1 gradient-bg text-white text-[10px] font-bold rounded-full flex items-center justify-center">{dmUsers.reduce((s, u) => s + u.unread, 0) > 99 ? '99+' : dmUsers.reduce((s, u) => s + u.unread, 0)}</span>
          )}
        </button>
      </div>

      {tab === 'community' ? (
        <div className="flex-1 flex flex-col rounded-2xl glass-dark border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-pink-400" /><span className="font-semibold text-white">Czat społeczności</span></div>
            {countdown && <div className="flex items-center gap-1.5 text-xs text-slate-400"><Timer className="w-3.5 h-3.5 text-amber-400" /><span>Najstarsza wiadomość zniknie za {countdown}</span></div>}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
            {messages.length === 0 ? <p className="text-center text-slate-400 py-12">Brak wiadomości. Rozpocznij rozmowę!</p> : messages.map(m => (
              <div key={m.id} className="flex items-start gap-3 animate-fade-in">
                <Avatar username={m.profile?.username || ''} avatarUrl={m.profile?.avatar_url} size="sm" onClick={() => onProfileClick(m.user_id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <button onClick={() => onProfileClick(m.user_id)} className="text-sm font-medium text-white hover:text-pink-400">{m.profile?.username}</button>
                    <span className="text-xs text-slate-500">{formatTime(m.created_at)}</span>
                  </div>
                  {m.content && m.content !== ' ' && <p className="text-sm text-slate-300 break-words">{m.content}</p>}
                  {m.image_url && <img src={m.image_url} alt="" className="mt-1 rounded-xl max-h-60 object-cover border border-white/10" />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10 shrink-0">
            {showImageInput && (
              <div className="mb-2 flex gap-2">
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL obrazu" className="flex-1 bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-pink-400" />
                <button onClick={() => setShowImageInput(false)} className="p-2 text-slate-400 hover:text-rose-400"><X className="w-4 h-4" /></button>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowImageInput(s => !s)} className="p-2.5 rounded-xl glass-dark border border-white/10 text-slate-400 hover:text-pink-400 transition-colors"><ImageIcon className="w-4 h-4" /></button>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())} placeholder="Napisz wiadomość..." className="flex-1 bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-400" />
              <button onClick={sendMessage} disabled={!input.trim() && !imageUrl} className="p-2.5 rounded-xl gradient-bg gradient-bg-hover disabled:opacity-50 text-white transition-all"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className={`w-72 shrink-0 rounded-2xl glass-dark border border-white/10 flex flex-col ${activeDm ? 'hidden sm:flex' : 'flex'}`}>
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={dmSearch} onChange={e => setDmSearch(e.target.value)} placeholder="Szukaj lub rozpocznij DM..." className="w-full bg-[#0a0a14] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {dmSearch && (
                <div className="p-2 border-b border-white/5">
                  <p className="text-xs text-slate-500 px-2 py-1">Rozpocznij nową rozmowę</p>
                  {allUsers.filter(u => u.username.toLowerCase().includes(dmSearch.toLowerCase()) && !dmUsers.some(d => d.profile.id === u.id)).slice(0, 5).map(u => (
                    <button key={u.id} onClick={() => openDm(u)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"><Avatar username={u.username} avatarUrl={u.avatar_url} size="sm" /><span className="text-sm text-white">{u.username}</span></button>
                  ))}
                </div>
              )}
              {dmUsers.map(({ profile: p, lastMsg, unread }) => (
                <button key={p.id} onClick={() => openDm(p)} className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 ${activeDm?.id === p.id ? 'bg-pink-500/10' : ''}`}>
                  <div className="relative"><Avatar username={p.username} avatarUrl={p.avatar_url} size="md" /><div className="absolute -bottom-0.5 -left-0.5"><StatusDot status={p.online_status} size="sm" showSymbol /></div></div>
                  <div className="flex-1 min-w-0 text-left"><p className="text-sm font-medium text-white truncate">{p.username}</p><p className="text-xs text-slate-400 truncate">{lastMsg.content}</p></div>
                  {unread > 0 && <span className="min-w-[18px] h-[18px] px-1 gradient-bg text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
                </button>
              ))}
              {dmUsers.length === 0 && !dmSearch && <p className="text-center text-slate-400 py-8 text-sm">Brak rozmów</p>}
            </div>
          </div>

          {activeDm ? (
            <div className="flex-1 flex flex-col rounded-2xl glass-dark border border-white/10 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
                <button onClick={() => setActiveDm(null)} className="sm:hidden p-1 text-slate-400"><ArrowLeft className="w-5 h-5" /></button>
                <Avatar username={activeDm.username} avatarUrl={activeDm.avatar_url} size="md" onClick={() => onProfileClick(activeDm.id)} />
                <div><button onClick={() => onProfileClick(activeDm.id)} className="font-semibold text-white hover:text-pink-400">{activeDm.username}</button><p className="text-xs text-slate-400">{STATUS_CONFIG[activeDm.online_status].label}</p></div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
                {dmMessages.map(m => { const isMine = m.sender_id === profile.id; return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine ? 'gradient-bg text-white' : 'bg-white/10 text-white'}`}><p className="text-sm break-words">{m.content}</p><p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-slate-400'}`}>{formatTime(m.created_at)}</p></div>
                  </div>); })}
                <div ref={dmEndRef} />
              </div>
              <div className="p-3 border-t border-white/10 shrink-0">
                <div className="flex gap-2">
                  <input value={dmInput} onChange={e => setDmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendDm())} placeholder="Napisz wiadomość..." className="flex-1 bg-[#0a0a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-400" />
                  <button onClick={sendDm} disabled={!dmInput.trim()} className="p-2.5 rounded-xl gradient-bg gradient-bg-hover disabled:opacity-50 text-white transition-all"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex flex-1 items-center justify-center rounded-2xl glass-dark border border-white/10">
              <p className="text-slate-400">Wybierz rozmowę lub rozpocznij nową</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
