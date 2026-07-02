import React from 'react';
import { EmptyState } from '../shared/components/EmptyState';
import { Mic2 } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { Link } from 'react-router-dom';

export function Artists() {
  const { artists, albums } = useLibraryStore();

  if (artists.length === 0) {
    return (
      <div className="h-full">
        <EmptyState 
          icon={Mic2}
          title="No Artists Found"
          description="Your favorite artists will be organized here after scanning."
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-6 px-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Mic2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Artists</h1>
          <p className="text-sm text-text-secondary">{artists.length} artists</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {artists.map((artist) => {
            const artistAlbumsCount = albums.filter(a => a.artistId === artist.id).length;

            return (
              <Link 
                key={artist.id} 
                to={`/artist/${artist.id}`}
                className="group flex flex-col items-center text-center gap-3 p-4 rounded-xl hover:bg-surface-hover transition-all cursor-pointer"
              >
                <div className="w-full aspect-square rounded-full bg-surface-active overflow-hidden relative shadow-md flex items-center justify-center border border-border/50 group-hover:border-primary/50 transition-colors">
                  <Mic2 className="w-12 h-12 text-text-muted opacity-50" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-sm font-bold text-background shadow-glow">View</span>
                  </div>
                </div>
                <div className="flex flex-col w-full">
                  <span className="font-bold text-text-primary truncate group-hover:text-primary transition-colors">{artist.name}</span>
                  <span className="text-xs text-text-muted mt-1">{artistAlbumsCount} albums</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
