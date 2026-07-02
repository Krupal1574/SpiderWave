import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Mic2, MonitorSpeaker, ListVideo, Heart, Disc3, Square } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { cn } from '../shared/utils/cn';
import { useNavigate } from 'react-router-dom';
import { Slider } from '../shared/components/Slider';

export function PlayerBar() {
  const navigate = useNavigate();
  const {
    isPlaying, currentTrack, volume, progress, audioQuality,
    pause, resume, stop, setVolume, toggleShuffle, shuffle, toggleRepeat, repeat,
    syncPlaybackState, playNext, playPrevious, seek, trackCapabilities
  } = usePlayerStore();

  const canSeek = currentTrack ? (trackCapabilities[currentTrack.id]?.canSeek ?? true) : false;

  useEffect(() => {
    if ('__TAURI_INTERNALS__' in window) {
      syncPlaybackState();
    }
  }, [syncPlaybackState]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (currentTrack) {
      resume();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[96px] w-full bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-between px-6 select-none relative z-50">

      {/* Left: Track Info */}
      <div className="flex items-center gap-4 w-[30%] min-w-[240px]">
        {currentTrack ? (
          <>
            <div
              onClick={() => { if (currentTrack.albumId) navigate(`/album/${currentTrack.albumId}`) }}
              className="w-16 h-16 bg-surface-hover rounded-md overflow-hidden flex-shrink-0 shadow-md group relative cursor-pointer border border-border/50"
            >
              {currentTrack.albumArt ? (
                <img src={currentTrack.albumArt} alt="Album Art" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-hover text-text-muted">
                  <Disc3 className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex flex-col truncate">
              <span
                onClick={() => { if (currentTrack.albumId) navigate(`/album/${currentTrack.albumId}`) }}
                className="text-sm font-bold text-text-primary hover:underline cursor-pointer truncate"
              >
                {currentTrack.title}
              </span>
              <span
                onClick={() => { if (currentTrack.artistId) navigate(`/artist/${currentTrack.artistId}`) }}
                className="text-xs text-text-secondary hover:underline cursor-pointer truncate mt-0.5"
              >
                {currentTrack.artist}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="px-1.5 py-0.5 rounded border border-accent/30 text-accent bg-accent/10 text-[9px] font-bold tracking-widest uppercase">
                  {currentTrack.format || 'FLAC'}
                </span>
              </div>
            </div>
            <button className="ml-2 text-text-muted hover:text-primary transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4 w-full">
            <div className="w-16 h-16 bg-surface-hover/50 rounded-md shadow-sm border border-border/30 flex items-center justify-center border-dashed">
              <Disc3 className="w-6 h-6 text-text-muted/30" />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-sm font-semibold text-text-muted/70">No Track Playing</span>
              <span className="text-xs text-text-muted/50">Select a song to start listening</span>
              <div className="flex gap-1.5 mt-1">
                <div className="h-3 w-8 bg-surface-hover/50 rounded"></div>
                <div className="h-3 w-16 bg-surface-hover/50 rounded"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center: Playback Controls */}
      <div className="flex flex-col items-center justify-center gap-2 max-w-[40%] w-full">
        <div className="flex items-center gap-6">
          <button
            onClick={toggleShuffle}
            className={cn("transition-colors", shuffle ? "text-primary" : "text-text-muted hover:text-text-primary")}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={() => playPrevious()}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button
            onClick={() => { if (canSeek && currentTrack) seek(Math.max(0, progress - 10)) }}
            disabled={!canSeek}
            className={cn(
              "font-bold text-xs transition-colors",
              !canSeek ? "text-text-muted/30 cursor-not-allowed" : "text-text-secondary hover:text-text-primary"
            )}
            title={!canSeek ? "Seeking disabled for this format" : ""}
          >
            -10s
          </button>

          <button
            onClick={stop}
            className="text-text-secondary hover:text-red-400 transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full bg-text-primary text-background flex items-center justify-center hover:scale-105 transition-transform shadow-md"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-[2px]" />}
          </button>

          <button
            onClick={() => { if (canSeek && currentTrack) seek(Math.min(currentTrack.duration, progress + 10)) }}
            disabled={!canSeek}
            className={cn(
              "font-bold text-xs transition-colors",
              !canSeek ? "text-text-muted/30 cursor-not-allowed" : "text-text-secondary hover:text-text-primary"
            )}
            title={!canSeek ? "Seeking disabled for this format" : ""}
          >
            +10s
          </button>

          <button
            onClick={() => playNext()}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={toggleRepeat}
            className={cn("transition-colors relative", repeat !== 'off' ? "text-primary" : "text-text-muted hover:text-text-primary")}
          >
            <Repeat className="w-4 h-4" />
            {repeat === 'one' && (
              <span className="absolute -bottom-1 -right-1 text-[8px] font-bold">1</span>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 w-full max-w-[500px]">
          <span className="text-xs text-text-muted w-10 text-right font-mono tracking-tighter shrink-0">
            {currentTrack ? formatTime(progress) : '0:00'}
          </span>
          <div className="flex-1">
            <Slider
              value={progress}
              min={0}
              max={currentTrack?.duration || 1}
              onDragEnd={(val) => {
                if (canSeek && currentTrack) seek(val);
              }}
              disabled={!canSeek}
            />
          </div>
          <span className="text-xs text-text-muted w-10 font-mono tracking-tighter shrink-0 flex items-center justify-between">
            {currentTrack ? formatTime(currentTrack.duration) : '0:00'}
          </span>
        </div>
        {!canSeek && (
          <div className="text-[10px] text-text-muted/60 mt-1">
            Seeking disabled for this format
          </div>
        )}
      </div>

      {/* Right: Actions & Volume */}
      <div className="flex items-center justify-end gap-4 w-[30%] min-w-[200px]">

        <div className="hidden xl:flex items-center justify-center px-2 py-0.5 rounded border border-border text-[9px] font-bold text-text-muted uppercase tracking-widest cursor-help bg-surface-hover/50">
          {audioQuality.toUpperCase()}
        </div>

        <button className="text-text-muted hover:text-text-primary transition-colors">
          <Mic2 className="w-4 h-4" />
        </button>
        <button className="text-text-muted hover:text-text-primary transition-colors">
          <ListVideo className="w-4 h-4" />
        </button>
        <button className="text-text-muted hover:text-text-primary transition-colors">
          <MonitorSpeaker className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 group w-28">
          <Volume2 className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors" />
          <Slider
            value={volume}
            min={0}
            max={1}
            onChange={setVolume}
          />
        </div>
      </div>

    </div>
  );
}
