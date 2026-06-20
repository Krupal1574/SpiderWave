import React from 'react';
import { EmptyState } from '../shared/components/EmptyState';
import { ListMusic } from 'lucide-react';

export function Playlists() {
  return (
    <div className="h-full">
      <EmptyState 
        icon={ListMusic}
        title="No Playlists Yet"
        description="Create your first playlist to start organizing your favorite tracks."
        actionLabel="Create Playlist"
        onAction={() => console.log('Create Playlist clicked')}
      />
    </div>
  );
}
