import { Track } from './track';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  tracks: Track[];
  coverArt?: string;
}
