import type { Mode } from "@shared/lib/timerTypes";
import { useUIStore } from "@shared/stores/uiStore";
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

type DurationFieldProps = {
  field: Mode;
  label: string;
  draftMinutes: string;
  isEditing: boolean;
  minMinutes: number;
  maxMinutes: number;
  onStartEdit: (field: Mode) => void;
  onDraftChange: (field: Mode, nextDraft: string) => void;
  onApply: (field: Mode) => void;
  onCancelEdit: (field: Mode) => void;
  closePendingRef: RefObject<boolean>;
};

function DurationField({
  field,
  label,
  draftMinutes,
  isEditing,
  minMinutes,
  maxMinutes,
  onStartEdit,
  onDraftChange,
  onApply,
  onCancelEdit,
  closePendingRef,
}: DurationFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const filteredValue = event.target.value.replace(/\D+/g, "");
    onDraftChange(field, filteredValue);
  };

  const handleBlur = () => {
    if (closePendingRef.current) {
      onCancelEdit(field);
      return;
    }

    onApply(field);
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

  return (
    <label
      className={`settings-modal__field${isEditing ? " is-editing" : ""}`}
    >
      <span className="settings-modal__field-label">{label}</span>
      <span className="settings-modal__field-input-row">
        <input
          className="settings-modal__field-input"
          type="text"
          inputMode="numeric"
          value={draftMinutes}
          aria-label={`${label} in minutes`}
          onFocus={() => onStartEdit(field)}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <span className="settings-modal__field-unit">min</span>
      </span>
      <span className="settings-modal__field-hint">
        {minMinutes}-{maxMinutes} minutes
      </span>
    </label>
  );
}

type SettingsModalProps = {
  focusDraftMinutes: string;
  breakDraftMinutes: string;
  activeEditedField: Mode | null;
  autoFocus: boolean;
  autoBreak: boolean;
  soundEnabled: boolean;
  onStartEditField: (field: Mode) => void;
  onDraftChange: (field: Mode, nextDraft: string) => void;
  onApplyDuration: (field: Mode) => void;
  onCancelEdit: (field: Mode) => void;
  onResetDurationDrafts: () => void;
  onToggleAutoFocus: () => void;
  onToggleAutoBreak: () => void;
  onToggleSound: () => void;
};

export function SettingsModal({
  focusDraftMinutes,
  breakDraftMinutes,
  activeEditedField,
  autoFocus,
  autoBreak,
  soundEnabled,
  onStartEditField,
  onDraftChange,
  onApplyDuration,
  onCancelEdit,
  onResetDurationDrafts,
  onToggleAutoFocus,
  onToggleAutoBreak,
  onToggleSound,
}: SettingsModalProps) {
  const isOpen = useUIStore((state) => state.isSettingsModalOpen);
  const setSettingsModalOpen = useUIStore((state) => state.setSettingsModalOpen);
  const closePendingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      closePendingRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCancel = () => {
    closePendingRef.current = true;
    onResetDurationDrafts();
    setSettingsModalOpen(false);
  };

  const handleOverlayMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closePendingRef.current = true;
    }
  };

  const modal = (
    <div
      className="settings-modal__overlay"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleCancel}
    >
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="settings-modal__header">
          <h2 id="settings-modal-title">Settings</h2>
          <button
            type="button"
            className="settings-modal__close"
            onMouseDown={() => {
              closePendingRef.current = true;
            }}
            onClick={handleCancel}
            aria-label="Close settings"
          >
            X
          </button>
        </header>

        <section className="settings-modal__section">
          <h3 className="settings-modal__section-title">Timer Durations</h3>
          <div className="settings-modal__duration-grid">
            <DurationField
              field="focus"
              label="Focus duration"
              draftMinutes={focusDraftMinutes}
              isEditing={activeEditedField === "focus"}
              minMinutes={15}
              maxMinutes={90}
              onStartEdit={onStartEditField}
              onDraftChange={onDraftChange}
              onApply={onApplyDuration}
              onCancelEdit={onCancelEdit}
              closePendingRef={closePendingRef}
            />
            <DurationField
              field="break"
              label="Break duration"
              draftMinutes={breakDraftMinutes}
              isEditing={activeEditedField === "break"}
              minMinutes={5}
              maxMinutes={30}
              onStartEdit={onStartEditField}
              onDraftChange={onDraftChange}
              onApply={onApplyDuration}
              onCancelEdit={onCancelEdit}
              closePendingRef={closePendingRef}
            />
          </div>
        </section>

        <section className="settings-modal__section">
          <h3 className="settings-modal__section-title">Timer Preferences</h3>
          <div className="settings-modal__toggles">
            <label className="settings-modal__toggle">
              <input
                type="checkbox"
                checked={autoFocus}
                onChange={onToggleAutoFocus}
              />
              <span>Auto Focus</span>
            </label>
            <label className="settings-modal__toggle">
              <input
                type="checkbox"
                checked={autoBreak}
                onChange={onToggleAutoBreak}
              />
              <span>Auto Break</span>
            </label>
            <label className="settings-modal__toggle">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={onToggleSound}
              />
              <span>Sound</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}
