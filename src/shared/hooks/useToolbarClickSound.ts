import { useCallback } from "react";
import { useAlarm } from "@shared/hooks/useAlarm";
import { useUserSettings } from "@shared/hooks/useUserSettings";
import { USER_SETTINGS_STORAGE_KEY } from "@shared/lib/timerStorage";

const TOOLBAR_CLICK_SOUND_SRC = "/sounds/click_on_elements.mp3";

export function useToolbarClickSound() {
  const { uiSoundsEnabled, uiVolume } = useUserSettings(USER_SETTINGS_STORAGE_KEY);
  const { play } = useAlarm(TOOLBAR_CLICK_SOUND_SRC, uiVolume);

  return useCallback(() => {
    if (!uiSoundsEnabled || uiVolume <= 0) {
      return;
    }

    play();
  }, [play, uiSoundsEnabled, uiVolume]);
}
