import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Track } from '../shared/types/track';
import { Album } from '../shared/types/album';
import { Artist } from '../shared/types/artist';
import { Playlist } from '../shared/types/playlist';

interface LibraryStats {
  totalTracks: number;
  totalAlbums: number;
  totalArtists: number;
  lastScanAt: string | null;
}

interface LibraryState {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  recentHistory: Track[];
  libraryStats: LibraryStats | null;
  dbPath: string | null;
  
  isLoading: boolean;
  isScanning: boolean;
  scanProgress: number;

  loadLibrary: () => Promise<void>;
  rescanLibrary: (folderPath: string) => Promise<void>;
  rescanAllFolders: () => Promise<void>;
  clearLibrary: () => void;
  addToHistory: (trackId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  recentHistory: [],
  libraryStats: null,
  dbPath: null,
  
  isLoading: false,
  isScanning: false,
  scanProgress: 0,

  loadLibrary: async () => {
    set({ isLoading: true });
    try {
      const [tracks, albums, artists, libraryStats, recentHistory, dbPath] = await Promise.all([
        invoke<Track[]>('get_tracks'),
        invoke<Album[]>('get_albums'),
        invoke<Artist[]>('get_artists'),
        invoke<LibraryStats>('get_library_stats'),
        invoke<Track[]>('get_recent_history'),
        invoke<string>('get_database_path'),
      ]);
      set({ tracks, albums, artists, libraryStats, recentHistory, dbPath, isLoading: false });
    } catch (err) {
      console.error('Failed to load library:', err);
      set({ isLoading: false });
    }
  },

  rescanLibrary: async (folderPath: string) => {
    set({ isScanning: true, scanProgress: 0 });
    try {
      await invoke('scan_music_library', { folderPath });
      await get().loadLibrary();
      set({ isScanning: false });
    } catch (err) {
      console.error('Scan failed:', err);
      set({ isScanning: false });
      throw err;
    }
  },

  rescanAllFolders: async () => {
    set({ isScanning: true, scanProgress: 0 });
    try {
      await invoke('rescan_all_folders');
      await get().loadLibrary();
      set({ isScanning: false });
    } catch (err) {
      console.error('Rescan all folders failed:', err);
      set({ isScanning: false });
      throw err;
    }
  },

  addToHistory: async (trackId: string) => {
    try {
      await invoke('add_to_history', { trackId: parseInt(trackId, 10) });
      const recentHistory = await invoke<Track[]>('get_recent_history');
      set({ recentHistory });
    } catch (err) {
      console.error('Failed to add to history:', err);
    }
  },

  clearLibrary: () => set({ 
    tracks: [], 
    albums: [], 
    artists: [], 
    recentHistory: [],
    libraryStats: null 
  }),
}));

// Listen for the 'library-updated' event emitted by the Rust startup scan.
// When the background scan completes, reload the library automatically.
if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
  listen('library-updated', () => {
    useLibraryStore.getState().loadLibrary();
  });
}
