import { create } from "zustand";

type UIState = {
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  analyticsCounter: number;
  refreshAnalytics: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isAuthModalOpen: false,
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  analyticsCounter: 0,
  refreshAnalytics: () => set((state) => ({ analyticsCounter: state.analyticsCounter + 1 })),
}));
