import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextType } from "@app/providers/auth-context";
import { flushPromises } from "../../test/testUtils";
import { useSettingsSync } from "./useSettingsSync";

const { getSupabaseClientMock, showToastMock } = vi.hoisted(() => ({
  getSupabaseClientMock: vi.fn(),
  showToastMock: vi.fn(),
}));

vi.mock("../../../utils/supabase", () => ({
  getSupabaseClient: getSupabaseClientMock,
}));

vi.mock("../stores/uiStore", async () => {
  const actual = await vi.importActual<typeof import("../stores/uiStore")>(
    "../stores/uiStore",
  );

  return {
    ...actual,
    showToast: showToastMock,
  };
});

function wrapperFactory(auth: AuthContextType) {
  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
  );
}

function createProfilesClient({
  data,
  error = null,
  updateError = null,
}: {
  data: Record<string, unknown> | null;
  error?: unknown;
  updateError?: unknown;
}) {
  const updateEqMock = vi.fn().mockResolvedValue({ error: updateError });
  const updateMock = vi.fn(() => ({
    eq: updateEqMock,
  }));
  const singleMock = vi.fn().mockResolvedValue({ data, error });
  const eqMock = vi.fn(() => ({
    single: singleMock,
  }));
  const selectMock = vi.fn(() => ({
    eq: eqMock,
  }));

  return {
    client: {
      from: vi.fn(() => ({
        select: selectMock,
        update: updateMock,
      })),
    },
    updateMock,
    updateEqMock,
  };
}

const baseSettings = {
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
};

describe("useSettingsSync", () => {
  beforeEach(() => {
    getSupabaseClientMock.mockReset();
    showToastMock.mockReset();
    vi.useFakeTimers();
  });

  it("hydrates settings from the cloud profile", async () => {
    const onSettingsFetched = vi.fn();
    const { client, updateMock } = createProfilesClient({
      data: {
        focus_duration: 1800,
        break_duration: 420,
        auto_break: true,
        auto_focus: false,
        alarm_enabled: false,
        alarm_volume: 0.7,
        ui_sounds_enabled: true,
        ui_volume: 0.4,
        focus_ambience_enabled: true,
        focus_ambience_volume: 0.3,
      },
    });

    getSupabaseClientMock.mockResolvedValue(client);

    renderHook(
      () => useSettingsSync(baseSettings, onSettingsFetched),
      {
        wrapper: wrapperFactory({
          user: { id: "user-1" } as AuthContextType["user"],
          session: null,
          loading: false,
        }),
      },
    );

    await act(async () => {
      await flushPromises();
    });

    expect(onSettingsFetched).toHaveBeenCalledWith({
      focusDuration: 1800,
      breakDuration: 420,
      autoBreak: true,
      autoFocus: false,
      alarmEnabled: false,
      alarmVolume: 0.7,
      uiSoundsEnabled: true,
      uiVolume: 0.4,
      focusAmbienceEnabled: true,
      focusAmbienceVolume: 0.3,
    });

    expect(updateMock).not.toHaveBeenCalled();
  });

  it("pushes current settings when the profile row has no durations yet", async () => {
    const { client, updateEqMock } = createProfilesClient({
      data: {
        focus_duration: null,
        break_duration: null,
      },
    });

    getSupabaseClientMock.mockResolvedValue(client);

    renderHook(
      () => useSettingsSync(baseSettings, vi.fn()),
      {
        wrapper: wrapperFactory({
          user: { id: "user-1" } as AuthContextType["user"],
          session: null,
          loading: false,
        }),
      },
    );

    await act(async () => {
      await flushPromises();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await act(async () => {
      await flushPromises();
    });

    expect(updateEqMock).toHaveBeenCalledWith("id", "user-1");
    expect(showToastMock).not.toHaveBeenCalled();
  });

  it("debounces writes and shows a toast only for non-silent syncs", async () => {
    const { client, updateEqMock } = createProfilesClient({
      data: {
        focus_duration: 1500,
        break_duration: 300,
        auto_break: false,
        auto_focus: false,
        alarm_enabled: true,
        alarm_volume: 1,
        ui_sounds_enabled: true,
        ui_volume: 0.5,
        focus_ambience_enabled: false,
        focus_ambience_volume: 0.2,
      },
    });

    getSupabaseClientMock.mockResolvedValue(client);

    const { result } = renderHook(
      () => useSettingsSync(baseSettings, vi.fn()),
      {
        wrapper: wrapperFactory({
          user: { id: "user-1" } as AuthContextType["user"],
          session: null,
          loading: false,
        }),
      },
    );

    await act(async () => {
      await flushPromises();
    });

    act(() => {
      result.current.pushSettingsToCloud({
        ...baseSettings,
        focusDuration: 1800,
      });
      result.current.pushSettingsToCloud({
        ...baseSettings,
        focusDuration: 2100,
      });
      vi.advanceTimersByTime(999);
    });

    expect(updateEqMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    await act(async () => {
      await flushPromises();
    });

    expect(updateEqMock).toHaveBeenCalledWith("id", "user-1");
    expect(showToastMock).toHaveBeenCalledWith("Settings synced to cloud", {
      duration: 2200,
    });
  });
});
