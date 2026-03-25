import { useRef, useCallback } from "react";

export const useAlarm = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (audioRef.current == null) {
    audioRef.current = new Audio("/sounds/alarm.wav"); // or import the asset
  }

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }, []);

  return { play, stop };
};
