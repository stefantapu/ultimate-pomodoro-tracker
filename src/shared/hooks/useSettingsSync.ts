import { useEffect, useRef } from "react";
import { supabase } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/AuthProvider";
import type { TimerSettings } from "../lib/timerTypes";
import { toast } from "sonner";

export function useSettingsSync(
  currentSettings: TimerSettings,
  onSettingsFetched: (settings: TimerSettings) => void
) {
  const { user } = useAuth();
  const debounceTimerRef = useRef<number | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    loadingRef.current = true;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("focus_duration, break_duration, auto_break, auto_focus")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch profile settings", error);
        loadingRef.current = false;
        return;
      }

      if (!isMounted) return;

      // Check if data exists and is populated.
      // Newly created rows after migration will inherently have defaults (1500, 300).
      // If legacy rows are NULL, they'll trigger the push fallback.
      if (
        data &&
        data.focus_duration !== null &&
        data.break_duration !== null
      ) {
        onSettingsFetched({
          focusDuration: data.focus_duration,
          breakDuration: data.break_duration,
          autoBreak: data.auto_break,
          autoFocus: data.auto_focus,
        });
      } else {
        // Fallback: This user existed BEFORE the migration column adds, 
        // so their DB cols are null. Push the local settings upwards!
        pushSettingsToCloud(currentSettings, true);
      }
      
      loadingRef.current = false;
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const pushSettingsToCloud = (settings: TimerSettings, silent = false) => {
    if (!user || loadingRef.current) return;

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
        .eq("id", user.id);

      if (error) {
        console.error("Cloud sync conflict:", error);
      } else if (!silent) {
        toast("Settings synced to cloud ☁️", {
          style: {
            background: "rgba(20, 20, 20, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "white",
            backdropFilter: "blur(10px)",
          },
        });
      }
    }, 1000);
  };

  return { pushSettingsToCloud };
}
