import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to prevent going off-screen
  let top = y;
  let left = x;
  
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    if (left + rect.width > window.innerWidth) {
      left = window.innerWidth - rect.width - 5;
    }
    if (top + rect.height > window.innerHeight) {
      top = window.innerHeight - rect.height - 5;
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] bg-surface border border-border shadow-xl rounded-lg py-1 min-w-[160px]"
      style={{ top, left }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="h-px bg-border/50 my-1 mx-2" />;
        }
        
        return (
          <button
            key={`item-${index}`}
            className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              onClose();
            }}
          >
            {item.icon && <span className="text-text-muted">{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </div>,
    document.body
  );
}
