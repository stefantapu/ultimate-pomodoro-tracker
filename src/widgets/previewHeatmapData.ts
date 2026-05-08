import type { HeatmapData } from "@shared/hooks/useAnalytics";

const PREVIEW_HEATMAP_DAYS = 183;
const MAX_DAILY_FOCUS_MINUTES = 4 * 60;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toUtcDateOnly(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function formatIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function clampMinutes(minutes: number) {
  return Math.min(MAX_DAILY_FOCUS_MINUTES, Math.max(0, minutes));
}

function getPreviewFocusMinutes(index: number, weekday: number) {
  const weekdayBaseline = [35, 120, 150, 135, 165, 110, 55][weekday];
  const cycleBoost = [0, 20, 45, 70, 100, 75, 50, 25][
    Math.floor((index % 32) / 4)
  ];
  const variation = ((index * 23 + weekday * 11) % 45) - 22;

  let minutes = weekdayBaseline + cycleBoost + variation;

  if ((index + weekday) % 11 === 0) {
    minutes *= 0.35;
  }

  if ((index + 5) % 23 === 0) {
    minutes = 0;
  }

  if ((index + 9) % 47 === 0) {
    minutes = MAX_DAILY_FOCUS_MINUTES;
  }

  return clampMinutes(Math.round(minutes / 15) * 15);
}

export function createPreviewHeatmapData(today = new Date()): HeatmapData[] {
  const endDate = toUtcDateOnly(today);
  const startTime = endDate.getTime() - (PREVIEW_HEATMAP_DAYS - 1) * DAY_IN_MS;

  return Array.from({ length: PREVIEW_HEATMAP_DAYS }, (_, index) => {
    const date = new Date(startTime + index * DAY_IN_MS);
    const minutes = getPreviewFocusMinutes(index, date.getUTCDay());

    return {
      date: formatIsoDate(date),
      value: minutes * 60,
    };
  });
}
