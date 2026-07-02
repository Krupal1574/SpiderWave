import { useState, useCallback } from 'react';

interface ContextMenuState {
  x: number;
  y: number;
  isOpen: boolean;
}

export function useContextMenu() {
  const [state, setState] = useState<ContextMenuState>({ x: 0, y: 0, isOpen: false });

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setState({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    contextMenuState: state,
    handleContextMenu,
    closeContextMenu,
  };
}
