import { create } from 'zustand';
import { Track } from '../shared/types/track';

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
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (queue: Track[]) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  volume: 1, // 0.0 to 1.0
  progress: 0,
  shuffle: false,
  repeat: 'off',
  audioQuality: 'lossless', // default presentation for SpiderWave

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTrack: (currentTrack) => set({ currentTrack }),
  setQueue: (queue) => set({ queue }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  toggleRepeat: () => set((state) => {
    const nextMode = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    return { repeat: nextMode };
  }),
  playNext: () => set((state) => {
    if (state.queue.length === 0) return state;
    
    // Determine the next index
    let nextIndex = state.queueIndex + 1;
    if (nextIndex >= state.queue.length) {
      if (state.repeat === 'all') {
        nextIndex = 0;
      } else {
        return state; // End of queue, do nothing
      }
    }
    
    return { 
      currentTrack: state.queue[nextIndex], 
      queueIndex: nextIndex,
      isPlaying: true, 
      progress: 0 
    };
  }),
  playPrevious: () => set((state) => {
    if (state.queue.length === 0) return state;
    
    let prevIndex = state.queueIndex - 1;
    if (prevIndex < 0) {
      if (state.repeat === 'all') {
        prevIndex = state.queue.length - 1;
      } else {
        prevIndex = 0; // Just restart current track if at beginning
      }
    }
    
    return { 
      currentTrack: state.queue[prevIndex], 
      queueIndex: prevIndex,
      isPlaying: true, 
      progress: 0 
    };
  }),
}));
