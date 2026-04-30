import { useCallback, useEffect } from "react";
import { getSupabaseClient } from "../../../utils/supabase";
import { useAuth } from "../../app/providers/useAuth";
import { useUIStore } from "../stores/uiStore";
import type { Mode } from "../lib/timerTypes";

export type SessionPayload = {
  mode: Mode;
  duration_seconds: number;
  accumulated_seconds: number;
  started_at: string;
  finished_at: string;
};

type QueuedSessionPayload = SessionPayload & {
  status?: "completed" | "interrupted";
};

const SYNC_QUEUE_KEY_PREFIX = "pomodoro_sync_queue";

function getSyncQueueKey(userId: string) {
  return `${SYNC_QUEUE_KEY_PREFIX}:${userId}`;
}

export function useSyncSession() {
  const { user } = useAuth();
  const refreshAnalytics = useUIStore((state) => state.refreshAnalytics);

  const getQueue = useCallback((): QueuedSessionPayload[] => {
    if (!user) {
      return [];
    }

    try {
      const queue = localStorage.getItem(getSyncQueueKey(user.id));
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }, [user]);

  const saveQueue = useCallback(
    (queue: QueuedSessionPayload[]) => {
      if (!user) {
        return;
      }

      localStorage.setItem(getSyncQueueKey(user.id), JSON.stringify(queue));
    },
    [user],
  );

  const flushQueue = useCallback(async () => {
    if (!user) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    const payloads = queue.map((item) => {
      const payload = { ...item, user_id: user.id };
      delete payload.status;

      return payload;
    });

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("focus_sessions").insert(payloads);

      if (!error) {
        saveQueue([]);
        refreshAnalytics();
      } else {
        console.error("Failed to sync sessions:", error);
      }
    } catch (error) {
      console.error("Sync stream err:", error);
    }
  }, [getQueue, refreshAnalytics, saveQueue, user]);

  useEffect(() => {
    if (user) {
      void flushQueue();
    }
  }, [flushQueue, user]);

  const syncSession = useCallback(
    async (session: SessionPayload) => {
      if (!user) return;

      const queue = getQueue();
      queue.push(session);
      saveQueue(queue);

      await flushQueue();
    },
    [flushQueue, getQueue, saveQueue, user],
  );

  return { syncSession };
}
