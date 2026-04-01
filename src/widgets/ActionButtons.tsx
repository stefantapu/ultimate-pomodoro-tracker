import type { TimerStatus } from "@shared/lib/timerTypes";
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

export function ActionButtons({
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
      <ThemedButton variant="action" onClick={onPrimaryAction}>
        {status === "running" ? "Pause" : "Start"}
      </ThemedButton>
      <ThemedButton variant="action" onClick={onReset}>
        Reset
      </ThemedButton>
      <ThemedButton
        variant="square"
        active={autoFocus}
        onClick={onToggleAutoFocus}
        aria-pressed={autoFocus}
      >
        <span>Auto</span>
        <span>Focus</span>
      </ThemedButton>
      <ThemedButton
        variant="square"
        active={autoBreak}
        onClick={onToggleAutoBreak}
        aria-pressed={autoBreak}
      >
        <span>Auto</span>
        <span>Break</span>
      </ThemedButton>
      <ThemedButton
        variant="square"
        active={soundEnabled}
        onClick={onToggleSound}
        aria-pressed={soundEnabled}
      >
        <span>Sound</span>
      </ThemedButton>
    </div>
  );
}

