import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
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
  libraryStats: LibraryStats | null;
  
  isLoading: boolean;
  isScanning: boolean;
  scanProgress: number;

  loadLibrary: () => Promise<void>;
  rescanLibrary: (folderPath: string) => Promise<void>;
  clearLibrary: () => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  libraryStats: null,
  
  isLoading: false,
  isScanning: false,
  scanProgress: 0,

  loadLibrary: async () => {
    set({ isLoading: true });
    try {
      const [tracks, albums, artists, libraryStats] = await Promise.all([
        invoke<Track[]>('get_tracks'),
        invoke<Album[]>('get_albums'),
        invoke<Artist[]>('get_artists'),
        invoke<LibraryStats>('get_library_stats')
      ]);
      set({ tracks, albums, artists, libraryStats, isLoading: false });
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
      throw err; // Re-throw to handle it in the UI component
    }
  },

  clearLibrary: () => set({ 
    tracks: [], 
    albums: [], 
    artists: [], 
    libraryStats: null 
  }),
}));
