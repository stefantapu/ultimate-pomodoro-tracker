import { useCallback, useEffect, useRef } from "react";
import { getSupabaseClient } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/useAuth";
import type { UserSettings } from "../lib/timerTypes";
import { showToast } from "../stores/uiStore";

export function useSettingsSync(
  currentSettings: UserSettings,
  onSettingsFetched: (settings: UserSettings) => void,
) {
  const { user } = useAuth();
  const userId = user?.id;
  const debounceTimerRef = useRef<number | null>(null);
  const loadingRef = useRef(false);
  const currentSettingsRef = useRef(currentSettings);
  const onSettingsFetchedRef = useRef(onSettingsFetched);

  useEffect(() => {
    currentSettingsRef.current = currentSettings;
  }, [currentSettings]);

  useEffect(() => {
    onSettingsFetchedRef.current = onSettingsFetched;
  }, [onSettingsFetched]);

  const pushSettingsToCloud = useCallback(
    (settings: UserSettings, silent = false) => {
      if (!userId || loadingRef.current) return;

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(async () => {
        const supabase = await getSupabaseClient();
        const { error } = await supabase
          .from("profiles")
          .update({
            focus_duration: settings.focusDuration,
            break_duration: settings.breakDuration,
            auto_break: settings.autoBreak,
            auto_focus: settings.autoFocus,
            alarm_enabled: settings.alarmEnabled,
            alarm_volume: settings.alarmVolume,
            ui_sounds_enabled: settings.uiSoundsEnabled,
            ui_volume: settings.uiVolume,
            focus_ambience_enabled: settings.focusAmbienceEnabled,
            focus_ambience_volume: settings.focusAmbienceVolume,
          })
          .eq("id", userId);

        if (error) {
          console.error("Cloud sync conflict:", error);
        } else if (!silent) {
          void showToast("Settings synced to cloud", {
            duration: 2200,
          });
        }
      }, 1000);
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    loadingRef.current = true;

    const fetchSettings = async () => {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "focus_duration, break_duration, auto_break, auto_focus, alarm_enabled, alarm_volume, ui_sounds_enabled, ui_volume, focus_ambience_enabled, focus_ambience_volume",
        )
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Failed to fetch profile settings", error);
        loadingRef.current = false;
        return;
      }

      if (!isMounted) return;

      if (
        data &&
        data.focus_duration !== null &&
        data.break_duration !== null
      ) {
        onSettingsFetchedRef.current({
          focusDuration: data.focus_duration,
          breakDuration: data.break_duration,
          autoBreak: data.auto_break,
          autoFocus: data.auto_focus,
          alarmEnabled:
            typeof data.alarm_enabled === "boolean"
              ? data.alarm_enabled
              : currentSettingsRef.current.alarmEnabled,
          alarmVolume:
            typeof data.alarm_volume === "number"
              ? data.alarm_volume
              : currentSettingsRef.current.alarmVolume,
          uiSoundsEnabled:
            typeof data.ui_sounds_enabled === "boolean"
              ? data.ui_sounds_enabled
              : currentSettingsRef.current.uiSoundsEnabled,
          uiVolume:
            typeof data.ui_volume === "number"
              ? data.ui_volume
              : currentSettingsRef.current.uiVolume,
          focusAmbienceEnabled:
            typeof data.focus_ambience_enabled === "boolean"
              ? data.focus_ambience_enabled
              : currentSettingsRef.current.focusAmbienceEnabled,
          focusAmbienceVolume:
            typeof data.focus_ambience_volume === "number"
              ? data.focus_ambience_volume
              : currentSettingsRef.current.focusAmbienceVolume,
          });
      } else {
        loadingRef.current = false;
        pushSettingsToCloud(currentSettingsRef.current, true);
      }

      loadingRef.current = false;
    };

    void fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [pushSettingsToCloud, userId]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { pushSettingsToCloud };
}
