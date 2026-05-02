import { useAlarm } from "@shared/hooks/useAlarm";
import { usePomodoroTimer } from "@shared/hooks/usePomodoroTimer";
import { useTimerSettingsController } from "@shared/hooks/useTimerSettingsController";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import {
  UI_SOUND_OUTPUT_GAIN,
  USER_SETTINGS_STORAGE_KEY,
} from "@shared/lib/timerStorage";
import type { Mode } from "@shared/lib/timerTypes";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ActionButtons } from "./ActionButtons";
import { TimerCard } from "./TimerCard";
import { TopControls } from "./TopControls";
import {
  clampVolume,
  DEFAULT_PAGE_TITLE,
  formatTitleTime,
} from "./timerBlockUtils";

const LazySettingsModal = lazy(() =>
  import("./SettingsModal").then((module) => ({
    default: module.SettingsModal,
  })),
);

const STATE_STORAGE_KEY = "pomodoro-timer-state";

function SettingsModalFallback({
  skinId,
  skinCssVariables,
}: {
  skinId: string;
  skinCssVariables: ReturnType<typeof mapSkinToCssVariables>;
}) {
  return (
    <div
      className={`settings-modal__overlay settings-modal__overlay--${skinId}`}
      style={skinCssVariables}
    >
      <div className="settings-modal">
        <header className="settings-modal__header">
          <h2>Settings</h2>
        </header>
        <section className="settings-modal__section">
          <p className="settings-modal__section-title">Loading settings...</p>
        </section>
      </div>
    </div>
  );
}

export function TimerBlock() {
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );
  const alarmSoundSrc = activeSkin.audio.alarm;
  const primaryTimerControlSoundSrc = activeSkin.audio.primaryTimerControl;
  const modeControlSoundSrc = activeSkin.audio.modeControl;
  const uiPreviewSoundSrc =
    activeSkin.audio.toolbarClick ??
    activeSkin.audio.primaryTimerControl ??
    activeSkin.audio.modeControl;
  const focusAmbienceSoundSrc = activeSkin.audio.focusAmbience;
  const isSettingsModalOpen = useUIStore((state) => state.isSettingsModalOpen);
  const settingsController = useTimerSettingsController(
    USER_SETTINGS_STORAGE_KEY,
  );
  const { currentSettings, draft, timerSettings } = settingsController;
  const {
    alarmEnabled,
    alarmVolume,
    uiSoundsEnabled,
    uiVolume,
    focusAmbienceEnabled,
    focusAmbienceVolume,
  } = currentSettings;
  const {
    alarmVolumeDraft,
    uiVolumeDraft,
    focusAmbienceVolumeDraft,
  } = draft;
  const [isFocusAmbienceAvailable, setIsFocusAmbienceAvailable] =
    useState<boolean>(Boolean(focusAmbienceSoundSrc));
  const uiPlaybackVolume = useMemo(
    () => clampVolume(uiVolume * UI_SOUND_OUTPUT_GAIN),
    [uiVolume],
  );
  const uiPreviewVolume = useMemo(
    () => clampVolume(uiVolumeDraft * UI_SOUND_OUTPUT_GAIN),
    [uiVolumeDraft],
  );

  const { play: playAlarm } = useAlarm(alarmSoundSrc, alarmVolume);
  const { play: previewAlarm } = useAlarm(alarmSoundSrc, alarmVolumeDraft);
  const { play: playPrimaryTimerClick } = useAlarm(
    primaryTimerControlSoundSrc,
    uiPlaybackVolume,
  );
  const { play: playModeTimerClick } = useAlarm(
    modeControlSoundSrc,
    uiPlaybackVolume,
  );
  const { play: previewUiClick } = useAlarm(uiPreviewSoundSrc, uiPreviewVolume);
  const { play: playFocusAmbience, stop: stopFocusAmbience } = useAlarm(
    focusAmbienceSoundSrc,
    focusAmbienceVolume,
    {
      loop: true,
      fadeInMs: activeSkin.focusAmbienceFadeInMs,
      loopOverlapMs: 1000,
      outputGain: activeSkin.focusAmbienceOutputGain,
    },
  );
  const {
    play: previewFocusAmbience,
    stop: stopPreviewFocusAmbience,
  } = useAlarm(
    focusAmbienceSoundSrc,
    focusAmbienceVolumeDraft,
    {
      fadeInMs: 250,
      outputGain: activeSkin.focusAmbienceOutputGain,
    },
  );

  const {
    mode,
    timeLeft,
    targetTimestamp,
    status,
    start,
    pause,
    reset,
    hardReset,
    switchMode,
  } = usePomodoroTimer({
    settings: timerSettings,
    stateStorageKey: STATE_STORAGE_KEY,
    onSessionComplete:
      alarmEnabled && alarmVolume > 0 ? playAlarm : undefined,
  });
  const resetTimerTrigger = useUIStore((state) => state.resetTimerTrigger);

  const settingsDerivation = settingsController.getDerivation(mode, status);
  const {
    focusDraftError,
    breakDraftError,
    isSettingsDirty,
    isTimerSettingsLocked,
    willResetCurrentTimer,
    canSaveSettings,
    alarmVolumeLabel,
    uiVolumeLabel,
    focusAmbienceVolumeLabel,
  } = settingsDerivation;

  const shouldPlayFocusAmbience =
    isFocusAmbienceAvailable &&
    Boolean(focusAmbienceSoundSrc) &&
    focusAmbienceEnabled &&
    focusAmbienceVolume > 0 &&
    mode === "focus" &&
    status === "running";

  const themeAudioHint = useMemo(() => {
    if (
      activeSkin.audio.alarm ||
      activeSkin.audio.primaryTimerControl ||
      activeSkin.audio.modeControl ||
      activeSkin.audio.toolbarClick ||
      activeSkin.audio.focusAmbience
    ) {
      return null;
    }

    return `${activeSkin.label} keeps your global audio preferences, but this theme has no sound assets yet. Previews and playback stay silent for now.`;
  }, [activeSkin.audio, activeSkin.label]);

  const focusAmbienceHint = useMemo(() => {
    if (!focusAmbienceSoundSrc) {
      return `${activeSkin.label} has no focus ambience yet.`;
    }

    if (!isFocusAmbienceAvailable) {
      return `Add ${focusAmbienceSoundSrc} to enable this ambience.`;
    }

    return `Loops only while a focus timer is running on ${activeSkin.label}.`;
  }, [activeSkin.label, focusAmbienceSoundSrc, isFocusAmbienceAvailable]);

  const handleToggleAutoFocusDraft = useCallback(() => {
    settingsController.toggleAutoFocusDraft(isTimerSettingsLocked);
  }, [isTimerSettingsLocked, settingsController]);

  const handleToggleAutoBreakDraft = useCallback(() => {
    settingsController.toggleAutoBreakDraft(isTimerSettingsLocked);
  }, [isTimerSettingsLocked, settingsController]);

  const handleToggleAlarmEnabledDraft = useCallback(() => {
    settingsController.toggleAlarmEnabledDraft();
  }, [settingsController]);

  const handleAlarmVolumeChange = useCallback((nextValue: string) => {
    settingsController.setAlarmVolumeDraft(nextValue);
  }, [settingsController]);

  const handleUiVolumeChange = useCallback((nextValue: string) => {
    settingsController.setUiVolumeDraft(nextValue);
  }, [settingsController]);

  const handleToggleUiSoundsEnabledDraft = useCallback(() => {
    settingsController.toggleUiSoundsEnabledDraft();
  }, [settingsController]);

  const handleToggleFocusAmbienceDraft = useCallback(() => {
    settingsController.toggleFocusAmbienceDraft();
  }, [settingsController]);

  const handleFocusAmbienceVolumeChange = useCallback(
    (nextValue: string) => {
      settingsController.setFocusAmbienceVolumeDraft(nextValue);
    },
    [settingsController],
  );

  const handlePreviewAlarm = useCallback(() => {
    stopPreviewFocusAmbience();

    if (alarmVolumeDraft <= 0 || !alarmSoundSrc) {
      return;
    }

    previewAlarm();
  }, [alarmSoundSrc, alarmVolumeDraft, previewAlarm, stopPreviewFocusAmbience]);

  const handlePreviewUiSounds = useCallback(() => {
    stopPreviewFocusAmbience();

    if (uiVolumeDraft <= 0 || !uiPreviewSoundSrc) {
      return;
    }

    previewUiClick();
  }, [previewUiClick, stopPreviewFocusAmbience, uiPreviewSoundSrc, uiVolumeDraft]);

  const handlePreviewFocusAmbience = useCallback(() => {
    stopPreviewFocusAmbience();

    if (
      focusAmbienceVolumeDraft <= 0 ||
      !focusAmbienceSoundSrc ||
      !isFocusAmbienceAvailable
    ) {
      return;
    }

    previewFocusAmbience();
  }, [
    focusAmbienceSoundSrc,
    focusAmbienceVolumeDraft,
    isFocusAmbienceAvailable,
    previewFocusAmbience,
    stopPreviewFocusAmbience,
  ]);

  const playPrimaryButtonClick = useCallback(() => {
    if (!uiSoundsEnabled || uiVolume <= 0 || !primaryTimerControlSoundSrc) {
      return;
    }

    playPrimaryTimerClick();
  }, [
    playPrimaryTimerClick,
    primaryTimerControlSoundSrc,
    uiSoundsEnabled,
    uiVolume,
  ]);

  const playModeButtonClick = useCallback(() => {
    if (!uiSoundsEnabled || uiVolume <= 0 || !modeControlSoundSrc) {
      return;
    }

    playModeTimerClick();
  }, [modeControlSoundSrc, playModeTimerClick, uiSoundsEnabled, uiVolume]);

  const handlePrimaryAction = useCallback(() => {
    playPrimaryButtonClick();

    if (status === "running") {
      pause();
      return;
    }

    start();
  }, [pause, playPrimaryButtonClick, start, status]);

  const handleResetTimer = useCallback(() => {
    playPrimaryButtonClick();
    reset();
  }, [playPrimaryButtonClick, reset]);

  const handleSelectMode = useCallback(
    (nextMode: Mode) => {
      playModeButtonClick();
      switchMode(nextMode);
    },
    [playModeButtonClick, switchMode],
  );

  const handleStartEditField = useCallback(
    (field: Mode) => {
      settingsController.startEditField(field, isTimerSettingsLocked);
    },
    [isTimerSettingsLocked, settingsController],
  );

  const handleDraftChange = useCallback(
    (field: Mode, nextDraft: string) => {
      settingsController.changeDurationDraft(
        field,
        nextDraft,
        isTimerSettingsLocked,
      );
    },
    [isTimerSettingsLocked, settingsController],
  );

  const handleCancelEdit = useCallback(
    (field: Mode) => {
      settingsController.cancelEdit(field);
    },
    [settingsController],
  );

  const handleCancelSettings = useCallback(() => {
    stopPreviewFocusAmbience();
    settingsController.restoreSettingsDrafts();
  }, [settingsController, stopPreviewFocusAmbience]);

  const handleSaveSettings = useCallback(() => {
    if (!canSaveSettings) {
      return;
    }

    stopPreviewFocusAmbience();
    settingsController.saveSettings(settingsDerivation);
  }, [
    canSaveSettings,
    settingsController,
    settingsDerivation,
    stopPreviewFocusAmbience,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;

    const checkAvailability = async () => {
      if (!focusAmbienceSoundSrc) {
        if (isMounted) {
          setIsFocusAmbienceAvailable(false);
        }
        return;
      }

      try {
        const response = await window.fetch(focusAmbienceSoundSrc, {
          method: "HEAD",
        });

        if (isMounted) {
          setIsFocusAmbienceAvailable(response.ok);
        }
      } catch {
        if (isMounted) {
          setIsFocusAmbienceAvailable(false);
        }
      }
    };

    void checkAvailability();

    return () => {
      isMounted = false;
    };
  }, [focusAmbienceSoundSrc]);

  useEffect(() => {
    if (resetTimerTrigger > 0) {
      hardReset();
    }
  }, [hardReset, resetTimerTrigger]);

  useEffect(() => {
    if (!isSettingsModalOpen) {
      stopPreviewFocusAmbience();
    }
  }, [isSettingsModalOpen, stopPreviewFocusAmbience]);

  useEffect(() => {
    if (!shouldPlayFocusAmbience) {
      stopFocusAmbience();
      return;
    }

    playFocusAmbience(false);
  }, [playFocusAmbience, shouldPlayFocusAmbience, stopFocusAmbience]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const computeRemaining = () => {
      if (status !== "running" || !targetTimestamp) {
        return Math.max(0, timeLeft);
      }

      return Math.max(0, Math.round((targetTimestamp - Date.now()) / 1000));
    };

    const updateTitle = () => {
      if (status !== "running") {
        document.title = DEFAULT_PAGE_TITLE;
        return;
      }

      document.title = `${formatTitleTime(computeRemaining())} - Forge Timer`;
    };

    updateTitle();

    if (status !== "running") {
      return;
    }

    const intervalId = window.setInterval(updateTitle, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status, targetTimestamp, timeLeft]);

  return (
    <div className="timer-block">
      {isSettingsModalOpen ? (
        <Suspense
          fallback={
            <SettingsModalFallback
              skinId={activeSkin.id}
              skinCssVariables={skinCssVariables}
            />
          }
        >
          <LazySettingsModal
            focusDraftMinutes={draft.focusDraftMinutes}
            breakDraftMinutes={draft.breakDraftMinutes}
            activeEditedField={settingsController.activeEditedField}
            autoFocusDraft={draft.autoFocusDraft}
            autoBreakDraft={draft.autoBreakDraft}
            alarmEnabledDraft={draft.alarmEnabledDraft}
            alarmVolumeDraft={alarmVolumeDraft}
            uiSoundsEnabledDraft={draft.uiSoundsEnabledDraft}
            uiVolumeDraft={uiVolumeDraft}
            focusAmbienceEnabledDraft={draft.focusAmbienceEnabledDraft}
            focusAmbienceVolumeDraft={focusAmbienceVolumeDraft}
            themeAudioHint={themeAudioHint}
            focusAmbienceHint={focusAmbienceHint}
            isTimerSettingsLocked={isTimerSettingsLocked}
            focusDraftError={focusDraftError}
            breakDraftError={breakDraftError}
            isSettingsDirty={isSettingsDirty}
            canSaveSettings={canSaveSettings}
            willResetCurrentTimer={willResetCurrentTimer}
            alarmVolumeLabel={alarmVolumeLabel}
            uiVolumeLabel={uiVolumeLabel}
            focusAmbienceVolumeLabel={focusAmbienceVolumeLabel}
            onStartEditField={handleStartEditField}
            onDraftChange={handleDraftChange}
            onCancelEdit={handleCancelEdit}
            onCancelSettings={handleCancelSettings}
            onSaveSettings={handleSaveSettings}
            onToggleAutoFocus={handleToggleAutoFocusDraft}
            onToggleAutoBreak={handleToggleAutoBreakDraft}
            onToggleAlarmEnabled={handleToggleAlarmEnabledDraft}
            onAlarmVolumeChange={handleAlarmVolumeChange}
            onPreviewAlarm={handlePreviewAlarm}
            onToggleUiSoundsEnabled={handleToggleUiSoundsEnabledDraft}
            onUiVolumeChange={handleUiVolumeChange}
            onPreviewUiSounds={handlePreviewUiSounds}
            onToggleFocusAmbience={handleToggleFocusAmbienceDraft}
            onFocusAmbienceVolumeChange={handleFocusAmbienceVolumeChange}
            onPreviewFocusAmbience={handlePreviewFocusAmbience}
            isFocusAmbiencePreviewDisabled={
              !focusAmbienceSoundSrc || !isFocusAmbienceAvailable
            }
          />
        </Suspense>
      ) : null}
      <TopControls mode={mode} onSelectMode={handleSelectMode} />
      <TimerCard
        mode={mode}
        status={status}
        timeLeft={timeLeft}
        targetTimestamp={targetTimestamp}
      />
      <ActionButtons
        status={status}
        onPrimaryAction={handlePrimaryAction}
        onReset={handleResetTimer}
      />
    </div>
  );
}
