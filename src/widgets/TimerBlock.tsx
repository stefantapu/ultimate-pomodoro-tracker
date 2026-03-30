import { useAlarm } from "@shared/hooks/useAlarm";
import { usePomodoroTimer } from "@shared/hooks/usePomodoroTimer";
import { useSettingsSync } from "@shared/hooks/useSettingsSync";
import {
  readTimerSettings,
  writeTimerSettings,
} from "@shared/lib/timerStorage";
import type { TimerSettings } from "@shared/lib/timerTypes";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

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

  // Hook handles Auth logic & pulling down cloud data on boot
  const { pushSettingsToCloud } = useSettingsSync(settings, (cloudSettings: TimerSettings) => {
    setFocusTime(cloudSettings.focusDuration);
    setBreakTime(cloudSettings.breakDuration);
    setAutoBreak(cloudSettings.autoBreak);
    setAutoFocus(cloudSettings.autoFocus);
    
    // Safety flag to prevent loop mirroring to DB right after booting.
    hasLoadedFromServer.current = true;
  });

  const {
    mode,
    displayMinutes,
    displaySeconds,
    status,
    start,
    pause,
    reset,
    switchMode,
  } = usePomodoroTimer({
    settings,
    stateStorageKey,
    onSessionComplete: play,
  });

  const handleSelectFocusTime = (event: ChangeEvent<HTMLSelectElement>) => {
    hasLoadedFromServer.current = true; // Manual interaction unlocks push
    setFocusTime(Number(event.target.value));
  };
  const handleSelectBreakTime = (event: ChangeEvent<HTMLSelectElement>) => {
    hasLoadedFromServer.current = true;
    setBreakTime(Number(event.target.value));
  };

  useEffect(() => {
    const updatedSettings = {
      focusDuration: focusTime,
      breakDuration: breakTime,
      autoBreak,
      autoFocus,
    };
    
    // Always map out to local settings for immediate offline backup
    writeTimerSettings(settingsStorageKey, updatedSettings);

    // Only update Supabase if this wasn't an automatic download update.
    if (hasLoadedFromServer.current) {
        pushSettingsToCloud(updatedSettings);
    }
  }, [settingsStorageKey, focusTime, breakTime, autoBreak, autoFocus, pushSettingsToCloud]);

  return (
    <>
      <div
        style={{
          backgroundColor: status === "running" ? "green" : "black",
        }}
      >
        {/* buttons */}
        <div>
          <button
            style={{ backgroundColor: mode === "focus" ? "green" : "" }}
            onClick={() => switchMode("focus")}
          >
            Focus
          </button>
          <button
            style={{ backgroundColor: mode === "break" ? "green" : "" }}
            onClick={() => switchMode("break")}
          >
            Break
          </button>
        </div>
        <div>
          <h1>
            {displayMinutes} : {displaySeconds}
          </h1>
          {status === "running" ? (
            <button onClick={pause}>pause</button>
          ) : (
            <button onClick={start}>start</button>
          )}
          <button onClick={reset}>reset</button>
        </div>
        {/* selectors */}
        <div>
          <div>
            <label htmlFor="TimerRangesFocus">Focus</label>

            <select
              name="TimerRangesFocus"
              id="TimerRangesFocus"
              value={focusTime}
              onChange={handleSelectFocusTime}
            >
              <option value="2">2 seconds</option>
              <option value="60">1 minute</option>
              <option value="600">10 mintes</option>
              <option value="1500">25 minutes</option>
            </select>
          </div>
          <div>
            <label htmlFor="TimerRangesBreak">Break</label>

            <select
              name="TimerRangesBreak"
              id="TimerRangesBreak"
              value={breakTime}
              onChange={handleSelectBreakTime}
            >
              <option value="2">2 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 mintes</option>
              <option value="600">10 minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="auto-switch-checkbox-b">
            Start break automaically
          </label>
          <input
            type="checkbox"
            id="auto-switch-checkbox-b"
            checked={autoBreak}
            onChange={() => setAutoBreak((prev) => !prev)}
          />
        </div>
        <div>
          <label htmlFor="auto-switch-checkbox-f">
            Start focus automaically
          </label>
          <input
            type="checkbox"
            id="auto-switch-checkbox-f"
            checked={autoFocus}
            onChange={() => setAutoFocus((prev) => !prev)}
          />
        </div>
      </div>
    </>
  );
}
