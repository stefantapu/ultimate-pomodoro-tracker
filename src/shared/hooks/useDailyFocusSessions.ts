import { useCallback } from "react";
import type { Mode } from "@shared/lib/timerTypes";
import {
  useAuthenticatedResource,
  type AuthenticatedResourceLoader,
} from "./useAuthenticatedResource";

export type DailyFocusSession = {
  id: string;
  mode: Mode;
  started_at: string;
  finished_at: string;
};

export function useDailyFocusSessions(dayStart: Date, dayEnd: Date) {
  const dayStartIso = dayStart.toISOString();
  const dayEndIso = dayEnd.toISOString();
  const loadSessions = useCallback<
    AuthenticatedResourceLoader<DailyFocusSession[]>
  >(
    async ({ supabase, user }) => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("id, mode, started_at, finished_at")
        .eq("user_id", user.id)
        .lt("started_at", dayEndIso)
        .gt("finished_at", dayStartIso)
        .order("started_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as DailyFocusSession[];
    },
    [dayEndIso, dayStartIso],
  );
  const resource = useAuthenticatedResource<DailyFocusSession[]>({
    load: loadSessions,
    errorMessage: "Failed to fetch today's focus sessions",
    logMessage: "Failed to fetch today's focus sessions",
    refreshOnAnalytics: true,
    refreshKey: dayStartIso,
  });

  return {
    sessions: resource.data ?? [],
    userId: resource.user?.id ?? null,
  };
}
