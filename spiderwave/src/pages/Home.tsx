import React from 'react';
import { Library, Activity, ListMusic, AudioWaveform, Clock, Play, Settings } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useNavigate } from 'react-router-dom';
import { Track } from '../shared/types/track';
import { formatTimeAgo } from '../shared/utils/dateUtils';

export function Home() {
  const { recentHistory } = useLibraryStore();
  const { playContext } = usePlayerStore();
  const navigate = useNavigate();

  const handlePlayHistory = (track: Track, idx: number) => {
    playContext(recentHistory, idx);
  };

  return (
    <div className="h-full flex flex-col gap-8 pb-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar px-6 pt-6">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-border p-8 md:p-10 shadow-lg shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary mb-3">
            🎵 Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">SpiderWave</span>
          </h1>
          <p className="text-base md:text-lg text-text-secondary mb-6 font-medium">
            Your Music. Your Wave.
          </p>
          <p className="text-sm text-text-muted mb-8 max-w-lg leading-relaxed">
            Scan your local music collection, extract rich metadata, and build a blazing-fast, beautiful local library.
          </p>
          
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-background font-bold rounded-full transition-all shadow-glow hover:scale-105 active:scale-95 text-sm"
          >
            <Settings className="w-4 h-4" />
            Manage Library
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-4 px-1 text-text-primary">
          <Clock className="w-5 h-5" />
          <h2 className="text-lg font-bold">Recent Activity</h2>
        </div>
        
        {recentHistory.length === 0 ? (
          <div className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
             <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-4">
               <Activity className="w-6 h-6 text-text-muted" />
             </div>
             <p className="text-text-primary font-medium mb-1">No recent activity</p>
             <p className="text-sm text-text-muted max-w-sm">Play a track or scan your library to see your recent history here.</p>
          </div>
        ) : (
          <div className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm overflow-hidden flex flex-col">
             {recentHistory.map((track, idx) => (
                <div key={`${track.id}-${idx}`} className="group flex items-center justify-between p-3 border-b border-border/30 hover:bg-surface-active transition-colors">
                  <div className="flex flex-col truncate w-3/4">
                    <span className="text-sm font-bold text-text-primary truncate">{track.title}</span>
                    <span className="text-xs text-text-secondary truncate">{track.artist}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handlePlayHistory(track, idx)}
                      className="w-8 h-8 rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-primary hover:text-background transition-all"
                    >
                      <Play className="w-4 h-4 translate-x-[1px] fill-current" />
                    </button>
                  </div>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="shrink-0">
        <h2 className="text-lg font-bold text-text-primary mb-4 px-1">Experience Premium Audio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:bg-surface-hover hover:border-border transition-all group">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Library className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1 text-sm">Library Management</h3>
            <p className="text-xs text-text-muted leading-relaxed">Organize vast collections effortlessly with instant search and smart sorting.</p>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:bg-surface-hover hover:border-border transition-all group">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1 text-sm">Advanced Audio</h3>
            <p className="text-xs text-text-muted leading-relaxed">Bit-perfect playback, gapless transitions, and parametric EQ controls.</p>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:bg-surface-hover hover:border-border transition-all group">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ListMusic className="w-5 h-5 text-pink-500" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1 text-sm">Smart Playlists</h3>
            <p className="text-xs text-text-muted leading-relaxed">Build dynamic queues and custom playlists that adapt to your listening habits.</p>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:bg-surface-hover hover:border-border transition-all group">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <AudioWaveform className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1 text-sm">Lossless Ready</h3>
            <p className="text-xs text-text-muted leading-relaxed">Full support for FLAC, ALAC, WAV, and high-resolution 24-bit audio files.</p>
          </div>

        </div>
      </div>

    </div>
  );
}
