import type { Mode } from "@shared/lib/timerTypes";
import { ThemedButton } from "./ThemedButton";

type TopControlsProps = {
  mode: Mode;
  focusDuration: number;
  breakDuration: number;
  onSelectMode: (mode: Mode) => void;
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainder}`;
}

export function TopControls({
  mode,
  focusDuration,
  breakDuration,
  onSelectMode,
}: TopControlsProps) {
  return (
    <div className="top-controls">
      <ThemedButton
        variant="tab"
        active={mode === "focus"}
        onClick={() => onSelectMode("focus")}
      >
        Focus
      </ThemedButton>
      <ThemedButton
        variant="tab"
        active={mode === "focus"}
        onClick={() => onSelectMode("focus")}
      >
        {formatDuration(focusDuration)}
      </ThemedButton>
      <ThemedButton
        variant="tab"
        active={mode === "break"}
        onClick={() => onSelectMode("break")}
      >
        Break
      </ThemedButton>
      <ThemedButton
        variant="tab"
        active={mode === "break"}
        onClick={() => onSelectMode("break")}
      >
        {formatDuration(breakDuration)}
      </ThemedButton>
    </div>
  );
}

