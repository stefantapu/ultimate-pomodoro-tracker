import type { TimerAction, TimerState } from "@shared/lib/timerTypes";

export function timerReducer(
  state: TimerState,
  action: TimerAction,
): TimerState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        status: "running",
        targetTimestamp: action.targetTimestamp,
        sessionStartedAt: state.sessionStartedAt || new Date().toISOString(),
      };
    case "PAUSE":
      return {
        ...state,
        status: "paused",
        targetTimestamp: null,
      };
    case "RESET":
      return {
        mode: action.mode ?? state.mode,
        status: "idle",
        timeLeft: action.duration,
        targetTimestamp: null,
        sessionStartedAt: null,
        accumulatedSeconds: 0,
      };
    case "SWITCH_MODE":
      return {
        mode: action.mode,
        status: "idle",
        timeLeft: action.duration,
        targetTimestamp: null,
        sessionStartedAt: null,
        accumulatedSeconds: 0,
      };
    case "TICK":
      return {
        ...state,
        timeLeft: action.timeLeft,
        accumulatedSeconds: state.accumulatedSeconds + 1,
      };
    case "FINISH": {
      if (
        action.nextMode &&
        action.nextDuration !== undefined &&
        action.nextTargetTimestamp
      ) {
        return {
          mode: action.nextMode,
          status: "running",
          timeLeft: action.nextDuration,
          targetTimestamp: action.nextTargetTimestamp,
          sessionStartedAt: new Date().toISOString(),
          accumulatedSeconds: 0,
        };
      }

      return {
        mode: action.nextMode ?? state.mode,
        status: "idle",
        timeLeft: action.nextDuration ?? state.timeLeft,
        targetTimestamp: null,
        sessionStartedAt: null,
        accumulatedSeconds: 0,
      };
    }
    default:
      return state;
  }
}
