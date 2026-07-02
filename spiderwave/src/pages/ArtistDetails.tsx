import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLibraryStore } from '../store/useLibraryStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { Mic2, Play, ArrowLeft, Disc3 } from 'lucide-react';
import { TrackList } from '../components/TrackList';

export function ArtistDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { artists, albums, tracks } = useLibraryStore();
  const { playContext } = usePlayerStore();

  const artist = useMemo(() => artists.find((a) => a.id === id), [artists, id]);
  const artistAlbums = useMemo(() => albums.filter((a) => a.artistId === id), [albums, id]);
  const artistTracks = useMemo(() => tracks.filter((t) => t.artistId === id), [tracks, id]);

  if (!artist) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Artist Not Found</h2>
        <button onClick={() => navigate('/artists')} className="text-primary hover:underline">
          Return to Artists
        </button>
      </div>
    );
  }

  const handlePlayArtist = () => {
    if (artistTracks.length > 0) {
      playContext(artistTracks, 0);
    }
  };

  return (
    <div className="h-full flex flex-col pt-6 px-6 overflow-y-auto custom-scrollbar">
      <button 
        onClick={() => navigate(-1)} 
        className="self-start flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors shrink-0"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col gap-6 mb-10 shrink-0">
        <div className="w-32 h-32 rounded-full shadow-lg overflow-hidden bg-surface-active border border-border flex items-center justify-center text-text-muted">
           <Mic2 className="w-16 h-16 opacity-50" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Artist</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-text-primary tracking-tight">
            {artist.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
            <span>{artistAlbums.length} albums</span>
            <span>•</span>
            <span>{artistTracks.length} tracks</span>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={handlePlayArtist}
              disabled={artistTracks.length === 0}
              className="w-14 h-14 rounded-full bg-primary text-background flex items-center justify-center shadow-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      {artistAlbums.length > 0 && (
        <div className="mb-10 shrink-0">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {artistAlbums.map((album) => (
              <Link 
                key={album.id} 
                to={`/album/${album.id}`}
                className="group flex flex-col gap-3 p-4 rounded-xl bg-surface hover:bg-surface-hover border border-border/50 hover:border-border transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-full aspect-square rounded-md bg-surface-active overflow-hidden relative shadow-inner">
                  {album.albumArt ? (
                    <img src={album.albumArt} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                      <Disc3 className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-text-primary truncate group-hover:text-primary transition-colors">{album.title}</span>
                  <span className="text-xs text-text-muted mt-1">{album.year || 'Unknown Year'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {artistTracks.length > 0 && (
        <div className="flex-1 flex flex-col min-h-[400px]">
           <h2 className="text-2xl font-bold text-text-primary mb-6 shrink-0">All Tracks</h2>
           <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col mb-6">
            <div className="grid grid-cols-[48px_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-border bg-surface-hover/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <div className="text-center">#</div>
              <div>Title</div>
              <div>Artist</div>
              <div>Album</div>
              <div className="text-right">Time</div>
            </div>
            <div className="flex-1 min-h-0">
              <TrackList tracks={artistTracks} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
