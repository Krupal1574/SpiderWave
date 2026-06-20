import React from 'react';
import { EmptyState } from '../shared/components/EmptyState';
import { Disc3 } from 'lucide-react';

export function Albums() {
  return (
    <div className="h-full">
      <EmptyState 
        icon={Disc3}
        title="No Albums Found"
        description="Albums will appear here once you scan your music library."
        actionLabel="Scan Library"
        onAction={() => console.log('Scan Library clicked')}
      />
    </div>
  );
}
