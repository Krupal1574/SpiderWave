import React from 'react';
import { EmptyState } from '../shared/components/EmptyState';
import { Disc3 } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { Link } from 'react-router-dom';

export function Albums() {
  const { albums } = useLibraryStore();

  if (albums.length === 0) {
    return (
      <div className="h-full">
        <EmptyState 
          icon={Disc3}
          title="No Albums Found"
          description="Albums will appear here once you scan your music library."
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-6 px-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Disc3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Albums</h1>
          <p className="text-sm text-text-secondary">{albums.length} albums</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {albums.map((album) => (
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
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-background shadow-glow translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <Disc3 className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-text-primary truncate group-hover:text-primary transition-colors">{album.title}</span>
                <span className="text-sm text-text-secondary truncate mt-0.5">{album.artistName}</span>
                <span className="text-xs text-text-muted mt-1">{album.trackCount} tracks {album.year ? `• ${album.year}` : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
