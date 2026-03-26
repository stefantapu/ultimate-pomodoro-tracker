import { useEffect, useRef, useState, useCallback } from "react";

type UseTimerProps = {
  mode: "focus" | "break";
  focusDuration: number;
  breakDuration: number;
  stateStorageKey: string;
};

type TimerStatus = "idle" | "running" | "paused" | "finished";

export function useTimer({
  mode,
  focusDuration,
  breakDuration,
  stateStorageKey,
}: UseTimerProps) {
  const [status, setStatus] = useState<TimerStatus>(() => {
    const saved = localStorage.getItem(stateStorageKey);
    if (!saved) return "idle";

    const parsed = JSON.parse(saved);

    if (parsed?.status === "running" && parsed?.targetTimestamp) {
      const stillRunning = (parsed.targetTimestamp - Date.now()) / 1000 > 0;

      return stillRunning ? "running" : "finished";
    }

    return parsed?.status ?? "idle";
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem(stateStorageKey);
    if (!saved) return focusDuration;

    const { remaining, targetTimestamp, status } = JSON.parse(saved);

    if (status === "running" && targetTimestamp) {
      const actualRemaining = Math.round((targetTimestamp - Date.now()) / 1000); //calculating real time from the timestamp
      return actualRemaining > 0 ? actualRemaining : focusDuration;
    }
    return remaining;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetTimestampRef = useRef<number | null>(null);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (!targetTimestampRef.current) return;

    const now = Date.now();
    const remaining = Math.round((targetTimestampRef.current - now) / 1000);

    if (remaining <= 0) {
      stopInterval();
      setTimeLeft(focusDuration);
      targetTimestampRef.current = null;
      setStatus("finished");
      return;
    }

    setTimeLeft(remaining);
  }, [focusDuration, stopInterval]);

  const start = useCallback(() => {
    if (status === "running") return;

    targetTimestampRef.current = Date.now() + timeLeft * 1000;
    setStatus("running");
    intervalRef.current = setInterval(tick, 1000);
  }, [status, timeLeft, tick]);

  const pause = useCallback(() => {
    setStatus("paused");
    targetTimestampRef.current = null;
    stopInterval();
  }, [stopInterval]);

  const reset = useCallback(() => {
    setStatus("idle");
    setTimeLeft(focusDuration);
    targetTimestampRef.current = null;
    stopInterval();
  }, [stopInterval, focusDuration]);

  useEffect(() => {
    if (status === "running") {
      targetTimestampRef.current = Date.now() + timeLeft * 1000;
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => stopInterval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync
  useEffect(() => {
    localStorage.setItem(
      stateStorageKey,
      JSON.stringify({
        remaining: timeLeft,
        targetTimestamp: targetTimestampRef.current,
        status,
        mode,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stateStorageKey, mode]);

  const formatTime = (seconds: number) => seconds.toString().padStart(2, "0");
  const displaySeconds = formatTime(timeLeft % 60);
  const displayMinutes = formatTime(Math.floor(timeLeft / 60));

  return {
    displayMinutes,
    displaySeconds,
    status,
    start,
    pause,
    reset,
  };
}
