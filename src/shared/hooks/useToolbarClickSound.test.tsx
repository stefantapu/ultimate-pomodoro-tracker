import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { useToolbarClickSound } from "./useToolbarClickSound";

class MockAudio {
  static instances: MockAudio[] = [];

  currentTime = 0;
  src?: string;
  volume = 1;

  pause = vi.fn();
  play = vi.fn(() => Promise.resolve());

  constructor(src?: string) {
    this.src = src;
    MockAudio.instances.push(this);
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

  beforeEach(() => {
    MockAudio.instances = [];
    globalThis.Audio = MockAudio as unknown as typeof Audio;
    useSkinStore.setState({
      activeSkinId: "warm",
      activeSkin: getSkinById("warm"),
      setActiveSkinId: useSkinStore.getState().setActiveSkinId,
    });
  });

  afterEach(() => {
    globalThis.Audio = originalAudio;
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
