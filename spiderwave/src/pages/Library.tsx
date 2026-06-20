import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Library as LibraryIcon, Loader2, FolderSearch, AlertCircle } from 'lucide-react';
import { EmptyState } from '../shared/components/EmptyState';
import { useLibraryStore } from '../store/useLibraryStore';
import { TrackList } from '../components/TrackList';
import { Track } from '../shared/types/track';

export function Library() {
  const { tracks, isScanning, startScan, finishScan } = useLibraryStore();
  const [error, setError] = useState<string | null>(null);

  const handleScanClick = async () => {
    try {
      setError(null);
      
      if (!('__TAURI_INTERNALS__' in window)) {
        setError("SpiderWave is running in a web browser. Please run via 'npm run tauri dev' to access the native file system.");
        finishScan([]);
        return;
      }
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Music Folder',
      });

      if (selected && typeof selected === 'string') {
        startScan();
        // Invoke Rust command
        const scannedTracks: Track[] = await invoke('scan_music_library', { folderPath: selected });
        finishScan(scannedTracks);
      }
    } catch (err) {
      console.error('Scan failed:', err);
      setError(String(err));
      finishScan([]); // reset scanning state
    }
  };

  if (isScanning) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-6 shadow-sm border border-border/50">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Scanning Library...</h3>
        <p className="text-text-secondary max-w-md">Extracting metadata from your audio files. This may take a moment for large collections.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Scan Failed</h3>
        <p className="text-text-secondary max-w-md mb-6">{error}</p>
        <button 
          onClick={handleScanClick}
          className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-background font-semibold rounded-full transition-colors shadow-glow"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="h-full">
        <EmptyState 
          icon={FolderSearch}
          title="Your Library is Empty"
          description="Select a folder containing your music to extract metadata and build your library automatically."
          actionLabel="Scan Local Folder"
          onAction={handleScanClick}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-6 px-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <LibraryIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Songs</h1>
            <p className="text-sm text-text-secondary">{tracks.length} tracks</p>
          </div>
        </div>
        
        <button 
          onClick={handleScanClick}
          className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-primary text-sm font-medium border border-border rounded-full transition-colors shadow-sm"
        >
          Scan Folder
        </button>
      </div>

      {/* Virtualized Track Table */}
      <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-[48px_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-border bg-surface-hover/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <div className="text-center">#</div>
          <div>Title</div>
          <div>Artist</div>
          <div>Album</div>
          <div className="text-right">Time</div>
        </div>
        
        {/* Virtualized List Container */}
        <div className="flex-1 min-h-0">
          <TrackList tracks={tracks} />
        </div>
      </div>
    </div>
  );
}
