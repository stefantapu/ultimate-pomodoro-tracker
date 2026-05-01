import { useCallback, useEffect } from "react";
import { getSupabaseClient } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/useAuth";
import { useUIStore } from "../stores/uiStore";
import type { Mode } from "../lib/timerTypes";
import {
  appendSessionToQueue,
  buildFocusSessionInsertPayloads,
  readSessionQueue,
  saveSessionQueue,
} from "../lib/focusSessionLedger";

export type SessionPayload = {
  mode: Mode;
  duration_seconds: number;
  accumulated_seconds: number;
  started_at: string;
  finished_at: string;
};

export function useSyncSession() {
  const { user } = useAuth();
  const userId = user?.id;
  const refreshAnalytics = useUIStore((state) => state.refreshAnalytics);

  const flushQueue = useCallback(async () => {
    if (!userId) return;

    const queue = readSessionQueue(userId);
    if (queue.length === 0) return;

    const payloads = buildFocusSessionInsertPayloads(userId, queue);

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("focus_sessions").insert(payloads);

      if (!error) {
        saveSessionQueue(userId, []);
        refreshAnalytics();
      } else {
        console.error("Failed to sync sessions:", error);
      }
    } catch (error) {
      console.error("Sync stream err:", error);
    }
  }, [refreshAnalytics, userId]);

  useEffect(() => {
    if (userId) {
      void flushQueue();
    }
  }, [flushQueue, userId]);

  const syncSession = useCallback(
    async (session: SessionPayload) => {
      if (!userId) return;

      appendSessionToQueue(userId, session);
      await flushQueue();
    },
    [flushQueue, userId],
  );

  return { syncSession };
}
