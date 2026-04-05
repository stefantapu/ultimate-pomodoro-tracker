import type { Mode } from "@shared/lib/timerTypes";
import { memo } from "react";
import { ThemedButton } from "./ThemedButton";

type TopControlsProps = {
  mode: Mode;
  onSelectMode: (mode: Mode) => void;
};

export const TopControls = memo(function TopControls({
  mode,
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
        active={mode === "break"}
        onClick={() => onSelectMode("break")}
      >
        Break
      </ThemedButton>
    </div>
  );
});
