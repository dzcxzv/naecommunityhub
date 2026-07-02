import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/Logo';
import { KeyRound, User, ArrowRight, Copy, Check, Sparkles, AlertCircle, MessageCircle, Gamepad2, Film, Music } from 'lucide-react';

export function AuthPage() {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [key, setKey] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'register') {
      const result = await signUp(username);
      if (result.error) setError(result.error);
      else if (result.key) { setGeneratedKey(result.key); setShowKey(true); }
    } else {
      const result = await signIn(username, key);
      if (result.error) setError(result.error);
    }
    setLoading(false);
  };

  const copyKey = () => { navigator.clipboard.writeText(generatedKey); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* ambient background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(233,30,140,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,210,255,0.1) 0%, transparent 50%), #0b0d14' }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <p className="mt-4 text-slate-400 text-sm text-center">
            <span className="gradient-text font-semibold">nae</span> — everything for everyone
          </p>
        </div>

        <div className="widget p-7 shadow-2xl" style={{ borderRadius: '1.5rem' }}>
          {showKey ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full gradient-bg flex items-center justify-center mb-4 glow-pink">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Konto utworzone!</h2>
              <p className="text-slate-400 text-sm mb-4">Zapisz swój klucz logowania — będzie potrzebny do logowania.</p>
              <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.2)' }}>
                <p className="text-xs text-slate-500 mb-1">Twój klucz logowania</p>
                <p className="font-mono text-lg gradient-text font-bold tracking-wider break-all">{generatedKey}</p>
              </div>
              <button onClick={copyKey} className="w-full flex items-center justify-center gap-2 gradient-bg text-white py-3 rounded-xl font-semibold transition-all hover:brightness-110">
                {copied ? <><Check className="w-4 h-4" /> Skopiowano!</> : <><Copy className="w-4 h-4" /> Kopiuj klucz</>}
              </button>
              <p className="text-amber-400/80 text-xs mt-4 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Przechowaj go bezpiecznie — nie można go odzyskać.
              </p>
            </div>
          ) : (
            <>
              {/* tab toggle */}
              <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <button onClick={() => { setMode('register'); setError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'register' ? 'gradient-bg text-white' : 'text-slate-400 hover:text-white'}`}>Rejestracja</button>
                <button onClick={() => { setMode('login'); setError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'gradient-bg text-white' : 'text-slate-400 hover:text-white'}`}>Logowanie</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nazwa użytkownika</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Wybierz nazwę" className="w-full bg-surface border border-divider rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 transition-colors" required minLength={3} maxLength={20} />
                  </div>
                </div>
                {mode === 'login' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Klucz logowania</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="text" value={key} onChange={e => setKey(e.target.value)} placeholder="NAE-XXXX-XXXX-XXXX" className="w-full bg-surface border border-divider rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 transition-colors font-mono" required />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="rounded-xl p-3 text-sm text-rose-300 animate-fade-in flex items-start gap-2" style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
                  </div>
                )}
                {mode === 'register' && <p className="text-xs text-slate-500">Losowy klucz logowania zostanie wygenerowany automatycznie. Użyj go z nazwą użytkownika do logowania.</p>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 gradient-bg disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all hover:brightness-110">
                  {loading ? 'Proszę czekać...' : <>{mode === 'register' ? 'Utwórz konto' : 'Zaloguj się'} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          )}
        </div>

        {/* feature pills */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {[MessageCircle, Gamepad2, Film, Music].map((Icon, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{['Czat', 'Gry', 'Kino', 'Muzyka'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
