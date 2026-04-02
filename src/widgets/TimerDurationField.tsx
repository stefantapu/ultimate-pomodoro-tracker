import type { Mode } from "@shared/lib/timerTypes";
import {
  memo,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

type TimerDurationFieldProps = {
  field: Mode;
  displayMinutes: number;
  draftMinutes: string;
  isEditing: boolean;
  isActiveMode: boolean;
  onStartEdit: (field: Mode) => void;
  onDraftChange: (field: Mode, nextDraft: string) => void;
  onApply: (field: Mode) => void;
  onCancelEdit: (field: Mode) => void;
};

function joinClassNames(...classNames: Array<string | false | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export const TimerDurationField = memo(function TimerDurationField({
  field,
  displayMinutes,
  draftMinutes,
  isEditing,
  isActiveMode,
  onStartEdit,
  onDraftChange,
  onApply,
  onCancelEdit,
}: TimerDurationFieldProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const renderedValue = isEditing ? draftMinutes : `${displayMinutes}:00`;

  useEffect(() => {
    if (!isEditing || !inputRef.current) {
      return;
    }

    inputRef.current.focus();
    inputRef.current.select();
  }, [isEditing]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const filteredValue = event.target.value.replace(/\D+/g, "");
    onDraftChange(field, filteredValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApply(field);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancelEdit(field);
    }
  };

  const handleBlur = () => {
    onApply(field);
  };

  const handleActivateEditing = () => {
    onStartEdit(field);
  };

  return (
    <div
      ref={wrapperRef}
      className={joinClassNames(
        "timer-duration-field",
        isActiveMode && "is-active",
        isEditing && "is-editing",
      )}
      onClick={handleActivateEditing}
    >
      <input
        ref={inputRef}
        className="timer-duration-field__input"
        type="text"
        inputMode="numeric"
        value={renderedValue}
        readOnly={!isEditing}
        aria-label={`${field} duration in minutes`}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </div>
  );
});
