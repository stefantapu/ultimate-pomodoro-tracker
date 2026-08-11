import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetAudioAssetCacheForTests } from "@shared/lib/audioAssetCache";
import { USER_SETTINGS_STORAGE_KEY } from "@shared/lib/timerStorage";
import { getSkinById } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import { renderWithProviders } from "../test/testUtils";
import { TimerBlock } from "./TimerBlock";

const { getSupabaseClientMock } = vi.hoisted(() => ({
  getSupabaseClientMock: vi.fn(),
}));

vi.mock("../../utils/supabase", () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

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
    getSupabaseClientMock.mockReset();
    getSupabaseClientMock.mockResolvedValue({
      from: vi.fn(() => {
        const query = {
          select: vi.fn(() => query),
          eq: vi.fn(() => query),
          lt: vi.fn(() => query),
          gt: vi.fn(() => query),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };

        return query;
      }),
    });
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
    useUIStore.setState((state) => ({
      ...state,
      isSettingsModalOpen: false,
      isInfographicsModalOpen: false,
      isThemePickerModalOpen: false,
    }));

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

  it("shows the complete local-day scale and current time to guests", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 34, 0));

    renderWithProviders(<TimerBlock />);

    const timeline = screen.getByRole("group", {
      name: "Today's focus session timeline",
    });

    expect(timeline).toBeInTheDocument();
    expect(screen.getByText("12:34")).toBeInTheDocument();
    expect(screen.queryByTestId("timeline-hour-division")).toBeNull();
    expect(
      screen.getAllByTestId("timeline-hour-label").map((label) => label.textContent),
    ).toEqual(["00", "06", "09", "12", "15", "18", "24"]);
    expect(screen.getByTestId("timeline-now-marker")).toBeInTheDocument();
    expect(screen.queryByTestId("timeline-session-segment")).toBeNull();
    expect(screen.queryByText(/nothing recorded/i)).toBeNull();
  });

  it("shows only authenticated focus sessions with clipped proportional geometry", async () => {
    vi.useFakeTimers();
    const now = new Date(2026, 3, 15, 12, 34, 0);
    const dayStart = new Date(2026, 3, 15, 0, 0, 0);
    const dayEnd = new Date(2026, 3, 16, 0, 0, 0);
    vi.setSystemTime(now);

    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      lt: vi.fn(),
      gt: vi.fn(),
      order: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.lt.mockReturnValue(query);
    query.gt.mockReturnValue(query);
    query.order.mockResolvedValue({
      data: [
        {
          id: "focus-crossing-midnight",
          mode: "focus",
          started_at: new Date(2026, 3, 14, 23, 30).toISOString(),
          finished_at: new Date(2026, 3, 15, 1, 0).toISOString(),
        },
        {
          id: "midday-break",
          mode: "break",
          started_at: new Date(2026, 3, 15, 12, 0).toISOString(),
          finished_at: new Date(2026, 3, 15, 12, 30).toISOString(),
        },
        {
          id: "break-crossing-next-midnight",
          mode: "break",
          started_at: new Date(2026, 3, 15, 23, 0).toISOString(),
          finished_at: new Date(2026, 3, 16, 0, 30).toISOString(),
        },
      ],
      error: null,
    });
    getSupabaseClientMock.mockResolvedValue({ from: vi.fn(() => query) });

    renderWithProviders(<TimerBlock />, {
      auth: { user: { id: "user-1" } as never },
    });

    await act(async () => {
      await vi.runAllTicks();
    });

    const segments = screen.getAllByTestId("timeline-session-segment");
    const focusSegment = segments.find(
      (segment) => segment.dataset.mode === "focus",
    );
    expect(segments).toHaveLength(1);
    expect(focusSegment).toHaveAttribute("aria-label", "Focus session");
    expect(parseFloat(focusSegment?.style.left ?? "NaN")).toBeCloseTo(0);
    expect(parseFloat(focusSegment?.style.width ?? "NaN")).toBeCloseTo(
      100 / 24,
    );
    expect(
      segments.some((segment) => segment.dataset.mode === "break"),
    ).toBe(false);
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.lt).toHaveBeenCalledWith("started_at", dayEnd.toISOString());
    expect(query.gt).toHaveBeenCalledWith("finished_at", dayStart.toISOString());
  });

  it("grows the active run, freezes it on pause, and starts a new segment on resume", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));

    renderWithProviders(<TimerBlock />, {
      auth: { user: { id: "user-1" } as never },
    });

    await act(async () => {
      await vi.runAllTicks();
    });

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    let segments = screen.getAllByTestId("timeline-session-segment");
    expect(segments).toHaveLength(1);
    expect(segments[0]).toHaveAttribute("data-active", "true");
    expect(segments[0].style.minWidth).toBe("4px");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    segments = screen.getAllByTestId("timeline-session-segment");
    expect(parseFloat(segments[0].style.width)).toBeCloseTo(100 / 1440);

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));

    segments = screen.getAllByTestId("timeline-session-segment");
    expect(segments).toHaveLength(1);
    expect(segments[0]).toHaveAttribute("data-active", "false");
    expect(segments[0].style.minWidth).toBe("");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    segments = screen.getAllByTestId("timeline-session-segment");
    expect(segments).toHaveLength(2);
    expect(
      segments.filter((segment) => segment.dataset.active === "true"),
    ).toHaveLength(1);
  });

  it("renders as a static information group without a legend", () => {
    renderWithProviders(<TimerBlock />);
    const timeline = screen.getByRole("group", {
      name: "Today's focus session timeline",
    });

    expect(timeline).not.toHaveAttribute("tabindex");
    expect(timeline).not.toHaveAttribute("aria-expanded");
    expect(timeline).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("pulses the current-time marker during a running break without drawing a break segment", async () => {
    vi.useFakeTimers();
    const now = new Date(2026, 3, 15, 10, 0, 0);
    vi.setSystemTime(now);
    localStorage.setItem(
      "pomodoro-timer-state",
      JSON.stringify({
        mode: "break",
        status: "running",
        timeLeft: 300,
        targetTimestamp: now.getTime() + 300_000,
        sessionStartedAt: now.toISOString(),
        accumulatedSeconds: 0,
      }),
    );

    renderWithProviders(<TimerBlock />, {
      auth: { user: { id: "user-1" } as never },
    });

    await act(async () => {
      await vi.runAllTicks();
    });

    expect(
      screen.getByRole("group", {
        name: "Today's focus session timeline",
      }),
    ).toHaveAttribute("data-running", "true");
    expect(screen.getByTestId("timeline-now-marker")).toBeInTheDocument();
    expect(screen.queryByTestId("timeline-session-segment")).toBeNull();
  });

  it("exposes the active skin and running state on the timeline", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));

    renderWithProviders(<TimerBlock />, {
      auth: { user: { id: "user-1" } as never },
    });

    await act(async () => {
      await vi.runAllTicks();
    });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    const timeline = screen.getByRole("group", {
      name: "Today's focus session timeline",
    });
    expect(timeline).toHaveAttribute("data-skin", "warm");
    expect(timeline).toHaveAttribute("data-running", "true");
    expect(screen.getByTestId("timeline-session-segment")).toHaveAttribute(
      "data-active",
      "true",
    );

    act(() => {
      useSkinStore.getState().setActiveSkinId("viking");
    });
    expect(timeline).toHaveAttribute("data-skin", "viking");

    act(() => {
      useSkinStore.getState().setActiveSkinId("neumorphism");
    });
    expect(timeline).toHaveAttribute("data-skin", "neumorphism");
  });

  it("clamps the time label and refreshes authenticated history at local-day rollover", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 23, 59, 59));

    renderWithProviders(<TimerBlock />, {
      auth: { user: { id: "user-1" } as never },
    });
    await act(async () => {
      await vi.runAllTicks();
    });

    expect(screen.getByText("23:59")).toHaveAttribute("data-edge", "end");
    expect(getSupabaseClientMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(2_000);
      await vi.runAllTicks();
    });

    expect(screen.getByText("00:00")).toHaveAttribute("data-edge", "start");
    expect(getSupabaseClientMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("aligns civil-hour divisions with session geometry on a local DST day", async () => {
    const year = new Date().getFullYear();
    let dstDay: Date | null = null;

    for (let dayOffset = 0; dayOffset < 730; dayOffset += 1) {
      const candidate = new Date(year, 0, 1 + dayOffset);
      const nextDay = new Date(
        candidate.getFullYear(),
        candidate.getMonth(),
        candidate.getDate() + 1,
      );

      if (nextDay.getTime() - candidate.getTime() !== 86_400_000) {
        dstDay = candidate;
        break;
      }
    }

    if (!dstDay) {
      return;
    }

    vi.useFakeTimers();
    const sixOClock = new Date(
      dstDay.getFullYear(),
      dstDay.getMonth(),
      dstDay.getDate(),
      6,
    );
    vi.setSystemTime(sixOClock);
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      lt: vi.fn(),
      gt: vi.fn(),
      order: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.lt.mockReturnValue(query);
    query.gt.mockReturnValue(query);
    query.order.mockResolvedValue({
      data: [
        {
          id: "six-am-focus",
          mode: "focus",
          started_at: sixOClock.toISOString(),
          finished_at: new Date(sixOClock.getTime() + 30 * 60_000).toISOString(),
        },
      ],
      error: null,
    });
    getSupabaseClientMock.mockResolvedValue({ from: vi.fn(() => query) });

    renderWithProviders(<TimerBlock />, {
      auth: { user: { id: "user-1" } as never },
    });
    await act(async () => {
      await vi.runAllTicks();
    });

    const sixHourLabel = screen
      .getAllByTestId("timeline-hour-label")
      .find((label) => label.textContent === "06");
    const segment = screen.getByTestId("timeline-session-segment");
    expect(parseFloat(segment.style.left)).toBeCloseTo(
      parseFloat(sixHourLabel?.style.left ?? "NaN"),
    );
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
      "/assets/red_lava_theme/audio/Warm_theme_background_music_loop.ogg",
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
      "/assets/red_lava_theme/audio/Warm_theme_background_music_loop.ogg",
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
      "/assets/Viking Theme/Sound effects/Storm, Wind, Winter Background Viking Theme Loop.ogg",
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
      "/assets/Viking Theme/Sound effects/Storm, Wind, Winter Background Viking Theme Loop.ogg",
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

  it("shows legal links and hides account deletion for guests", async () => {
    act(() => {
      useUIStore.getState().setSettingsModalOpen(true);
    });

    renderWithProviders(<TimerBlock />);

    expect(await screen.findByText("App info")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(screen.getByRole("link", { name: "Support on Ko-fi" })).toHaveAttribute(
      "href",
      "https://ko-fi.com/forgetimerdev",
    );
    expect(
      screen.queryByRole("link", { name: "Request account deletion" }),
    ).not.toBeInTheDocument();
  });

  it("shows signed-in users account deletion request options", async () => {
    act(() => {
      useUIStore.getState().setSettingsModalOpen(true);
    });

    renderWithProviders(<TimerBlock />, {
      auth: {
        user: {
          id: "user-1",
          email: "hero@example.com",
        } as never,
      },
    });

    const deletionButton = await screen.findByRole("button", {
      name: "Request account deletion",
    });

    expect(
      screen.getByText(/send a deletion request from the email linked/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", {
        name: "Account deletion email details",
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(deletionButton);

    expect(
      screen.getByRole("region", {
        name: "Account deletion email details",
      }),
    ).toBeInTheDocument();
    const emailAppLink = screen.getByRole("link", { name: "Open email app" });
    expect(emailAppLink).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:stefantapu@gmail.com?"),
    );
    expect(emailAppLink).toHaveAttribute(
      "href",
      expect.stringContaining("subject=ForgeTimer+account+deletion+request"),
    );
    expect(
      screen.getByLabelText("Account deletion request message"),
    ).toHaveValue(
      "Please delete my ForgeTimer account and saved app data. I am sending this request from the email linked to my account.",
    );
  });

  it("copies account deletion request details when clipboard is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    act(() => {
      useUIStore.getState().setSettingsModalOpen(true);
    });

    renderWithProviders(<TimerBlock />, {
      auth: {
        user: {
          id: "user-1",
          email: "hero@example.com",
        } as never,
      },
    });

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Request account deletion",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy request details" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("Subject: ForgeTimer account deletion request"),
      );
    });
    expect(await screen.findByText("Request details copied.")).toBeInTheDocument();
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
