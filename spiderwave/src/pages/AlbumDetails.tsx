import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLibraryStore } from '../store/useLibraryStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { Disc3, Play, ArrowLeft } from 'lucide-react';
import { TrackList } from '../components/TrackList';

export function AlbumDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { albums, tracks } = useLibraryStore();
  const { playContext } = usePlayerStore();

  const album = useMemo(() => albums.find((a) => a.id === id), [albums, id]);
  const albumTracks = useMemo(() => tracks.filter((t) => t.albumId === id), [tracks, id]);

  if (!album) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Album Not Found</h2>
        <button onClick={() => navigate('/albums')} className="text-primary hover:underline">
          Return to Albums
        </button>
      </div>
    );
  }

  const handlePlayAlbum = () => {
    if (albumTracks.length > 0) {
      playContext(albumTracks, 0);
    }
  };

  return (
    <div className="h-full flex flex-col pt-6 px-6">
      <button 
        onClick={() => navigate(-1)} 
        className="self-start flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-end gap-6 mb-8">
        <div className="w-48 h-48 rounded-xl shadow-lg overflow-hidden bg-surface-active shrink-0 border border-border/50">
          {album.albumArt ? (
            <img src={album.albumArt} alt={album.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
              <Disc3 className="w-20 h-20 opacity-50" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Album</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary tracking-tight line-clamp-2">
            {album.title}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
            <span className="font-bold text-text-primary hover:underline cursor-pointer" onClick={() => navigate(`/artist/${album.artistId}`)}>
              {album.artistName}
            </span>
            <span>•</span>
            <span>{album.year || 'Unknown Year'}</span>
            <span>•</span>
            <span>{album.trackCount} tracks</span>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={handlePlayAlbum}
              disabled={albumTracks.length === 0}
              className="w-14 h-14 rounded-full bg-primary text-background flex items-center justify-center shadow-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col mb-6">
        <div className="grid grid-cols-[48px_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-border bg-surface-hover/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <div className="text-center">#</div>
          <div>Title</div>
          <div>Artist</div>
          <div>Album</div>
          <div className="text-right">Time</div>
        </div>
        <div className="flex-1 min-h-0">
          {albumTracks.length > 0 ? (
            <TrackList tracks={albumTracks} />
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted">
              No tracks found for this album.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
