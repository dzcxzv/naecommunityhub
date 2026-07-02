import { useEffect, useState } from 'react';
import { Gamepad2, Film, MessageCircle, Music, Sparkles, ArrowRight, Zap, Star, Users, Shield, Rocket, Send } from 'lucide-react';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';
import type { Page } from '../components/Navbar';

export function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      setUserCount(count || 0);
    })();
    const ch = supabase.channel('home-uc').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => setUserCount(c => c + 1)).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="min-h-screen">
      {/* ════════════════════════ HERO ════════════════════════ */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6">
        {/* ambient gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          {/* Left: headline */}
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold gradient-bg-soft text-pink-300">
                <Sparkles className="w-3 h-3" /> Beta v0.1
              </span>
              <span className="text-xs text-slate-500">{userCount} użytkowników online</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              <span className="gradient-text">nae</span>
              <span className="block text-white mt-1">— everything</span>
              <span className="block text-slate-400">for everyone</span>
            </h1>

            <p className="mt-6 text-lg text-slate-400 max-w-lg">
              Platforma skupiona wokół aktualizacji platformy, wydarzeń oraz panelu społeczności. Czat, gry, kino i muzyka w jednym miejscu.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => setPage('community')} className="group flex items-center gap-2 px-6 py-3.5 rounded-xl gradient-bg text-white font-semibold shadow-lg glow-pink transition-all hover:scale-105">
                Eksploruj społeczność
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => setPage('games')} className="flex items-center gap-2 px-6 py-3.5 rounded-xl widget-sm text-white font-medium hover:border-pink-400/30 transition-all" style={{ borderRadius: '0.75rem' }}>
                <Gamepad2 className="w-4 h-4" /> Zagraj w gry
              </button>
            </div>

            {/* Stat pills */}
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                { label: 'Członków',    value: userCount },
                { label: 'Mini-gier',   value: 7 },
                { label: 'Pokoi',       value: '∞' },
                { label: 'Wersja',      value: 'v0.1.0' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl widget-sm" style={{ borderRadius: '0.75rem' }}>
                  <span className="text-xl font-bold gradient-text-pk tabular-nums">{s.value}</span>
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mock chat widget */}
          <div className="hidden lg:block animate-float">
            <MockChatWidget />
          </div>
        </div>
      </section>

      {/* ════════════════════════ FEATURES ════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Wszystko w jednym miejscu</h2>
          <p className="text-slate-400 mt-1">Czat, gry, muzyka i kino — bez przełączania aplikacji</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="group relative p-7 rounded-2xl widget hover:border-pink-400/20 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shrink-0 glow-pink group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">{f.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{f.desc}</p>
                    <ul className="space-y-2">
                      {f.bullets.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-sm text-slate-300">
                          <Zap className="w-3.5 h-3.5 text-pink-400 mt-0.5 shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════ UPDATES ════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-2"><Zap className="w-7 h-7 gradient-text" /> Aktualizacje</h2>
            <p className="text-slate-400 mt-1">Najnowsze zmiany na platformie</p>
          </div>
          <button onClick={() => setPage('feed')} className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1">Wszystkie <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>

        <div className="space-y-3">
          {UPDATES.map((u, i) => (
            <div key={i} className="flex gap-5 p-5 rounded-2xl widget hover:border-pink-400/20 transition-all animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="shrink-0 flex flex-col items-center gap-2 w-24">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${u.color}`}>{u.tag}</span>
                <span className="text-xs text-slate-500 tabular-nums">{u.date}</span>
              </div>
              <div className="w-px bg-white/8 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm mb-1">{u.title}</h3>
                <p className="text-sm text-slate-400">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════ EVENTS ════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-2"><Star className="w-7 h-7 gradient-text" /> Wydarzenia</h2>
          <p className="text-slate-400 mt-1">Nadchodzące wydarzenia społeczności</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {EVENTS.map((e, i) => {
            const Icon = e.icon;
            return (
              <div key={i} className="relative p-6 rounded-2xl widget overflow-hidden hover:border-pink-400/20 transition-all animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/8 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center glow-pink">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold gradient-text-pk">{e.date}</div>
                      <div className="text-xs text-slate-400 font-medium">{e.month}</div>
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-1">{e.title}</h3>
                  <p className="text-sm text-slate-400">{e.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════ STATS BANNER ════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="relative rounded-3xl widget p-10 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 gradient-bg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <StatBig icon={Users}    value={userCount}   label="Członków"    color="text-pink-400" />
            <StatBig icon={Gamepad2} value="7"           label="Mini-gier"   color="text-cyan-400" />
            <StatBig icon={Rocket}   value="v0.1.0"      label="Wersja"      color="text-pink-400" />
            <StatBig icon={Shield}   value="100%"        label="Bezpieczeństwo" color="text-cyan-400" />
          </div>
        </div>
      </section>

      {/* ════════════════════════ CHANGELOG ════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-2"><Sparkles className="w-7 h-7 gradient-text" /> Lista zmian</h2>
          <p className="text-slate-400 mt-1">Historia aktualizacji platformy</p>
        </div>
        <div className="space-y-4">
          {CHANGELOG.map(c => (
            <div key={c.version} className="p-7 rounded-2xl widget">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-lg bg-pink-500/20 text-pink-400 text-sm font-mono font-bold">v{c.version}</span>
                <span className="text-sm text-slate-500">{c.date}</span>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                {c.items.map((item, i) => <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-pink-400 mt-0.5">•</span> {item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════ FOOTER ════════════════════════ */}
      <footer className="border-t mt-8 py-10 px-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-slate-500">© 2026 nae nexus hub. everything for everyone.</p>
          <a href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Discord</a>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function StatBig({ icon: Icon, value, label, color }: { icon: typeof Users; value: string | number; label: string; color: string }) {
  return (
    <div>
      <Icon className={`w-7 h-7 mx-auto mb-2 ${color}`} />
      <div className="text-3xl font-bold gradient-text-pk">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

/* ── Mock chat widget for the hero ── */
function MockChatWidget() {
  const msgs = [
    { user: 'miyoxz',   text: 'no siemano, nowy update crazy',  me: false, color: 'from-rose-500 to-pink-500' },
    { user: 'kacper',   text: 'kino dzisiaj o 20?',              me: false, color: 'from-sky-500 to-indigo-500' },
    { user: 'Ty',       text: 'jasne, dołączam do pokoju',       me: true,  color: '' },
    { user: 'miyoxz',   text: 'gramy w wisielca potem',          me: false, color: 'from-rose-500 to-pink-500' },
  ];
  return (
    <div className="widget p-5 shadow-2xl" style={{ borderRadius: '1.5rem' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center glow-pink">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Czat społeczności</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">{42} online</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex items-start gap-2.5 ${m.me ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${m.color || 'from-pink-500 to-cyan-500'}`}>
              {m.user.substring(0, 2).toUpperCase()}
            </div>
            <div className={`max-w-[75%] ${m.me ? 'items-end' : ''}`}>
              <p className="text-xs text-slate-500 mb-0.5">{m.user}</p>
              <div className={`px-3 py-2 rounded-xl text-sm ${m.me ? 'gradient-bg text-white' : 'bg-white/6 text-slate-200'}`} style={{ background: m.me ? undefined : 'rgba(255,255,255,0.06)' }}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <input disabled placeholder="Napisz wiadomość..." className="flex-1 bg-transparent text-sm text-slate-400 placeholder-slate-500 focus:outline-none" />
        <button className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Data ── */
const FEATURES = [
  {
    icon: MessageCircle, title: 'Czat społeczności', desc: 'Czatuj w czasie rzeczywistym z całą społecznością.',
    bullets: ['Wiadomości z 7-dniowym auto-usuwaniem', 'DM z nieprzeczytanymi znacznikami', 'Wysyłanie obrazów'],
  },
  {
    icon: Gamepad2, title: 'Mini-gry', desc: '7 gier z rankingiem i pokojami multiplayer.',
    bullets: ['Wisielec & Pictionary — do 10 graczy', 'Refleks, Pamięć, Snake, Math Sprint', 'Globalny ranking punktowy'],
  },
  {
    icon: Film, title: 'Kino', desc: 'Oglądaj filmy razem w wirtualnych pokojach.',
    bullets: ['Wirtualne miejsca siedzące (2×5)', 'Czat pokoju podczas oglądania', 'Synchronizacja YouTube'],
  },
  {
    icon: Music, title: 'Muzyka', desc: 'Słuchaj z innymi i pokazuj co grasz.',
    bullets: ['YouTube i Spotify w jednym', 'Auto-wykrywanie tytułu i artysty', 'Status "teraz słucha" na profilu'],
  },
];

const UPDATES = [
  { tag: 'Beta',        color: 'bg-pink-500/20 text-pink-400',  date: '01.07.2026', title: 'nae nexus hub beta wystartowało',  desc: 'Platforma jest teraz samodzielna. Dostępna rejestracja, profile, czat społeczności i mini-gry.' },
  { tag: 'Funkcja',     color: 'bg-cyan-400/20 text-cyan-400',  date: '01.07.2026', title: 'Pokoje kinowe z wirtualnymi miejscami', desc: 'Oglądaj filmy razem w pokojach z dwoma rzędami po pięć miejsc.' },
  { tag: 'Funkcja',     color: 'bg-cyan-400/20 text-cyan-400',  date: '01.07.2026', title: 'Mini-gry multiplayer',             desc: 'Wisielec i Pictionary obsługują pokoje do 10 graczy.' },
  { tag: 'Bezpieczeństwo', color: 'bg-rose-500/20 text-rose-400', date: '01.07.2026', title: 'Wzmocnione zasady RLS',       desc: 'Wszystkie tabele egzekwują bezpieczeństwo na poziomie wierszy.' },
];

const EVENTS = [
  { date: '04', month: 'LIP', title: 'Turniej Pictionary',  desc: 'Dołącz do pierwszego turnieju Pictionary.', icon: Gamepad2 },
  { date: '07', month: 'LIP', title: 'Wieczór kinowy',      desc: 'Wspólne oglądanie filmu w Kinie.',          icon: Film },
  { date: '10', month: 'LIP', title: 'Reset rankingu',      desc: 'Miesięczny reset rankingu gry Refleks.',    icon: Zap },
];

const CHANGELOG = [
  { version: '0.1.0', date: 'Lip 2026', items: ['Pierwsze uruchomienie beta', 'Autoryzacja nazwą użytkownika + klucz', 'Czat społeczności z 7-dniowym TTL', '7 mini-gier z rankingiem', 'Pokoje kinowe z wirtualnymi miejscami', 'Odtwarzacz muzyki z YouTube/Spotify'] },
];
