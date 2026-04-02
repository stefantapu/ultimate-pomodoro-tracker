import { create } from "zustand";

type UIState = {
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (isOpen: boolean) => void;
  analyticsCounter: number;
  refreshAnalytics: () => void;
  resetTimerTrigger: number;
  triggerTimerReset: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isAuthModalOpen: false,
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  isSettingsModalOpen: false,
  setSettingsModalOpen: (isOpen) => set({ isSettingsModalOpen: isOpen }),
  analyticsCounter: 0,
  refreshAnalytics: () => set((state) => ({ analyticsCounter: state.analyticsCounter + 1 })),
  resetTimerTrigger: 0,
  triggerTimerReset: () => set((state) => ({ resetTimerTrigger: state.resetTimerTrigger + 1 })),
}));
