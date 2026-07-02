import { OnlineStatus } from '../lib/types';

// Custom SVG status symbols — no emojis
function OnlineSymbol() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}
function AfkSymbol() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 15s1.5-1 4-1 4 1 4 1" />
      <path d="M9 9l2 1m2 0l2-1" />
    </svg>
  );
}
function BusySymbol() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="8" y1="8" x2="16" y2="16" />
      <line x1="16" y1="8" x2="8" y2="16" />
    </svg>
  );
}
function InvisibleSymbol() {
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 15s1.5-2 4-2 4 2 4 2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
      <path d="M3 3l18 18" opacity="0.4" />
    </svg>
  );
}

export const STATUS_CONFIG: Record<OnlineStatus, { color: string; label: string; symbol: () => JSX.Element; bg: string; ring: string }> = {
  online: { color: 'bg-emerald-500', label: 'Online', symbol: OnlineSymbol, bg: 'bg-emerald-500/20', ring: 'ring-emerald-500/40' },
  afk: { color: 'bg-violet-500', label: 'AFK', symbol: AfkSymbol, bg: 'bg-violet-500/20', ring: 'ring-violet-500/40' },
  busy: { color: 'bg-rose-500', label: 'Zajęty', symbol: BusySymbol, bg: 'bg-rose-500/20', ring: 'ring-rose-500/40' },
  invisible: { color: 'bg-slate-500', label: 'Niewidoczny', symbol: InvisibleSymbol, bg: 'bg-slate-500/20', ring: 'ring-slate-500/40' },
};

interface StatusDotProps {
  status: OnlineStatus;
  size?: 'sm' | 'md' | 'lg';
  showSymbol?: boolean;
}

export function StatusDot({ status, size = 'sm', showSymbol = false }: StatusDotProps) {
  const cfg = STATUS_CONFIG[status];
  const Symbol = cfg.symbol;
  const sz = size === 'sm' ? 'w-3.5 h-3.5 p-0.5' : size === 'md' ? 'w-5 h-5 p-1' : 'w-6 h-6 p-1';
  return (
    <div className={`${cfg.color} ${sz} rounded-full flex items-center justify-center ring-2 ring-[#0b0d14] text-white shrink-0`}>
      {showSymbol && <Symbol />}
    </div>
  );
}
