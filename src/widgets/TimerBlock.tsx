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
import { TimerCard } from "./TimerCard";
import { TopControls } from "./TopControls";

const STATE_STORAGE_KEY = "pomodoro-timer-state";
const SETTINGS_STORAGE_KEY = "pomodoro-timer-settings";
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 90;

function minutesToSeconds(minutes: number) {
  return minutes * 60;
}

function secondsToMinutes(seconds: number) {
  return Math.floor(seconds / 60);
}

function parseValidMinutes(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (
    Number.isNaN(parsed) ||
    parsed < MIN_DURATION_MINUTES ||
    parsed > MAX_DURATION_MINUTES
  ) {
    return null;
  }

  return parsed;
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
  const [soundEnabled, setSoundEnabled] = useState(true);
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

  const handleApplyDuration = useCallback(
    (field: Mode) => {
      if (activeEditedField !== field) {
        return;
      }

      const draftMinutes =
        field === "focus" ? focusDraftMinutes : breakDraftMinutes;
      const parsedMinutes = parseValidMinutes(draftMinutes);

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
      <TopControls
        mode={mode}
        focusLastValidMinutes={focusLastValidMinutes}
        breakLastValidMinutes={breakLastValidMinutes}
        focusDraftMinutes={focusDraftMinutes}
        breakDraftMinutes={breakDraftMinutes}
        activeEditedField={activeEditedField}
        onSelectMode={switchMode}
        onStartEditField={handleStartEditField}
        onDraftChange={handleDraftChange}
        onApplyDuration={handleApplyDuration}
        onCancelEdit={handleCancelEdit}
      />
      <TimerCard
        mode={mode}
        status={status}
        timeLeft={timeLeft}
        targetTimestamp={targetTimestamp}
      />
      <ActionButtons
        status={status}
        autoFocus={autoFocus}
        autoBreak={autoBreak}
        soundEnabled={soundEnabled}
        onPrimaryAction={status === "running" ? pause : start}
        onReset={reset}
        onToggleAutoFocus={handleToggleAutoFocus}
        onToggleAutoBreak={handleToggleAutoBreak}
        onToggleSound={handleToggleSound}
      />
    </div>
  );
}
