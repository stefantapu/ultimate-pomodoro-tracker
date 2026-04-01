import { useAlarm } from "@shared/hooks/useAlarm";
import { usePomodoroTimer } from "@shared/hooks/usePomodoroTimer";
import { useSettingsSync } from "@shared/hooks/useSettingsSync";
import { readTimerSettings, writeTimerSettings } from "@shared/lib/timerStorage";
import type { TimerSettings } from "@shared/lib/timerTypes";
import { useEffect, useRef, useState } from "react";
import { useUIStore } from "@shared/stores/uiStore";
import { ActionButtons } from "./ActionButtons";
import { TimerCard } from "./TimerCard";
import { TopControls } from "./TopControls";

const STATE_STORAGE_KEY = "pomodoro-timer-state";
const SETTINGS_STORAGE_KEY = "pomodoro-timer-settings";

export function TimerBlock() {
  const { play } = useAlarm();
  const [breakTime, setBreakTime] = useState<number>(
    () => readTimerSettings(SETTINGS_STORAGE_KEY).breakDuration,
  );
  const [focusTime, setFocusTime] = useState<number>(
    () => readTimerSettings(SETTINGS_STORAGE_KEY).focusDuration,
  );
  const [autoBreak, setAutoBreak] = useState<boolean>(
    () => readTimerSettings(SETTINGS_STORAGE_KEY).autoBreak,
  );
  const [autoFocus, setAutoFocus] = useState<boolean>(
    () => readTimerSettings(SETTINGS_STORAGE_KEY).autoFocus,
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hasLoadedFromServer = useRef(false);

  const settings: TimerSettings = {
    focusDuration: focusTime,
    breakDuration: breakTime,
    autoBreak,
    autoFocus,
  };

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
    stateStorageKey: STATE_STORAGE_KEY,
    onSessionComplete: soundEnabled ? play : undefined,
  });

  const resetTimerTrigger = useUIStore((state) => state.resetTimerTrigger);

  useEffect(() => {
    if (resetTimerTrigger > 0) {
      hardReset();
    }
  }, [hardReset, resetTimerTrigger]);

  useEffect(() => {
    const updatedSettings: TimerSettings = {
      focusDuration: focusTime,
      breakDuration: breakTime,
      autoBreak,
      autoFocus,
    };

    writeTimerSettings(SETTINGS_STORAGE_KEY, updatedSettings);

    if (hasLoadedFromServer.current) {
      pushSettingsToCloud(updatedSettings);
    }
  }, [autoBreak, autoFocus, breakTime, focusTime, pushSettingsToCloud]);

  return (
    <div className="timer-block">
      <TopControls
        mode={mode}
        focusDuration={focusTime}
        breakDuration={breakTime}
        onSelectMode={switchMode}
      />
      <TimerCard
        mode={mode}
        status={status}
        timeLabel={`${displayMinutes}:${displaySeconds}`}
      />
      <ActionButtons
        status={status}
        autoFocus={autoFocus}
        autoBreak={autoBreak}
        soundEnabled={soundEnabled}
        onPrimaryAction={status === "running" ? pause : start}
        onReset={reset}
        onToggleAutoFocus={() => {
          hasLoadedFromServer.current = true;
          setAutoFocus((previous) => !previous);
        }}
        onToggleAutoBreak={() => {
          hasLoadedFromServer.current = true;
          setAutoBreak((previous) => !previous);
        }}
        onToggleSound={() => setSoundEnabled((previous) => !previous)}
      />
    </div>
  );
}

