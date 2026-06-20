import React from 'react';
import { EmptyState } from '../shared/components/EmptyState';
import { Library as LibraryIcon } from 'lucide-react';

export function Library() {
  return (
    <div className="h-full">
      <EmptyState 
        icon={LibraryIcon}
        title="Your Library is Empty"
        description="Scan your local folders to automatically extract metadata and organize your music."
        actionLabel="Scan Library"
        onAction={() => console.log('Scan Library clicked')}
      />
    </div>
  );
}
