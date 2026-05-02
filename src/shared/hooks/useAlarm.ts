import {
  getCachedAudioElement,
  primeAudioElementPool,
  resolveCachedAudioSrc,
} from "@shared/lib/audioAssetCache";
import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

type UseAlarmOptions = {
  loop?: boolean;
  fadeInMs?: number;
  loopOverlapMs?: number;
  outputGain?: number;
  cacheKey?: string;
};

type AudioGraph = {
  context: AudioContext;
  gain: GainNode;
};

export const useAlarm = (
  src: string | null = "/assets/red_lava_theme/audio/alarm.mp3",
  volume = 1,
  options: UseAlarmOptions = {},
) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const standbyAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const fadeStartedAtRef = useRef<number | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);
  const previousSrcRef = useRef<string | null>(src);
  const volumeRef = useRef(volume);
  const audioGraphRef = useRef<WeakMap<HTMLAudioElement, AudioGraph>>(
    new WeakMap(),
  );
  const scheduleLoopOverlapRef = useRef<(a: HTMLAudioElement) => void>(() => {});
  const {
    loop = false,
    fadeInMs = 0,
    loopOverlapMs = 0,
    outputGain = 1,
    cacheKey,
  } = options;
  const shouldOverlapLoop = loop && loopOverlapMs > 0;
  const normalizedOutputGain = Math.max(0, outputGain);

  const shouldUseNativeLoopFallback = useCallback(() => (
    shouldOverlapLoop &&
    typeof document !== "undefined" &&
    document.hidden
  ), [shouldOverlapLoop]);

  const applyLoopMode = useCallback((a: HTMLAudioElement) => {
    a.loop = shouldUseNativeLoopFallback() || (!shouldOverlapLoop && loop);
  }, [loop, shouldOverlapLoop, shouldUseNativeLoopFallback]);

  const setupAudioGraph = useCallback((a: HTMLAudioElement) => {
    const existingGraph = audioGraphRef.current.get(a);

    if (existingGraph) {
      existingGraph.gain.gain.value = normalizedOutputGain;
      return existingGraph;
    }

    if (
      normalizedOutputGain <= 1 ||
      typeof window === "undefined" ||
      typeof window.AudioContext === "undefined"
    ) {
      return null;
    }

    try {
      const context = new window.AudioContext();
      const source = context.createMediaElementSource(a);
      const gain = context.createGain();
      source.connect(gain).connect(context.destination);
      gain.gain.value = normalizedOutputGain;

      const graph = { context, gain };
      audioGraphRef.current.set(a, graph);
      return graph;
    } catch {
      return null;
    }
  }, [normalizedOutputGain]);

  const setAudioVolume = useCallback((a: HTMLAudioElement, nextVolume: number) => {
    const volumeLevel = Math.max(0, Math.min(1, nextVolume));
    const graph = setupAudioGraph(a);

    if (graph) {
      a.volume = volumeLevel;
      graph.gain.gain.value = normalizedOutputGain;
      return;
    }

    a.volume = Math.max(0, Math.min(1, volumeLevel * normalizedOutputGain));
  }, [normalizedOutputGain, setupAudioGraph]);

  const resumeAudioGraph = useCallback((a: HTMLAudioElement) => {
    const graph = setupAudioGraph(a);

    if (graph?.context.state === "suspended") {
      void graph.context.resume().catch(() => {});
    }
  }, [setupAudioGraph]);

  const cancelFade = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      window.cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }

    fadeStartedAtRef.current = null;
  }, []);

  const cancelLoopTimeout = useCallback(() => {
    if (loopTimeoutRef.current !== null) {
      window.clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  }, []);

  const resetAudio = useCallback((a: HTMLAudioElement | null) => {
    if (!a) {
      return;
    }

    a.pause();

    try {
      a.currentTime = 0;
    } catch {
      // Some browsers can reject currentTime resets for not-yet-ready audio.
    }
  }, []);

  const getPooledAudio = useCallback(
    (targetRef: MutableRefObject<HTMLAudioElement | null>) => {
      if (!src || !cacheKey) {
        return null;
      }

      const poolIndex = targetRef === standbyAudioRef ? 1 : 0;
      return getCachedAudioElement(src, cacheKey, poolIndex);
    },
    [cacheKey, src],
  );

  const ensureAudio = useCallback((targetRef = audioRef) => {
    if (typeof Audio === "undefined" || !src) {
      return null;
    }

    if (targetRef.current == null) {
      targetRef.current =
        getPooledAudio(targetRef) ?? new Audio(resolveCachedAudioSrc(src));
      targetRef.current.setAttribute("data-audio-src", src);
      targetRef.current.setAttribute(
        "data-audio-resolved-src",
        resolveCachedAudioSrc(src),
      );
    }

    const a = targetRef.current;

    if (!a) {
      return null;
    }

    const resolvedSrc = resolveCachedAudioSrc(src);

    if (
      a.getAttribute("data-audio-src") !== src ||
      a.getAttribute("data-audio-resolved-src") !== resolvedSrc
    ) {
      resetAudio(a);
      a.src = resolvedSrc;
      a.setAttribute("data-audio-src", src);
      a.setAttribute("data-audio-resolved-src", resolvedSrc);
    }

    applyLoopMode(a);

    return a;
  }, [applyLoopMode, getPooledAudio, resetAudio, src]);

  const stop = useCallback(() => {
    cancelFade();
    cancelLoopTimeout();
    resetAudio(audioRef.current);
    resetAudio(standbyAudioRef.current);
  }, [cancelFade, cancelLoopTimeout, resetAudio]);

  const startFadeIn = useCallback((a: HTMLAudioElement, durationMs: number) => {
    cancelFade();

    if (durationMs <= 0 || typeof window === "undefined") {
      setAudioVolume(a, volumeRef.current);
      return;
    }

    setAudioVolume(a, 0);

    const startedAt = window.performance.now();
    fadeStartedAtRef.current = startedAt;

    const applyFade = (timestamp: number) => {
      if (fadeStartedAtRef.current !== startedAt) {
        return;
      }

      const progress = Math.max(
        0,
        Math.min(1, (timestamp - startedAt) / durationMs),
      );
      setAudioVolume(a, volumeRef.current * progress);

      if (progress < 1 && !a.paused) {
        fadeFrameRef.current = window.requestAnimationFrame(applyFade);
        return;
      }

      setAudioVolume(a, volumeRef.current);
      fadeFrameRef.current = null;
      fadeStartedAtRef.current = null;
    };

    fadeFrameRef.current = window.requestAnimationFrame(applyFade);
  }, [cancelFade, setAudioVolume]);

  const scheduleLoopOverlap = useCallback((a: HTMLAudioElement) => {
    cancelLoopTimeout();

    if (!shouldOverlapLoop || typeof window === "undefined") {
      return;
    }

    if (shouldUseNativeLoopFallback()) {
      applyLoopMode(a);
      return;
    }

    applyLoopMode(a);

    const scheduleFromDuration = () => {
      if (audioRef.current !== a || a.paused) {
        return;
      }

      if (!Number.isFinite(a.duration) || a.duration <= 0) {
        return;
      }

      const overlapSeconds = loopOverlapMs / 1000;
      const delayMs = Math.max(0, (a.duration - a.currentTime - overlapSeconds) * 1000);

      loopTimeoutRef.current = window.setTimeout(() => {
        if (audioRef.current !== a || a.paused) {
          return;
        }

        const nextAudio = ensureAudio(standbyAudioRef);

        if (!nextAudio) {
          return;
        }

        nextAudio.loop = false;
        setAudioVolume(nextAudio, 0);

        try {
          nextAudio.currentTime = 0;
        } catch {
          // No-op: currentTime reset can fail for not-yet-ready audio.
        }

        resumeAudioGraph(nextAudio);
        const playPromise = nextAudio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }

        audioRef.current = nextAudio;
        standbyAudioRef.current = a;
        startFadeIn(nextAudio, loopOverlapMs);
        scheduleLoopOverlapRef.current(nextAudio);
      }, delayMs);
    };

    if (Number.isFinite(a.duration) && a.duration > 0) {
      scheduleFromDuration();
      return;
    }

    const handleMetadata = () => {
      a.removeEventListener("loadedmetadata", handleMetadata);
      scheduleFromDuration();
    };

    a.addEventListener("loadedmetadata", handleMetadata);
  }, [
    applyLoopMode,
    cancelLoopTimeout,
    ensureAudio,
    loopOverlapMs,
    resumeAudioGraph,
    setAudioVolume,
    shouldOverlapLoop,
    shouldUseNativeLoopFallback,
    startFadeIn,
  ]);

  useEffect(() => {
    scheduleLoopOverlapRef.current = scheduleLoopOverlap;
  }, [scheduleLoopOverlap]);

  useEffect(() => {
    if (!shouldOverlapLoop || typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      const activeAudio = audioRef.current;

      if (!activeAudio) {
        return;
      }

      applyLoopMode(activeAudio);

      if (document.hidden) {
        cancelLoopTimeout();
        return;
      }

      if (!activeAudio.paused) {
        scheduleLoopOverlapRef.current(activeAudio);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applyLoopMode, cancelLoopTimeout, shouldOverlapLoop]);

  useEffect(() => {
    if (!cacheKey) {
      return;
    }

    primeAudioElementPool(src, cacheKey, shouldOverlapLoop ? 2 : 1);
  }, [cacheKey, shouldOverlapLoop, src]);

  useEffect(() => {
    volumeRef.current = volume;

    if (!src) {
      stop();
      return;
    }

    if (previousSrcRef.current !== src) {
      stop();
      previousSrcRef.current = src;
    }

    for (const a of [audioRef.current, standbyAudioRef.current]) {
      if (!a) {
        continue;
      }

      applyLoopMode(a);
      setAudioVolume(a, volume);
    }
  }, [applyLoopMode, setAudioVolume, src, stop, volume]);

  const play = useCallback((restart = true) => {
    const a = ensureAudio();

    if (!a) return;

    const shouldFadeIn = fadeInMs > 0 && (restart || a.paused);

    if (!restart && !a.paused) {
      return;
    }

    if (restart) {
      resetAudio(a);
    }

    cancelFade();
    cancelLoopTimeout();
    setAudioVolume(a, shouldFadeIn ? 0 : volumeRef.current);

    resumeAudioGraph(a);
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});

    scheduleLoopOverlap(a);

    if (shouldFadeIn) {
      startFadeIn(a, fadeInMs);
    }
  }, [
    cancelFade,
    cancelLoopTimeout,
    ensureAudio,
    fadeInMs,
    resetAudio,
    resumeAudioGraph,
    scheduleLoopOverlap,
    setAudioVolume,
    startFadeIn,
  ]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { play, stop };
};
