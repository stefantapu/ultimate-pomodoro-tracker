import { useAlarm } from "@shared/hooks/useAlarm";
import { usePomodoroTimer } from "@shared/hooks/usePomodoroTimer";
import { useSettingsSync } from "@shared/hooks/useSettingsSync";
import {
  readTimerSettings,
  writeTimerSettings,
} from "@shared/lib/timerStorage";
import type { Mode, TimerSettings } from "@shared/lib/timerTypes";
import { useUIStore } from "@shared/stores/uiStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionButtons } from "./ActionButtons";
import { SettingsModal } from "./SettingsModal";
import { TimerCard } from "./TimerCard";
import { TopControls } from "./TopControls";

const STATE_STORAGE_KEY = "pomodoro-timer-state";
const SETTINGS_STORAGE_KEY = "pomodoro-timer-settings";
const SOUND_ENABLED_STORAGE_KEY = "pomodoro-sound-enabled";
const FOCUS_MIN_DURATION_MINUTES = 15;
const FOCUS_MAX_DURATION_MINUTES = 90;
const BREAK_MIN_DURATION_MINUTES = 5;
const BREAK_MAX_DURATION_MINUTES = 30;

function minutesToSeconds(minutes: number) {
  return minutes * 60;
}

function secondsToMinutes(seconds: number) {
  return Math.floor(seconds / 60);
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

export function TimerBlock() {
  const { play } = useAlarm();
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
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    readSoundEnabled(),
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
      setAutoFocus(cloudSettings.autoFocus);
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
  const [pendingDurationResetCount, setPendingDurationResetCount] = useState(0);
  const lastHandledDurationResetRef = useRef(0);

  const resetTimerTrigger = useUIStore((state) => state.resetTimerTrigger);

  const handleToggleAutoFocus = useCallback(() => {
    hasLoadedFromServer.current = true;
    setAutoFocus((previous) => !previous);
  }, []);

  const handleToggleAutoBreak = useCallback(() => {
    hasLoadedFromServer.current = true;
    setAutoBreak((previous) => !previous);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((previous) => !previous);
  }, []);

  const restoreFieldDraftToLastValid = useCallback(
    (field: Mode) => {
      if (field === "focus") {
        setFocusDraftMinutes(focusLastValidMinutes.toString());
        return;
      }

      setBreakDraftMinutes(breakLastValidMinutes.toString());
    },
    [breakLastValidMinutes, focusLastValidMinutes],
  );

  const handleStartEditField = useCallback(
    (field: Mode) => {
      if (activeEditedField && activeEditedField !== field) {
        restoreFieldDraftToLastValid(activeEditedField);
      }

      if (field === "focus") {
        setFocusDraftMinutes(focusLastValidMinutes.toString());
      } else {
        setBreakDraftMinutes(breakLastValidMinutes.toString());
      }

      setActiveEditedField(field);
    },
    [
      activeEditedField,
      breakLastValidMinutes,
      focusLastValidMinutes,
      restoreFieldDraftToLastValid,
    ],
  );

  const handleDraftChange = useCallback((field: Mode, nextDraft: string) => {
    if (field === "focus") {
      setFocusDraftMinutes(nextDraft);
      return;
    }

    setBreakDraftMinutes(nextDraft);
  }, []);

  const handleCancelEdit = useCallback(
    (field: Mode) => {
      restoreFieldDraftToLastValid(field);

      if (activeEditedField === field) {
        setActiveEditedField(null);
      }
    },
    [activeEditedField, restoreFieldDraftToLastValid],
  );

  const handleResetDurationDrafts = useCallback(() => {
    setFocusDraftMinutes(focusLastValidMinutes.toString());
    setBreakDraftMinutes(breakLastValidMinutes.toString());
    setActiveEditedField(null);
  }, [breakLastValidMinutes, focusLastValidMinutes]);

  const handleApplyDuration = useCallback(
    (field: Mode) => {
      if (activeEditedField !== field) {
        return;
      }

      const draftMinutes =
        field === "focus" ? focusDraftMinutes : breakDraftMinutes;
      const parsedMinutes = parseValidMinutes(field, draftMinutes);

      if (parsedMinutes === null) {
        handleCancelEdit(field);
        return;
      }

      const nextDurationSeconds = minutesToSeconds(parsedMinutes);
      const currentDurationSeconds =
        field === "focus" ? focusDurationSeconds : breakDurationSeconds;

      if (nextDurationSeconds === currentDurationSeconds) {
        if (field === "focus") {
          setFocusDraftMinutes(parsedMinutes.toString());
        } else {
          setBreakDraftMinutes(parsedMinutes.toString());
        }

        setActiveEditedField(null);
        return;
      }

      hasLoadedFromServer.current = true;

      if (field === "focus") {
        setFocusDurationSeconds(nextDurationSeconds);
        setFocusLastValidMinutes(parsedMinutes);
        setFocusDraftMinutes(parsedMinutes.toString());
      } else {
        setBreakDurationSeconds(nextDurationSeconds);
        setBreakLastValidMinutes(parsedMinutes);
        setBreakDraftMinutes(parsedMinutes.toString());
      }

      setActiveEditedField(null);
      setPendingDurationResetCount((previous) => previous + 1);
    },
    [
      activeEditedField,
      breakDraftMinutes,
      breakDurationSeconds,
      focusDraftMinutes,
      focusDurationSeconds,
      handleCancelEdit,
    ],
  );

  useEffect(() => {
    if (resetTimerTrigger > 0) {
      hardReset();
    }
  }, [hardReset, resetTimerTrigger]);

  useEffect(() => {
    if (
      pendingDurationResetCount === 0 ||
      pendingDurationResetCount === lastHandledDurationResetRef.current
    ) {
      return;
    }

    lastHandledDurationResetRef.current = pendingDurationResetCount;
    reset();
  }, [pendingDurationResetCount, reset]);

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
      <SettingsModal
        focusDraftMinutes={focusDraftMinutes}
        breakDraftMinutes={breakDraftMinutes}
        activeEditedField={activeEditedField}
        autoFocus={autoFocus}
        autoBreak={autoBreak}
        soundEnabled={soundEnabled}
        onStartEditField={handleStartEditField}
        onDraftChange={handleDraftChange}
        onApplyDuration={handleApplyDuration}
        onCancelEdit={handleCancelEdit}
        onResetDurationDrafts={handleResetDurationDrafts}
        onToggleAutoFocus={handleToggleAutoFocus}
        onToggleAutoBreak={handleToggleAutoBreak}
        onToggleSound={handleToggleSound}
      />
      <TopControls mode={mode} onSelectMode={switchMode} />
      <TimerCard
        mode={mode}
        status={status}
        timeLeft={timeLeft}
        targetTimestamp={targetTimestamp}
      />
      <ActionButtons
        status={status}
        onPrimaryAction={status === "running" ? pause : start}
        onReset={reset}
      />
    </div>
  );
}
