import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Track } from '../shared/types/track';
import { Play, ListPlus, PlaySquare } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useContextMenu } from '../shared/hooks/useContextMenu';
import { ContextMenu } from '../shared/components/ContextMenu';

interface TrackListProps {
  tracks: Track[];
}

export function TrackList({ tracks }: TrackListProps) {
  const { currentTrack, playContext, addToQueue, playNextInQueue } = usePlayerStore();
  const parentRef = useRef<HTMLDivElement>(null);
  const { contextMenuState, handleContextMenu, closeContextMenu } = useContextMenu();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // matches previous itemSize
    overscan: 10,
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const onRightClick = (e: React.MouseEvent, track: Track) => {
    setSelectedTrack(track);
    handleContextMenu(e);
  };

  return (
    <div 
      ref={parentRef} 
      className="h-full w-full overflow-auto custom-scrollbar"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const track = tracks[virtualRow.index];
          const isPlaying = currentTrack?.id === track.id;

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`group flex items-center grid grid-cols-[48px_1fr_1fr_1fr_80px] gap-4 px-6 border-b border-border/30 hover:bg-surface-active cursor-pointer transition-colors ${isPlaying ? 'bg-surface-active text-primary' : 'text-text-secondary'}`}
              onClick={() => {
                playContext(tracks, virtualRow.index);
              }}
              onContextMenu={(e) => onRightClick(e, track)}
            >
              <div className="text-center flex items-center justify-center relative">
                <span className={`text-sm ${isPlaying ? 'text-primary' : 'text-text-muted'} group-hover:hidden`}>
                  {isPlaying ? <Play className="w-4 h-4 fill-current" /> : virtualRow.index + 1}
                </span>
                <Play className="w-4 h-4 text-text-primary hidden group-hover:block fill-current" />
              </div>
              <div className="truncate font-medium text-text-primary">
                {track.title}
              </div>
              <div className="truncate">
                {track.artist}
              </div>
              <div className="truncate">
                {track.album}
              </div>
              <div className="text-right text-sm font-mono tracking-tighter">
                {formatTime(track.duration)}
              </div>
            </div>
          );
        })}
      </div>

      {contextMenuState.isOpen && selectedTrack && (
        <ContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          onClose={closeContextMenu}
          items={[
            {
              label: 'Play Next',
              icon: <PlaySquare className="w-4 h-4" />,
              onClick: () => playNextInQueue(selectedTrack),
            },
            {
              label: 'Add to Queue',
              icon: <ListPlus className="w-4 h-4" />,
              onClick: () => addToQueue(selectedTrack),
            },
          ]}
        />
      )}
    </div>
  );
}
