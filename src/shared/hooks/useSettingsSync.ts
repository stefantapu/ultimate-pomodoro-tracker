import { useCallback, useEffect, useRef } from "react";
import { supabase } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/useAuth";
import type { TimerSettings } from "../lib/timerTypes";
import { toast } from "sonner";

export function useSettingsSync(
  currentSettings: TimerSettings,
  onSettingsFetched: (settings: TimerSettings) => void,
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
    (settings: TimerSettings, silent = false) => {
      if (!userId || loadingRef.current) return;

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(async () => {
        const { error } = await supabase
          .from("profiles")
          .update({
            focus_duration: settings.focusDuration,
            break_duration: settings.breakDuration,
            auto_break: settings.autoBreak,
            auto_focus: settings.autoFocus,
          })
          .eq("id", userId);

        if (error) {
          console.error("Cloud sync conflict:", error);
        } else if (!silent) {
          toast("Settings synced to cloud", {
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
      const { data, error } = await supabase
        .from("profiles")
        .select("focus_duration, break_duration, auto_break, auto_focus")
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
        });
      } else {
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
