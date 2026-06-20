export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  duration: number; // in seconds
  url: string; // file path or stream url
  trackNumber?: number;
  discNumber?: number;
  year?: number;
  genre?: string;
  albumArt?: string;
  bitrate?: number;
  sampleRate?: number;
  format?: string; // FLAC, MP3, WAV
}
