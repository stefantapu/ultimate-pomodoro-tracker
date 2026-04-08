import { useCallback, useRef } from "react";

export const useAlarm = (src = "/sounds/alarm.mp3", volume = 1) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (audioRef.current == null) {
      audioRef.current = new Audio(src);
    }

    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    a.volume = volume;
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [src, volume]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }, []);

  return { play, stop };
};
