import { useEffect, useRef, useState } from "react";

type UseTimerProps = {
  duration: number; //seconds
};

function createTick(
  startTimeRef: React.MutableRefObject<number | null>,
  duration: number,
  setTimeLeft: (v: number) => void,
  setIsRunning: (v: boolean) => void,
  rafRef: React.MutableRefObject<number | null>,
) {
  return function tick() {
    if (!startTimeRef.current) return;

    const now = Date.now();

    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    const remaining = duration - elapsed;

    if (remaining <= 0) {
      setTimeLeft(0);
      setIsRunning(false);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    setTimeLeft(remaining);
    rafRef.current = requestAnimationFrame(tick);
  };
}

export function useTimer({ duration }: UseTimerProps) {
  /////////////////////////////////////////////////////////////////
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const tickRef = useRef<() => void>(null);

  useEffect(() => {
    tickRef.current = createTick(
      startTimeRef,
      duration,
      setTimeLeft,
      setIsRunning,
      rafRef,
    );
  }, [duration]);

  const start = () => {
    if (isRunning) return;

    startTimeRef.current = Date.now() - (duration - timeLeft) * 1000;
    setIsRunning(true);
    rafRef.current = requestAnimationFrame(() => tickRef.current?.());
  };

  const pause = () => {
    setIsRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    startTimeRef.current = null;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
  };
}
