import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_USER_SETTINGS,
  LEGACY_SOUND_ENABLED_STORAGE_KEY,
  USER_SETTINGS_STORAGE_KEY,
  USER_SETTINGS_UPDATED_EVENT,
  readTimerState,
  readUserSettings,
  writeTimerState,
  writeUserSettings,
} from "./timerStorage";

const fallbackSettings = {
  focusDuration: 1500,
  breakDuration: 300,
  autoBreak: false,
  autoFocus: false,
};

describe("timerStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default user settings when nothing is stored", () => {
    expect(readUserSettings()).toEqual(DEFAULT_USER_SETTINGS);
    expect(readUserSettings()).toMatchObject({
      uiVolume: 1,
      focusAmbienceEnabled: true,
    });
  });

  it("applies the legacy sound override when audio settings were not stored", () => {
    localStorage.setItem(LEGACY_SOUND_ENABLED_STORAGE_KEY, "false");
    localStorage.setItem(
      USER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        focusDuration: 1800,
        breakDuration: 600,
        autoBreak: true,
        autoFocus: false,
      }),
    );

    expect(readUserSettings()).toMatchObject({
      focusDuration: 1800,
      breakDuration: 600,
      autoBreak: true,
      autoFocus: false,
      alarmEnabled: false,
      uiSoundsEnabled: false,
      uiVolume: 0,
      focusAmbienceEnabled: false,
    });
  });

  it("normalizes invalid json back to defaults", () => {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, "{broken");

    expect(readUserSettings()).toEqual(DEFAULT_USER_SETTINGS);
  });

  it("clamps stored volume settings into the supported range", () => {
    localStorage.setItem(
      USER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_USER_SETTINGS,
        alarmVolume: 10,
        uiVolume: -3,
        focusAmbienceVolume: 2,
      }),
    );

    expect(readUserSettings()).toMatchObject({
      alarmVolume: 1,
      uiVolume: 0,
      focusAmbienceVolume: 1,
    });
  });

  it("restores a running timer based on the target timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:05.000Z"));

    localStorage.setItem(
      "timer-state",
      JSON.stringify({
        mode: "focus",
        status: "running",
        timeLeft: 10,
        targetTimestamp: new Date("2026-04-15T12:00:10.000Z").getTime(),
        sessionStartedAt: "2026-04-15T12:00:00.000Z",
        accumulatedSeconds: 2,
      }),
    );

    expect(readTimerState("timer-state", fallbackSettings)).toEqual({
      mode: "focus",
      status: "running",
      timeLeft: 5,
      targetTimestamp: new Date("2026-04-15T12:00:10.000Z").getTime(),
      sessionStartedAt: "2026-04-15T12:00:00.000Z",
      accumulatedSeconds: 7,
    });
  });

  it("falls back to the mode duration when timer state is broken", () => {
    localStorage.setItem("timer-state", "{bad");

    expect(readTimerState("timer-state", fallbackSettings)).toEqual({
      mode: "focus",
      status: "idle",
      timeLeft: 1500,
      targetTimestamp: null,
      sessionStartedAt: null,
      accumulatedSeconds: 0,
    });
  });

  it("writes normalized user settings and emits an update event", () => {
    const eventSpy = vi.fn();
    window.addEventListener(
      USER_SETTINGS_UPDATED_EVENT,
      eventSpy as EventListener,
    );
    localStorage.setItem(LEGACY_SOUND_ENABLED_STORAGE_KEY, "false");

    writeUserSettings(USER_SETTINGS_STORAGE_KEY, {
      ...DEFAULT_USER_SETTINGS,
      alarmVolume: 4,
      uiVolume: -1,
    });

    expect(JSON.parse(localStorage.getItem(USER_SETTINGS_STORAGE_KEY) ?? "{}"))
      .toMatchObject({
        alarmVolume: 1,
        uiVolume: 0,
      });
    expect(localStorage.getItem(LEGACY_SOUND_ENABLED_STORAGE_KEY)).toBeNull();
    expect(eventSpy).toHaveBeenCalledTimes(1);
  });

  it("writes timer state as-is", () => {
    writeTimerState("timer-state", {
      mode: "break",
      status: "paused",
      timeLeft: 42,
      targetTimestamp: null,
      sessionStartedAt: null,
      accumulatedSeconds: 13,
    });

    expect(JSON.parse(localStorage.getItem("timer-state") ?? "{}")).toEqual({
      mode: "break",
      status: "paused",
      timeLeft: 42,
      targetTimestamp: null,
      sessionStartedAt: null,
      accumulatedSeconds: 13,
    });
  });
});
