import type { SkinAudio } from "@shared/skins/types";

type AudioCacheStatus = "idle" | "loading" | "ready" | "failed";

type AudioCacheEntry = {
  originalSrc: string;
  objectUrl: string | null;
  promise: Promise<string> | null;
  status: AudioCacheStatus;
  pools: Map<string, HTMLAudioElement[]>;
};

const FIRST_GESTURE_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

const audioCache = new Map<string, AudioCacheEntry>();
let activeAudioSources = new Set<string>();
let isFirstGestureUnlocked = false;
let areFirstGestureListenersInstalled = false;

function canUseBrowserAudio() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function readAudioSources(audio: SkinAudio | readonly (string | null)[]) {
  const sources = Array.isArray(audio) ? audio : Object.values(audio);
  return new Set(sources.filter((src): src is string => Boolean(src)));
}

function getOrCreateEntry(src: string): AudioCacheEntry {
  const existingEntry = audioCache.get(src);

  if (existingEntry) {
    return existingEntry;
  }

  const entry: AudioCacheEntry = {
    originalSrc: src,
    objectUrl: null,
    promise: null,
    status: "idle",
    pools: new Map(),
  };

  audioCache.set(src, entry);
  return entry;
}

function resetAudioElement(audio: HTMLAudioElement) {
  audio.pause();

  try {
    audio.currentTime = 0;
  } catch {
    // No-op: browsers can reject currentTime changes for unloaded media.
  }
}

function loadAudioElement(audio: HTMLAudioElement) {
  audio.preload = "auto";

  try {
    audio.load();
  } catch {
    // No-op: loading is best effort and playback still falls back normally.
  }
}

function syncAudioElementSource(
  audio: HTMLAudioElement,
  originalSrc: string,
  resolvedSrc: string,
) {
  if (audio.getAttribute("data-audio-resolved-src") === resolvedSrc) {
    return;
  }

  if (!audio.paused) {
    return;
  }

  resetAudioElement(audio);
  audio.src = resolvedSrc;
  audio.setAttribute("data-audio-src", originalSrc);
  audio.setAttribute("data-audio-resolved-src", resolvedSrc);
  loadAudioElement(audio);
}

function refreshPausedPools(entry: AudioCacheEntry) {
  const resolvedSrc = resolveCachedAudioSrc(entry.originalSrc);

  for (const pool of entry.pools.values()) {
    for (const audio of pool) {
      syncAudioElementSource(audio, entry.originalSrc, resolvedSrc);
    }
  }
}

function disposeEntry(entry: AudioCacheEntry) {
  for (const pool of entry.pools.values()) {
    for (const audio of pool) {
      resetAudioElement(audio);
      audio.removeAttribute("src");
      audio.removeAttribute("data-audio-src");
      audio.removeAttribute("data-audio-resolved-src");
      loadAudioElement(audio);
    }
  }

  if (entry.objectUrl && typeof URL !== "undefined") {
    URL.revokeObjectURL(entry.objectUrl);
  }

  audioCache.delete(entry.originalSrc);
}

function evictInactiveAudioSources() {
  for (const entry of audioCache.values()) {
    if (!activeAudioSources.has(entry.originalSrc)) {
      disposeEntry(entry);
    }
  }
}

function removeFirstGestureListeners() {
  if (typeof window === "undefined") {
    return;
  }

  for (const eventName of FIRST_GESTURE_EVENTS) {
    window.removeEventListener(eventName, handleFirstGesture, true);
  }

  areFirstGestureListenersInstalled = false;
}

function installFirstGestureListeners() {
  if (
    typeof window === "undefined" ||
    isFirstGestureUnlocked ||
    areFirstGestureListenersInstalled
  ) {
    return;
  }

  for (const eventName of FIRST_GESTURE_EVENTS) {
    window.addEventListener(eventName, handleFirstGesture, true);
  }

  areFirstGestureListenersInstalled = true;
}

function handleFirstGesture() {
  isFirstGestureUnlocked = true;
  removeFirstGestureListeners();
  unlockActiveAudioElements();
  void primeActiveAudioSources();
}

function unlockActiveAudioElements() {
  if (!canUseBrowserAudio()) {
    return;
  }

  for (const src of activeAudioSources) {
    const audio = getCachedAudioElement(src, "first-gesture-unlock");

    if (!audio) {
      continue;
    }

    const previousMuted = audio.muted;
    const previousVolume = audio.volume;

    audio.muted = true;
    audio.volume = 0;

    const finishUnlockAttempt = () => {
      resetAudioElement(audio);
      audio.muted = previousMuted;
      audio.volume = previousVolume;
    };

    let playPromise: Promise<void> | undefined;

    try {
      playPromise = audio.play();
    } catch {
      finishUnlockAttempt();
      continue;
    }

    if (playPromise && typeof playPromise.finally === "function") {
      playPromise.catch(() => {}).finally(finishUnlockAttempt);
      continue;
    }

    finishUnlockAttempt();
  }
}

export function setActiveAudioCacheSources(
  audio: SkinAudio | readonly (string | null)[],
) {
  activeAudioSources = readAudioSources(audio);

  for (const src of activeAudioSources) {
    getOrCreateEntry(src);
  }

  evictInactiveAudioSources();

  if (activeAudioSources.size === 0) {
    return;
  }

  if (isFirstGestureUnlocked) {
    void primeActiveAudioSources();
    return;
  }

  installFirstGestureListeners();
}

export async function primeActiveAudioSources() {
  await Promise.all(
    Array.from(activeAudioSources, (src) => preloadCachedAudioSource(src)),
  );
}

export async function preloadCachedAudioSource(src: string): Promise<string> {
  const entry = getOrCreateEntry(src);

  if (entry.status === "ready" && entry.objectUrl) {
    return entry.objectUrl;
  }

  if (entry.status === "loading" && entry.promise) {
    return entry.promise;
  }

  if (
    typeof window === "undefined" ||
    typeof window.fetch !== "function" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    entry.status = "failed";
    return src;
  }

  entry.status = "loading";
  entry.promise = window
    .fetch(src)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Audio preload failed: ${response.status}`);
      }

      return response.blob();
    })
    .then((blob) => {
      if (entry.objectUrl) {
        URL.revokeObjectURL(entry.objectUrl);
      }

      entry.objectUrl = URL.createObjectURL(blob);
      entry.status = "ready";
      refreshPausedPools(entry);
      return entry.objectUrl;
    })
    .catch(() => {
      entry.objectUrl = null;
      entry.status = "failed";
      return src;
    })
    .finally(() => {
      entry.promise = null;
    });

  return entry.promise;
}

export function resolveCachedAudioSrc(src: string): string {
  return audioCache.get(src)?.objectUrl ?? src;
}

export function getAudioCacheStatus(src: string): AudioCacheStatus {
  return audioCache.get(src)?.status ?? "idle";
}

export function getCachedAudioElement(
  originalSrc: string,
  poolKey: string,
  poolIndex = 0,
): HTMLAudioElement | null {
  if (!canUseBrowserAudio()) {
    return null;
  }

  const entry = getOrCreateEntry(originalSrc);
  const resolvedSrc = resolveCachedAudioSrc(originalSrc);
  const pool = entry.pools.get(poolKey) ?? [];

  entry.pools.set(poolKey, pool);

  while (pool.length <= poolIndex) {
    const audio = new Audio(resolvedSrc);
    audio.setAttribute("data-audio-src", originalSrc);
    audio.setAttribute("data-audio-resolved-src", resolvedSrc);
    loadAudioElement(audio);
    pool.push(audio);
  }

  const audio = pool[poolIndex];
  syncAudioElementSource(audio, originalSrc, resolvedSrc);
  return audio;
}

export function primeAudioElementPool(
  originalSrc: string | null,
  poolKey: string,
  poolSize = 1,
) {
  if (!originalSrc || poolSize <= 0) {
    return;
  }

  for (let index = 0; index < poolSize; index += 1) {
    getCachedAudioElement(originalSrc, poolKey, index);
  }
}

export function isAudioCacheUnlocked() {
  return isFirstGestureUnlocked;
}

export function resetAudioAssetCacheForTests() {
  for (const entry of Array.from(audioCache.values())) {
    disposeEntry(entry);
  }

  activeAudioSources = new Set();
  isFirstGestureUnlocked = false;
  removeFirstGestureListeners();
}
