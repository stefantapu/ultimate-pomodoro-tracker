import { timerReducer } from "@shared/lib/timerReducer";
import {
  readTimerState,
  writeTimerState,
} from "@shared/lib/timerStorage";
import type {
  Mode,
  TimerSettings,
  TimerState,
} from "@shared/lib/timerTypes";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

type UsePomodoroTimerParams = {
  settings: TimerSettings;
  stateStorageKey: string;
  onSessionComplete?: () => void;
};

function formatTime(seconds: number) {
  return seconds.toString().padStart(2, "0");
}

export function usePomodoroTimer({
  settings,
  stateStorageKey,
  onSessionComplete,
}: UsePomodoroTimerParams) {
  const { focusDuration, breakDuration, autoBreak, autoFocus } = settings;
  const [state, dispatch] = useReducer(
    timerReducer,
    undefined,
    () => readTimerState(stateStorageKey, settings),
  );
  const stateRef = useRef<TimerState>(state);
  const previousDurationsRef = useRef({
    focusDuration: settings.focusDuration,
    breakDuration: settings.breakDuration,
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleSessionFinish = useCallback(() => {
    const currentState = stateRef.current;
    const completedMode = currentState.mode;
    const nextMode =
      completedMode === "focus" && autoBreak
        ? "break"
        : completedMode === "break" && autoFocus
          ? "focus"
          : null;

    onSessionComplete?.();

    if (nextMode) {
      const nextDuration =
        nextMode === "focus" ? focusDuration : breakDuration;

      dispatch({
        type: "FINISH",
        nextMode,
        nextDuration,
        nextTargetTimestamp: Date.now() + nextDuration * 1000,
      });

      return;
    }

    dispatch({
      type: "FINISH",
      nextMode: completedMode,
      nextDuration:
        completedMode === "focus" ? focusDuration : breakDuration,
    });
  }, [autoBreak, autoFocus, breakDuration, focusDuration, onSessionComplete]);

  const start = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState.status === "running") {
      return;
    }

    dispatch({
      type: "START",
      targetTimestamp: Date.now() + currentState.timeLeft * 1000,
    });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: "PAUSE" });
  }, []);

  const reset = useCallback(() => {
    const currentState = stateRef.current;

    dispatch({
      type: "RESET",
      duration:
        currentState.mode === "focus" ? focusDuration : breakDuration,
    });
  }, [breakDuration, focusDuration]);

  const switchMode = useCallback(
    (mode: Mode) => {
      dispatch({
        type: "SWITCH_MODE",
        mode,
        duration: mode === "focus" ? focusDuration : breakDuration,
      });
    },
    [breakDuration, focusDuration],
  );

  useEffect(() => {
    if (state.status !== "running" || !state.targetTimestamp) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.round((state.targetTimestamp! - Date.now()) / 1000),
      );

      if (remaining <= 0) {
        window.clearInterval(intervalId);
        handleSessionFinish();
        return;
      }

      dispatch({ type: "TICK", timeLeft: remaining });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [handleSessionFinish, state.status, state.targetTimestamp]);

  useEffect(() => {
    writeTimerState(stateStorageKey, state);
  }, [state, stateStorageKey]);

  useEffect(() => {
    const previousDurations = previousDurationsRef.current;
    const hasFocusDurationChanged =
      previousDurations.focusDuration !== focusDuration;
    const hasBreakDurationChanged =
      previousDurations.breakDuration !== breakDuration;

    previousDurationsRef.current = {
      focusDuration,
      breakDuration,
    };

    if (
      !hasFocusDurationChanged &&
      !hasBreakDurationChanged
    ) {
      return;
    }

    const currentState = stateRef.current;
    const shouldReset =
      (currentState.mode === "focus" && hasFocusDurationChanged) ||
      (currentState.mode === "break" && hasBreakDurationChanged);

    if (!shouldReset) {
      return;
    }

    dispatch({
      type: "RESET",
      duration:
        currentState.mode === "focus" ? focusDuration : breakDuration,
    });
  }, [breakDuration, focusDuration]);

  const displayMinutes = useMemo(
    () => formatTime(Math.floor(state.timeLeft / 60)),
    [state.timeLeft],
  );
  const displaySeconds = useMemo(
    () => formatTime(state.timeLeft % 60),
    [state.timeLeft],
  );

  return {
    mode: state.mode,
    status: state.status,
    timeLeft: state.timeLeft,
    displayMinutes,
    displaySeconds,
    start,
    pause,
    reset,
    switchMode,
  };
}
