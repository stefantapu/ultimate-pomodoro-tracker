import type { ExternalToast } from "sonner";
import { create } from "zustand";

type UIState = {
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (isOpen: boolean) => void;
  isToastHostEnabled: boolean;
  enableToastHost: () => void;
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
  isToastHostEnabled: false,
  enableToastHost: () => set({ isToastHostEnabled: true }),
  analyticsCounter: 0,
  refreshAnalytics: () => set((state) => ({ analyticsCounter: state.analyticsCounter + 1 })),
  resetTimerTrigger: 0,
  triggerTimerReset: () => set((state) => ({ resetTimerTrigger: state.resetTimerTrigger + 1 })),
}));

let toastHostReady = false;
let toastHostReadyPromise: Promise<void> | null = null;
let resolveToastHostReady: (() => void) | null = null;

function waitForToastHost() {
  if (toastHostReady) {
    return Promise.resolve();
  }

  useUIStore.getState().enableToastHost();

  if (!toastHostReadyPromise) {
    toastHostReadyPromise = new Promise<void>((resolve) => {
      resolveToastHostReady = resolve;
    });
  }

  return toastHostReadyPromise;
}

export function markToastHostReady() {
  toastHostReady = true;
  resolveToastHostReady?.();
  resolveToastHostReady = null;
}

export async function showToast(message: string, options?: ExternalToast) {
  await waitForToastHost();
  const { toast } = await import("sonner");
  toast(message, options);
}
