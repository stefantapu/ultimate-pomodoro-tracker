import { useAlarm } from "@shared/hooks/useAlarm";
import { useHandleTimerFinish } from "@shared/hooks/useHandleTimerFinish";
import { useTimer } from "@shared/hooks/useTimer";
import { useEffect, useState, type ChangeEvent } from "react";

export function TimerBlock() {
  const stateStorageKey = "pomodoro-timer-state";
  const settingsStorageKey = "pomodoro-timer-settings";
  const { play } = useAlarm();

  const [mode, setMode] = useState<"focus" | "break">("focus");

  const [breakTime, setBreakTime] = useState<number>(() => {
    const defaultDuration = 600;
    const duration = localStorage.getItem(settingsStorageKey);
    if (!duration) return defaultDuration;
    const parsed = JSON.parse(duration);

    return parsed.breakDuration;
  });
  const [focusTime, setFocusTime] = useState<number>(() => {
    const defaultDuration = 600;
    const duration = localStorage.getItem(settingsStorageKey);
    if (!duration) return defaultDuration;
    const parsed = JSON.parse(duration);

    return parsed.focusDuration;
  });

  const { displayMinutes, displaySeconds, status, start, pause, reset } =
    useTimer({
      mode: mode,
      focusDuration: focusTime,
      breakDuration: breakTime,
      stateStorageKey,
    });

  const handleSelectFocusTime = (event: ChangeEvent<HTMLSelectElement>) => {
    setFocusTime(Number(event.target.value));
    reset();
  };
  const handleSelectBreakTime = (event: ChangeEvent<HTMLSelectElement>) => {
    setBreakTime(Number(event.target.value));
    reset();
  };

  useEffect(() => {
    localStorage.setItem(
      settingsStorageKey,
      JSON.stringify({
        focusDuration: focusTime,
        breakDuration: breakTime,
      }),
    );
  }, [focusTime, breakTime]);

  useHandleTimerFinish({ status, play, reset });

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
            onClick={() => {
              setMode("focus");
              reset();
            }}
          >
            Focus
          </button>
          <button
            style={{ backgroundColor: mode === "break" ? "green" : "" }}
            onClick={() => {
              setMode("break");
              reset();
            }}
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
    </>
  );
}
