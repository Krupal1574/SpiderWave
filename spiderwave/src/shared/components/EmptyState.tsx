import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full p-8 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-6 shadow-sm border border-border/50">
        <Icon className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary max-w-md mb-8">{description}</p>
      
      {actionLabel && (
        <button 
          onClick={onAction}
          className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-background font-semibold rounded-full transition-colors shadow-glow hover:scale-105 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
