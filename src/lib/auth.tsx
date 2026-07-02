import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import type { Profile } from './types';

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  signUp: (username: string) => Promise<{ key?: string; error?: string }>;
  signIn: (username: string, key: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

function generateKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [4, 4, 4];
  return 'NAE-' + segments.map(len =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) {
      setProfile(null);
    } else {
      setProfile(data as Profile);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session) {
          setProfile(null);
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!error && data) {
          setProfile(data as Profile);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (username: string): Promise<{ key?: string; error?: string }> => {
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) return { error: 'Username must be at least 3 characters' };
    if (cleanUsername.length > 20) return { error: 'Username must be at most 20 characters' };
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) return { error: 'Username can only contain letters, numbers, and underscores' };

    // Check if username is taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', cleanUsername)
      .maybeSingle();
    if (existing) {
      const suggestions = [
        `${cleanUsername}${Math.floor(Math.random() * 100)}`,
        `${cleanUsername}_${Math.floor(Math.random() * 1000)}`,
        `${cleanUsername}${Math.floor(Math.random() * 9999)}`,
      ];
      return { error: `Username "${cleanUsername}" is already taken. Try: ${suggestions.join(', ')}` };
    }

    const key = generateKey();
    const fakeEmail = `${cleanUsername.toLowerCase()}@nae.user`;
    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password: key,
    });

    if (error) {
      return { error: error.message };
    }
    if (!data.user) {
      return { error: 'Failed to create account' };
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: cleanUsername,
        login_key: key,
        role: 'visitor',
        online_status: 'online',
      });

    if (profileError) {
      return { error: `Profile creation failed: ${profileError.message}` };
    }

    await loadProfile();
    return { key };
  }, [loadProfile]);

  const signIn = useCallback(async (username: string, key: string): Promise<{ error?: string }> => {
    const cleanUsername = username.trim();
    const fakeEmail = `${cleanUsername.toLowerCase()}@nae.user`;
    const { error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: key,
    });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid username or key' };
      }
      return { error: error.message };
    }
    await loadProfile();
    return {};
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
