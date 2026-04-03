import type { TimerStatus } from "@shared/lib/timerTypes";
import { memo } from "react";
import { ThemedButton } from "./ThemedButton";

type ActionButtonsProps = {
  status: TimerStatus;
  onPrimaryAction: () => void;
  onReset: () => void;
};

export const ActionButtons = memo(function ActionButtons({
  status,
  onPrimaryAction,
  onReset,
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
    </div>
  );
});
