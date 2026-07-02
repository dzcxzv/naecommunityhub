import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { AuthPage } from './pages/AuthPage';
import { Navbar, Page } from './components/Navbar';
import { MusicPlayer } from './components/MusicPlayer';
import { HomePage } from './pages/HomePage';
import { CommunityPage } from './pages/CommunityPage';
import { ChatPage } from './pages/ChatPage';
import { GamesPage } from './pages/GamesPage';
import { CinemaPage } from './pages/CinemaPage';
import { FeedPage } from './pages/FeedPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { supabase } from './lib/supabase';

function AppShell() {
  const { profile, loading } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [dmUnread, setDmUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  // Update presence on load and periodically
  useEffect(() => {
    if (!profile) return;
    const updatePresence = () => { 
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', profile.id).then(() => {});
    };
    updatePresence();
    const interval = setInterval(updatePresence, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  const onProfileClick = useCallback((id: string) => {
    setViewProfileId(id);
    setPage('profile');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0b0d14' }}>
        <div className="w-10 h-10 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen pb-24">
      <Navbar
        page={page}
        setPage={setPage}
        setViewProfileId={setViewProfileId}
        dmUnread={dmUnread}
        chatUnread={chatUnread}
      />

      <main>
        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'feed' && <FeedPage onProfileClick={onProfileClick} />}
        {page === 'community' && <CommunityPage onProfileClick={onProfileClick} />}
        {page === 'chat' && <ChatPage onProfileClick={onProfileClick} onUnreadChange={(c, d) => { setChatUnread(c); setDmUnread(d); }} />}
        {page === 'games' && <GamesPage onProfileClick={onProfileClick} />}
        {page === 'cinema' && <CinemaPage onProfileClick={onProfileClick} />}
        {page === 'profile' && viewProfileId && <ProfilePage profileId={viewProfileId} onProfileClick={onProfileClick} />}
        {page === 'settings' && <SettingsPage />}
      </main>

      <MusicPlayer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
