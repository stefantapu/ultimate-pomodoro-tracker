import { useEffect, useState } from "react";
import {
  readUserSettings,
  USER_SETTINGS_UPDATED_EVENT,
} from "@shared/lib/timerStorage";
import type { UserSettings } from "@shared/lib/timerTypes";

export function useUserSettings(settingsStorageKey: string) {
  const [settings, setSettings] = useState<UserSettings>(() =>
    readUserSettings(settingsStorageKey),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncSettings = () => {
      setSettings(readUserSettings(settingsStorageKey));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== settingsStorageKey) {
        return;
      }

      syncSettings();
    };

    const handleSettingsUpdated = () => {
      syncSettings();
    };

    syncSettings();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      USER_SETTINGS_UPDATED_EVENT,
      handleSettingsUpdated as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        USER_SETTINGS_UPDATED_EVENT,
        handleSettingsUpdated as EventListener,
      );
    };
  }, [settingsStorageKey]);

  return settings;
}
