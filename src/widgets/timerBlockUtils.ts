import type { Mode } from "@shared/lib/timerTypes";

export const FOCUS_MIN_DURATION_MINUTES = 15;
export const FOCUS_MAX_DURATION_MINUTES = 90;
export const BREAK_MIN_DURATION_MINUTES = 5;
export const BREAK_MAX_DURATION_MINUTES = 30;
export const DEFAULT_PAGE_TITLE = "Forge Timer - Pomodoro";

export function minutesToSeconds(minutes: number) {
  return minutes * 60;
}

export function secondsToMinutes(seconds: number) {
  return Math.floor(seconds / 60);
}

export function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function percentToVolume(nextValue: string) {
  const parsedValue = Number(nextValue);

  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return clampVolume(parsedValue / 100);
}

export function formatVolumeLabel(value: number) {
  return `${Math.round(clampVolume(value) * 100)}%`;
}

export function formatTitleTime(seconds: number) {
  const normalized = Math.max(0, seconds);
  const minutes = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const secondsDisplay = (normalized % 60).toString().padStart(2, "0");
  return `${minutes}:${secondsDisplay}`;
}

export function getDurationLimits(field: Mode) {
  if (field === "focus") {
    return {
      min: FOCUS_MIN_DURATION_MINUTES,
      max: FOCUS_MAX_DURATION_MINUTES,
    };
  }

  return {
    min: BREAK_MIN_DURATION_MINUTES,
    max: BREAK_MAX_DURATION_MINUTES,
  };
}

export function parseValidMinutes(field: Mode, value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  const { min, max } = getDurationLimits(field);

  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}
