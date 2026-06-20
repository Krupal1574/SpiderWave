import React from 'react';
import { EmptyState } from '../shared/components/EmptyState';
import { Mic2 } from 'lucide-react';

export function Artists() {
  return (
    <div className="h-full">
      <EmptyState 
        icon={Mic2}
        title="No Artists Found"
        description="Your favorite artists will be organized here after scanning."
        actionLabel="Scan Library"
        onAction={() => console.log('Scan Library clicked')}
      />
    </div>
  );
}
