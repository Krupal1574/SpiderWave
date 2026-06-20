import React from 'react';
import { Search } from 'lucide-react';

export function SearchBar() {
  return (
    <div className="relative group w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-text-muted group-focus-within:text-text-primary transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-12 py-2 border border-border bg-surface-hover/50 rounded-full text-sm placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-border focus:bg-surface-active transition-all text-text-primary shadow-sm"
        placeholder="Search songs, albums, artists..."
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <kbd className="inline-flex items-center border border-border rounded px-1.5 text-[10px] font-medium text-text-muted font-sans bg-surface shadow-sm">
          <span className="text-[10px] mr-0.5">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}
