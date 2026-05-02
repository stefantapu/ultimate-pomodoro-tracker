import { useCallback } from "react";
import { useUserSettings } from "@shared/hooks/useUserSettings";
import { useSkinStore } from "@shared/stores/skinStore";
import {
  UI_SOUND_OUTPUT_GAIN,
  USER_SETTINGS_STORAGE_KEY,
} from "@shared/lib/timerStorage";

let sharedToolbarClickAudio: HTMLAudioElement | null = null;
let sharedToolbarClickSrc: string | null = null;

function getSharedToolbarClickAudio(src: string) {
  if (typeof Audio === "undefined") {
    return null;
  }

  if (!sharedToolbarClickAudio || sharedToolbarClickSrc !== src) {
    sharedToolbarClickAudio = new Audio(src);
    sharedToolbarClickSrc = src;
  }

  return sharedToolbarClickAudio;
}

function playSharedToolbarClick(src: string, volume: number) {
  const audio = getSharedToolbarClickAudio(src);

  if (!audio) {
    return;
  }

  audio.volume = Math.max(0, Math.min(1, volume));
  audio.pause();

  try {
    audio.currentTime = 0;
  } catch {
    // Some browsers can reject currentTime resets while media is still loading.
  }

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

export function useToolbarClickSound() {
  const { uiSoundsEnabled, uiVolume } = useUserSettings(USER_SETTINGS_STORAGE_KEY);
  const toolbarClickSrc = useSkinStore(
    (state) => state.activeSkin.audio.toolbarClick,
  );
  const uiPlaybackVolume = uiVolume * UI_SOUND_OUTPUT_GAIN;

  return useCallback(() => {
    if (!uiSoundsEnabled || uiVolume <= 0 || !toolbarClickSrc) {
      return;
    }

    playSharedToolbarClick(toolbarClickSrc, uiPlaybackVolume);
  }, [toolbarClickSrc, uiPlaybackVolume, uiSoundsEnabled, uiVolume]);
}
