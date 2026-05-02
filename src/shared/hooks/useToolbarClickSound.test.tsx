import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetAudioAssetCacheForTests } from "@shared/lib/audioAssetCache";
import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { useToolbarClickSound } from "./useToolbarClickSound";

class MockAudio {
  static instances: MockAudio[] = [];

  currentTime = 0;
  paused = true;
  src?: string;
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
    this.src = src;
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

function ToolbarClickHarness() {
  const playToolbarClick = useToolbarClickSound();

  return (
    <button type="button" onClick={playToolbarClick}>
      Click
    </button>
  );
}

describe("useToolbarClickSound", () => {
  const originalAudio = globalThis.Audio;
  const originalWindowAudio = window.Audio;

  beforeEach(() => {
    MockAudio.instances = [];
    globalThis.Audio = MockAudio as unknown as typeof Audio;
    window.Audio = MockAudio as unknown as typeof Audio;
    useSkinStore.setState({
      activeSkinId: "warm",
      activeSkin: getSkinById("warm"),
      setActiveSkinId: useSkinStore.getState().setActiveSkinId,
    });
  });

  afterEach(() => {
    resetAudioAssetCacheForTests();
    globalThis.Audio = originalAudio;
    window.Audio = originalWindowAudio;
    vi.restoreAllMocks();
  });

  it("keeps modal close click playback alive after the caller unmounts", () => {
    const { unmount } = render(<ToolbarClickHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Click" }));
    unmount();

    expect(MockAudio.instances).toHaveLength(1);
    expect(MockAudio.instances[0].play).toHaveBeenCalledTimes(1);
    expect(MockAudio.instances[0].pause).toHaveBeenCalledTimes(1);
    expect(MockAudio.instances[0].volume).toBe(0.5);
  });
});
