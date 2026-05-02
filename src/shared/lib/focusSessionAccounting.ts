import type { SessionPayload } from "@shared/hooks/useSyncSession";
import type { TimerState } from "@shared/lib/timerTypes";

type TimerDurations = {
  focusDuration: number;
  breakDuration: number;
};

export function getFinalAccumulatedSeconds(
  currentState: TimerState,
  now = Date.now(),
) {
  let finalAccumulatedSeconds = currentState.accumulatedSeconds;

  if (currentState.status === "running" && currentState.targetTimestamp) {
    const remaining = Math.max(
      0,
      Math.round((currentState.targetTimestamp - now) / 1000),
    );
    finalAccumulatedSeconds += Math.max(0, currentState.timeLeft - remaining);
  }

  return finalAccumulatedSeconds;
}

export function buildSessionPayload(
  currentState: TimerState,
  durations: TimerDurations,
  accumulatedSeconds: number,
): SessionPayload | null {
  if (!currentState.sessionStartedAt || accumulatedSeconds <= 0) {
    return null;
  }

  return {
    mode: currentState.mode,
    duration_seconds:
      currentState.mode === "focus"
        ? durations.focusDuration
        : durations.breakDuration,
    accumulated_seconds: accumulatedSeconds,
    started_at: currentState.sessionStartedAt,
    finished_at: new Date().toISOString(),
  };
}
