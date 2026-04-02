import type { TimerStatus } from "@shared/lib/timerTypes";
import { useSkinStore } from "@shared/stores/skinStore";
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
  const activeSkinId = useSkinStore((state) => state.activeSkinId);
  const showAutoLabels = activeSkinId !== "warm";

  return (
    <div className="action-buttons">
      <div className="action-buttons__row action-buttons__row--primary">
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

      <div className="action-buttons__row action-buttons__row--secondary">
        <ThemedButton
          variant="square"
          className="action-buttons__button--auto-focus"
          active={autoFocus}
          onClick={onToggleAutoFocus}
          aria-label="Toggle auto focus"
          title="Auto Focus"
          aria-pressed={autoFocus}
        >
          {showAutoLabels ? (
            <>
              <span>Auto</span>
              <span>Focus</span>
            </>
          ) : null}
        </ThemedButton>
        <ThemedButton
          variant="square"
          className="action-buttons__button--auto-break"
          active={autoBreak}
          onClick={onToggleAutoBreak}
          aria-label="Toggle auto break"
          title="Auto Break"
          aria-pressed={autoBreak}
        >
          {showAutoLabels ? (
            <>
              <span>Auto</span>
              <span>Break</span>
            </>
          ) : null}
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
    </div>
  );
});
