import React from 'react';
import { Library, Activity, ListMusic, AudioWaveform, Clock } from 'lucide-react';

export function Home() {
  return (
    <div className="h-full flex flex-col gap-8 pb-8 animate-in fade-in duration-500">
      
      {/* Hero Section (Reduced height) */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-border p-8 md:p-10 shadow-lg">
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
          
          <button className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-background font-bold rounded-full transition-all shadow-glow hover:scale-105 active:scale-95 text-sm">
            Scan Library
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1 text-text-primary">
          <Clock className="w-5 h-5" />
          <h2 className="text-lg font-bold">Recent Activity</h2>
        </div>
        <div className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
           <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-4">
             <Activity className="w-6 h-6 text-text-muted" />
           </div>
           <p className="text-text-primary font-medium mb-1">No recent activity</p>
           <p className="text-sm text-text-muted max-w-sm">Play a track or scan your library to see your recent history here.</p>
        </div>
      </div>

      {/* Feature Cards */}
      <div>
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
