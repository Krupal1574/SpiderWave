import { Track } from './track';
import { Album } from './album';
import { Artist } from './artist';

export interface SearchResults {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
}
