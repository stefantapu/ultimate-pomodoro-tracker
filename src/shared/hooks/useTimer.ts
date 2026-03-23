import { useCallback, useEffect, useRef, useState } from "react";

type UseTimerProps = {
  duration: number; //seconds
  storageKey?: string;
};

export function useTimer({
  duration,
  storageKey = "pomodoro-state",
}: UseTimerProps) {
  const [timeLeft, settimeLeft] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return duration;

    const { remaining, targetTimeStamp, isRunning } = JSON.parse(saved);

    if (isRunning && targetTimeStamp) {
      const actualRemaning = Math.round((targetTimeStamp - Date.now()) / 1000);
      return actualRemaning > 0 ? actualRemaning : 0;
    }
    return remaining;
  });

  const [isRunning, setIsRunning] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).isRunning : false;
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
      setIsRunning(false);
      settimeLeft(duration);
      targetTimestampRef.current = null;
      return;
    }

    settimeLeft(remaining);
  }, [stopInterval, duration]);

  const start = useCallback(() => {
    if (isRunning) return;

    targetTimestampRef.current = Date.now() + timeLeft * 1000;

    setIsRunning(true);
    intervalRef.current = setInterval(tick, 1000);
  }, [isRunning, timeLeft, tick]);

  const pause = useCallback(() => {
    setIsRunning(false);
    targetTimestampRef.current = null;
    stopInterval();
  }, [stopInterval]);

  const reset = useCallback(() => {
    setIsRunning(false);
    settimeLeft(duration);
    targetTimestampRef.current = null;
    stopInterval();
    localStorage.removeItem(storageKey);
  }, [duration, storageKey, stopInterval]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        remaining: timeLeft,
        targetTimestampRef: targetTimestampRef.current,
        isRunning,
      }),
    );
  }, [timeLeft, isRunning, storageKey]);

  //rehabilitation
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      targetTimestampRef.current = Date.now() + timeLeft * 1000;
      intervalRef.current = setInterval(tick, 1000);
    }

    return () => stopInterval();
  }, []);

  return { timeLeft, isRunning, start, pause, reset };
}
