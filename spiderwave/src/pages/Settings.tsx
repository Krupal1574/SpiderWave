import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, HardDrive, RefreshCw, Info, Volume2, MonitorPlay, Palette, Folders, Plus, Trash2, FolderSync } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { Slider } from '../shared/components/Slider';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface LibraryFolder {
  id: number;
  path: string;
  lastScanned: string;
}

export function Settings() {
  const { libraryStats, dbPath, rescanAllFolders, isScanning } = useLibraryStore();
  const { volume, setVolume } = usePlayerStore();
  const [folders, setFolders] = useState<LibraryFolder[]>([]);

  const loadFolders = async () => {
    try {
      const res = await invoke<LibraryFolder[]>('get_library_folders');
      setFolders(res || []);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  };

  useEffect(() => {
    if ('__TAURI_INTERNALS__' in window) {
      loadFolders();
    }
  }, []);

  const handleAddFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Music Folder to Add',
      });
      if (selected && typeof selected === 'string') {
        // Register the folder first, then rescan all folders atomically.
        await invoke('add_library_folder', { path: selected });
        await loadFolders();
        await rescanAllFolders();
      }
    } catch (err) {
      console.error('Failed to add folder:', err);
    }
  };

  const handleRemoveFolder = async (path: string) => {
    if (confirm(`Are you sure you want to remove this folder from the library?\n\n${path}\n\nNote: This will not delete your files, only remove them from SpiderWave.`)) {
      try {
        await invoke('remove_library_folder', { path });
        loadFolders();
      } catch (err) {
        console.error('Failed to remove folder:', err);
      }
    }
  };

  const handleRescan = async () => {
    try {
      await rescanAllFolders();
    } catch (err) {
      console.error('Failed to rescan folders:', err);
    }
  };

  return (
    <div className="h-full flex flex-col pt-6 px-8 overflow-y-auto custom-scrollbar pb-12">
      <div className="flex items-center gap-3 mb-10 shrink-0">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Settings</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your SpiderWave configuration</p>
        </div>
      </div>

      <div className="max-w-4xl space-y-12">
        
        {/* Library Section */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2 border-b border-border/50 pb-2">
            <FolderSync className="w-5 h-5 text-text-secondary" />
            Library
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-text-primary">Library Folders</span>
                <button 
                  onClick={handleAddFolder}
                  className="text-xs flex items-center gap-1 font-semibold text-text-primary hover:text-primary transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Folder
                </button>
              </div>
              
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                {folders.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-text-muted">
                    No library folders added. Add a folder to start scanning music.
                  </div>
                ) : (
                  folders.map((folder, idx) => (
                    <div key={folder.id || idx} className={`flex items-center justify-between px-4 py-3 bg-surface-hover/30 ${idx < folders.length - 1 ? 'border-b border-border/50' : ''}`}>
                      <div className="flex items-center gap-3 text-sm text-text-primary truncate w-3/4">
                        <Folders className="w-4 h-4 text-text-muted shrink-0" />
                        <span className="truncate" title={folder.path}>{folder.path}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveFolder(folder.path)}
                        className="text-text-muted hover:text-red-400 transition-colors p-1"
                        title="Remove Folder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-t border-border/50">
              <div>
                <h3 className="font-semibold text-text-primary text-sm">Rescan Library</h3>
                <p className="text-xs text-text-muted mt-1">Update your library with new files. Last scan: Today at 10:45 AM</p>
              </div>
              <button 
                onClick={handleRescan}
                disabled={isScanning}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Rescan Library'}
              </button>
            </div>
          </div>
        </section>

        {/* Playback Section */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2 border-b border-border/50 pb-2">
            <MonitorPlay className="w-5 h-5 text-text-secondary" />
            Playback
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-1/2">
                <h3 className="font-semibold text-text-primary text-sm">Default Volume</h3>
                <p className="text-xs text-text-muted mt-1">Set the initial volume level.</p>
              </div>
              <div className="w-1/3 flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-text-muted shrink-0" />
                <Slider value={volume} min={0} max={1} onChange={setVolume} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary text-sm">Resume Playback</h3>
                <p className="text-xs text-text-muted mt-1">Automatically resume playing when SpiderWave starts.</p>
              </div>
              <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 bg-white w-3 h-3 rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
              <div>
                <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                  Crossfade Tracks
                  <span className="px-1.5 py-0.5 rounded border border-border text-[9px] font-bold uppercase tracking-widest text-text-muted">Coming Soon</span>
                </h3>
                <p className="text-xs text-text-muted mt-1">Smoothly fade between songs.</p>
              </div>
              <div className="w-10 h-5 bg-surface-hover rounded-full relative">
                <div className="absolute left-1 top-1 bg-text-muted w-3 h-3 rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
              <div>
                <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                  Gapless Playback
                  <span className="px-1.5 py-0.5 rounded border border-border text-[9px] font-bold uppercase tracking-widest text-text-muted">Coming Soon</span>
                </h3>
                <p className="text-xs text-text-muted mt-1">Eliminate silence between consecutive tracks.</p>
              </div>
              <div className="w-10 h-5 bg-surface-hover rounded-full relative">
                <div className="absolute left-1 top-1 bg-text-muted w-3 h-3 rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance & Advanced */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2 border-b border-border/50 pb-2">
            <Palette className="w-5 h-5 text-text-secondary" />
            Appearance & Advanced
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary text-sm">Theme</h3>
                <p className="text-xs text-text-muted mt-1">Choose your preferred visual style.</p>
              </div>
              <select className="bg-surface-active border border-border rounded-md px-3 py-1.5 text-sm font-semibold text-text-primary outline-none focus:border-primary">
                <option>Dark Mode</option>
                <option disabled>Light Mode (Soon)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary text-sm">Database Path</h3>
                <p className="text-xs text-text-muted mt-1">Location of your local SQLite library.</p>
              </div>
              <span className="text-xs font-mono text-text-secondary bg-surface-active px-2 py-1 rounded border border-border/50 max-w-[50%] truncate" title={dbPath || ''}>
                {dbPath || 'Loading...'}
              </span>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2 border-b border-border/50 pb-2">
            <Database className="w-5 h-5 text-text-secondary" />
            Statistics
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl p-6 border border-border shadow-sm flex flex-col items-center justify-center gap-2">
              <div className="text-3xl font-bold text-primary">{libraryStats?.totalTracks || 0}</div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Tracks</div>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-border shadow-sm flex flex-col items-center justify-center gap-2">
              <div className="text-3xl font-bold text-text-primary">{libraryStats?.totalAlbums || 0}</div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Albums</div>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-border shadow-sm flex flex-col items-center justify-center gap-2">
              <div className="text-3xl font-bold text-text-primary">{libraryStats?.totalArtists || 0}</div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Artists</div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2 border-b border-border/50 pb-2">
            <Info className="w-5 h-5 text-text-secondary" />
            About
          </h2>
          
          <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">SW</span>
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-xl tracking-tight">SpiderWave</h3>
                <p className="text-sm text-text-secondary mt-0.5">Version 0.4.6-alpha</p>
              </div>
            </div>
            
            <div className="h-px w-full bg-border/50 my-2"></div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted font-medium">Developer</span>
                <span className="font-semibold text-text-primary">Krupal Prajapati</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted font-medium">Engine</span>
                <span className="font-semibold text-text-primary">Tauri + React + Rust (Rodio)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted font-medium">License</span>
                <span className="font-semibold text-text-primary">MIT</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
