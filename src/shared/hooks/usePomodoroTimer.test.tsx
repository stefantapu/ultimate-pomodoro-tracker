import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePomodoroTimer } from "./usePomodoroTimer";

const syncSessionMock = vi.fn();

vi.mock("./useSyncSession", () => ({
  useSyncSession: () => ({
    syncSession: syncSessionMock,
  }),
}));

describe("usePomodoroTimer", () => {
  beforeEach(() => {
    syncSessionMock.mockReset();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));
  });

  it("starts, pauses, and syncs interrupted progress", () => {
    const { result } = renderHook(() =>
      usePomodoroTimer({
        settings: {
          focusDuration: 10,
          breakDuration: 5,
          autoBreak: false,
          autoFocus: false,
        },
        stateStorageKey: "timer-state",
      }),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe("running");

    act(() => {
      vi.advanceTimersByTime(4000);
      result.current.pause();
    });

    expect(syncSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "focus",
        status: "interrupted",
        duration_seconds: 10,
        accumulated_seconds: 4,
        started_at: "2026-04-15T12:00:00.000Z",
        finished_at: "2026-04-15T12:00:04.000Z",
      }),
    );

    expect(result.current.status).toBe("paused");
    expect(result.current.timeLeft).toBe(6);
    expect(JSON.parse(localStorage.getItem("timer-state") ?? "{}")).toMatchObject({
      status: "paused",
      timeLeft: 6,
      accumulatedSeconds: 0,
      sessionStartedAt: null,
    });
  });

  it("finishes a focus session and auto-starts the break timer", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));

    const onSessionComplete = vi.fn();
    const { result } = renderHook(() =>
      usePomodoroTimer({
        settings: {
          focusDuration: 5,
          breakDuration: 3,
          autoBreak: true,
          autoFocus: false,
        },
        stateStorageKey: "timer-state",
        onSessionComplete,
      }),
    );

    act(() => {
      result.current.start();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.mode).toBe("break");
    expect(onSessionComplete).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("running");
    expect(result.current.timeLeft).toBe(3);
    expect(syncSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "focus",
        status: "completed",
        duration_seconds: 5,
        accumulated_seconds: 5,
      }),
    );
  });

  it("does not sync when hard reset is used", () => {
    const { result } = renderHook(() =>
      usePomodoroTimer({
        settings: {
          focusDuration: 10,
          breakDuration: 5,
          autoBreak: false,
          autoFocus: false,
        },
        stateStorageKey: "timer-state",
      }),
    );

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(2000);
      result.current.hardReset();
    });

    expect(syncSessionMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
    expect(result.current.timeLeft).toBe(10);
  });
});
