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
  setIsScanning: (isScanning: boolean) => void;
  setScanProgress: (scanProgress: number) => void;
  setLastScanAt: (timestamp: number | null) => void;
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
  setIsScanning: (isScanning) => set({ isScanning }),
  setScanProgress: (scanProgress) => set({ scanProgress }),
  setLastScanAt: (lastScanAt) => set({ lastScanAt }),
}));
