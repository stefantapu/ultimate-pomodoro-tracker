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
      };
    case "SWITCH_MODE":
      return {
        mode: action.mode,
        status: "idle",
        timeLeft: action.duration,
        targetTimestamp: null,
      };
    case "TICK":
      return {
        ...state,
        timeLeft: action.timeLeft,
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
        };
      }

      return {
        mode: action.nextMode ?? state.mode,
        status: "idle",
        timeLeft: action.nextDuration ?? state.timeLeft,
        targetTimestamp: null,
      };
    }
    default:
      return state;
  }
}
