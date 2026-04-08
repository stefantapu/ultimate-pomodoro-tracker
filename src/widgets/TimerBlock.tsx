import { useAlarm } from "@shared/hooks/useAlarm";
import { usePomodoroTimer } from "@shared/hooks/usePomodoroTimer";
import { useSettingsSync } from "@shared/hooks/useSettingsSync";
import {
  readTimerSettings,
  writeTimerSettings,
} from "@shared/lib/timerStorage";
import type { Mode, TimerSettings } from "@shared/lib/timerTypes";
import { useUIStore } from "@shared/stores/uiStore";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActionButtons } from "./ActionButtons";
import { TimerCard } from "./TimerCard";
import { TopControls } from "./TopControls";

const LazySettingsModal = lazy(() =>
  import("./SettingsModal").then((module) => ({
    default: module.SettingsModal,
  })),
);

const STATE_STORAGE_KEY = "pomodoro-timer-state";
const SETTINGS_STORAGE_KEY = "pomodoro-timer-settings";
const SOUND_ENABLED_STORAGE_KEY = "pomodoro-sound-enabled";
const FOCUS_MIN_DURATION_MINUTES = 15;
const FOCUS_MAX_DURATION_MINUTES = 90;
const BREAK_MIN_DURATION_MINUTES = 5;
const BREAK_MAX_DURATION_MINUTES = 30;
const DEFAULT_PAGE_TITLE = "Forge Timer - Pomodoro";

function minutesToSeconds(minutes: number) {
  return minutes * 60;
}

function secondsToMinutes(seconds: number) {
  return Math.floor(seconds / 60);
}

function formatTitleTime(seconds: number) {
  const normalized = Math.max(0, seconds);
  const minutes = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const secondsDisplay = (normalized % 60).toString().padStart(2, "0");
  return `${minutes}:${secondsDisplay}`;
}

function getDurationLimits(field: Mode) {
  if (field === "focus") {
    return {
      min: FOCUS_MIN_DURATION_MINUTES,
      max: FOCUS_MAX_DURATION_MINUTES,
    };
  }

  return {
    min: BREAK_MIN_DURATION_MINUTES,
    max: BREAK_MAX_DURATION_MINUTES,
  };
}

function parseValidMinutes(field: Mode, value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  const { min, max } = getDurationLimits(field);

  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function readSoundEnabled() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const raw = window.localStorage.getItem(SOUND_ENABLED_STORAGE_KEY);

    if (raw === null) {
      return true;
    }

    return raw === "true";
  } catch {
    return true;
  }
}

function SettingsModalFallback() {
  return (
    <div className="settings-modal__overlay">
      <div className="settings-modal">
        <header className="settings-modal__header">
          <h2>Settings</h2>
        </header>
        <section className="settings-modal__section">
          <p className="settings-modal__section-title">Loading settings...</p>
        </section>
      </div>
    </div>
  );
}

export function TimerBlock() {
  const { play } = useAlarm();
  const { play: playStoneClick } = useAlarm("/sounds/stone_click.mp3", 0.5);
  const isSettingsModalOpen = useUIStore((state) => state.isSettingsModalOpen);
  const initialSettings = useMemo(
    () => readTimerSettings(SETTINGS_STORAGE_KEY),
    [],
  );
  const [breakDurationSeconds, setBreakDurationSeconds] = useState<number>(
    () => initialSettings.breakDuration,
  );
  const [focusDurationSeconds, setFocusDurationSeconds] = useState<number>(
    () => initialSettings.focusDuration,
  );
  const [focusLastValidMinutes, setFocusLastValidMinutes] = useState<number>(
    () => secondsToMinutes(initialSettings.focusDuration),
  );
  const [breakLastValidMinutes, setBreakLastValidMinutes] = useState<number>(
    () => secondsToMinutes(initialSettings.breakDuration),
  );
  const [focusDraftMinutes, setFocusDraftMinutes] = useState<string>(() =>
    secondsToMinutes(initialSettings.focusDuration).toString(),
  );
  const [breakDraftMinutes, setBreakDraftMinutes] = useState<string>(() =>
    secondsToMinutes(initialSettings.breakDuration).toString(),
  );
  const [activeEditedField, setActiveEditedField] = useState<Mode | null>(null);
  const [autoBreak, setAutoBreak] = useState<boolean>(
    () => initialSettings.autoBreak,
  );
  const [autoFocus, setAutoFocus] = useState<boolean>(
    () => initialSettings.autoFocus,
  );
  const [autoFocusDraft, setAutoFocusDraft] = useState<boolean>(
    () => initialSettings.autoFocus,
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    readSoundEnabled(),
  );
  const [autoBreakDraft, setAutoBreakDraft] = useState<boolean>(
    () => initialSettings.autoBreak,
  );
  const hasLoadedFromServer = useRef(false);

  const settings = useMemo<TimerSettings>(
    () => ({
      focusDuration: focusDurationSeconds,
      breakDuration: breakDurationSeconds,
      autoBreak,
      autoFocus,
    }),
    [autoBreak, autoFocus, breakDurationSeconds, focusDurationSeconds],
  );

  const { pushSettingsToCloud } = useSettingsSync(
    settings,
    (cloudSettings: TimerSettings) => {
      const nextFocusMinutes = secondsToMinutes(cloudSettings.focusDuration);
      const nextBreakMinutes = secondsToMinutes(cloudSettings.breakDuration);

      setFocusDurationSeconds(cloudSettings.focusDuration);
      setBreakDurationSeconds(cloudSettings.breakDuration);
      setFocusLastValidMinutes(nextFocusMinutes);
      setBreakLastValidMinutes(nextBreakMinutes);
      setFocusDraftMinutes(nextFocusMinutes.toString());
      setBreakDraftMinutes(nextBreakMinutes.toString());
      setActiveEditedField(null);
      setAutoBreak(cloudSettings.autoBreak);
      setAutoBreakDraft(cloudSettings.autoBreak);
      setAutoFocus(cloudSettings.autoFocus);
      setAutoFocusDraft(cloudSettings.autoFocus);
      hasLoadedFromServer.current = true;
    },
  );

  const {
    mode,
    timeLeft,
    targetTimestamp,
    status,
    start,
    pause,
    reset,
    hardReset,
    switchMode,
  } = usePomodoroTimer({
    settings,
    stateStorageKey: STATE_STORAGE_KEY,
    onSessionComplete: soundEnabled ? play : undefined,
  });
  const resetTimerTrigger = useUIStore((state) => state.resetTimerTrigger);

  const focusDraftError = useMemo(() => {
    return parseValidMinutes("focus", focusDraftMinutes) === null
      ? `Enter ${FOCUS_MIN_DURATION_MINUTES}-${FOCUS_MAX_DURATION_MINUTES} minutes.`
      : null;
  }, [focusDraftMinutes]);

  const breakDraftError = useMemo(() => {
    return parseValidMinutes("break", breakDraftMinutes) === null
      ? `Enter ${BREAK_MIN_DURATION_MINUTES}-${BREAK_MAX_DURATION_MINUTES} minutes.`
      : null;
  }, [breakDraftMinutes]);

  const draftFocusDurationSeconds = useMemo(() => {
    const parsedMinutes = parseValidMinutes("focus", focusDraftMinutes);
    return parsedMinutes === null ? null : minutesToSeconds(parsedMinutes);
  }, [focusDraftMinutes]);

  const draftBreakDurationSeconds = useMemo(() => {
    const parsedMinutes = parseValidMinutes("break", breakDraftMinutes);
    return parsedMinutes === null ? null : minutesToSeconds(parsedMinutes);
  }, [breakDraftMinutes]);

  const hasDurationDraftErrors =
    focusDraftError !== null || breakDraftError !== null;
  const hasTimerSettingsDraftChanges =
    draftFocusDurationSeconds !== focusDurationSeconds ||
    draftBreakDurationSeconds !== breakDurationSeconds ||
    autoFocusDraft !== autoFocus ||
    autoBreakDraft !== autoBreak;
  const isTimerSettingsLocked = status === "running";
  const willResetCurrentTimer =
    !isTimerSettingsLocked &&
    !hasDurationDraftErrors &&
    ((mode === "focus" && draftFocusDurationSeconds !== focusDurationSeconds) ||
      (mode === "break" && draftBreakDurationSeconds !== breakDurationSeconds));
  const canSaveTimerSettings =
    !isTimerSettingsLocked &&
    hasTimerSettingsDraftChanges &&
    !hasDurationDraftErrors;

  const handleToggleAutoFocusDraft = useCallback(() => {
    if (isTimerSettingsLocked) {
      return;
    }

    setAutoFocusDraft((previous) => !previous);
  }, [isTimerSettingsLocked]);

  const handleToggleAutoBreakDraft = useCallback(() => {
    if (isTimerSettingsLocked) {
      return;
    }

    setAutoBreakDraft((previous) => !previous);
  }, [isTimerSettingsLocked]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((previous) => !previous);
  }, []);

  const playButtonClick = useCallback(() => {
    if (soundEnabled) {
      playStoneClick();
    }
  }, [playStoneClick, soundEnabled]);

  const handlePrimaryAction = useCallback(() => {
    playButtonClick();

    if (status === "running") {
      pause();
      return;
    }

    start();
  }, [pause, playButtonClick, start, status]);

  const handleResetTimer = useCallback(() => {
    playButtonClick();
    reset();
  }, [playButtonClick, reset]);

  const handleSelectMode = useCallback(
    (nextMode: Mode) => {
      playButtonClick();
      switchMode(nextMode);
    },
    [playButtonClick, switchMode],
  );

  const restoreTimerSettingsDrafts = useCallback(() => {
    setFocusDraftMinutes(focusLastValidMinutes.toString());
    setBreakDraftMinutes(breakLastValidMinutes.toString());
    setAutoFocusDraft(autoFocus);
    setAutoBreakDraft(autoBreak);
    setActiveEditedField(null);
  }, [autoBreak, autoFocus, breakLastValidMinutes, focusLastValidMinutes]);

  const handleStartEditField = useCallback(
    (field: Mode) => {
      if (isTimerSettingsLocked) {
        return;
      }

      setActiveEditedField(field);
    },
    [isTimerSettingsLocked],
  );

  const handleDraftChange = useCallback(
    (field: Mode, nextDraft: string) => {
      if (isTimerSettingsLocked) {
        return;
      }

      if (field === "focus") {
        setFocusDraftMinutes(nextDraft);
        return;
      }

      setBreakDraftMinutes(nextDraft);
    },
    [isTimerSettingsLocked],
  );

  const handleCancelEdit = useCallback(
    (field: Mode) => {
      if (activeEditedField === field) {
        setActiveEditedField(null);
      }
    },
    [activeEditedField],
  );

  const handleCancelTimerSettings = useCallback(() => {
    restoreTimerSettingsDrafts();
  }, [restoreTimerSettingsDrafts]);

  const handleSaveTimerSettings = useCallback(() => {
    if (!canSaveTimerSettings) {
      return;
    }

    const nextFocusDurationSeconds = draftFocusDurationSeconds;
    const nextBreakDurationSeconds = draftBreakDurationSeconds;

    if (
      nextFocusDurationSeconds === null ||
      nextBreakDurationSeconds === null
    ) {
      return;
    }

    const nextFocusMinutes = secondsToMinutes(nextFocusDurationSeconds);
    const nextBreakMinutes = secondsToMinutes(nextBreakDurationSeconds);

    hasLoadedFromServer.current = true;

    setFocusDurationSeconds(nextFocusDurationSeconds);
    setBreakDurationSeconds(nextBreakDurationSeconds);
    setFocusLastValidMinutes(nextFocusMinutes);
    setBreakLastValidMinutes(nextBreakMinutes);
    setFocusDraftMinutes(nextFocusMinutes.toString());
    setBreakDraftMinutes(nextBreakMinutes.toString());
    setAutoFocus(autoFocusDraft);
    setAutoBreak(autoBreakDraft);
    setActiveEditedField(null);
  }, [
    autoBreakDraft,
    autoFocusDraft,
    canSaveTimerSettings,
    draftBreakDurationSeconds,
    draftFocusDurationSeconds,
  ]);

  useEffect(() => {
    if (resetTimerTrigger > 0) {
      hardReset();
    }
  }, [hardReset, resetTimerTrigger]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const computeRemaining = () => {
      if (status !== "running" || !targetTimestamp) {
        return Math.max(0, timeLeft);
      }

      return Math.max(0, Math.round((targetTimestamp - Date.now()) / 1000));
    };

    const updateTitle = () => {
      if (status !== "running") {
        document.title = DEFAULT_PAGE_TITLE;
        return;
      }

      document.title = `${formatTitleTime(computeRemaining())} - Forge Timer`;
    };

    updateTitle();

    if (status !== "running") {
      return;
    }

    const intervalId = window.setInterval(updateTitle, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status, targetTimestamp, timeLeft]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        SOUND_ENABLED_STORAGE_KEY,
        String(soundEnabled),
      );
    } catch {
      // No-op: localStorage can fail in strict browser modes.
    }
  }, [soundEnabled]);

  useEffect(() => {
    const updatedSettings: TimerSettings = {
      focusDuration: focusDurationSeconds,
      breakDuration: breakDurationSeconds,
      autoBreak,
      autoFocus,
    };

    writeTimerSettings(SETTINGS_STORAGE_KEY, updatedSettings);

    if (hasLoadedFromServer.current) {
      pushSettingsToCloud(updatedSettings);
    }
  }, [
    autoBreak,
    autoFocus,
    breakDurationSeconds,
    focusDurationSeconds,
    pushSettingsToCloud,
  ]);

  return (
    <div className="timer-block">
      {isSettingsModalOpen ? (
        <Suspense fallback={<SettingsModalFallback />}>
          <LazySettingsModal
            focusDraftMinutes={focusDraftMinutes}
            breakDraftMinutes={breakDraftMinutes}
            activeEditedField={activeEditedField}
            autoFocusDraft={autoFocusDraft}
            autoBreakDraft={autoBreakDraft}
            soundEnabled={soundEnabled}
            isTimerSettingsLocked={isTimerSettingsLocked}
            focusDraftError={focusDraftError}
            breakDraftError={breakDraftError}
            isTimerSettingsDirty={hasTimerSettingsDraftChanges}
            canSaveTimerSettings={canSaveTimerSettings}
            willResetCurrentTimer={willResetCurrentTimer}
            onStartEditField={handleStartEditField}
            onDraftChange={handleDraftChange}
            onCancelEdit={handleCancelEdit}
            onCancelTimerSettings={handleCancelTimerSettings}
            onSaveTimerSettings={handleSaveTimerSettings}
            onToggleAutoFocus={handleToggleAutoFocusDraft}
            onToggleAutoBreak={handleToggleAutoBreakDraft}
            onToggleSound={handleToggleSound}
          />
        </Suspense>
      ) : null}
      <TopControls mode={mode} onSelectMode={handleSelectMode} />
      <TimerCard
        mode={mode}
        status={status}
        timeLeft={timeLeft}
        targetTimestamp={targetTimestamp}
      />
      <ActionButtons
        status={status}
        onPrimaryAction={handlePrimaryAction}
        onReset={handleResetTimer}
      />
    </div>
  );
}
