import { useCallback, useEffect, useRef } from "react";

type UseAlarmOptions = {
  loop?: boolean;
};

export const useAlarm = (
  src: string | null = "/sounds/alarm.mp3",
  volume = 1,
  options: UseAlarmOptions = {},
) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { loop = false } = options;

  const ensureAudio = useCallback(() => {
    if (typeof Audio === "undefined" || !src) {
      return null;
    }

    if (audioRef.current == null) {
      audioRef.current = new Audio(src);
    }

    const a = audioRef.current;

    if (!a) {
      return null;
    }

    a.src = src;
    a.loop = loop;
    a.volume = volume;

    return a;
  }, [loop, src, volume]);

  useEffect(() => {
    const a = audioRef.current;

    if (!a) {
      return;
    }

    if (!src) {
      a.pause();
      return;
    }

    a.src = src;
    a.loop = loop;
    a.volume = volume;
  }, [loop, src, volume]);

  const play = useCallback((restart = true) => {
    const a = ensureAudio();

    if (!a) return;

    if (!restart && !a.paused) {
      return;
    }

    if (restart) {
      a.pause();

      try {
        a.currentTime = 0;
      } catch {
        // Some browsers can reject currentTime resets for not-yet-ready audio.
      }
    }

    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [ensureAudio]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    try {
      a.currentTime = 0;
    } catch {
      // No-op: currentTime reset can fail for some audio states.
    }
  }, []);

  useEffect(() => {
    return () => {
      const a = audioRef.current;

      if (!a) {
        return;
      }

      a.pause();
    };
  }, []);

  return { play, stop };
};
