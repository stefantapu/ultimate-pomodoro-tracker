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
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useSyncSession } from "./useSyncSession";

type UsePomodoroTimerParams = {
  settings: TimerSettings;
  stateStorageKey: string;
  onSessionComplete?: () => void;
};

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
  const { syncSession } = useSyncSession();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const checkAndSyncSession = useCallback(
    (status: "completed" | "interrupted", finalAccumulatedSeconds?: number) => {
      const currentState = stateRef.current;
      const duration =
        currentState.mode === "focus" ? focusDuration : breakDuration;

      const accumulated = finalAccumulatedSeconds ?? currentState.accumulatedSeconds;

      if (
        currentState.sessionStartedAt &&
        accumulated >= 10
      ) {
        syncSession({
          mode: currentState.mode,
          status,
          duration_seconds: duration,
          accumulated_seconds: accumulated,
          started_at: currentState.sessionStartedAt,
          finished_at: new Date().toISOString(),
        });
      }
    },
    [breakDuration, focusDuration, syncSession],
  );

  const getFinalAccumulatedSeconds = useCallback((currentState: TimerState) => {
    let finalAccum = currentState.accumulatedSeconds;
    if (currentState.status === "running" && currentState.targetTimestamp) {
      const remaining = Math.max(
        0,
        Math.round((currentState.targetTimestamp - Date.now()) / 1000)
      );
      finalAccum += Math.max(0, currentState.timeLeft - remaining);
    }
    return finalAccum;
  }, []);

  const handleSessionFinish = useCallback(() => {
    const currentState = stateRef.current;
    const completedMode = currentState.mode;
    const finalAccum = getFinalAccumulatedSeconds(currentState);
    
    const nextMode =
      completedMode === "focus" && autoBreak
        ? "break"
        : completedMode === "break" && autoFocus
          ? "focus"
          : null;

    onSessionComplete?.();
    checkAndSyncSession("completed", finalAccum);

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
  }, [autoBreak, autoFocus, breakDuration, focusDuration, onSessionComplete, checkAndSyncSession, getFinalAccumulatedSeconds]);

  const start = useCallback(() => {
    const currentState = stateRef.current;
    const currentDuration =
      currentState.mode === "focus" ? focusDuration : breakDuration;
    const nextTimeLeft =
      currentState.timeLeft > 0 ? currentState.timeLeft : currentDuration;

    if (currentState.status === "running") {
      return;
    }

    dispatch({
      type: "START",
      timeLeft: nextTimeLeft,
      targetTimestamp: Date.now() + nextTimeLeft * 1000,
    });
  }, [breakDuration, focusDuration]);

  const pause = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.status === "running" && currentState.targetTimestamp) {
      const remaining = Math.max(
        0,
        Math.round((currentState.targetTimestamp - Date.now()) / 1000),
      );
      dispatch({ type: "PAUSE", timeLeft: remaining });
    } else {
      dispatch({ type: "PAUSE" });
    }
  }, []);

  const reset = useCallback(() => {
    const currentState = stateRef.current;
    
    const finalAccum = getFinalAccumulatedSeconds(currentState);
    checkAndSyncSession("interrupted", finalAccum);

    dispatch({
      type: "RESET",
      duration:
        currentState.mode === "focus" ? focusDuration : breakDuration,
    });
  }, [breakDuration, focusDuration, checkAndSyncSession, getFinalAccumulatedSeconds]);

  const hardReset = useCallback(() => {
    const currentState = stateRef.current;
    
    // Explicitly avoids checkAndSyncSession to prevent unauthorized errors during logout flow
    dispatch({
      type: "RESET",
      duration:
        currentState.mode === "focus" ? focusDuration : breakDuration,
    });
  }, [breakDuration, focusDuration]);

  const switchMode = useCallback(
    (mode: Mode) => {
      const currentState = stateRef.current;
      const finalAccum = getFinalAccumulatedSeconds(currentState);
      checkAndSyncSession("interrupted", finalAccum);
      dispatch({
        type: "SWITCH_MODE",
        mode,
        duration: mode === "focus" ? focusDuration : breakDuration,
      });
    },
    [breakDuration, focusDuration, checkAndSyncSession, getFinalAccumulatedSeconds],
  );

  useEffect(() => {
    if (state.status !== "running" || !state.targetTimestamp) {
      return;
    }

    const remainingMilliseconds = state.targetTimestamp - Date.now();

    if (remainingMilliseconds <= 0) {
      handleSessionFinish();
      return;
    }

    const timeoutId = window.setTimeout(
      handleSessionFinish,
      remainingMilliseconds,
    );

    return () => {
      window.clearTimeout(timeoutId);
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

    const finalAccum = getFinalAccumulatedSeconds(currentState);
    checkAndSyncSession("interrupted", finalAccum);

    dispatch({
      type: "RESET",
      duration:
        currentState.mode === "focus" ? focusDuration : breakDuration,
    });
  }, [breakDuration, focusDuration, checkAndSyncSession, getFinalAccumulatedSeconds]);

  return {
    mode: state.mode,
    status: state.status,
    timeLeft: state.timeLeft,
    targetTimestamp: state.targetTimestamp,
    start,
    pause,
    reset,
    hardReset,
    switchMode,
  };
}
