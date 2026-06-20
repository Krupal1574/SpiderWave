import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Track } from '../shared/types/track';

interface PositionPayload {
  position: number;
}

interface PlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  volume: number;
  progress: number;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  audioQuality: 'low' | 'normal' | 'high' | 'lossless' | 'hi-res';
  
  // Actions
  playTrack: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  syncPlaybackState: () => void;
  
  // Queue Actions (To be implemented fully in 4B)
  setQueue: (queue: Track[]) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
}

let isSynced = false;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  volume: 1, // 0.0 to 1.0
  progress: 0,
  shuffle: false,
  repeat: 'off',
  audioQuality: 'lossless',

  playTrack: async (track: Track) => {
    try {
      await invoke('play_track', { path: track.path });
      set({ currentTrack: track, isPlaying: true, progress: 0 });
    } catch (err) {
      console.error('Failed to play track:', err);
    }
  },

  pause: async () => {
    try {
      await invoke('pause_playback');
      set({ isPlaying: false });
    } catch (err) {
      console.error('Failed to pause:', err);
    }
  },

  resume: async () => {
    try {
      await invoke('resume_playback');
      set({ isPlaying: true });
    } catch (err) {
      console.error('Failed to resume:', err);
    }
  },

  stop: async () => {
    try {
      await invoke('stop_playback');
      set({ isPlaying: false, progress: 0 });
    } catch (err) {
      console.error('Failed to stop:', err);
    }
  },

  setVolume: async (volume: number) => {
    try {
      await invoke('set_volume', { volume });
      set({ volume });
    } catch (err) {
      console.error('Failed to set volume:', err);
    }
  },

  syncPlaybackState: () => {
    if (isSynced) return;
    isSynced = true;

    // Listen for progress updates
    listen<PositionPayload>('playback-position', (event) => {
      set({ progress: event.payload.position });
    });

    // Listen for state changes from backend
    listen('playback-started', () => set({ isPlaying: true }));
    listen('playback-paused', () => set({ isPlaying: false }));
    listen('playback-resumed', () => set({ isPlaying: true }));
    listen('playback-stopped', () => set({ isPlaying: false, progress: 0 }));
    listen('playback-ended', () => {
      set({ isPlaying: false, progress: 0 });
      // Phase 4B: trigger playNext here if queue exists
    });
  },

  setQueue: (queue) => set({ queue }),
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  toggleRepeat: () => set((state) => {
    const nextMode = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    return { repeat: nextMode };
  }),
  
  playNext: () => { /* Phase 4B */ },
  playPrevious: () => { /* Phase 4B */ },
}));
