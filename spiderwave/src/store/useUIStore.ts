import { create } from 'zustand';

interface UIState {
  isSidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  activeModal: string | null;
  
  toggleSidebar: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  rightPanelOpen: false, // Skipping right panel for now as per user request, but state can remain
  activeModal: null,

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
}));
