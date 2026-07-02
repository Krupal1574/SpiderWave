import React, { useState, useEffect, useRef } from 'react';
import { Search, Music, Disc3, Mic2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { SearchResults } from '../types/search';
import { usePlayerStore } from '../../store/usePlayerStore';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { playContext } = usePlayerStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await invoke<SearchResults>('search_library', { query: query.trim() });
          setResults(res);
          setIsOpen(true);
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults(null);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
  };

  const handleTrackClick = (track: any) => {
    if (results && results.tracks.length > 0) {
      const absoluteIndex = results.tracks.findIndex(t => t.id === track.id);
      playContext(results.tracks, absoluteIndex >= 0 ? absoluteIndex : 0);
    } else {
      playContext([track], 0);
    }
    closeSearch();
  };

  const handleAlbumClick = (albumId: string) => {
    navigate(`/album/${albumId}`);
    closeSearch();
  };

  const handleArtistClick = (artistId: string) => {
    navigate(`/artist/${artistId}`);
    closeSearch();
  };

  return (
    <div className="relative group w-full max-w-md" ref={dropdownRef}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-4 w-4 transition-colors ${isOpen ? 'text-primary' : 'text-text-muted group-focus-within:text-text-primary'}`} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results && query.trim().length >= 2) setIsOpen(true); }}
        className="block w-full pl-10 pr-12 py-2 border border-border bg-surface-hover/50 rounded-full text-sm placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-border focus:bg-surface-active transition-all text-text-primary shadow-sm"
        placeholder="Search songs, albums, artists..."
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <kbd className="inline-flex items-center border border-border rounded px-1.5 text-[10px] font-medium text-text-muted font-sans bg-surface shadow-sm">
          <span className="text-[10px] mr-0.5">⌘</span>K
        </kbd>
      </div>

      {isOpen && results && (
        <div className="absolute top-full mt-2 w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[70vh]">
          <div className="overflow-y-auto custom-scrollbar p-2">
            
            {results.tracks.length === 0 && results.albums.length === 0 && results.artists.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-muted">
                No results found for "{query}"
              </div>
            ) : (
              <>
                {results.tracks.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-1 text-xs font-bold text-text-muted uppercase tracking-wider">Tracks</div>
                    <div className="flex flex-col gap-1 mt-1">
                      {results.tracks.slice(0, 10).map((track, idx) => (
                          <button
                            key={track.id}
                            onClick={() => handleTrackClick(track)}
                            className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-surface-hover transition-colors group/item"
                          >
                          <div className="w-8 h-8 rounded bg-surface-active flex items-center justify-center text-text-muted group-hover/item:text-primary transition-colors shrink-0">
                            <Music className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-semibold text-text-primary truncate">{track.title}</span>
                            <span className="text-xs text-text-secondary truncate">{track.artist}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {results.albums.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-1 text-xs font-bold text-text-muted uppercase tracking-wider">Albums</div>
                    <div className="flex flex-col gap-1 mt-1">
                      {results.albums.slice(0, 5).map((album) => (
                        <button
                          key={album.id}
                          onClick={() => handleAlbumClick(album.id)}
                          className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-surface-hover transition-colors group/item"
                        >
                          <div className="w-8 h-8 rounded bg-surface-active flex items-center justify-center text-text-muted overflow-hidden shrink-0">
                            {album.albumArt ? (
                              <img src={album.albumArt} alt={album.title} className="w-full h-full object-cover" />
                            ) : (
                              <Disc3 className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-semibold text-text-primary truncate">{album.title}</span>
                            <span className="text-xs text-text-secondary truncate">{album.artistName}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {results.artists.length > 0 && (
                  <div className="mb-1">
                    <div className="px-3 py-1 text-xs font-bold text-text-muted uppercase tracking-wider">Artists</div>
                    <div className="flex flex-col gap-1 mt-1">
                      {results.artists.slice(0, 5).map((artist) => (
                        <button
                          key={artist.id}
                          onClick={() => handleArtistClick(artist.id)}
                          className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-surface-hover transition-colors group/item"
                        >
                          <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center text-text-muted shrink-0">
                            <Mic2 className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-semibold text-text-primary truncate">{artist.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
