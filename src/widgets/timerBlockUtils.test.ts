import { describe, expect, it } from "vitest";
import {
  clampVolume,
  formatTitleTime,
  formatVolumeLabel,
  getDurationLimits,
  minutesToSeconds,
  parseValidMinutes,
  percentToVolume,
  secondsToMinutes,
} from "./timerBlockUtils";

describe("timerBlockUtils", () => {
  it("converts minutes and seconds", () => {
    expect(minutesToSeconds(25)).toBe(1500);
    expect(secondsToMinutes(359)).toBe(5);
  });

  it("clamps and formats volume values", () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(5)).toBe(1);
    expect(percentToVolume("55")).toBe(0.55);
    expect(percentToVolume("abc")).toBe(0);
    expect(formatVolumeLabel(0.556)).toBe("56%");
  });

  it("formats title time as mm:ss", () => {
    expect(formatTitleTime(0)).toBe("00:00");
    expect(formatTitleTime(125)).toBe("02:05");
  });

  it("exposes the correct focus and break limits", () => {
    expect(getDurationLimits("focus")).toEqual({ min: 15, max: 90 });
    expect(getDurationLimits("break")).toEqual({ min: 5, max: 30 });
  });

  it("validates minute drafts against the configured limits", () => {
    expect(parseValidMinutes("focus", "25")).toBe(25);
    expect(parseValidMinutes("focus", "10")).toBeNull();
    expect(parseValidMinutes("break", "31")).toBeNull();
    expect(parseValidMinutes("break", "abc")).toBeNull();
  });
});
