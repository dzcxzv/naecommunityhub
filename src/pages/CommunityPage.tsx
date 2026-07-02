import { useEffect, useState } from 'react';
import { Send, Search, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { StatusDot, STATUS_CONFIG } from '../components/StatusDot';
import { PostCard } from '../components/PostCard';
import type { Profile, Post } from '../lib/types';

export function CommunityPage({ onProfileClick }: { onProfileClick: (id: string) => void }) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postText, setPostText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'feed' | 'members'>('feed');

  const loadPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profile:profiles!user_id(username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPosts(data as unknown as Post[]);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setUsers(data as Profile[]);
  };

  useEffect(() => {
    loadPosts();
    loadUsers();
    const channel = supabase
      .channel('community-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => loadPosts())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => loadPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const createPost = async () => {
    if (!profile || !postText.trim()) return;
    const { data, error } = await supabase
      .from('posts')
      .insert({ content: postText.trim(), image_url: imageUrl || null })
      .select('*, profile:profiles!user_id(username, avatar_url)')
      .single();
    if (error) {
      console.error('Failed to create post:', error.message);
      return;
    }
    if (data) {
      setPosts(prev => [data as unknown as Post, ...prev]);
      setPostText('');
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-dark rounded-xl mb-6 w-fit">
        <button onClick={() => setTab('feed')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'feed' ? 'gradient-bg text-white' : 'text-slate-400 hover:text-slate-200'}`}>Tablica</button>
        <button onClick={() => setTab('members')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'members' ? 'gradient-bg text-white' : 'text-slate-400 hover:text-slate-200'}`}>Członkowie</button>
      </div>

      {tab === 'feed' ? (
        <>
          {/* Create post */}
          {profile && (
            <div className="p-4 rounded-2xl glass-dark border border-white/10 mb-6">
              <div className="flex gap-3">
                <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="md" />
                <div className="flex-1">
                  <textarea
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                    placeholder="Podziel się czymś ze społecznością..."
                    rows={3}
                    className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-400 resize-none"
                  />
                  {showImageInput && (
                    <div className="mt-2 flex gap-2">
                      <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL obrazu" className="flex-1 bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-pink-400" />
                      <button onClick={() => setShowImageInput(false)} className="p-2 text-slate-400 hover:text-rose-400"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <button onClick={() => setShowImageInput(s => !s)} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-pink-400 transition-colors">
                      <ImageIcon className="w-4 h-4" /> Obraz
                    </button>
                    <button onClick={createPost} disabled={!postText.trim()} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg gradient-bg gradient-bg-hover disabled:opacity-50 text-white text-sm font-medium transition-colors">
                      <Send className="w-3.5 h-3.5" /> Opublikuj
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-center text-slate-400 py-12">Brak postów. Bądź pierwszy!</p>
            ) : posts.map(p => <PostCard key={p.id} post={p} onProfileClick={onProfileClick} />)}
          </div>
        </>
      ) : (
        <div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj członków..." className="w-full bg-[#0a0a14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredUsers.map(u => (
              <button key={u.id} onClick={() => onProfileClick(u.id)} className="flex items-center gap-3 p-3 rounded-xl glass-dark border border-white/10 hover:border-pink-400/30 transition-colors text-left">
                <div className="relative">
                  <Avatar username={u.username} avatarUrl={u.avatar_url} size="md" />
                  <div className="absolute -bottom-0.5 -left-0.5 translate-x-[-2px] translate-y-[2px]"><StatusDot status={u.online_status} size="sm" showSymbol /></div>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-200 truncate">{u.username}</p>
                  <p className="text-xs text-slate-400 truncate">{STATUS_CONFIG[u.online_status].label}</p>
                </div>
                <span className={`ml-auto px-2 py-0.5 rounded text-xs capitalize ${u.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
