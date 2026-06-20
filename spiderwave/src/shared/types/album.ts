export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  year?: number;
  genre?: string;
  albumArt?: string;
  trackCount: number;
}
