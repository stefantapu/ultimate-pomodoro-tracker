import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAlarm } from "./useAlarm";

class MockAudio {
  static instances: MockAudio[] = [];

  currentTime = 0;
  duration = 10;
  loop = false;
  paused = true;
  src = "";
  volume = 1;

  private readonly attributes = new Map<string, string>();
  private readonly listeners = new Map<string, Set<() => void>>();

  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  constructor(src?: string) {
    this.src = src ?? "";
    MockAudio.instances.push(this);
  }

  addEventListener(eventName: string, listener: () => void) {
    const listeners = this.listeners.get(eventName) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
  }

  removeEventListener(eventName: string, listener: () => void) {
    this.listeners.get(eventName)?.delete(listener);
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }
}

function AlarmHarness({
  playSignal,
  volume,
  outputGain = 1,
}: {
  playSignal: number;
  volume: number;
  outputGain?: number;
}) {
  const { play } = useAlarm("/ambience.mp3", volume, {
    loop: true,
    loopOverlapMs: 1000,
    outputGain,
  });

  useEffect(() => {
    if (playSignal > 0) {
      play(false);
    }
  }, [play, playSignal]);

  return null;
}

describe("useAlarm", () => {
  const originalAudio = globalThis.Audio;
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafId: number;
  let performanceNow: number;

  const runNextAnimationFrame = (timestamp: number) => {
    const [id, callback] = rafCallbacks.entries().next().value ?? [];

    if (!id || !callback) {
      throw new Error("Expected a queued animation frame.");
    }

    rafCallbacks.delete(id);
    callback(timestamp);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    MockAudio.instances = [];
    globalThis.Audio = MockAudio as unknown as typeof Audio;
    rafCallbacks = new Map();
    rafId = 0;
    performanceNow = 0;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      rafId += 1;
      rafCallbacks.set(rafId, callback);
      return rafId;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      rafCallbacks.delete(id);
    });
    vi.spyOn(window.performance, "now").mockImplementation(() => performanceNow);
  });

  afterEach(() => {
    globalThis.Audio = originalAudio;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("updates the active ambience volume without pausing or reloading it", () => {
    const { rerender } = render(<AlarmHarness playSignal={1} volume={0.4} />);
    const activeAudio = MockAudio.instances[0];

    expect(activeAudio.play).toHaveBeenCalledTimes(1);
    expect(activeAudio.paused).toBe(false);

    rerender(<AlarmHarness playSignal={1} volume={0.8} />);

    expect(MockAudio.instances).toHaveLength(1);
    expect(activeAudio.pause).not.toHaveBeenCalled();
    expect(activeAudio.volume).toBe(0.8);
    expect(activeAudio.getAttribute("data-audio-src")).toBe("/ambience.mp3");
  });

  it("applies output gain when native volume is the only available path", () => {
    render(<AlarmHarness playSignal={1} volume={0.4} outputGain={2} />);

    expect(MockAudio.instances[0].volume).toBe(0.8);
  });

  it("starts the next loop before the current ambience ends", () => {
    render(<AlarmHarness playSignal={1} volume={0.4} />);

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    expect(MockAudio.instances).toHaveLength(2);
    expect(MockAudio.instances[1].play).toHaveBeenCalledTimes(1);
    expect(MockAudio.instances[1].volume).toBe(0);
  });

  it("fades in the next overlapped loop across the overlap duration", () => {
    render(<AlarmHarness playSignal={1} volume={0.4} />);

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    const nextAudio = MockAudio.instances[1];
    expect(nextAudio.volume).toBe(0);

    act(() => {
      runNextAnimationFrame(performanceNow + 500);
    });

    expect(nextAudio.volume).toBeCloseTo(0.2);

    act(() => {
      runNextAnimationFrame(performanceNow + 1000);
    });

    expect(MockAudio.instances[1].volume).toBe(0.4);
  });
});
