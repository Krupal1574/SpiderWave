import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Track } from '../shared/types/track';
import { useLibraryStore } from './useLibraryStore';

export interface QueueItem {
  id: string;
  track: Track;
}

interface PositionPayload {
  position: number;
}

interface PlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  
  queue: QueueItem[];
  originalQueue: QueueItem[];
  
  activePlayback: {
    queueItemId: string;
    requestId: string;
  } | null;
  pendingTransition: {
    requestId: string;
    queueItemId: string;
  } | null;

  volume: number;
  progress: number;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  audioQuality: 'low' | 'normal' | 'high' | 'lossless' | 'hi-res';
  isSeeking: boolean;
  
  trackCapabilities: Record<string, {
    canSeek: boolean;
  }>;
  
  // Actions
  playContext: (contextQueue: Track[], startIndex: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  syncPlaybackState: () => void;
  
  // Transport Actions
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: (isAuto?: boolean) => Promise<void>;
  playPrevious: () => Promise<void>;
  seek: (position: number) => Promise<void>;

  // Queue Management
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  removeFromQueue: (queueItemId: string) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  initPlayerState: () => Promise<void>;
  playQueueItem: (queueItemId: string) => Promise<void>;
}

let isSynced = false;
let consecutiveFailures = 0;
let lastPlaybackEndedTime = 0;

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

const generateRequestId = () => `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const generateQueueItemId = () => `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const saveQueueState = async (state: PlayerState) => {
  try {
    const items = state.queue.map((t) => [t.id, Number(t.track.id)]);
    await invoke('save_queue_state', {
      items,
      activeId: state.activePlayback?.queueItemId || null,
      shuffle: state.shuffle,
      repeat: state.repeat,
      volume: state.volume,
    });
  } catch (err) {
    console.error('Failed to save queue state:', err);
  }
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  currentTrack: null,
  queue: [],
  originalQueue: [],
  activePlayback: null,
  pendingTransition: null,
  volume: 1, 
  progress: 0,
  shuffle: false,
  repeat: 'off',
  audioQuality: 'lossless',
  isSeeking: false,
  trackCapabilities: {},

  playContext: async (contextQueue: Track[], startIndex: number) => {
    if (contextQueue.length === 0) return;
    
    const { shuffle } = get();
    
    const originalQItems: QueueItem[] = contextQueue.map(t => ({ id: generateQueueItemId(), track: t }));
    let newQueue: QueueItem[];
    let activeItem: QueueItem;

    if (shuffle) {
      activeItem = originalQItems[startIndex];
      const rest = originalQItems.filter((_, i) => i !== startIndex);
      newQueue = [activeItem, ...shuffleArray(rest)];
    } else {
      newQueue = originalQItems;
      activeItem = originalQItems[startIndex];
    }

    const requestId = generateRequestId();

    set({ 
      originalQueue: originalQItems,
      queue: newQueue,
      pendingTransition: {
        requestId,
        queueItemId: activeItem.id
      }
    });
    saveQueueState(get());

    try {
      await invoke('play_track', { requestId, path: activeItem.track.path });
      consecutiveFailures = 0;
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
      set({ isPlaying: false, progress: 0, currentTrack: null, activePlayback: null, pendingTransition: null });
    } catch (err) {
      console.error('Failed to stop:', err);
    }
  },

  setVolume: async (volume: number) => {
    try {
      await invoke('set_volume', { volume });
      set({ volume });
      saveQueueState(get());
    } catch (err) {
      console.error('Failed to set volume:', err);
    }
  },

  syncPlaybackState: () => {
    if (isSynced) return;
    isSynced = true;

    listen<PositionPayload>('playback-position', (event) => {
      if (!get().isSeeking) {
        set({ progress: event.payload.position });
      }
    });

    listen<{ request_id: string, position: number }>('seek-acknowledged', (event) => {
      const { pendingTransition } = get();
      // Only allow seek events if we are not actively transitioning to a different track
      if (!pendingTransition) {
        set({ progress: event.payload.position, isSeeking: false });
      }
    });

    listen<{ trackId: string, reason: string }>('seek-failed', (event) => {
      const { activePlayback, currentTrack, trackCapabilities } = get();
      if (activePlayback && activePlayback.requestId === event.payload.trackId && currentTrack) {
        set({
          isSeeking: false,
          trackCapabilities: {
            ...trackCapabilities,
            [currentTrack.id]: { canSeek: false }
          }
        });
      }
    });

    listen<{ request_id: string }>('playback-started', (event) => {
      const { pendingTransition, queue } = get();
      
      if (pendingTransition && event.payload.request_id === pendingTransition.requestId) {
        const item = queue.find(q => q.id === pendingTransition.queueItemId);
        if (item) {
          set({ 
            currentTrack: item.track, 
            isPlaying: true, 
            progress: 0,
            activePlayback: { queueItemId: pendingTransition.queueItemId, requestId: pendingTransition.requestId },
            pendingTransition: null
          });
          useLibraryStore.getState().addToHistory(item.track.id);
        } else {
          console.warn('Pending track was removed from queue before it could start. Aborting and playing next.');
          set({ pendingTransition: null });
          get().playNext(true);
        }
      }
    });
    
    listen('playback-paused', () => set({ isPlaying: false }));
    listen('playback-resumed', () => set({ isPlaying: true }));
    listen('playback-stopped', () => set({ isPlaying: false, progress: 0, activePlayback: null, pendingTransition: null }));
    
    listen<{ request_id: string }>('playback-failed', (event) => {
      const { pendingTransition } = get();
      if (pendingTransition && event.payload.request_id === pendingTransition.requestId) {
        console.log(`[DEBUG] Playback failed for request ${event.payload.request_id}`);
        set({ pendingTransition: null });
        get().playNext(true);
      }
    });

    listen<{ request_id: string }>('playback-ended', (event) => {
      const { pendingTransition } = get();
      // If we are already transitioning, ignore this. It's likely from the old track dropping.
      if (pendingTransition) return;

      const now = Date.now();
      if (now - lastPlaybackEndedTime < 50) return;
      lastPlaybackEndedTime = now;
      
      console.log('[DEBUG] playback-ended received, advancing queue');
      set({ isPlaying: false, progress: 0 });
      get().playNext(true);
    });
  },

  toggleShuffle: () => {
    const { shuffle, originalQueue, activePlayback } = get();
    const newShuffle = !shuffle;
    
    if (newShuffle) {
      if (originalQueue.length > 0 && activePlayback) {
        const activeItem = originalQueue.find(q => q.id === activePlayback.queueItemId);
        if (activeItem) {
          const rest = originalQueue.filter(t => t.id !== activePlayback.queueItemId);
          const newQueue = [activeItem, ...shuffleArray(rest)];
          set({ shuffle: newShuffle, queue: newQueue });
        } else {
          set({ shuffle: newShuffle });
        }
      } else {
        set({ shuffle: newShuffle });
      }
    } else {
      set({ shuffle: newShuffle, queue: originalQueue });
    }
    saveQueueState(get());
  },

  toggleRepeat: () => {
    set((state) => {
      const nextMode = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
      return { repeat: nextMode };
    });
    saveQueueState(get());
  },
  
  playQueueItem: async (queueItemId: string) => {
    const { queue } = get();
    const item = queue.find(q => q.id === queueItemId);
    if (!item) return;

    const requestId = generateRequestId();
    set({
      pendingTransition: { requestId, queueItemId }
    });
    saveQueueState(get());

    try {
      await invoke('play_track', { requestId, path: item.track.path });
      consecutiveFailures = 0;
    } catch (err) {
      console.error('Failed to play queue item:', err);
    }
  },

  playNext: async (isAuto = false) => {
    const { queue, activePlayback, repeat, currentTrack } = get();
    
    if (queue.length === 0) return;

    if (isAuto && repeat === 'one' && currentTrack && consecutiveFailures === 0 && activePlayback) {
      const requestId = generateRequestId();
      set({ pendingTransition: { requestId, queueItemId: activePlayback.queueItemId } });
      try {
        await invoke('play_track', { requestId, path: currentTrack.path });
      } catch (err) {
        console.error('Failed to replay track:', err);
      }
      return;
    }

    if (isAuto) {
      consecutiveFailures++;
      if (consecutiveFailures > queue.length) {
        console.log('[DEBUG] Consecutive failures exceeded queue length, stopping to prevent infinite loop');
        consecutiveFailures = 0;
        await get().stop();
        return;
      }
    } else {
      consecutiveFailures = 0;
    }

    const currentIndex = activePlayback ? queue.findIndex(q => q.id === activePlayback.queueItemId) : -1;
    let nextIndex = currentIndex !== -1 ? currentIndex + 1 : 0;
    
    if (nextIndex >= queue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        console.log('[DEBUG] Reached end of queue, stopping playback');
        await get().stop();
        consecutiveFailures = 0;
        return;
      }
    }

    const nextItem = queue[nextIndex];
    const requestId = generateRequestId();
    console.log(`[DEBUG] playNext: requesting track id=${nextItem.track.id}, req=${requestId}`);
    
    set({ pendingTransition: { requestId, queueItemId: nextItem.id } });
    saveQueueState(get());
    
    try {
      await invoke('play_track', { requestId, path: nextItem.track.path });
      if (!isAuto) consecutiveFailures = 0;
    } catch (err) {
      console.error('Failed to play next track:', err);
      setTimeout(() => get().playNext(true), 100);
    }
  },

  playPrevious: async () => {
    const { progress, queue, activePlayback, repeat, currentTrack } = get();
    if (queue.length === 0 || !activePlayback) return;

    if (progress > 3) {
      const requestId = generateRequestId();
      set({ pendingTransition: { requestId, queueItemId: activePlayback.queueItemId } });
      try {
        await invoke('play_track', { requestId, path: currentTrack!.path });
      } catch (err) {
        console.error('Failed to restart track:', err);
      }
      return;
    }

    const currentIndex = queue.findIndex(q => q.id === activePlayback.queueItemId);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    const prevItem = queue[prevIndex];
    const requestId = generateRequestId();
    set({ pendingTransition: { requestId, queueItemId: prevItem.id } });
    saveQueueState(get());
    
    try {
      await invoke('play_track', { requestId, path: prevItem.track.path });
    } catch (err) {
      console.error('Failed to play previous track:', err);
    }
  },

  seek: async (position: number) => {
    try {
      // Seek shouldn't happen if we're actively transitioning
      const { pendingTransition, activePlayback } = get();
      if (pendingTransition || !activePlayback) return;
      
      console.log(`[DEBUG] Executing seek to ${position}`);
      set({ progress: position, isSeeking: true });
      await invoke('seek_to', { requestId: activePlayback.requestId, position: Math.floor(position) });
    } catch (err) {
      console.error('Failed to seek:', err);
      set({ isSeeking: false });
    }
  },

  addToQueue: (track: Track) => {
    const { queue, originalQueue } = get();
    if (queue.length === 0) {
      get().playContext([track], 0);
      return;
    }
    const newItem = { id: generateQueueItemId(), track };
    set({
      queue: [...queue, newItem],
      originalQueue: [...originalQueue, newItem],
    });
    saveQueueState(get());
  },

  playNextInQueue: (track: Track) => {
    const { queue, originalQueue, activePlayback, pendingTransition } = get();
    if (queue.length === 0) {
      get().playContext([track], 0);
      return;
    }
    
    const newItem = { id: generateQueueItemId(), track };
    const targetItemId = pendingTransition?.queueItemId || activePlayback?.queueItemId;
    
    let insertIndex = targetItemId ? queue.findIndex(q => q.id === targetItemId) + 1 : queue.length;
    if (insertIndex === 0) insertIndex = queue.length; // fallback

    const newQueue = [...queue];
    newQueue.splice(insertIndex, 0, newItem);
    
    const newOriginal = [...originalQueue];
    newOriginal.push(newItem);

    set({ queue: newQueue, originalQueue: newOriginal });
    saveQueueState(get());
  },

  removeFromQueue: (queueItemId: string) => {
    const { queue, activePlayback, pendingTransition } = get();
    const itemIndex = queue.findIndex(q => q.id === queueItemId);
    if (itemIndex === -1) return;

    if (queueItemId === pendingTransition?.queueItemId) {
      // User deleted the loading track! Abort transition and try playing next immediately
      console.warn('User removed the actively loading track. Aborting transition.');
      set({ pendingTransition: null });
      
      const newQueue = [...queue];
      newQueue.splice(itemIndex, 1);
      set({ queue: newQueue });
      
      get().playNext();
      saveQueueState(get());
      return;
    }

    if (activePlayback && queueItemId === activePlayback.queueItemId && !pendingTransition) {
      // Currently playing track removed
      get().playNext();
      const newQueue = [...queue];
      newQueue.splice(itemIndex, 1);
      if (newQueue.length === 0) {
        get().stop();
        set({ queue: [] });
      } else {
        set({ queue: newQueue });
      }
      saveQueueState(get());
      return;
    }

    const newQueue = [...queue];
    newQueue.splice(itemIndex, 1);
    set({ queue: newQueue });
    saveQueueState(get());
  },

  clearQueue: () => {
    const { queue, activePlayback, pendingTransition } = get();
    if (queue.length === 0) return;
    
    const targetId = pendingTransition?.queueItemId || activePlayback?.queueItemId;
    if (!targetId) {
      set({ queue: [] });
      return;
    }

    const targetItem = queue.find(q => q.id === targetId);
    if (targetItem) {
      set({ queue: [targetItem] });
    } else {
      set({ queue: [] });
    }
    saveQueueState(get());
  },

  reorderQueue: (startIndex: number, endIndex: number) => {
    const { queue } = get();
    const newQueue = Array.from(queue);
    const [removed] = newQueue.splice(startIndex, 1);
    newQueue.splice(endIndex, 0, removed);

    set({ queue: newQueue });
    saveQueueState(get());
  },

  initPlayerState: async () => {
    try {
      const state: any = await invoke('load_queue_state');
      if (state && state.queue.length > 0) {
        // Rust now returns { queue: [{id, track}], active_queue_item_id: "..." }
        const activeId = state.activeQueueItemId;
        const activeItem = state.queue.find((q: any) => q.id === activeId) || state.queue[0];
        set({
          queue: state.queue,
          originalQueue: state.queue,
          activePlayback: activeId ? { queueItemId: activeId, requestId: "restored" } : null,
          shuffle: state.shuffle,
          repeat: state.repeat as any,
          volume: state.volume,
          currentTrack: activeItem.track,
        });
        await invoke('set_volume', { volume: state.volume });
      }
    } catch (err) {
      console.error('Failed to init player state:', err);
    }
  },
}));
