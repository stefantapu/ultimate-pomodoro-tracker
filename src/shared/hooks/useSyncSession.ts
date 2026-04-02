import { useCallback, useEffect } from "react";
import { supabase } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/AuthProvider";
import { useUIStore } from "../stores/uiStore";
import type { Mode } from "../lib/timerTypes";

export type SessionPayload = {
  mode: Mode;
  status: "completed" | "interrupted";
  duration_seconds: number;
  accumulated_seconds: number;
  started_at: string;
  finished_at: string;
};

const SYNC_QUEUE_KEY = "pomodoro_sync_queue";

export function useSyncSession() {
  const { user } = useAuth();
  const refreshAnalytics = useUIStore((state) => state.refreshAnalytics);

  const getQueue = useCallback((): SessionPayload[] => {
    try {
      const q = localStorage.getItem(SYNC_QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  }, []);

  const saveQueue = useCallback((q: SessionPayload[]) => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q));
  }, []);

  const flushQueue = useCallback(async () => {
    if (!user) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    // Attach user_id to all items
    const payloads = queue.map((item) => ({ ...item, user_id: user.id }));

    try {
      const { error } = await supabase.from("focus_sessions").insert(payloads);
      if (!error) {
        // Clear queue on success sync
        saveQueue([]);
        refreshAnalytics(); // Triggers global UI store to refresh stats
      } else {
        console.error("Failed to sync sessions:", error);
      }
    } catch (e) {
      console.error("Sync stream err:", e);
    }
  }, [getQueue, refreshAnalytics, saveQueue, user]);

  // Attempt to flush queue on hook mount (and when user is populated)
  useEffect(() => {
    if (user) {
      flushQueue();
    }
  }, [flushQueue, user]);

  const syncSession = useCallback(async (session: SessionPayload) => {
    if (!user) return;

    const queue = getQueue();
    queue.push(session);
    saveQueue(queue);

    // Attempt immediately
    await flushQueue();
  }, [flushQueue, getQueue, saveQueue, user]);

  return { syncSession };
}
