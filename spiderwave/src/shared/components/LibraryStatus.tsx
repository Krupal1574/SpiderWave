import React from 'react';
import { useLibraryStore } from '../../store/useLibraryStore';

export function LibraryStatus() {
  const { tracks, albums, artists, isScanning, libraryStats } = useLibraryStore();

  return (
    <div className="px-4 py-3 bg-surface-hover/30 rounded-lg border border-border/50 mx-3 mb-4 flex flex-col gap-1.5 shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">Tracks</span>
        <span className="text-text-primary font-medium">{tracks.length}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">Albums</span>
        <span className="text-text-primary font-medium">{albums.length}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">Artists</span>
        <span className="text-text-primary font-medium">{artists.length}</span>
      </div>
      
      <div className="mt-2 pt-2 border-t border-border/50">
        {isScanning ? (
           <span className="text-xs text-accent animate-pulse font-medium flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
             Scanning Library...
           </span>
        ) : libraryStats && libraryStats.totalTracks > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-green-500 flex items-center gap-1.5 font-medium">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              Library Ready
            </span>
            {libraryStats.lastScanAt && (
              <span className="text-[10px] text-text-muted">
                Last scanned: {new Date(parseInt(libraryStats.lastScanAt) * 1000).toLocaleDateString()}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-text-muted flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-text-muted rounded-full"></div>
            Library Not Scanned
          </span>
        )}
      </div>
    </div>
  );
}
