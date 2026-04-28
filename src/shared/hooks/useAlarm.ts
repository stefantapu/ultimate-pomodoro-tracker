import { useCallback, useEffect, useRef } from "react";

type UseAlarmOptions = {
  loop?: boolean;
  fadeInMs?: number;
};

export const useAlarm = (
  src: string | null = "/sounds/alarm.mp3",
  volume = 1,
  options: UseAlarmOptions = {},
) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const fadeStartedAtRef = useRef<number | null>(null);
  const { loop = false, fadeInMs = 0 } = options;

  const cancelFade = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      window.cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }

    fadeStartedAtRef.current = null;
  }, []);

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

    return a;
  }, [loop, src]);

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

    const shouldFadeIn = fadeInMs > 0 && (restart || a.paused);

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

    cancelFade();
    a.volume = shouldFadeIn ? 0 : volume;

    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});

    if (!shouldFadeIn || typeof window === "undefined") {
      return;
    }

    const startedAt = window.performance.now();
    fadeStartedAtRef.current = startedAt;

    const applyFade = (timestamp: number) => {
      if (fadeStartedAtRef.current !== startedAt) {
        return;
      }

      const progress = Math.min(1, (timestamp - startedAt) / fadeInMs);
      a.volume = volume * progress;

      if (progress < 1 && !a.paused) {
        fadeFrameRef.current = window.requestAnimationFrame(applyFade);
        return;
      }

      a.volume = volume;
      fadeFrameRef.current = null;
      fadeStartedAtRef.current = null;
    };

    fadeFrameRef.current = window.requestAnimationFrame(applyFade);
  }, [cancelFade, ensureAudio, fadeInMs, volume]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    cancelFade();
    a.pause();
    try {
      a.currentTime = 0;
    } catch {
      // No-op: currentTime reset can fail for some audio states.
    }
  }, [cancelFade]);

  useEffect(() => {
    return () => {
      const a = audioRef.current;

      if (!a) {
        return;
      }

      cancelFade();
      a.pause();
    };
  }, [cancelFade]);

  return { play, stop };
};
