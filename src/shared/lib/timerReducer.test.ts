import { describe, expect, it, vi } from "vitest";
import { timerReducer } from "./timerReducer";
import type { TimerState } from "./timerTypes";

const baseState: TimerState = {
  mode: "focus",
  status: "idle",
  timeLeft: 1500,
  targetTimestamp: null,
  sessionStartedAt: null,
  accumulatedSeconds: 0,
};

describe("timerReducer", () => {
  it("starts a session and preserves an existing session start time", () => {
    const next = timerReducer(
      {
        ...baseState,
        sessionStartedAt: "2026-04-15T10:00:00.000Z",
      },
      {
        type: "START",
        timeLeft: 1200,
        targetTimestamp: 12345,
      },
    );

    expect(next).toEqual({
      ...baseState,
      status: "running",
      timeLeft: 1200,
      targetTimestamp: 12345,
      sessionStartedAt: "2026-04-15T10:00:00.000Z",
      accumulatedSeconds: 0,
    });
  });

  it("records elapsed time when pausing without checkpoint", () => {
    const next = timerReducer(
      {
        ...baseState,
        status: "running",
        timeLeft: 1500,
        targetTimestamp: 15000,
        sessionStartedAt: "2026-04-15T10:00:00.000Z",
      },
      {
        type: "PAUSE",
        timeLeft: 1200,
      },
    );

    expect(next.status).toBe("paused");
    expect(next.targetTimestamp).toBeNull();
    expect(next.timeLeft).toBe(1200);
    expect(next.accumulatedSeconds).toBe(300);
    expect(next.sessionStartedAt).toBe("2026-04-15T10:00:00.000Z");
  });

  it("clears session tracking when pausing after a synced checkpoint", () => {
    const next = timerReducer(
      {
        ...baseState,
        status: "running",
        timeLeft: 1500,
        targetTimestamp: 15000,
        sessionStartedAt: "2026-04-15T10:00:00.000Z",
        accumulatedSeconds: 120,
      },
      {
        type: "PAUSE",
        timeLeft: 1000,
        checkpoint: true,
      },
    );

    expect(next.accumulatedSeconds).toBe(0);
    expect(next.sessionStartedAt).toBeNull();
  });

  it("resets the active mode and clears runtime state", () => {
    const next = timerReducer(
      {
        ...baseState,
        status: "paused",
        timeLeft: 900,
        targetTimestamp: 20000,
        sessionStartedAt: "2026-04-15T10:00:00.000Z",
        accumulatedSeconds: 600,
      },
      {
        type: "RESET",
        duration: 1800,
      },
    );

    expect(next).toEqual({
      mode: "focus",
      status: "idle",
      timeLeft: 1800,
      targetTimestamp: null,
      sessionStartedAt: null,
      accumulatedSeconds: 0,
    });
  });

  it("switches mode and resets timer state", () => {
    const next = timerReducer(baseState, {
      type: "SWITCH_MODE",
      mode: "break",
      duration: 300,
    });

    expect(next).toEqual({
      mode: "break",
      status: "idle",
      timeLeft: 300,
      targetTimestamp: null,
      sessionStartedAt: null,
      accumulatedSeconds: 0,
    });
  });

  it("tracks elapsed seconds on tick", () => {
    const next = timerReducer(
      {
        ...baseState,
        status: "running",
        timeLeft: 100,
        accumulatedSeconds: 12,
      },
      {
        type: "TICK",
        timeLeft: 96,
      },
    );

    expect(next.timeLeft).toBe(96);
    expect(next.accumulatedSeconds).toBe(16);
  });

  it("finishes into an auto-started next mode", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));

    const next = timerReducer(baseState, {
      type: "FINISH",
      nextMode: "break",
      nextDuration: 300,
      nextTargetTimestamp: 99999,
    });

    expect(next.mode).toBe("break");
    expect(next.status).toBe("running");
    expect(next.timeLeft).toBe(300);
    expect(next.targetTimestamp).toBe(99999);
    expect(next.accumulatedSeconds).toBe(0);
    expect(next.sessionStartedAt).toBe("2026-04-15T12:00:00.000Z");
  });

  it("finishes into an idle next mode when auto-start is disabled", () => {
    const next = timerReducer(baseState, {
      type: "FINISH",
      nextMode: "break",
      nextDuration: 300,
    });

    expect(next).toEqual({
      mode: "break",
      status: "idle",
      timeLeft: 300,
      targetTimestamp: null,
      sessionStartedAt: null,
      accumulatedSeconds: 0,
    });
  });
});
