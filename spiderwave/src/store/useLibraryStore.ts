import { create } from 'zustand';
import { Track } from '../shared/types/track';
import { Album } from '../shared/types/album';
import { Artist } from '../shared/types/artist';
import { Playlist } from '../shared/types/playlist';

interface LibraryState {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  isScanning: boolean;
  scanProgress: number;
  lastScanAt: number | null;

  setTracks: (tracks: Track[]) => void;
  setAlbums: (albums: Album[]) => void;
  setArtists: (artists: Artist[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  
  startScan: () => void;
  finishScan: (tracks: Track[]) => void;
  clearLibrary: () => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  isScanning: false,
  scanProgress: 0,
  lastScanAt: null,

  setTracks: (tracks) => set({ tracks }),
  setAlbums: (albums) => set({ albums }),
  setArtists: (artists) => set({ artists }),
  setPlaylists: (playlists) => set({ playlists }),
  
  startScan: () => set({ isScanning: true, scanProgress: 0 }),
  finishScan: (tracks) => set({ 
    isScanning: false, 
    tracks, 
    lastScanAt: Date.now() 
  }),
  clearLibrary: () => set({ 
    tracks: [], 
    albums: [], 
    artists: [], 
    lastScanAt: null 
  }),
}));
