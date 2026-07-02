import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, X, Music, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { youtubeId, spotifyEmbedUrl } from '../lib/utils';

interface Track { url: string; title: string; artist: string; }

export function MusicPlayer() {
  const { profile } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentTrack = tracks[currentIdx];

  const updateMusicStatus = useCallback(async (playing: boolean, title: string, artist: string, url: string) => {
    if (!profile) return;
    await supabase.from('music_status').upsert({ id: profile.id, track_title: title, artist, url, is_playing: playing, updated_at: new Date().toISOString() });
  }, [profile]);

  useEffect(() => {
    if (currentTrack) updateMusicStatus(isPlaying, currentTrack.title, currentTrack.artist, currentTrack.url);
    else updateMusicStatus(false, '', '', '');
  }, [currentTrack, isPlaying, updateMusicStatus]);

  const detectTrackInfo = useCallback(async (url: string): Promise<{ title: string; artist: string }> => {
    const ytId = youtubeId(url);
    if (ytId) {
      try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytId}`);
        if (res.ok) { const data = await res.json(); return { title: data.title || 'Nieznany utwór', artist: data.author_name || 'Nieznany artysta' }; }
      } catch { /* fallback */ }
    }
    const spotify = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (spotify) return { title: 'Utwór Spotify', artist: 'Spotify' };
    return { title: 'Nieznany utwór', artist: 'Nieznany artysta' };
  }, []);

  const addTrack = async () => {
    if (!urlInput.trim()) return;
    const info = await detectTrackInfo(urlInput.trim());
    setTracks(prev => [...prev, { url: urlInput.trim(), title: info.title, artist: info.artist }]);
    setCurrentIdx(tracks.length);
    setIsPlaying(true);
    setShowBar(true);
    setShowUrlInput(false);
    setUrlInput('');
    setMinimized(false);
  };

  const removeTrack = (idx: number) => {
    setTracks(prev => prev.filter((_, i) => i !== idx));
    if (currentIdx >= idx && currentIdx > 0) setCurrentIdx(currentIdx - 1);
    if (tracks.length <= 1) { setShowBar(false); setIsPlaying(false); }
  };

  const nextTrack = () => { if (tracks.length) { setCurrentIdx((currentIdx + 1) % tracks.length); setIsPlaying(true); } };
  const prevTrack = () => { if (tracks.length) { setCurrentIdx((currentIdx - 1 + tracks.length) % tracks.length); setIsPlaying(true); } };
  const togglePlay = () => { if (currentTrack) { setIsPlaying(!isPlaying); setShowBar(true); } };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  let embedUrl = '';
  if (currentTrack) {
    const ytId = youtubeId(currentTrack.url);
    if (ytId) embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=${isPlaying ? '1' : '0'}&controls=1&mute=0`;
    else { const sp = spotifyEmbedUrl(currentTrack.url); if (sp) embedUrl = sp; }
  }

  const urlInputPanel = showUrlInput && (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-80 max-w-[90vw] widget p-4 animate-slide-up" style={{ borderRadius: '1rem' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-white">Dodaj muzykę</h3>
        <button onClick={() => setShowUrlInput(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTrack()} placeholder="Wklej link YouTube lub Spotify" className="w-full bg-surface border border-divider rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-400" />
        </div>
        <button onClick={addTrack} className="px-3 py-2 gradient-bg text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all">Dodaj</button>
      </div>
    </div>
  );

  return (
    <>
      {urlInputPanel}

      {/* All states rendered centered at the bottom — no jumping */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 max-w-[calc(100vw-2rem)]">
        {!showBar || !currentTrack ? (
          /* Floating music pill */
          <button
            onClick={() => { if (tracks.length > 0) { setShowBar(true); setMinimized(false); } else setShowUrlInput(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full gradient-bg text-white shadow-lg glow-pink transition-all hover:scale-105"
          >
            <Music className="w-4 h-4" />
            <span className="text-sm font-semibold">Muzyka</span>
            {tracks.length > 0 && isPlaying && (
              <span className="flex items-end gap-0.5 h-3 ml-1">
                <span className="w-0.5 bg-white rounded-full animate-bar" style={{ animationDelay: '0s' }} />
                <span className="w-0.5 bg-white rounded-full animate-bar" style={{ animationDelay: '0.15s' }} />
                <span className="w-0.5 bg-white rounded-full animate-bar" style={{ animationDelay: '0.3s' }} />
              </span>
            )}
          </button>
        ) : minimized ? (
          <button onClick={() => setMinimized(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-full widget-sm text-sm shadow-lg max-w-sm" style={{ borderRadius: '9999px' }}>
            <Music className="w-4 h-4 text-pink-400" />
            <span className="text-white truncate flex-1 text-left">{currentTrack.title}</span>
            <span className="text-slate-400 hidden sm:inline truncate max-w-24">— {currentTrack.artist}</span>
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        ) : (
          <div className="w-[360px] max-w-[calc(100vw-3rem)] widget p-3 shadow-2xl animate-scale-in" style={{ borderRadius: '1.25rem' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center shrink-0 glow-pink">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
                <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={prevTrack} className="p-1.5 text-slate-300 hover:text-white transition-colors"><SkipBack className="w-4 h-4" /></button>
                <button onClick={togglePlay} className="p-2 rounded-full gradient-bg text-white hover:scale-110 transition-transform">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={nextTrack} className="p-1.5 text-slate-300 hover:text-white transition-colors"><SkipForward className="w-4 h-4" /></button>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 w-24">
                <VolumeIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-pink-400" />
              </div>
              <button onClick={() => setShowUrlInput(s => !s)} className="p-1.5 text-slate-300 hover:text-pink-400 transition-colors" title="Dodaj utwór"><Link2 className="w-4 h-4" /></button>
              <button onClick={() => setMinimized(true)} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Zminimalizuj"><ChevronDown className="w-4 h-4" /></button>
              <button onClick={() => { setShowBar(false); setIsPlaying(false); }} className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors" title="Zamknij"><X className="w-4 h-4" /></button>
            </div>
            {tracks.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-thin pb-1">
                {tracks.map((t, i) => (
                  <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs shrink-0 ${i === currentIdx ? 'bg-pink-500/20 border border-pink-400/30' : 'bg-white/5'}`}>
                    <button onClick={() => { setCurrentIdx(i); setIsPlaying(true); }} className="text-slate-300 hover:text-white truncate max-w-28">{t.title}</button>
                    <button onClick={() => removeTrack(i)} className="text-slate-500 hover:text-rose-400"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden">
        {embedUrl && <iframe ref={iframeRef} src={embedUrl} allow="autoplay; encrypted-media" title="music-player" />}
      </div>
    </>
  );
}
