import { useEffect, useState } from 'react';
import { Bell, LogOut, Settings as SettingsIcon, User as UserIcon } from 'lucide-react';
import { Logo } from './Logo';
import { WeatherBar } from './WeatherBar';
import { Avatar } from './Avatar';
import { StatusDot, STATUS_CONFIG } from '../components/StatusDot';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { OnlineStatus } from '../lib/types';

export type Page = 'home' | 'community' | 'chat' | 'games' | 'cinema' | 'feed' | 'profile' | 'settings';

interface NavbarProps {
  page: Page;
  setPage: (p: Page) => void;
  setViewProfileId: (id: string | null) => void;
  dmUnread: number;
  chatUnread: number;
}

const NAV_LINKS: { key: Page; label: string }[] = [
  { key: 'home',      label: 'Start' },
  { key: 'feed',      label: 'Aktualności' },
  { key: 'community', label: 'Społeczność' },
  { key: 'chat',      label: 'Czat' },
  { key: 'games',     label: 'Mini-gry' },
  { key: 'cinema',    label: 'Kino' },
];

export function Navbar({ page, setPage, setViewProfileId, chatUnread }: NavbarProps) {
  const { profile, signOut, refreshProfile } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase.channel('nav-notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, loadNotifs)
      .subscribe();
    loadNotifs();
  }, [profile]);

  async function loadNotifs() {
    if (!profile) return;
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('read', false);
    setNotifCount(count || 0);
  }

  const openProfile = () => {
    if (profile) setViewProfileId(profile.id);
    setPage('profile');
    setShowMenu(false);
  };

  return (
    <nav className="sticky top-0 z-30" style={{ background: 'rgba(11,13,20,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-6 h-[60px] grid grid-cols-[200px_1fr_200px] items-center gap-4">

        {/* Left: Logo */}
        <button onClick={() => setPage('home')} className="flex items-center shrink-0">
          <Logo size="sm" />
        </button>

        {/* Center: nav links */}
        <div className="hidden md:flex items-center justify-center gap-1">
          {NAV_LINKS.map(({ key, label }) => {
            const active = page === key;
            return (
              <button
                key={key}
                onClick={() => setPage(key)}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-white bg-white/8'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={active ? { background: 'rgba(255,255,255,0.08)' } : {}}
              >
                {label}
                {key === 'chat' && chatUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 gradient-bg text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {chatUnread > 99 ? '99+' : chatUnread}
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full gradient-bg" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Weather + Bell + Konto pill */}
        <div className="flex items-center justify-end gap-2">
          <WeatherBar />

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(s => !s)}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 gradient-bg text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </button>
            {showNotifs && <NotificationsDropdown onClose={() => setShowNotifs(false)} />}
          </div>

          {/* Konto pill */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(s => !s)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white gradient-bg glow-pink transition-all hover:brightness-110"
            >
              <div className="relative">
                {profile && <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="xs" />}
                {profile && <span className="absolute -bottom-0.5 -right-0.5"><StatusDot status={profile.online_status} size="sm" showSymbol /></span>}
              </div>
              <span className="hidden sm:block max-w-[80px] truncate">{profile?.username ?? 'Konto'}</span>
            </button>

            {showMenu && profile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border animate-scale-in overflow-hidden z-50"
                  style={{ background: 'rgba(14,16,23,0.97)', borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
                  <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <p className="font-semibold text-white text-sm truncate">{profile.username}</p>
                    <p className="text-xs text-slate-400">{profile.role === 'owner' ? 'Właściciel' : 'Gość'}</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <button onClick={openProfile} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <UserIcon className="w-4 h-4" /> Mój profil
                    </button>
                    <button onClick={() => { setPage('settings'); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <SettingsIcon className="w-4 h-4" /> Ustawienia
                    </button>
                    {/* Status submenu */}
                    <button onClick={() => setShowStatusMenu(s => !s)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                      <StatusDot status={profile.online_status} size="sm" showSymbol />
                      <span className="flex-1 text-left">{STATUS_CONFIG[profile.online_status].label}</span>
                    </button>
                    {showStatusMenu && (
                      <div className="ml-2 space-y-0.5">
                        {(Object.keys(STATUS_CONFIG) as OnlineStatus[]).map(s => (
                          <button key={s} onClick={async () => {
                            await supabase.from('profiles').update({ online_status: s }).eq('id', profile.id);
                            await refreshProfile();
                            setShowStatusMenu(false);
                          }} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                            <StatusDot status={s} size="sm" showSymbol />
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => { signOut(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Wyloguj się
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-center gap-0.5 px-3 pb-2 overflow-x-auto scrollbar-thin">
        {NAV_LINKS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPage(key)}
            className={`relative shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              page === key ? 'text-white' : 'text-slate-400'
            }`}
            style={page === key ? { background: 'rgba(255,255,255,0.08)' } : {}}
          >
            {label}
            {key === 'chat' && chatUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 gradient-bg text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {chatUnread > 99 ? '99+' : chatUnread}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from('notifications').select('*, from_profile:profiles!from_user_id(username, avatar_url)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20);
      setNotifs(data || []);
      await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
    })();
  }, [profile]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border animate-scale-in z-50 overflow-hidden"
        style={{ background: 'rgba(14,16,23,0.97)', borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h3 className="text-sm font-semibold text-white">Powiadomienia</h3>
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {notifs.length === 0
            ? <p className="p-6 text-center text-sm text-slate-500">Brak powiadomień</p>
            : notifs.map(n => (
              <div key={n.id} className="p-3 border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <p className="text-sm text-white">{n.content}</p>
                {n.from_profile && <p className="text-xs text-slate-500 mt-0.5">od {n.from_profile.username}</p>}
              </div>
            ))
          }
        </div>
      </div>
    </>
  );
}
