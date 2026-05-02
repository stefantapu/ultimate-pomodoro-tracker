import type { SessionPayload } from "@shared/hooks/useSyncSession";

export type QueuedSessionPayload = SessionPayload & {
  status?: "completed" | "interrupted";
};

const SYNC_QUEUE_KEY_PREFIX = "pomodoro_sync_queue";

export function getSyncQueueKey(userId: string) {
  return `${SYNC_QUEUE_KEY_PREFIX}:${userId}`;
}

export function readSessionQueue(userId: string): QueuedSessionPayload[] {
  try {
    const queue = localStorage.getItem(getSyncQueueKey(userId));
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

export function saveSessionQueue(
  userId: string,
  queue: QueuedSessionPayload[],
) {
  localStorage.setItem(getSyncQueueKey(userId), JSON.stringify(queue));
}

export function appendSessionToQueue(userId: string, session: SessionPayload) {
  const queue = readSessionQueue(userId);
  queue.push(session);
  saveSessionQueue(userId, queue);
}

export function buildFocusSessionInsertPayloads(
  userId: string,
  queue: QueuedSessionPayload[],
) {
  return queue.map((item) => ({
    mode: item.mode,
    duration_seconds: item.duration_seconds,
    accumulated_seconds: item.accumulated_seconds,
    started_at: item.started_at,
    finished_at: item.finished_at,
    user_id: userId,
  }));
}
