export type Mode = "focus" | "break";

export type TimerStatus = "idle" | "running" | "paused";

export type TimerState = {
  mode: Mode;
  status: TimerStatus;
  timeLeft: number;
  targetTimestamp: number | null;
  sessionStartedAt: string | null;
  accumulatedSeconds: number;
};

export type TimerSettings = {
  focusDuration: number;
  breakDuration: number;
  autoBreak: boolean;
  autoFocus: boolean;
};

export type TimerAction =
  | { type: "START"; targetTimestamp: number; timeLeft?: number }
  | { type: "PAUSE"; timeLeft?: number; checkpoint?: boolean }
  | { type: "RESET"; mode?: Mode; duration: number }
  | { type: "SWITCH_MODE"; mode: Mode; duration: number }
  | { type: "TICK"; timeLeft: number }
  | {
    type: "FINISH";
    nextMode?: Mode;
    nextDuration?: number;
    nextTargetTimestamp?: number;
  };

