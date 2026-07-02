import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';
import { useTheme } from '../lib/theme';

type WIcon = 'sun' | 'cloud' | 'rain' | 'snow' | 'storm';
const WIcons: Record<WIcon, typeof Cloud> = { sun: Sun, cloud: Cloud, rain: CloudRain, snow: CloudSnow, storm: CloudLightning };
function codeToIcon(c: number): WIcon {
  if (c === 0) return 'sun';
  if (c <= 48) return 'cloud';
  if (c <= 67) return 'rain';
  if (c <= 77) return 'snow';
  if (c <= 82) return 'rain';
  if (c >= 95) return 'storm';
  return 'cloud';
}

const MONTHS_PL = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

export function WeatherBar() {
  const { theme, toggleTheme } = useTheme();
  const [temp, setTemp] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [icon, setIcon] = useState<WIcon>('cloud');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('https://wttr.in/Warsaw?format=j1')
      .then(r => r.json())
      .then(data => {
        const c = data.current_condition?.[0];
        if (c) {
          setTemp(parseInt(c.temp_C));
          setHumidity(parseInt(c.humidity));
          setIcon(codeToIcon(parseInt(c.weatherCode)));
        }
      })
      .catch(() => { setTemp(19); setHumidity(58); setIcon('cloud'); });
  }, []);

  const Icon = WIcons[icon];
  const timeStr = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const dateStr = `${now.getDate().toString().padStart(2, '0')} ${MONTHS_PL[now.getMonth()]}`;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs shrink-0 cursor-pointer hover:brightness-110 transition-all"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Przełącz na jasny' : 'Przełącz na ciemny'}
    >
      <Icon className="w-3.5 h-3.5 text-slate-300" />
      <span className="font-semibold text-white">{temp !== null ? `${temp}°` : '–'}</span>
      {humidity !== null && (
        <>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{humidity}%</span>
        </>
      )}
      <span className="text-slate-500 hidden lg:inline">|</span>
      <span className="font-semibold text-white hidden lg:inline tabular-nums">{timeStr}</span>
      <span className="text-slate-400 hidden lg:inline">{dateStr} · Polska</span>
    </div>
  );
}
