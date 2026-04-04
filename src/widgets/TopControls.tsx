import type { Mode } from "@shared/lib/timerTypes";
import { memo } from "react";
import { ThemedButton } from "./ThemedButton";
import { TimerDurationField } from "./TimerDurationField";

type TopControlsProps = {
  mode: Mode;
  focusLastValidMinutes: number;
  breakLastValidMinutes: number;
  focusDraftMinutes: string;
  breakDraftMinutes: string;
  activeEditedField: Mode | null;
  onSelectMode: (mode: Mode) => void;
  onStartEditField: (field: Mode) => void;
  onDraftChange: (field: Mode, nextDraft: string) => void;
  onApplyDuration: (field: Mode) => void;
  onCancelEdit: (field: Mode) => void;
};

export const TopControls = memo(function TopControls({
  mode,
  focusLastValidMinutes,
  breakLastValidMinutes,
  focusDraftMinutes,
  breakDraftMinutes,
  activeEditedField,
  onSelectMode,
  onStartEditField,
  onDraftChange,
  onApplyDuration,
  onCancelEdit,
}: TopControlsProps) {
  return (
    <div className="top-controls">
      <TimerDurationField
        field="focus"
        displayMinutes={focusLastValidMinutes}
        draftMinutes={focusDraftMinutes}
        isEditing={activeEditedField === "focus"}
        isActiveMode={mode === "focus"}
        onStartEdit={onStartEditField}
        onDraftChange={onDraftChange}
        onApply={onApplyDuration}
        onCancelEdit={onCancelEdit}
      />
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
      <TimerDurationField
        field="break"
        displayMinutes={breakLastValidMinutes}
        draftMinutes={breakDraftMinutes}
        isEditing={activeEditedField === "break"}
        isActiveMode={mode === "break"}
        onStartEdit={onStartEditField}
        onDraftChange={onDraftChange}
        onApply={onApplyDuration}
        onCancelEdit={onCancelEdit}
      />
    </div>
  );
});
