import React from 'react';
import { EmptyState } from '../shared/components/EmptyState';
import { ListVideo } from 'lucide-react';

export function Queue() {
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
