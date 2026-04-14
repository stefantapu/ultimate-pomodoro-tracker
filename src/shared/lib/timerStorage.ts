import type {
  Mode,
  TimerSettings,
  TimerState,
  TimerStatus,
  UserSettings,
} from "@shared/lib/timerTypes";

type StoredTimerState = {
  mode?: Mode;
  status?: TimerStatus;
  timeLeft?: number;
  remaining?: number;
  targetTimestamp?: number | null;
  sessionStartedAt?: string | null;
  accumulatedSeconds?: number;
};

export const USER_SETTINGS_STORAGE_KEY = "pomodoro-timer-settings";
export const LEGACY_SOUND_ENABLED_STORAGE_KEY = "pomodoro-sound-enabled";
export const USER_SETTINGS_UPDATED_EVENT = "pomodoro-user-settings-updated";

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  focusDuration: 1500,
  breakDuration: 300,
  autoBreak: false,
  autoFocus: false,
};

export const DEFAULT_AUDIO_SETTINGS = {
  alarmEnabled: true,
  alarmVolume: 1,
  uiSoundsEnabled: true,
  uiVolume: 0.5,
  focusAmbienceEnabled: false,
  focusAmbienceVolume: 0.2,
} satisfies Omit<UserSettings, keyof TimerSettings>;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  ...DEFAULT_TIMER_SETTINGS,
  ...DEFAULT_AUDIO_SETTINGS,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getModeDuration(mode: Mode, settings: TimerSettings) {
  return mode === "focus" ? settings.focusDuration : settings.breakDuration;
}

function isMode(value: unknown): value is Mode {
  return value === "focus" || value === "break";
}

function isTimerStatus(value: unknown): value is TimerStatus {
  return value === "idle" || value === "running" || value === "paused";
}

function hasStoredAudioSettings(parsed: Partial<UserSettings>) {
  return (
    typeof parsed.alarmEnabled === "boolean" ||
    typeof parsed.alarmVolume === "number" ||
    typeof parsed.uiSoundsEnabled === "boolean" ||
    typeof parsed.uiVolume === "number" ||
    typeof parsed.focusAmbienceEnabled === "boolean" ||
    typeof parsed.focusAmbienceVolume === "number"
  );
}

function readLegacyAudioOverrides() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_SOUND_ENABLED_STORAGE_KEY);

    if (raw !== "false") {
      return {};
    }

    return {
      alarmEnabled: false,
      uiSoundsEnabled: false,
      uiVolume: 0,
      focusAmbienceEnabled: false,
    };
  } catch {
    return {};
  }
}

function normalizeUserSettings(
  parsed?: Partial<UserSettings>,
): UserSettings {
  const legacyAudioOverrides =
    parsed && hasStoredAudioSettings(parsed) ? {} : readLegacyAudioOverrides();

  return {
    focusDuration:
      typeof parsed?.focusDuration === "number"
        ? parsed.focusDuration
        : DEFAULT_TIMER_SETTINGS.focusDuration,
    breakDuration:
      typeof parsed?.breakDuration === "number"
        ? parsed.breakDuration
        : DEFAULT_TIMER_SETTINGS.breakDuration,
    autoBreak:
      typeof parsed?.autoBreak === "boolean"
        ? parsed.autoBreak
        : DEFAULT_TIMER_SETTINGS.autoBreak,
    autoFocus:
      typeof parsed?.autoFocus === "boolean"
        ? parsed.autoFocus
        : DEFAULT_TIMER_SETTINGS.autoFocus,
    alarmEnabled:
      typeof parsed?.alarmEnabled === "boolean"
        ? parsed.alarmEnabled
        : legacyAudioOverrides.alarmEnabled ?? DEFAULT_AUDIO_SETTINGS.alarmEnabled,
    alarmVolume:
      typeof parsed?.alarmVolume === "number"
        ? clamp(parsed.alarmVolume, 0, 1)
        : DEFAULT_AUDIO_SETTINGS.alarmVolume,
    uiSoundsEnabled:
      typeof parsed?.uiSoundsEnabled === "boolean"
        ? parsed.uiSoundsEnabled
        : legacyAudioOverrides.uiSoundsEnabled ??
          DEFAULT_AUDIO_SETTINGS.uiSoundsEnabled,
    uiVolume:
      typeof parsed?.uiVolume === "number"
        ? clamp(parsed.uiVolume, 0, 1)
        : legacyAudioOverrides.uiVolume ?? DEFAULT_AUDIO_SETTINGS.uiVolume,
    focusAmbienceEnabled:
      typeof parsed?.focusAmbienceEnabled === "boolean"
        ? parsed.focusAmbienceEnabled
        : legacyAudioOverrides.focusAmbienceEnabled ??
          DEFAULT_AUDIO_SETTINGS.focusAmbienceEnabled,
    focusAmbienceVolume:
      typeof parsed?.focusAmbienceVolume === "number"
        ? clamp(parsed.focusAmbienceVolume, 0, 1)
        : DEFAULT_AUDIO_SETTINGS.focusAmbienceVolume,
  };
}

export function extractTimerSettings(settings: UserSettings): TimerSettings {
  return {
    focusDuration: settings.focusDuration,
    breakDuration: settings.breakDuration,
    autoBreak: settings.autoBreak,
    autoFocus: settings.autoFocus,
  };
}

export function readUserSettings(
  settingsStorageKey = USER_SETTINGS_STORAGE_KEY,
): UserSettings {
  if (typeof window === "undefined") {
    return DEFAULT_USER_SETTINGS;
  }

  const raw = window.localStorage.getItem(settingsStorageKey);

  if (!raw) {
    return normalizeUserSettings();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return normalizeUserSettings(parsed);
  } catch {
    return normalizeUserSettings();
  }
}

export function writeUserSettings(
  settingsStorageKey: string,
  settings: UserSettings,
) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeUserSettings(settings);

  try {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(normalized));
    window.localStorage.removeItem(LEGACY_SOUND_ENABLED_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent<UserSettings>(USER_SETTINGS_UPDATED_EVENT, {
        detail: normalized,
      }),
    );
  } catch {
    // No-op: localStorage can fail in strict browser modes.
  }
}

export function readTimerSettings(
  settingsStorageKey = USER_SETTINGS_STORAGE_KEY,
): TimerSettings {
  return extractTimerSettings(readUserSettings(settingsStorageKey));
}

export function writeTimerSettings(
  settingsStorageKey: string,
  settings: TimerSettings,
) {
  const currentSettings = readUserSettings(settingsStorageKey);
  writeUserSettings(settingsStorageKey, {
    ...currentSettings,
    ...settings,
  });
}

export function readTimerState(
  stateStorageKey: string,
  fallbackSettings: TimerSettings,
): TimerState {
  if (typeof window === "undefined") {
    return {
      mode: "focus",
      status: "idle",
      timeLeft: getModeDuration("focus", fallbackSettings),
      targetTimestamp: null,
      sessionStartedAt: null,
      accumulatedSeconds: 0,
    };
  }

  const raw = window.localStorage.getItem(stateStorageKey);
  const defaultMode: Mode = "focus";

  if (!raw) {
    return {
      mode: defaultMode,
      status: "idle",
      timeLeft: getModeDuration(defaultMode, fallbackSettings),
      targetTimestamp: null,
      sessionStartedAt: null,
      accumulatedSeconds: 0,
    };
  }

  try {
    const parsed = JSON.parse(raw) as StoredTimerState;
    const mode = isMode(parsed.mode) ? parsed.mode : defaultMode;
    const duration = getModeDuration(mode, fallbackSettings);
    const storedTimeLeft =
      typeof parsed.timeLeft === "number"
        ? parsed.timeLeft
        : typeof parsed.remaining === "number"
          ? parsed.remaining
          : duration;
    const status = isTimerStatus(parsed.status) ? parsed.status : "idle";
    const targetTimestamp =
      typeof parsed.targetTimestamp === "number" ? parsed.targetTimestamp : null;
    const sessionStartedAt =
      typeof parsed.sessionStartedAt === "string" ? parsed.sessionStartedAt : null;
    const accumulatedSeconds =
      typeof parsed.accumulatedSeconds === "number"
        ? parsed.accumulatedSeconds
        : 0;

    if (status === "running" && targetTimestamp) {
      const remaining = Math.max(
        0,
        Math.round((targetTimestamp - Date.now()) / 1000),
      );

      return {
        mode,
        status,
        timeLeft: remaining,
        targetTimestamp,
        sessionStartedAt,
        accumulatedSeconds:
          accumulatedSeconds + Math.max(0, storedTimeLeft - remaining),
      };
    }

    return {
      mode,
      status,
      timeLeft: storedTimeLeft,
      targetTimestamp: null,
      sessionStartedAt,
      accumulatedSeconds,
    };
  } catch {
    return {
      mode: defaultMode,
      status: "idle",
      timeLeft: getModeDuration(defaultMode, fallbackSettings),
      targetTimestamp: null,
      sessionStartedAt: null,
      accumulatedSeconds: 0,
    };
  }
}

export function writeTimerState(
  stateStorageKey: string,
  timerState: TimerState,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(stateStorageKey, JSON.stringify(timerState));
}
