import { useEffect, useState } from 'react';
import { Camera, Edit3, X, Check, Calendar, Music as MusicIcon, Award, Gamepad2, Zap, Brain, Hash, Calculator, Ghost, BookOpen, Heart, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { StatusDot } from '../components/StatusDot';
import { PostCard } from '../components/PostCard';
import { timeAgo } from '../lib/utils';
import { PRONOUN_OPTIONS, GENDER_OPTIONS, INTEREST_OPTIONS } from '../lib/types';
import type { Profile, Post, MusicStatus, GameScore } from '../lib/types';

const GAME_ICONS: Record<string, typeof Gamepad2> = {
  reflex: Zap, memory: Brain, wordguess: Hash, mathsprint: Calculator, snake: Ghost, hangman: BookOpen, pictionary: Gamepad2,
};

const BADGE_TIERS = [
  { threshold: 100, name: 'Początkujący', icon: Award, color: 'from-slate-400 to-slate-600' },
  { threshold: 500, name: 'Zaawansowany', icon: Award, color: 'from-cyan-400 to-cyan-600' },
  { threshold: 1000, name: 'Ekspert', icon: Award, color: 'from-pink-400 to-pink-600' },
  { threshold: 2500, name: 'Mistrz', icon: Award, color: 'from-amber-400 to-amber-600' },
];

export function ProfilePage({ profileId, onProfileClick }: { profileId: string; onProfileClick: (id: string) => void }) {
  const { profile: me, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showBgUpload, setShowBgUpload] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [music, setMusic] = useState<MusicStatus | null>(null);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [editData, setEditData] = useState({ bio: '', pronouns: '', gender: '', interests: [] as string[], custom_status: '' });

  const isMe = me?.id === profileId;

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', profileId).maybeSingle();
      if (p) {
        setProfile(p as Profile);
        setEditData({ bio: p.bio, pronouns: p.pronouns, gender: p.gender, interests: p.interests || [], custom_status: p.custom_status });
      }
      const { data: postData } = await supabase.from('posts').select('*, profile:profiles!user_id(username, avatar_url)').eq('user_id', profileId).order('created_at', { ascending: false }).limit(20);
      if (postData) setPosts(postData as unknown as Post[]);

      const { data: musicData } = await supabase.from('music_status').select('*').eq('id', profileId).maybeSingle();
      if (musicData) setMusic(musicData as MusicStatus);

      const { data: scoreData } = await supabase.from('game_scores').select('*, profile:profiles!user_id(username, avatar_url)').eq('user_id', profileId).order('score', { ascending: false }).limit(10);
      if (scoreData) { setScores(scoreData as unknown as GameScore[]); setTotalScore((scoreData as unknown as GameScore[]).reduce((s, r) => s + r.score, 0)); }

      if (me && !isMe) {
        const { data: f } = await supabase.from('follows').select('id').eq('follower_id', me.id).eq('following_id', profileId).maybeSingle();
        setIsFollowing(!!f);
      }
      loadFollowLists();
    })();
  }, [profileId, me, isMe]);

  const loadFollowLists = async () => {
    const { data: fwers } = await supabase.from('follows').select('follower:profiles!follower_id(*)').eq('following_id', profileId).limit(50);
    setFollowers((fwers || []).map((f: any) => f.follower).filter(Boolean) as Profile[]);
    const { data: fwing } = await supabase.from('follows').select('following:profiles!following_id(*)').eq('follower_id', profileId).limit(50);
    setFollowing((fwing || []).map((f: any) => f.following).filter(Boolean) as Profile[]);
  };

  const toggleFollow = async () => {
    if (!me || !profile) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', profile.id);
    } else {
      await supabase.from('follows').insert({ follower_id: me.id, following_id: profile.id });
      await supabase.from('notifications').insert({ user_id: profile.id, type: 'follow', content: `${me.username} zaczął Cię obserwować`, from_user_id: me.id });
    }
    setIsFollowing(!isFollowing);
    loadFollowLists();
  };

  const saveEdit = async () => {
    if (!profile) return;
    await supabase.from('profiles').update({ bio: editData.bio, pronouns: editData.pronouns, gender: editData.gender, interests: editData.interests, custom_status: editData.custom_status }).eq('id', profile.id);
    setIsEditing(false);
    if (isMe) await refreshProfile();
    const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).maybeSingle();
    if (data) setProfile(data as Profile);
  };

  const uploadAvatar = async (url: string) => {
    if (!profile) return;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
    setShowAvatarUpload(false);
    if (isMe) await refreshProfile();
    setProfile({ ...profile, avatar_url: url });
  };

  const uploadBg = async (url: string) => {
    if (!profile) return;
    await supabase.from('profiles').update({ background_url: url }).eq('id', profile.id);
    setShowBgUpload(false);
    setProfile({ ...profile, background_url: url });
  };

  if (!profile) return <div className="p-8 text-center text-slate-400">Ładowanie profilu...</div>;

  const currentBadge = [...BADGE_TIERS].reverse().find(b => totalScore >= b.threshold) || BADGE_TIERS[0];

  return (
    <div className="min-h-screen pb-12">
      {/* Background banner */}
      <div className="relative h-40 sm:h-56 overflow-hidden">
        {profile.background_url ? (
          <img src={profile.background_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full gradient-bg opacity-40" />
        )}
        {isMe && (
          <button onClick={() => setShowBgUpload(true)} className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-dark border border-white/10 text-sm text-white hover:border-pink-400/50 transition-colors">
            <Camera className="w-3.5 h-3.5" /> Zmień tło
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative">
        {/* Header row: avatar + name + EDIT BUTTON right next to name */}
        <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
          <div className="relative shrink-0">
            <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="2xl" className="ring-4 ring-[#0a0a14]" />
            <div className="absolute -bottom-1 -left-1 z-10">
              <StatusDot status={profile.online_status} size="md" showSymbol />
            </div>
            {isMe && (
              <button
                onClick={() => setShowAvatarUpload(true)}
                className="absolute -bottom-1 -right-1 z-10 p-1.5 rounded-full gradient-bg text-white ring-2 ring-[#0a0a14] hover:scale-110 transition-transform"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${profile.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                {profile.role === 'owner' ? 'Właściciel' : 'Gość'}
              </span>
              {/* Edit/Follow button RIGHT NEXT to name — not at far right */}
              {isMe ? (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-bg gradient-bg-hover text-white text-xs font-medium transition-all ml-1">
                  <Edit3 className="w-3.5 h-3.5" /> Edytuj
                </button>
              ) : (
                <button onClick={toggleFollow} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isFollowing ? 'glass-dark border border-white/10 text-slate-300' : 'gradient-bg gradient-bg-hover text-white'}`}>
                  {isFollowing ? 'Obserwujesz' : 'Obserwuj'}
                </button>
              )}
            </div>
            {profile.custom_status && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-dark border border-white/10 text-sm text-white">
                <span className="text-slate-400">💬</span> {profile.custom_status}
              </div>
            )}
          </div>
        </div>

        {/* Two-column layout: main content (left) + badge sidebar (right) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* LEFT COLUMN: main content */}
          <div className="min-w-0">
            {/* Info row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
              {profile.pronouns && <span>{profile.pronouns}</span>}
              {profile.gender && <span>• {profile.gender}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Dołączył {timeAgo(profile.created_at)}</span>
            </div>

            {/* Stats row */}
            <div className="mt-4 flex items-center gap-6">
              <button onClick={() => setShowFollowers(true)} className="text-sm hover:text-pink-400 transition-colors">
                <span className="font-bold text-white">{followers.length}</span> <span className="text-slate-400">Obserwujący</span>
              </button>
              <button onClick={() => setShowFollowing(true)} className="text-sm hover:text-pink-400 transition-colors">
                <span className="font-bold text-white">{following.length}</span> <span className="text-slate-400">Obserwowani</span>
              </button>
            </div>

            {/* Bio + interests */}
            {profile.bio && <p className="mt-4 text-slate-300">{profile.bio}</p>}
            {profile.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.interests.map(i => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-400 text-xs">{i}</span>
                ))}
              </div>
            )}

            {/* Music status */}
            {music && music.is_playing && music.track_title && (
              <div className="mt-4 p-3 rounded-xl glass-dark border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center gradient-glow">
                  <MusicIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Teraz słucha</p>
                  <p className="text-sm font-medium text-white">{music.track_title} — {music.artist}</p>
                </div>
                <span className="ml-auto flex items-end gap-0.5 h-4">
                  <span className="w-0.5 bg-pink-400 animate-bar" style={{ animationDelay: '0s' }} />
                  <span className="w-0.5 bg-cyan-400 animate-bar" style={{ animationDelay: '0.15s' }} />
                  <span className="w-0.5 bg-pink-400 animate-bar" style={{ animationDelay: '0.3s' }} />
                </span>
              </div>
            )}

            {/* Posts */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-white mb-4">Posty</h3>
              {posts.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Brak postów.</p>
              ) : (
                <div className="space-y-4">
                  {posts.map(p => <PostCard key={p.id} post={p} onProfileClick={onProfileClick} />)}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Badge bar / sidebar */}
          <div className="space-y-4">
            {/* Badge card */}
            <div className="rounded-2xl glass-dark border border-white/10 p-5 sticky top-16">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4 gradient-text" /> Odznaki</h3>

              {/* Current tier badge */}
              <div className="flex flex-col items-center mb-4">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${currentBadge.color} flex items-center justify-center mb-2 gradient-glow`}>
                  <Award className="w-10 h-10 text-white" />
                </div>
                <p className="font-bold text-white text-sm">{currentBadge.name}</p>
                <p className="text-xs text-slate-400">{totalScore} pkt łącznie</p>
              </div>

              {/* Badge progression */}
              <div className="space-y-2 mb-4">
                {BADGE_TIERS.map(b => {
                  const achieved = totalScore >= b.threshold;
                  return (
                    <div key={b.threshold} className={`flex items-center gap-2 p-2 rounded-lg ${achieved ? 'glass-dark border border-white/10' : 'opacity-40'}`}>
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${b.color} flex items-center justify-center shrink-0`}>
                        <Award className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.threshold} pkt</p>
                      </div>
                      {achieved && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  );
                })}
              </div>

              {/* Game scores */}
              {scores.length > 0 && (
                <>
                  <div className="border-t border-white/10 pt-4 mb-3">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1"><Gamepad2 className="w-3.5 h-3.5" /> Najlepsze wyniki</h4>
                  </div>
                  <div className="space-y-2">
                    {scores.map(s => {
                      const Icon = GAME_ICONS[s.game_type] || Gamepad2;
                      return (
                        <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg glass-dark border border-white/10">
                          <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 capitalize">{s.game_type}</p>
                            <p className="text-sm font-bold text-white">{s.score} pkt</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Stats summary */}
              <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1"><UsersIcon className="w-3 h-3" /> Obserwujący</span>
                  <span className="font-bold text-white">{followers.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1"><UsersIcon className="w-3 h-3" /> Obserwowani</span>
                  <span className="font-bold text-white">{following.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1"><Heart className="w-3 h-3" /> Posty</span>
                  <span className="font-bold text-white">{posts.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1"><Gamepad2 className="w-3 h-3" /> Gry</span>
                  <span className="font-bold text-white">{scores.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setIsEditing(false)}>
          <div className="w-full max-w-lg glass-dark rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Edytuj profil</h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Bio</label>
                <textarea value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} rows={3} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Status niestandardowy</label>
                <input value={editData.custom_status} onChange={e => setEditData({ ...editData, custom_status: e.target.value })} maxLength={60} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Zaimki</label>
                  <select value={editData.pronouns} onChange={e => setEditData({ ...editData, pronouns: e.target.value })} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400">
                    <option value="">Brak</option>
                    {PRONOUN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Płeć</label>
                  <select value={editData.gender} onChange={e => setEditData({ ...editData, gender: e.target.value })} className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400">
                    <option value="">Brak</option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Zainteresowania</label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(i => {
                    const sel = editData.interests.includes(i);
                    return (
                      <button key={i} onClick={() => setEditData({ ...editData, interests: sel ? editData.interests.filter(x => x !== i) : [...editData.interests, i] })}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${sel ? 'gradient-bg text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{i}</button>
                    );
                  })}
                </div>
              </div>
              <button onClick={saveEdit} className="w-full flex items-center justify-center gap-2 gradient-bg gradient-bg-hover text-white py-2.5 rounded-xl font-medium">
                <Check className="w-4 h-4" /> Zapisz zmiany
              </button>
            </div>
          </div>
        </div>
      )}

      {showAvatarUpload && <UrlUpload title="Zmień avatar" onSubmit={uploadAvatar} onClose={() => setShowAvatarUpload(false)} />}
      {showBgUpload && <UrlUpload title="Zmień tło" onSubmit={uploadBg} onClose={() => setShowBgUpload(false)} />}
      {showFollowers && <UserListModal title="Obserwujący" users={followers} onClose={() => setShowFollowers(false)} onProfileClick={(id) => { setShowFollowers(false); onProfileClick(id); }} />}
      {showFollowing && <UserListModal title="Obserwowani" users={following} onClose={() => setShowFollowing(false)} onProfileClick={(id) => { setShowFollowing(false); onProfileClick(id); }} />}
    </div>
  );
}

function UrlUpload({ title, onSubmit, onClose }: { title: string; onSubmit: (url: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md glass-dark rounded-2xl border border-white/10 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
        <p className="text-sm text-slate-400 mb-3">Wklej URL obrazu:</p>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#0a0a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-400 mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl glass-dark border border-white/10 text-slate-300 text-sm">Anuluj</button>
          <button onClick={() => url && onSubmit(url)} className="flex-1 py-2 rounded-xl gradient-bg gradient-bg-hover text-white text-sm">Zapisz</button>
        </div>
      </div>
    </div>
  );
}

function UserListModal({ title, users, onClose, onProfileClick }: { title: string; users: Profile[]; onClose: () => void; onProfileClick: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md glass-dark rounded-2xl border border-white/10 p-6 max-h-[80vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {users.length === 0 ? <p className="text-center text-slate-400 py-6">Brak użytkowników</p> : (
          <div className="space-y-2">
            {users.map(u => (
              <button key={u.id} onClick={() => onProfileClick(u.id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Avatar username={u.username} avatarUrl={u.avatar_url} size="sm" />
                <span className="text-sm text-white">{u.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
