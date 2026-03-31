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
import { useSyncSession } from "./useSyncSession";

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

    if (currentState.status === "running") {
      return;
    }

    dispatch({
      type: "START",
      targetTimestamp: Date.now() + currentState.timeLeft * 1000,
    });
  }, []);

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

    const initialRemaining = Math.max(
      0,
      Math.round((state.targetTimestamp - Date.now()) / 1000),
    );

    if (initialRemaining <= 0) {
      handleSessionFinish();
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

    const finalAccum = getFinalAccumulatedSeconds(currentState);
    checkAndSyncSession("interrupted", finalAccum);

    dispatch({
      type: "RESET",
      duration:
        currentState.mode === "focus" ? focusDuration : breakDuration,
    });
  }, [breakDuration, focusDuration, checkAndSyncSession, getFinalAccumulatedSeconds]);

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
