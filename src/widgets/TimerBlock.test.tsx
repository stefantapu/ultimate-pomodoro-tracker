import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetAudioAssetCacheForTests } from "@shared/lib/audioAssetCache";
import { USER_SETTINGS_STORAGE_KEY } from "@shared/lib/timerStorage";
import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import { renderWithProviders } from "../test/testUtils";
import { TimerBlock } from "./TimerBlock";

const syncSessionMock = vi.fn();
const pushSettingsToCloudMock = vi.fn();
const useAlarmMock = vi.fn();
let useAlarmReturns: Array<{
  play: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}>;

class MockAudio {
  currentTime = 0;
  paused = true;
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

vi.mock("@shared/hooks/useSyncSession", () => ({
  useSyncSession: () => ({
    syncSession: syncSessionMock,
  }),
}));

vi.mock("@shared/hooks/useSettingsSync", () => ({
  useSettingsSync: () => ({
    pushSettingsToCloud: pushSettingsToCloudMock,
  }),
}));

vi.mock("@shared/hooks/useAlarm", () => ({
  useAlarm: (...args: unknown[]) => useAlarmMock(...args),
}));

describe("TimerBlock", () => {
  const originalAudio = globalThis.Audio;
  const originalWindowAudio = window.Audio;

  beforeEach(() => {
    resetAudioAssetCacheForTests();
    globalThis.Audio = MockAudio as unknown as typeof Audio;
    window.Audio = MockAudio as unknown as typeof Audio;
    localStorage.clear();
    syncSessionMock.mockReset();
    pushSettingsToCloudMock.mockReset();
    useAlarmMock.mockReset();
    useAlarmReturns = [];
    useAlarmMock.mockImplementation(() => {
      const controls = {
        play: vi.fn(),
        stop: vi.fn(),
      };

      useAlarmReturns.push(controls);
      return controls;
    });
    useSkinStore.setState({
      activeSkinId: "warm",
      activeSkin: getSkinById("warm"),
      setActiveSkinId: useSkinStore.getState().setActiveSkinId,
    });

    localStorage.setItem(
      USER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        focusDuration: 1500,
        breakDuration: 300,
        autoBreak: false,
        autoFocus: false,
        alarmEnabled: true,
        alarmVolume: 1,
        uiSoundsEnabled: true,
        uiVolume: 0.5,
        focusAmbienceEnabled: false,
        focusAmbienceVolume: 0.2,
      }),
    );
  });

  afterEach(() => {
    resetAudioAssetCacheForTests();
    globalThis.Audio = originalAudio;
    window.Audio = originalWindowAudio;
  });

  it("renders stored timer state and toggles start/pause", async () => {
    localStorage.setItem(
      "pomodoro-timer-state",
      JSON.stringify({
        mode: "focus",
        status: "paused",
        timeLeft: 120,
        targetTimestamp: null,
        sessionStartedAt: null,
        accumulatedSeconds: 0,
      }),
    );

    renderWithProviders(<TimerBlock />);

    expect(screen.getByText("02:00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("shows validation errors and disables saving invalid durations", async () => {
    act(() => {
      useUIStore.getState().setSettingsModalOpen(true);
    });

    renderWithProviders(<TimerBlock />);

    const input = await screen.findByLabelText("Focus duration in minutes");
    fireEvent.change(input, { target: { value: "10" } });

    expect(screen.getByText("Enter 15-90 minutes.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save settings" }),
    ).toBeDisabled();
  });

  it("locks timer settings while the timer is running", async () => {
    renderWithProviders(<TimerBlock />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    act(() => {
      useUIStore.getState().setSettingsModalOpen(true);
    });

    expect(
      await screen.findByText(
        "Timer is running. Pause or reset before changing timer settings.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Focus duration in minutes")).toBeDisabled();
    expect(screen.getByLabelText("Break duration in minutes")).toBeDisabled();
  });

  it("saves duration changes and resets the displayed timer for the active mode", async () => {
    act(() => {
      useUIStore.getState().setSettingsModalOpen(true);
    });

    renderWithProviders(<TimerBlock />);

    const input = await screen.findByLabelText("Focus duration in minutes");
    fireEvent.change(input, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("30:00")).toBeInTheDocument();
  });

  it("updates the document title while a timer is running", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));

    renderWithProviders(<TimerBlock />);

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(document.title).toBe("25:00 - Forge Timer");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(document.title).toBe("24:58 - Forge Timer");

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));

    expect(document.title).toBe("Forge Timer - Pomodoro");
  });

  it("uses silent audio placeholders on the neumorphism skin", () => {
    act(() => {
      useSkinStore.getState().setActiveSkinId("neumorphism");
    });

    renderWithProviders(<TimerBlock />);

    expect(useAlarmMock).toHaveBeenCalledWith(null, 1);
    expect(useAlarmMock).toHaveBeenCalledWith(null, 0.25, {
      cacheKey: "primary-timer-control",
    });
    expect(useAlarmMock).toHaveBeenCalledWith(null, 0.25, {
      cacheKey: "mode-control",
    });
    expect(useAlarmMock).toHaveBeenCalledWith(null, 0.25, {
      cacheKey: "settings-ui-preview",
    });
    expect(useAlarmMock).toHaveBeenCalledWith(null, 0.2, {
      loop: true,
      fadeInMs: 0,
      loopOverlapMs: 1000,
      outputGain: 1,
      cacheKey: "focus-ambience",
    });
    expect(useAlarmMock).toHaveBeenCalledWith(null, 0.2, {
      fadeInMs: 250,
      outputGain: 1,
      cacheKey: "settings-focus-ambience-preview",
    });
  });

  it("uses boosted warm ambience for playback and previews", () => {
    renderWithProviders(<TimerBlock />);

    expect(useAlarmMock).toHaveBeenCalledWith(
      "/assets/red_lava_theme/audio/Warm_theme_background_music.mp3",
      0.2,
      {
        loop: true,
        fadeInMs: 0,
        loopOverlapMs: 1000,
        outputGain: 2.5,
        cacheKey: "focus-ambience",
      },
    );
    expect(useAlarmMock).toHaveBeenCalledWith(
      "/assets/red_lava_theme/audio/Warm_theme_background_music.mp3",
      0.2,
      {
        fadeInMs: 250,
        outputGain: 2.5,
        cacheKey: "settings-focus-ambience-preview",
      },
    );
  });

  it("uses distinct viking audio roles with focus ambience fade-in", () => {
    act(() => {
      useSkinStore.getState().setActiveSkinId("viking");
    });

    renderWithProviders(<TimerBlock />);

    expect(useAlarmMock).toHaveBeenCalledWith(
      "/assets/Viking Theme/Sound effects/Alarm-on-timer-finish-sound.mp3",
      1,
    );
    expect(useAlarmMock).toHaveBeenCalledWith(
      "/assets/Viking Theme/Sound effects/Start-Pause-Click.mp3",
      0.25,
      { cacheKey: "primary-timer-control" },
    );
    expect(useAlarmMock).toHaveBeenCalledWith(
      "/assets/Viking Theme/Sound effects/Focus-Break-Click.mp3",
      0.25,
      { cacheKey: "mode-control" },
    );
    expect(useAlarmMock).toHaveBeenCalledWith(
      "/assets/Viking Theme/Sound effects/Storm, Wind, Winter Background Viking Theme Loop.mp3",
      0.2,
      {
        loop: true,
        fadeInMs: 1800,
        loopOverlapMs: 1000,
        outputGain: 1,
        cacheKey: "focus-ambience",
      },
    );
    expect(useAlarmMock).toHaveBeenCalledWith(
      "/assets/Viking Theme/Sound effects/Storm, Wind, Winter Background Viking Theme Loop.mp3",
      0.2,
      {
        fadeInMs: 250,
        outputGain: 1,
        cacheKey: "settings-focus-ambience-preview",
      },
    );
  });

  it("renders settings modal with ambience preview across themes", async () => {
    act(() => {
      useSkinStore.getState().setActiveSkinId("neumorphism");
      useUIStore.getState().setSettingsModalOpen(true);
    });

    renderWithProviders(<TimerBlock />);

    expect(await screen.findByText("Sound")).toBeInTheDocument();
    expect(document.querySelector(".settings-modal__overlay--neumorphism")).not.toBeNull();
    const previewButtons = screen.getAllByRole("button", { name: "Preview" });

    expect(previewButtons).toHaveLength(3);
    expect(previewButtons[2]).toBeDisabled();
  });

  it("stops ambience previews when another preview runs or settings are saved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true }),
    );

    act(() => {
      useUIStore.getState().setSettingsModalOpen(true);
    });

    renderWithProviders(<TimerBlock />);

    const previewButtons = await screen.findAllByRole("button", {
      name: "Preview",
    });
    const previewAlarmControls = useAlarmReturns[1];
    const previewUiControls = useAlarmReturns[4];
    const previewAmbienceControls = useAlarmReturns[6];

    fireEvent.click(previewButtons[2]);

    expect(previewAmbienceControls.play).toHaveBeenCalledTimes(1);

    fireEvent.click(previewButtons[0]);

    expect(previewAmbienceControls.stop).toHaveBeenCalledTimes(2);
    expect(previewAlarmControls.play).toHaveBeenCalledTimes(1);

    fireEvent.click(previewButtons[2]);
    fireEvent.click(previewButtons[1]);

    expect(previewAmbienceControls.stop).toHaveBeenCalledTimes(4);
    expect(previewUiControls.play).toHaveBeenCalledTimes(1);

    fireEvent.click(previewButtons[2]);
    fireEvent.change(screen.getByLabelText("Focus ambience volume"), {
      target: { value: "30" },
    });
    const saveButton = screen.getByRole("button", { name: "Save settings" });

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    const stopCallsBeforeSave = useAlarmReturns.reduce(
      (sum, controls) => sum + controls.stop.mock.calls.length,
      0,
    );

    fireEvent.click(saveButton);

    expect(
      useAlarmReturns.reduce(
        (sum, controls) => sum + controls.stop.mock.calls.length,
        0,
      ),
    ).toBeGreaterThan(stopCallsBeforeSave);
  });

  it("applies valid settings changes when clicking the settings backdrop", async () => {
    act(() => {
      useUIStore.getState().setSettingsModalOpen(true);
    });

    renderWithProviders(<TimerBlock />);

    const uiVolumeSlider = await screen.findByLabelText("UI sounds volume");
    fireEvent.change(uiVolumeSlider, { target: { value: "80" } });
    fireEvent.click(document.querySelector(".settings-modal__overlay")!);

    await waitFor(() => {
      expect(document.querySelector(".settings-modal__overlay")).toBeNull();
      expect(
        JSON.parse(localStorage.getItem(USER_SETTINGS_STORAGE_KEY) ?? "{}"),
      ).toMatchObject({
        uiVolume: 0.8,
      });
    });
  });
});
