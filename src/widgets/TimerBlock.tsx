import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAlarm } from "@shared/hooks/useAlarm";
import { usePomodoroTimer } from "@shared/hooks/usePomodoroTimer";
import { useSettingsSync } from "@shared/hooks/useSettingsSync";
import {
  readTimerSettings,
  writeTimerSettings,
} from "@shared/lib/timerStorage";
import type { TimerSettings } from "@shared/lib/timerTypes";
import { useUIStore } from "@shared/stores/uiStore";
import styles from "./TimerBlock.module.css";

export function TimerBlock() {
  const stateStorageKey = "pomodoro-timer-state";
  const settingsStorageKey = "pomodoro-timer-settings";
  const { play } = useAlarm();

  const [breakTime, setBreakTime] = useState<number>(
    () => readTimerSettings(settingsStorageKey).breakDuration,
  );
  const [focusTime, setFocusTime] = useState<number>(
    () => readTimerSettings(settingsStorageKey).focusDuration,
  );
  const [autoBreak, setAutoBreak] = useState<boolean>(
    () => readTimerSettings(settingsStorageKey).autoBreak,
  );
  const [autoFocus, setAutoFocus] = useState<boolean>(
    () => readTimerSettings(settingsStorageKey).autoFocus,
  );

  const settings = {
    focusDuration: focusTime,
    breakDuration: breakTime,
    autoBreak,
    autoFocus,
  };

  const hasLoadedFromServer = useRef(false);

  const { pushSettingsToCloud } = useSettingsSync(
    settings,
    (cloudSettings: TimerSettings) => {
      setFocusTime(cloudSettings.focusDuration);
      setBreakTime(cloudSettings.breakDuration);
      setAutoBreak(cloudSettings.autoBreak);
      setAutoFocus(cloudSettings.autoFocus);
      hasLoadedFromServer.current = true;
    },
  );

  const {
    mode,
    displayMinutes,
    displaySeconds,
    status,
    start,
    pause,
    reset,
    hardReset,
    switchMode,
  } = usePomodoroTimer({
    settings,
    stateStorageKey,
    onSessionComplete: play,
  });

  const handleSelectFocusTime = (event: ChangeEvent<HTMLSelectElement>) => {
    hasLoadedFromServer.current = true;
    setFocusTime(Number(event.target.value));
  };

  const handleSelectBreakTime = (event: ChangeEvent<HTMLSelectElement>) => {
    hasLoadedFromServer.current = true;
    setBreakTime(Number(event.target.value));
  };

  const resetTimerTrigger = useUIStore((state) => state.resetTimerTrigger);

  useEffect(() => {
    if (resetTimerTrigger > 0) {
      hardReset();
    }
  }, [resetTimerTrigger, hardReset]);

  useEffect(() => {
    const updatedSettings = {
      focusDuration: focusTime,
      breakDuration: breakTime,
      autoBreak,
      autoFocus,
    };

    writeTimerSettings(settingsStorageKey, updatedSettings);

    if (hasLoadedFromServer.current) {
      pushSettingsToCloud(updatedSettings);
    }
  }, [
    settingsStorageKey,
    focusTime,
    breakTime,
    autoBreak,
    autoFocus,
    pushSettingsToCloud,
  ]);

  const isRunning = status === "running";

  return (
    <section
      className={`${styles.card} ${isRunning ? styles.statusRunning : ""}`}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Timer</h1>
        </div>
      </div>

      <div className={styles.modeToggle}>
        <button
          type="button"
          className={`${styles.button} ${mode === "focus" ? styles.buttonPrimary : ""}`}
          onClick={() => switchMode("focus")}
        >
          Focus Mode
        </button>
        <button
          type="button"
          className={`${styles.button} ${mode === "break" ? styles.buttonPrimary : ""}`}
          onClick={() => switchMode("break")}
        >
          Break Mode
        </button>
      </div>

      <div className={styles.timerFace}>
        <h2 className={styles.timeValue}>
          {displayMinutes} : {displaySeconds}
        </h2>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={isRunning ? pause : start}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button type="button" className={styles.button} onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <div className={styles.settingsGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="TimerRangesFocus">
            Focus Length
          </label>
          <select
            className={styles.select}
            name="TimerRangesFocus"
            id="TimerRangesFocus"
            value={focusTime}
            onChange={handleSelectFocusTime}
          >
            <option value="2">2 seconds</option>
            <option value="60">1 minute</option>
            <option value="600">10 minutes</option>
            <option value="1500">25 minutes</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="TimerRangesBreak">
            Break Length
          </label>
          <select
            className={styles.select}
            name="TimerRangesBreak"
            id="TimerRangesBreak"
            value={breakTime}
            onChange={handleSelectBreakTime}
          >
            <option value="2">2 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
            <option value="600">10 minutes</option>
          </select>
        </div>
      </div>

      <div className={styles.toggleGroup}>
        <label className={styles.toggleRow} htmlFor="auto-switch-checkbox-b">
          <span className={styles.toggleText}>Start break automatically</span>
          <input
            className={styles.checkbox}
            type="checkbox"
            id="auto-switch-checkbox-b"
            checked={autoBreak}
            onChange={() => setAutoBreak((prev) => !prev)}
          />
        </label>

        <label className={styles.toggleRow} htmlFor="auto-switch-checkbox-f">
          <span className={styles.toggleText}>Start focus automatically</span>
          <input
            className={styles.checkbox}
            type="checkbox"
            id="auto-switch-checkbox-f"
            checked={autoFocus}
            onChange={() => setAutoFocus((prev) => !prev)}
          />
        </label>
      </div>
    </section>
  );
}
