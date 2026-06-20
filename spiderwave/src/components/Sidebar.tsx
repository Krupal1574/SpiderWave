import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Library, Disc3, Mic2, ListMusic, ListVideo, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../shared/utils/cn';
import { useUIStore } from '../store/useUIStore';
import { LibraryStatus } from '../shared/components/LibraryStatus';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
}

const NavItem = ({ to, icon, label, isCollapsed }: NavItemProps) => (

  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-4 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group relative",
        isActive
          ? "bg-surface-active text-primary shadow-sm"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
        isCollapsed ? "justify-center" : "justify-start"
      )
    }
    title={isCollapsed ? label : undefined}
  >
    {({ isActive }) => (
      <>
        <div className={cn("flex items-center justify-center transition-transform group-hover:scale-110", isCollapsed && "scale-110")}>
          {icon}
        </div>
        {!isCollapsed && <span className="truncate">{label}</span>}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-primary rounded-r-full" />
        )}
      </>
    )}
  </NavLink>
);

export function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside 
      className={cn(
        "h-full bg-background border-r border-border flex flex-col pt-6 transition-all duration-300 relative",
        isSidebarCollapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Collapse Toggle */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary transition-colors z-50 shadow-md"
      >
        {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Header */}
      <div className={cn("px-6 mb-8 flex items-center gap-3 transition-all", isSidebarCollapsed && "px-0 justify-center")}>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-glow shrink-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
          <Disc3 className="w-5 h-5 text-background relative z-10" />
        </div>
        {!isSidebarCollapsed && (
          <h1 className="text-xl font-bold tracking-tight text-text-primary truncate">
            SpiderWave
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
        <div>
          {!isSidebarCollapsed && (
             <p className="px-3 text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Menu</p>
          )}
          <div className="space-y-1">
            <NavItem isCollapsed={isSidebarCollapsed} to="/" icon={<Home className="w-5 h-5" />} label="Home" />
            <NavItem isCollapsed={isSidebarCollapsed} to="/library" icon={<Library className="w-5 h-5" />} label="Library" />
            <NavItem isCollapsed={isSidebarCollapsed} to="/albums" icon={<Disc3 className="w-5 h-5" />} label="Albums" />
            <NavItem isCollapsed={isSidebarCollapsed} to="/artists" icon={<Mic2 className="w-5 h-5" />} label="Artists" />
          </div>
        </div>

        <div>
           {!isSidebarCollapsed && (
             <p className="px-3 text-xs font-bold text-text-muted uppercase tracking-wider mb-2">My Music</p>
           )}
           <div className="space-y-1">
            <NavItem isCollapsed={isSidebarCollapsed} to="/playlists" icon={<ListMusic className="w-5 h-5" />} label="Playlists" />
            <NavItem isCollapsed={isSidebarCollapsed} to="/queue" icon={<ListVideo className="w-5 h-5" />} label="Play Queue" />
          </div>
        </div>
      </nav>

      {/* Footer Area */}
      <div className="mt-auto flex flex-col gap-2">
        {!isSidebarCollapsed && <LibraryStatus />}
        <div className="p-3 border-t border-border/50">
          <NavItem isCollapsed={isSidebarCollapsed} to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
          
          {/* Version Label */}
          {!isSidebarCollapsed && (
            <div className="px-3 mt-4 text-[10px] text-text-muted font-mono tracking-widest uppercase">
              SpiderWave v0.1.0-alpha
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
