import type { Mode } from "@shared/lib/timerTypes";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useUIStore } from "@shared/stores/uiStore";
import { useSkinStore } from "@shared/stores/skinStore";
import {
  useMemo,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

type DurationFieldProps = {
  field: Mode;
  label: string;
  draftMinutes: string;
  isEditing: boolean;
  minMinutes: number;
  maxMinutes: number;
  error: string | null;
  disabled: boolean;
  canSave: boolean;
  onStartEdit: (field: Mode) => void;
  onDraftChange: (field: Mode, nextDraft: string) => void;
  onCancelEdit: (field: Mode) => void;
  onCancelSettings: () => void;
  onSaveSettings: () => void;
};

function DurationField({
  field,
  label,
  draftMinutes,
  isEditing,
  minMinutes,
  maxMinutes,
  error,
  disabled,
  canSave,
  onStartEdit,
  onDraftChange,
  onCancelEdit,
  onCancelSettings,
  onSaveSettings,
}: DurationFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const filteredValue = event.target.value.replace(/\D+/g, "");
    onDraftChange(field, filteredValue);
  };

  const handleBlur = () => {
    onCancelEdit(field);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (canSave) {
        onSaveSettings();
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancelSettings();
    }
  };

  const hintId = `settings-${field}-duration-hint`;
  const errorId = `settings-${field}-duration-error`;

  return (
    <label
      className={[
        "settings-modal__field",
        isEditing ? "is-editing" : "",
        error ? "has-error" : "",
        disabled ? "is-disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="settings-modal__field-label">{label}</span>
      <span className="settings-modal__field-input-row">
        <input
          className="settings-modal__field-input"
          type="text"
          inputMode="numeric"
          value={draftMinutes}
          aria-label={`${label} in minutes`}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onFocus={() => onStartEdit(field)}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <span className="settings-modal__field-unit">min</span>
      </span>
      <span className="settings-modal__field-hint" id={hintId}>
        {minMinutes}-{maxMinutes} minutes
      </span>
      {error ? (
        <span className="settings-modal__field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

type SettingsModalProps = {
  focusDraftMinutes: string;
  breakDraftMinutes: string;
  activeEditedField: Mode | null;
  autoFocusDraft: boolean;
  autoBreakDraft: boolean;
  soundEnabled: boolean;
  isTimerSettingsLocked: boolean;
  focusDraftError: string | null;
  breakDraftError: string | null;
  isTimerSettingsDirty: boolean;
  canSaveTimerSettings: boolean;
  willResetCurrentTimer: boolean;
  onStartEditField: (field: Mode) => void;
  onDraftChange: (field: Mode, nextDraft: string) => void;
  onCancelEdit: (field: Mode) => void;
  onCancelTimerSettings: () => void;
  onSaveTimerSettings: () => void;
  onToggleAutoFocus: () => void;
  onToggleAutoBreak: () => void;
  onToggleSound: () => void;
};

export function SettingsModal({
  focusDraftMinutes,
  breakDraftMinutes,
  activeEditedField,
  autoFocusDraft,
  autoBreakDraft,
  soundEnabled,
  isTimerSettingsLocked,
  focusDraftError,
  breakDraftError,
  isTimerSettingsDirty,
  canSaveTimerSettings,
  willResetCurrentTimer,
  onStartEditField,
  onDraftChange,
  onCancelEdit,
  onCancelTimerSettings,
  onSaveTimerSettings,
  onToggleAutoFocus,
  onToggleAutoBreak,
  onToggleSound,
}: SettingsModalProps) {
  const isOpen = useUIStore((state) => state.isSettingsModalOpen);
  const setSettingsModalOpen = useUIStore((state) => state.setSettingsModalOpen);
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );

  if (!isOpen) {
    return null;
  }

  const handleCancel = () => {
    onCancelTimerSettings();
    setSettingsModalOpen(false);
  };

  const handleSave = () => {
    if (!canSaveTimerSettings) {
      return;
    }

    onSaveTimerSettings();
    setSettingsModalOpen(false);
  };

  const modal = (
    <div
      className="settings-modal__overlay"
      style={skinCssVariables}
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
            onClick={handleCancel}
            aria-label="Close settings"
          >
            X
          </button>
        </header>

        <section className="settings-modal__section">
          <h3 className="settings-modal__section-title">Timer Durations</h3>
          {isTimerSettingsLocked ? (
            <p className="settings-modal__notice" role="status">
              Timer is running. Pause or reset before changing timer settings.
            </p>
          ) : null}
          <div className="settings-modal__duration-grid">
            <DurationField
              field="focus"
              label="Focus duration"
              draftMinutes={focusDraftMinutes}
              isEditing={activeEditedField === "focus"}
              minMinutes={15}
              maxMinutes={90}
              error={focusDraftError}
              disabled={isTimerSettingsLocked}
              canSave={canSaveTimerSettings}
              onStartEdit={onStartEditField}
              onDraftChange={onDraftChange}
              onCancelEdit={onCancelEdit}
              onCancelSettings={onCancelTimerSettings}
              onSaveSettings={handleSave}
            />
            <DurationField
              field="break"
              label="Break duration"
              draftMinutes={breakDraftMinutes}
              isEditing={activeEditedField === "break"}
              minMinutes={5}
              maxMinutes={30}
              error={breakDraftError}
              disabled={isTimerSettingsLocked}
              canSave={canSaveTimerSettings}
              onStartEdit={onStartEditField}
              onDraftChange={onDraftChange}
              onCancelEdit={onCancelEdit}
              onCancelSettings={onCancelTimerSettings}
              onSaveSettings={handleSave}
            />
          </div>
        </section>

        <section className="settings-modal__section">
          <h3 className="settings-modal__section-title">Timer Preferences</h3>
          <div className="settings-modal__toggles">
            <label
              className={`settings-modal__toggle${
                isTimerSettingsLocked ? " is-disabled" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={autoFocusDraft}
                disabled={isTimerSettingsLocked}
                onChange={onToggleAutoFocus}
              />
              <span>Auto Focus</span>
            </label>
            <label
              className={`settings-modal__toggle${
                isTimerSettingsLocked ? " is-disabled" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={autoBreakDraft}
                disabled={isTimerSettingsLocked}
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

        <section className="settings-modal__section settings-modal__contact">
          <h3 className="settings-modal__section-title">Contact</h3>
          <a
            className="settings-modal__contact-link"
            href="mailto:tapushtefan@gmail.com"
          >
            tapushtefan@gmail.com
          </a>
        </section>

        <footer className="settings-modal__footer">
          {willResetCurrentTimer ? (
            <p className="settings-modal__warning" role="status">
              Saving duration changes resets the current timer.
            </p>
          ) : null}
          <div className="settings-modal__actions">
            <button
              type="button"
              className="settings-modal__button settings-modal__button--secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="settings-modal__button settings-modal__button--primary"
              disabled={!canSaveTimerSettings}
              onClick={handleSave}
            >
              {isTimerSettingsDirty ? "Save settings" : "No changes"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}
