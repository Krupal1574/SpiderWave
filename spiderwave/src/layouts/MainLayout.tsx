import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { PlayerBar } from '../components/PlayerBar';
import { SearchBar } from '../shared/components/SearchBar';
import { Bell, User } from 'lucide-react';

export function MainLayout() {
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden text-text-primary">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-surface overflow-y-auto rounded-tl-xl border-l border-t border-border/50 relative flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-hover/30 to-transparent pointer-events-none"></div>
          
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-20 w-full h-16 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-md border-b border-border/50">
            <div className="flex-1">
              <SearchBar />
            </div>
            
            <div className="flex items-center gap-4 ml-4">
              <button className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
                <User className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="relative z-10 p-8 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
      <PlayerBar />
    </div>
  );
}
