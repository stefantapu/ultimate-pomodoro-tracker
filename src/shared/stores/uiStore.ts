import { create } from "zustand";

type UIState = {
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isAuthModalOpen: false,
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
}));
