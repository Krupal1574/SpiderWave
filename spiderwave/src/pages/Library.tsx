import React, { useEffect } from 'react';
import { Library as LibraryIcon, Loader2, FolderSearch, Settings } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { TrackList } from '../components/TrackList';
import { useNavigate } from 'react-router-dom';

export function Library() {
  const { tracks, isScanning, isLoading, loadLibrary } = useLibraryStore();
  const navigate = useNavigate();

  useEffect(() => {
    if ('__TAURI_INTERNALS__' in window) {
      loadLibrary();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-6 shadow-sm border border-border/50">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Loading Library...</h3>
        <p className="text-text-secondary max-w-md">Reading tracks from database.</p>
      </div>
    );
  }

  if (isScanning) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-6 shadow-sm border border-border/50">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Scanning Library...</h3>
        <p className="text-text-secondary max-w-md">Extracting metadata and updating database. This may take a moment.</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-6 shadow-sm border border-border/50">
          <FolderSearch className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Your Library is Empty</h3>
        <p className="text-sm text-text-secondary max-w-md mb-6">
          Add a music folder in Settings to begin importing your collection.
        </p>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-semibold transition-colors shadow-glow"
        >
          <Settings className="w-4 h-4" />
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-6 px-6">
      <div className="flex items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <LibraryIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Songs</h1>
            <p className="text-sm text-text-secondary">{tracks.length} tracks</p>
          </div>
        </div>
      </div>

      {/* Track Table */}
      <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="grid grid-cols-[48px_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-border bg-surface-hover/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <div className="text-center">#</div>
          <div>Title</div>
          <div>Artist</div>
          <div>Album</div>
          <div className="text-right">Time</div>
        </div>
        <div className="flex-1 min-h-0">
          <TrackList tracks={tracks} />
        </div>
      </div>
    </div>
  );
}
