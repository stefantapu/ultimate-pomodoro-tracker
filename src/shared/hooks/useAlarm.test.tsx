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

class MockAudioParam {
  value = 1;
  events: Array<{ type: string; value?: number; time: number }> = [];

  cancelScheduledValues = vi.fn((time: number) => {
    this.events.push({ type: "cancel", time });
  });

  setValueAtTime = vi.fn((value: number, time: number) => {
    this.value = value;
    this.events.push({ type: "set", value, time });
    return this;
  });

  linearRampToValueAtTime = vi.fn((value: number, time: number) => {
    this.value = value;
    this.events.push({ type: "ramp", value, time });
    return this;
  });
}

class MockGainNode {
  gain = new MockAudioParam();
  connect = vi.fn(() => this);
}

class MockBufferSourceNode {
  buffer: AudioBuffer | null = null;
  connect = vi.fn(() => new MockGainNode());
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  static instances: MockAudioContext[] = [];

  currentTime = 100;
  destination = {};
  gains: MockGainNode[] = [];
  sources: MockBufferSourceNode[] = [];
  state: AudioContextState = "running";

  constructor() {
    MockAudioContext.instances.push(this);
  }

  createGain = vi.fn(() => {
    const gain = new MockGainNode();
    this.gains.push(gain);
    return gain;
  });

  createBufferSource = vi.fn(() => {
    const source = new MockBufferSourceNode();
    this.sources.push(source);
    return source;
  });

  decodeAudioData = vi.fn(async () => ({
    duration: 10,
  }) as AudioBuffer);

  resume = vi.fn(async () => {});
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
  const originalAudioContext = window.AudioContext;
  const originalFetch = window.fetch;
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

  const setDocumentHidden = (isHidden: boolean) => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: isHidden,
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    MockAudio.instances = [];
    MockAudioContext.instances = [];
    globalThis.Audio = MockAudio as unknown as typeof Audio;
    window.AudioContext = undefined as unknown as typeof AudioContext;
    setDocumentHidden(false);
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
    setDocumentHidden(false);
    globalThis.Audio = originalAudio;
    window.AudioContext = originalAudioContext;
    window.fetch = originalFetch;
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
    expect(MockAudio.instances[0].loop).toBe(false);
    expect(MockAudio.instances[1].loop).toBe(true);
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

  it("uses native looping as a safety net so background timer throttling cannot stop ambience", () => {
    render(<AlarmHarness playSignal={1} volume={0.4} />);

    const activeAudio = MockAudio.instances[0];
    expect(activeAudio.loop).toBe(true);

    act(() => {
      setDocumentHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(activeAudio.loop).toBe(true);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(MockAudio.instances).toHaveLength(1);

    act(() => {
      setDocumentHidden(false);
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(activeAudio.loop).toBe(true);

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    expect(MockAudio.instances).toHaveLength(2);
    expect(MockAudio.instances[1].play).toHaveBeenCalledTimes(1);
  });

  it("schedules overlapped ambience on the Web Audio clock when available", async () => {
    window.AudioContext =
      MockAudioContext as unknown as typeof AudioContext;
    window.fetch = vi.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
    })) as unknown as typeof fetch;

    render(<AlarmHarness playSignal={1} volume={0.4} />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const context = MockAudioContext.instances[0];
    const masterGain = context.gains[0];
    const firstSource = context.sources[0];
    const secondSource = context.sources[1];
    const firstSourceGain = context.gains[1];
    const secondSourceGain = context.gains[2];

    expect(MockAudio.instances).toHaveLength(0);
    expect(window.fetch).toHaveBeenCalledWith("/ambience.mp3");
    expect(context.decodeAudioData).toHaveBeenCalledTimes(1);
    expect(masterGain.gain.value).toBe(0.4);
    expect(firstSource.start).toHaveBeenCalledWith(100.03, 0, 10);
    expect(secondSource.start).toHaveBeenCalledWith(109.03, 0, 10);
    expect(firstSourceGain.gain.events).toEqual(
      expect.arrayContaining([
        { type: "set", value: 1, time: 100.03 },
        { type: "set", value: 1, time: 109.03 },
        { type: "ramp", value: 0, time: 110.03 },
      ]),
    );
    expect(secondSourceGain.gain.events).toEqual(
      expect.arrayContaining([
        { type: "set", value: 0, time: 109.03 },
        { type: "ramp", value: 1, time: 110.03 },
      ]),
    );
    expect(vi.getTimerCount()).toBe(0);
  });
});
