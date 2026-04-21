import { useCallback } from "react";
import { useAlarm } from "@shared/hooks/useAlarm";
import { useUserSettings } from "@shared/hooks/useUserSettings";
import { useSkinStore } from "@shared/stores/skinStore";
import { USER_SETTINGS_STORAGE_KEY } from "@shared/lib/timerStorage";

export function useToolbarClickSound() {
  const { uiSoundsEnabled, uiVolume } = useUserSettings(USER_SETTINGS_STORAGE_KEY);
  const toolbarClickSrc = useSkinStore(
    (state) => state.activeSkin.audio.toolbarClick,
  );
  const { play } = useAlarm(toolbarClickSrc, uiVolume);

  return useCallback(() => {
    if (!uiSoundsEnabled || uiVolume <= 0 || !toolbarClickSrc) {
      return;
    }

    play();
  }, [play, toolbarClickSrc, uiSoundsEnabled, uiVolume]);
}
