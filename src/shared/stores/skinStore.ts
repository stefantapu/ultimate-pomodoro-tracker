import { create } from "zustand";
import {
  DEFAULT_SKIN_ID,
  getSkinById,
  isSkinId,
} from "@shared/skins/catalog";
import type { SkinId, SkinProfile } from "@shared/skins/types";

const STORAGE_KEY = "pomodoro-active-skin";

function readStoredSkinId(): SkinId {
  if (typeof window === "undefined") {
    return DEFAULT_SKIN_ID;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (rawValue && isSkinId(rawValue)) {
      return rawValue;
    }
  } catch {
    return DEFAULT_SKIN_ID;
  }

  return DEFAULT_SKIN_ID;
}

function persistSkinId(skinId: SkinId) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, skinId);
  } catch {
    // No-op: localStorage can fail in strict browser modes.
  }
}

export type SkinState = {
  activeSkinId: SkinId;
  activeSkin: SkinProfile;
  setActiveSkinId: (skinId: SkinId) => void;
};

const initialSkinId = readStoredSkinId();
const initialSkin = getSkinById(initialSkinId);

export const useSkinStore = create<SkinState>((set) => ({
  activeSkinId: initialSkin.id,
  activeSkin: initialSkin,
  setActiveSkinId: (skinId) => {
    const nextSkin = getSkinById(skinId);
    persistSkinId(nextSkin.id);
    set({
      activeSkinId: nextSkin.id,
      activeSkin: nextSkin,
    });
  },
}));
