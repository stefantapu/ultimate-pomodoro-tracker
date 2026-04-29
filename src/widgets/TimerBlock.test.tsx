import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USER_SETTINGS_STORAGE_KEY } from "@shared/lib/timerStorage";
import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import { renderWithProviders } from "../test/testUtils";
import { TimerBlock } from "./TimerBlock";

const syncSessionMock = vi.fn();
const pushSettingsToCloudMock = vi.fn();
const useAlarmMock = vi.fn();

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
  beforeEach(() => {
    localStorage.clear();
    syncSessionMock.mockReset();
    pushSettingsToCloudMock.mockReset();
    useAlarmMock.mockReset();
    useAlarmMock.mockReturnValue({
      play: vi.fn(),
      stop: vi.fn(),
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
    expect(useAlarmMock).toHaveBeenCalledWith(null, 0.25);
    expect(useAlarmMock).toHaveBeenCalledWith(null, 0.2, {
      loop: true,
      fadeInMs: 0,
      loopOverlapMs: 1000,
    });
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
    );
    expect(useAlarmMock).toHaveBeenCalledWith(
      "/assets/Viking Theme/Sound effects/Focus-Break-Click.mp3",
      0.25,
    );
    expect(useAlarmMock).toHaveBeenCalledWith(
      "/assets/Viking Theme/Sound effects/Storm, Wind, Winter Background Viking Theme Loop.mp3",
      0.2,
      { loop: true, fadeInMs: 1800, loopOverlapMs: 1000 },
    );
  });

  it("renders settings modal with neumorphism class hooks for theme-specific audio styling", async () => {
    act(() => {
      useSkinStore.getState().setActiveSkinId("neumorphism");
      useUIStore.getState().setSettingsModalOpen(true);
    });

    renderWithProviders(<TimerBlock />);

    expect(await screen.findByText("Sound")).toBeInTheDocument();
    expect(document.querySelector(".settings-modal__overlay--neumorphism")).not.toBeNull();
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
