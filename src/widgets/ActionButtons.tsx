import type { TimerStatus } from "@shared/lib/timerTypes";
import { memo } from "react";
import { ThemedButton } from "./ThemedButton";

type ActionButtonsProps = {
  status: TimerStatus;
  autoFocus: boolean;
  autoBreak: boolean;
  soundEnabled: boolean;
  onPrimaryAction: () => void;
  onReset: () => void;
  onToggleAutoFocus: () => void;
  onToggleAutoBreak: () => void;
  onToggleSound: () => void;
};

export const ActionButtons = memo(function ActionButtons({
  status,
  autoFocus,
  autoBreak,
  soundEnabled,
  onPrimaryAction,
  onReset,
  onToggleAutoFocus,
  onToggleAutoBreak,
  onToggleSound,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <ThemedButton
        variant="action"
        className="action-buttons__button--start"
        onClick={onPrimaryAction}
      >
        {status === "running" ? "Pause" : "Start"}
      </ThemedButton>
      <ThemedButton
        variant="action"
        className="action-buttons__button--reset"
        onClick={onReset}
      >
        Reset
      </ThemedButton>
      <ThemedButton
        variant="square"
        className="action-buttons__button--auto-focus"
        active={autoFocus}
        onClick={onToggleAutoFocus}
        aria-pressed={autoFocus}
      >
        <span>Auto</span>
        <span>Focus</span>
      </ThemedButton>
      <ThemedButton
        variant="square"
        className="action-buttons__button--auto-break"
        active={autoBreak}
        onClick={onToggleAutoBreak}
        aria-pressed={autoBreak}
      >
        <span>Auto</span>
        <span>Break</span>
      </ThemedButton>
      <ThemedButton
        variant="square"
        className="action-buttons__button--sound"
        active={soundEnabled}
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
      >
        <span>Sound</span>
      </ThemedButton>
    </div>
  );
});
