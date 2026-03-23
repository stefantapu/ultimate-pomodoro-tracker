import { useEffect, useRef, useState, useCallback } from "react";

type UseTimerProps = {
  duration: number;
  storageKey?: string;
  onFinish?: () => void;
};

export function useTimer({
  duration,
  storageKey = "pomodoro-state",
  onFinish,
}: UseTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return duration;

    const { remaining, targetTimestamp, isRunning } = JSON.parse(saved);

    if (isRunning && targetTimestamp) {
      const actualRemaining = Math.round((targetTimestamp - Date.now()) / 1000);
      return actualRemaining > 0 ? actualRemaining : duration; // Если время вышло пока вкладка была закрыта, возвращаем duration
    }
    return remaining;
  });

  const [isRunning, setIsRunning] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : null;

    // Если при загрузке видим, что время уже вышло, возвращаем false
    if (parsed?.isRunning && parsed?.targetTimestamp) {
      return (parsed.targetTimestamp - Date.now()) / 1000 > 0;
    }
    return parsed?.isRunning ?? false;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetTimestampRef = useRef<number | null>(null);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Синхронизация
  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        remaining: timeLeft,
        targetTimestamp: targetTimestampRef.current,
        isRunning,
      }),
    );
  }, [timeLeft, isRunning, storageKey]);

  const tick = useCallback(() => {
    if (!targetTimestampRef.current) return;

    const now = Date.now();
    const remaining = Math.round((targetTimestampRef.current - now) / 1000);

    if (remaining <= 0) {
      // --- ЛОГИКА АВТОСБРОСА ---
      stopInterval();
      setIsRunning(false);
      setTimeLeft(duration);
      targetTimestampRef.current = null;

      if (onFinish) onFinish(); // Опционально: звук или пуш
      return;
    }

    setTimeLeft(remaining);
  }, [duration, stopInterval, onFinish]);

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
    setTimeLeft(duration);
    targetTimestampRef.current = null;
    stopInterval();
    localStorage.removeItem(storageKey);
  }, [duration, storageKey, stopInterval]);

  useEffect(() => {
    if (isRunning) {
      targetTimestampRef.current = Date.now() + timeLeft * 1000;
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => stopInterval();
  }, []);

  const formatTime = (seconds: number) => seconds.toString().padStart(2, "0");
  const displaySeconds = formatTime(timeLeft % 60);
  const displayMinutes = formatTime(Math.floor(timeLeft / 60));

  return { displayMinutes, displaySeconds, isRunning, start, pause, reset };
}
