import type { Mode } from "@shared/lib/timerTypes";
import {
  ACCOUNT_DELETION_BODY,
  ACCOUNT_DELETION_SUBJECT,
  SUPPORT_EMAIL,
  createSupportMailtoHref,
} from "@shared/config/support";
import { useAuth } from "@app/providers/useAuth";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useToolbarClickSound } from "@shared/hooks/useToolbarClickSound";
import { useUIStore } from "@shared/stores/uiStore";
import { useSkinStore } from "@shared/stores/skinStore";
import {
  useMemo,
  useState,
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

type AudioSettingRowProps = {
  label: string;
  value: number;
  valueLabel: string;
  disabled?: boolean;
  hint?: string;
  checked?: boolean;
  previewLabel?: string;
  previewDisabled?: boolean;
  onToggle?: () => void;
  onPreview?: () => void;
  onValueChange: (nextValue: string) => void;
};

function AudioSettingRow({
  label,
  value,
  valueLabel,
  disabled = false,
  hint,
  checked,
  previewLabel,
  previewDisabled = false,
  onToggle,
  onPreview,
  onValueChange,
}: AudioSettingRowProps) {
  const sliderId = `audio-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(event.target.value);
  };

  return (
    <div
      className={`settings-modal__audio-row${disabled ? " is-disabled" : ""}`}
      aria-disabled={disabled ? true : undefined}
    >
      <div className="settings-modal__audio-top">
        {onToggle ? (
          <label className="settings-modal__audio-toggle">
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={onToggle}
            />
            <span>{label}</span>
          </label>
        ) : (
          <span className="settings-modal__audio-label">{label}</span>
        )}
        {onPreview ? (
          <button
            type="button"
            className="settings-modal__audio-preview"
            disabled={disabled || previewDisabled}
            onClick={onPreview}
          >
            {previewLabel ?? "Preview"}
          </button>
        ) : null}
      </div>
      <div className="settings-modal__audio-slider-row">
        <input
          id={sliderId}
          className="settings-modal__audio-slider"
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(value * 100)}
          disabled={disabled}
          aria-label={`${label} volume`}
          onChange={handleSliderChange}
        />
        <span className="settings-modal__audio-value">{valueLabel}</span>
      </div>
      {hint ? <p className="settings-modal__audio-hint">{hint}</p> : null}
    </div>
  );
}

type SettingsModalProps = {
  focusDraftMinutes: string;
  breakDraftMinutes: string;
  activeEditedField: Mode | null;
  autoFocusDraft: boolean;
  autoBreakDraft: boolean;
  alarmEnabledDraft: boolean;
  alarmVolumeDraft: number;
  uiSoundsEnabledDraft: boolean;
  uiVolumeDraft: number;
  focusAmbienceEnabledDraft: boolean;
  focusAmbienceVolumeDraft: number;
  themeAudioHint: string | null;
  focusAmbienceHint: string;
  isTimerSettingsLocked: boolean;
  focusDraftError: string | null;
  breakDraftError: string | null;
  isSettingsDirty: boolean;
  canSaveSettings: boolean;
  willResetCurrentTimer: boolean;
  alarmVolumeLabel: string;
  uiVolumeLabel: string;
  focusAmbienceVolumeLabel: string;
  onStartEditField: (field: Mode) => void;
  onDraftChange: (field: Mode, nextDraft: string) => void;
  onCancelEdit: (field: Mode) => void;
  onCancelSettings: () => void;
  onSaveSettings: () => void;
  onToggleAutoFocus: () => void;
  onToggleAutoBreak: () => void;
  onToggleAlarmEnabled: () => void;
  onAlarmVolumeChange: (nextValue: string) => void;
  onPreviewAlarm: () => void;
  onToggleUiSoundsEnabled: () => void;
  onUiVolumeChange: (nextValue: string) => void;
  onPreviewUiSounds: () => void;
  onToggleFocusAmbience: () => void;
  onFocusAmbienceVolumeChange: (nextValue: string) => void;
  onPreviewFocusAmbience: () => void;
  isFocusAmbiencePreviewDisabled: boolean;
};

export function SettingsModal({
  focusDraftMinutes,
  breakDraftMinutes,
  activeEditedField,
  autoFocusDraft,
  autoBreakDraft,
  alarmEnabledDraft,
  alarmVolumeDraft,
  uiSoundsEnabledDraft,
  uiVolumeDraft,
  focusAmbienceEnabledDraft,
  focusAmbienceVolumeDraft,
  themeAudioHint,
  focusAmbienceHint,
  isTimerSettingsLocked,
  focusDraftError,
  breakDraftError,
  isSettingsDirty,
  canSaveSettings,
  willResetCurrentTimer,
  alarmVolumeLabel,
  uiVolumeLabel,
  focusAmbienceVolumeLabel,
  onStartEditField,
  onDraftChange,
  onCancelEdit,
  onCancelSettings,
  onSaveSettings,
  onToggleAutoFocus,
  onToggleAutoBreak,
  onToggleAlarmEnabled,
  onAlarmVolumeChange,
  onPreviewAlarm,
  onToggleUiSoundsEnabled,
  onUiVolumeChange,
  onPreviewUiSounds,
  onToggleFocusAmbience,
  onFocusAmbienceVolumeChange,
  onPreviewFocusAmbience,
  isFocusAmbiencePreviewDisabled,
}: SettingsModalProps) {
  const isOpen = useUIStore((state) => state.isSettingsModalOpen);
  const setSettingsModalOpen = useUIStore((state) => state.setSettingsModalOpen);
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const { user } = useAuth();
  const playToolbarClick = useToolbarClickSound();
  const [isDeletionRequestOpen, setDeletionRequestOpen] = useState(false);
  const [deletionCopyStatus, setDeletionCopyStatus] = useState<
    "idle" | "copied" | "unavailable"
  >("idle");
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );

  if (!isOpen) {
    return null;
  }

  const handleCancel = () => {
    playToolbarClick();
    onCancelSettings();
    setSettingsModalOpen(false);
  };

  const handleSave = () => {
    if (!canSaveSettings) {
      return;
    }

    playToolbarClick();
    onSaveSettings();
    setSettingsModalOpen(false);
  };

  const handleBackdropClick = () => {
    if (isSettingsDirty) {
      if (canSaveSettings) {
        handleSave();
      }

      return;
    }

    handleCancel();
  };

  const accountDeletionHref = createSupportMailtoHref({
    subject: ACCOUNT_DELETION_SUBJECT,
    body: ACCOUNT_DELETION_BODY,
  });
  const accountDeletionRequestText = [
    `To: ${SUPPORT_EMAIL}`,
    `Subject: ${ACCOUNT_DELETION_SUBJECT}`,
    "",
    ACCOUNT_DELETION_BODY,
  ].join("\n");

  const handleShowDeletionRequest = () => {
    playToolbarClick();
    setDeletionRequestOpen(true);
    setDeletionCopyStatus("idle");
  };

  const handleCopyDeletionRequest = async () => {
    if (!navigator.clipboard?.writeText) {
      setDeletionCopyStatus("unavailable");
      return;
    }

    await navigator.clipboard.writeText(accountDeletionRequestText);
    setDeletionCopyStatus("copied");
  };

  const modal = (
    <div
      className={`settings-modal__overlay settings-modal__overlay--${activeSkin.id}`}
      style={skinCssVariables}
      onClick={handleBackdropClick}
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
              canSave={canSaveSettings}
              onStartEdit={onStartEditField}
              onDraftChange={onDraftChange}
              onCancelEdit={onCancelEdit}
              onCancelSettings={onCancelSettings}
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
              canSave={canSaveSettings}
              onStartEdit={onStartEditField}
              onDraftChange={onDraftChange}
              onCancelEdit={onCancelEdit}
              onCancelSettings={onCancelSettings}
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
          </div>
        </section>

        <section className="settings-modal__section">
          <h3 className="settings-modal__section-title">Sound</h3>
          {themeAudioHint ? (
            <p className="settings-modal__notice" role="status">
              {themeAudioHint}
            </p>
          ) : null}
          <div className="settings-modal__audio-grid">
            <AudioSettingRow
              label="Timer end sound"
              checked={alarmEnabledDraft}
              value={alarmVolumeDraft}
              valueLabel={alarmVolumeLabel}
              hint="Controls the alarm when a focus or break session ends."
              onToggle={onToggleAlarmEnabled}
              onPreview={onPreviewAlarm}
              onValueChange={onAlarmVolumeChange}
            />
            <AudioSettingRow
              label="UI sounds"
              checked={uiSoundsEnabledDraft}
              value={uiVolumeDraft}
              valueLabel={uiVolumeLabel}
              hint="Applies to timer controls and the top-right toolbar buttons."
              onToggle={onToggleUiSoundsEnabled}
              onPreview={onPreviewUiSounds}
              onValueChange={onUiVolumeChange}
            />
            <AudioSettingRow
              label="Focus ambience"
              checked={focusAmbienceEnabledDraft}
              value={focusAmbienceVolumeDraft}
              valueLabel={focusAmbienceVolumeLabel}
              hint={focusAmbienceHint}
              previewDisabled={isFocusAmbiencePreviewDisabled}
              onToggle={onToggleFocusAmbience}
              onPreview={onPreviewFocusAmbience}
              onValueChange={onFocusAmbienceVolumeChange}
            />
          </div>
        </section>

        <section className="settings-modal__section settings-modal__contact">
          <h3 className="settings-modal__section-title">App info</h3>
          <div className="settings-modal__legal-links" aria-label="Legal links">
            <a href="/privacy">Privacy</a>
            <span aria-hidden="true">/</span>
            <a href="/terms">Terms</a>
          </div>
          <a
            className="settings-modal__contact-link"
            href={`mailto:${SUPPORT_EMAIL}`}
          >
            {SUPPORT_EMAIL}
          </a>
        </section>

        {user ? (
          <section className="settings-modal__section settings-modal__deletion">
            <h3 className="settings-modal__section-title">Account</h3>
            <p className="settings-modal__notice">
              To delete your account and saved ForgeTimer data, send a deletion
              request from the email linked to your account.
            </p>
            <p className="settings-modal__muted-copy">
              Deletion can include your profile, notes, focus/break sessions,
              progress, XP, level, and settings stored in Supabase.
            </p>
            <p className="settings-modal__muted-copy">
              Guest data stored locally in this browser is not deleted by this
              request. You can clear local browser data from your browser
              settings.
            </p>
            <button
              type="button"
              className="settings-modal__button settings-modal__button--secondary"
              aria-expanded={isDeletionRequestOpen}
              onClick={handleShowDeletionRequest}
            >
              Request account deletion
            </button>
            {isDeletionRequestOpen ? (
              <div
                className="settings-modal__deletion-request"
                role="region"
                aria-label="Account deletion email details"
              >
                <p className="settings-modal__muted-copy">
                  Your browser may need a configured email app for the link to
                  open. If nothing opens, copy these details into your email
                  client.
                </p>
                <dl className="settings-modal__request-details">
                  <div>
                    <dt>To</dt>
                    <dd>
                      <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                    </dd>
                  </div>
                  <div>
                    <dt>Subject</dt>
                    <dd>{ACCOUNT_DELETION_SUBJECT}</dd>
                  </div>
                </dl>
                <label className="settings-modal__request-message">
                  <span>Message</span>
                  <textarea
                    readOnly
                    value={ACCOUNT_DELETION_BODY}
                    aria-label="Account deletion request message"
                  />
                </label>
                <div className="settings-modal__request-actions">
                  <a
                    className="settings-modal__button settings-modal__button--primary settings-modal__deletion-link"
                    href={accountDeletionHref}
                  >
                    Open email app
                  </a>
                  <button
                    type="button"
                    className="settings-modal__button settings-modal__button--secondary"
                    onClick={handleCopyDeletionRequest}
                  >
                    Copy request details
                  </button>
                </div>
                {deletionCopyStatus === "copied" ? (
                  <p className="settings-modal__copy-status" role="status">
                    Request details copied.
                  </p>
                ) : null}
                {deletionCopyStatus === "unavailable" ? (
                  <p className="settings-modal__copy-status" role="status">
                    Copy is unavailable in this browser. Select the message text
                    manually.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

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
              disabled={!canSaveSettings}
              onClick={handleSave}
            >
              {isSettingsDirty ? "Save settings" : "No changes"}
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
