import { useAlarm } from "@shared/hooks/useAlarm";
import { usePomodoroTimer } from "@shared/hooks/usePomodoroTimer";
import {
  readTimerSettings,
  writeTimerSettings,
} from "@shared/lib/timerStorage";
import { useEffect, useState, type ChangeEvent } from "react";

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
    setFocusTime(Number(event.target.value));
  };
  const handleSelectBreakTime = (event: ChangeEvent<HTMLSelectElement>) => {
    setBreakTime(Number(event.target.value));
  };

  useEffect(() => {
    writeTimerSettings(settingsStorageKey, {
      focusDuration: focusTime,
      breakDuration: breakTime,
      autoBreak,
      autoFocus,
    });
  }, [settingsStorageKey, focusTime, breakTime, autoBreak, autoFocus]);

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
