import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAudioCacheStatus,
  getCachedAudioElement,
  resetAudioAssetCacheForTests,
  resolveCachedAudioSrc,
  setActiveAudioCacheSources,
} from "./audioAssetCache";

class MockAudio {
  static instances: MockAudio[] = [];

  currentTime = 0;
  muted = false;
  paused = true;
  preload = "";
  src = "";
  volume = 1;
  private readonly attributes = new Map<string, string>();

  load = vi.fn();
  pause = vi.fn(() => {
    this.paused = true;
  });
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });

  constructor(src?: string) {
    this.src = src ?? "";
    MockAudio.instances.push(this);
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
}

describe("audioAssetCache", () => {
  const originalAudio = globalThis.Audio;
  const originalWindowAudio = window.Audio;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  let fetchMock: ReturnType<typeof vi.fn>;
  let createObjectUrlMock: ReturnType<typeof vi.fn>;
  let revokeObjectUrlMock: ReturnType<typeof vi.fn>;

  const dispatchFirstGesture = () => {
    window.dispatchEvent(new Event("pointerdown"));
  };

  beforeEach(() => {
    MockAudio.instances = [];
    globalThis.Audio = MockAudio as unknown as typeof Audio;
    window.Audio = MockAudio as unknown as typeof Audio;
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(["audio"], {
        type: "audio/mpeg",
      })),
    });
    createObjectUrlMock = vi.fn((blob: Blob) => `blob:audio-${blob.size}`);
    revokeObjectUrlMock = vi.fn();

    Object.defineProperty(window, "fetch", {
      configurable: true,
      value: fetchMock,
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrlMock,
    });
  });

  afterEach(() => {
    resetAudioAssetCacheForTests();
    globalThis.Audio = originalAudio;
    window.Audio = originalWindowAudio;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: originalCreateObjectUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: originalRevokeObjectUrl,
    });
    vi.restoreAllMocks();
  });

  it("fetches active audio as blobs after the first gesture", async () => {
    setActiveAudioCacheSources(["/ambience.mp3", "/click.mp3"]);

    expect(getAudioCacheStatus("/ambience.mp3")).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();

    dispatchFirstGesture();

    expect(MockAudio.instances).toHaveLength(2);
    expect(
      MockAudio.instances.every((audio) => audio.play.mock.calls.length === 1),
    ).toBe(true);

    await vi.waitFor(() => {
      expect(getAudioCacheStatus("/ambience.mp3")).toBe("ready");
      expect(getAudioCacheStatus("/click.mp3")).toBe("ready");
    });

    expect(fetchMock).toHaveBeenCalledWith("/ambience.mp3");
    expect(fetchMock).toHaveBeenCalledWith("/click.mp3");
    expect(resolveCachedAudioSrc("/ambience.mp3")).toBe("blob:audio-5");
  });

  it("falls back to original URLs when blob fetching fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    setActiveAudioCacheSources(["/ambience.mp3"]);
    dispatchFirstGesture();

    await vi.waitFor(() => {
      expect(getAudioCacheStatus("/ambience.mp3")).toBe("failed");
    });

    expect(resolveCachedAudioSrc("/ambience.mp3")).toBe("/ambience.mp3");
  });

  it("keeps only the active theme sources and refreshes paused pools", async () => {
    setActiveAudioCacheSources(["/warm.mp3"]);

    const activeLoop = getCachedAudioElement("/warm.mp3", "focus-ambience", 0);
    const standbyLoop = getCachedAudioElement("/warm.mp3", "focus-ambience", 1);

    expect(activeLoop?.src).toBe("/warm.mp3");
    expect(standbyLoop?.src).toBe("/warm.mp3");

    dispatchFirstGesture();

    await vi.waitFor(() => {
      expect(activeLoop?.src).toBe("blob:audio-5");
      expect(standbyLoop?.src).toBe("blob:audio-5");
    });

    setActiveAudioCacheSources(["/viking.mp3"]);

    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:audio-5");
    expect(resolveCachedAudioSrc("/warm.mp3")).toBe("/warm.mp3");
  });
});
