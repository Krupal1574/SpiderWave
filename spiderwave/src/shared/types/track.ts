export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  track_number?: number;
  path: string;
  
  // Extra UI fields that might be populated later
  albumArt?: string;
  bitrate?: number;
  sampleRate?: number;
  format?: string; // FLAC, MP3, WAV
}
