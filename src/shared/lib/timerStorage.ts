import type {
  Mode,
  TimerSettings,
  TimerState,
  TimerStatus,
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

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  focusDuration: 1500,
  breakDuration: 300,
  autoBreak: false,
  autoFocus: false,
};

function getModeDuration(mode: Mode, settings: TimerSettings) {
  return mode === "focus" ? settings.focusDuration : settings.breakDuration;
}

function isMode(value: unknown): value is Mode {
  return value === "focus" || value === "break";
}

function isTimerStatus(value: unknown): value is TimerStatus {
  return value === "idle" || value === "running" || value === "paused";
}

export function readTimerSettings(
  settingsStorageKey: string,
): TimerSettings {
  const raw = localStorage.getItem(settingsStorageKey);

  if (!raw) {
    return DEFAULT_TIMER_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TimerSettings>;

    return {
      focusDuration:
        typeof parsed.focusDuration === "number"
          ? parsed.focusDuration
          : DEFAULT_TIMER_SETTINGS.focusDuration,
      breakDuration:
        typeof parsed.breakDuration === "number"
          ? parsed.breakDuration
          : DEFAULT_TIMER_SETTINGS.breakDuration,
      autoBreak:
        typeof parsed.autoBreak === "boolean"
          ? parsed.autoBreak
          : DEFAULT_TIMER_SETTINGS.autoBreak,
      autoFocus:
        typeof parsed.autoFocus === "boolean"
          ? parsed.autoFocus
          : DEFAULT_TIMER_SETTINGS.autoFocus,
    };
  } catch {
    return DEFAULT_TIMER_SETTINGS;
  }
}

export function writeTimerSettings(
  settingsStorageKey: string,
  settings: TimerSettings,
) {
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

export function readTimerState(
  stateStorageKey: string,
  fallbackSettings: TimerSettings,
): TimerState {
  const raw = localStorage.getItem(stateStorageKey);
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
      typeof parsed.accumulatedSeconds === "number" ? parsed.accumulatedSeconds : 0;

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
        accumulatedSeconds: accumulatedSeconds + Math.max(0, storedTimeLeft - remaining),
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
  localStorage.setItem(stateStorageKey, JSON.stringify(timerState));
}

