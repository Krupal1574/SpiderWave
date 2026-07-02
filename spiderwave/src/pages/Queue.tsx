import React, { useState } from 'react';
import { EmptyState } from '../shared/components/EmptyState';
import { ListVideo, Play, Trash2, ArrowUpFromLine, PlaySquare } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { invoke } from '@tauri-apps/api/core';
import { useContextMenu } from '../shared/hooks/useContextMenu';
import { ContextMenu } from '../shared/components/ContextMenu';
export function Queue() {
  const { queue, activePlayback, clearQueue, removeFromQueue, playNextInQueue, playQueueItem } = usePlayerStore();
  const { contextMenuState, handleContextMenu, closeContextMenu } = useContextMenu();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const activeIndex = queue.findIndex(q => q.id === activePlayback?.queueItemId);
  const displayQueueIndex = activeIndex !== -1 ? activeIndex : -1;

  const handleJumpToTrack = (queueItemId: string) => {
    playQueueItem(queueItemId);
  };

  const onRightClick = (e: React.MouseEvent, index: number) => {
    setSelectedIndex(index);
    handleContextMenu(e);
  };

  if (queue.length === 0) {
    return (
      <div className="h-full">
        <EmptyState 
          icon={ListVideo}
          title="Queue is Empty"
          description="Play a track or album to add it to your playback queue."
        />
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col pt-6 px-6">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ListVideo className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Play Queue</h1>
            <p className="text-sm text-text-secondary">{queue.length} tracks • {displayQueueIndex !== -1 ? queue.length - displayQueueIndex - 1 : queue.length} remaining</p>
          </div>
        </div>
        <button 
          onClick={clearQueue}
          className="text-sm font-semibold text-text-muted hover:text-text-primary transition-colors flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-surface-hover"
        >
          <Trash2 className="w-4 h-4" />
          Clear Queue
        </button>
      </div>

      <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col mb-6">
        <div className="grid grid-cols-[48px_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-border bg-surface-hover/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <div className="text-center">#</div>
          <div>Title</div>
          <div>Artist</div>
          <div>Album</div>
          <div className="text-right">Time</div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col relative w-full">
            {queue.map((item, idx) => {
              const isPlaying = item.id === activePlayback?.queueItemId;
              const hasPlayed = displayQueueIndex !== -1 && idx < displayQueueIndex;

              return (
                <div
                  key={item.id}
                  className={`group flex items-center grid grid-cols-[48px_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-border/30 hover:bg-surface-active cursor-pointer transition-colors ${isPlaying ? 'bg-surface-active text-primary border-l-2 border-l-primary' : hasPlayed ? 'text-text-muted opacity-60' : 'text-text-secondary'}`}
                  onClick={() => handleJumpToTrack(item.id)}
                  onContextMenu={(e) => onRightClick(e, idx)}
                >
                  <div className="text-center flex items-center justify-center relative">
                    <span className={`text-sm ${isPlaying ? 'text-primary' : 'text-text-muted'} group-hover:hidden`}>
                      {isPlaying ? <Play className="w-4 h-4 fill-current" /> : idx + 1}
                    </span>
                    <Play className="w-4 h-4 text-text-primary hidden group-hover:block fill-current" />
                  </div>
                  <div className="truncate font-medium text-text-primary">
                    {item.track.title}
                  </div>
                  <div className="truncate">
                    {item.track.artist}
                  </div>
                  <div className="truncate">
                    {item.track.album}
                  </div>
                  <div className="text-right text-sm font-mono tracking-tighter">
                    {formatTime(item.track.duration)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {contextMenuState.isOpen && selectedIndex !== null && queue[selectedIndex] && (
        <ContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          onClose={closeContextMenu}
          items={[
            {
              label: 'Play Next',
              icon: <PlaySquare className="w-4 h-4" />,
              onClick: () => {
                const item = queue[selectedIndex];
                removeFromQueue(item.id);
                playNextInQueue(item.track);
              },
            },
            {
              label: 'Move to Top',
              icon: <ArrowUpFromLine className="w-4 h-4" />,
              onClick: () => {
                const item = queue[selectedIndex];
                removeFromQueue(item.id);
                playNextInQueue(item.track);
              },
            },
            {
              divider: true,
              label: '',
              onClick: () => {}
            },
            {
              label: 'Remove from Queue',
              icon: <Trash2 className="w-4 h-4 text-red-400" />,
              onClick: () => removeFromQueue(queue[selectedIndex].id),
            },
          ]}
        />
      )}
    </div>
  );
}
