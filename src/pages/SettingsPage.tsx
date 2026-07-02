import { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, LogOut, Key, Bell, Shield, Copy, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';

export function SettingsPage() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!profile) return null;

  const copyKey = () => {
    navigator.clipboard.writeText(profile.login_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><SettingsIcon className="w-6 h-6 gradient-text" /> Ustawienia</h2>

      <div className="space-y-4">
        {/* Account */}
        <div className="p-5 rounded-2xl glass-dark border border-white/10">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-pink-400" /> Konto</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Nazwa użytkownika</span>
              <span className="font-medium text-white">{profile.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Rola</span>
              <span className={`px-2 py-0.5 rounded text-xs ${profile.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>{profile.role === 'owner' ? 'Właściciel' : 'Gość'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Klucz logowania</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowKey(s => !s)} className="flex items-center gap-1.5 text-pink-400 hover:text-pink-300">
                  <Key className="w-3.5 h-3.5" /> {showKey ? profile.login_key : '••••••••'}
                </button>
                <button onClick={copyKey} className="p-1.5 rounded-lg glass-dark border border-white/10 text-slate-400 hover:text-pink-400 transition-colors" title="Kopiuj klucz">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="p-5 rounded-2xl glass-dark border border-white/10">
          <h3 className="font-semibold text-white mb-3">Wygląd</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Motyw</span>
            <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-dark border border-white/10 text-sm text-white hover:border-pink-400/50 transition-colors">
              {theme === 'dark' ? <><Moon className="w-4 h-4" /> Ciemny</> : <><Sun className="w-4 h-4" /> Jasny</>}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-5 rounded-2xl glass-dark border border-white/10">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-pink-400" /> Powiadomienia</h3>
          <p className="text-sm text-slate-400">Otrzymujesz powiadomienia o polubieniach, komentarzach, obserwowaniu i wiadomościach prywatnych. Pojawiają się w ikonie dzwonka w pasku nawigacji.</p>
        </div>

        {/* Logout */}
        <button onClick={signOut} className="w-full p-4 rounded-2xl glass-dark border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2 font-medium">
          <LogOut className="w-4 h-4" /> Wyloguj się
        </button>
      </div>
    </div>
  );
}
