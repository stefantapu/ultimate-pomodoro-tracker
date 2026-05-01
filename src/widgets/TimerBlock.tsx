import { useAlarm } from "@shared/hooks/useAlarm";
import { usePomodoroTimer } from "@shared/hooks/usePomodoroTimer";
import { useSettingsSync } from "@shared/hooks/useSettingsSync";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import {
  extractTimerSettings,
  readUserSettings,
  UI_SOUND_OUTPUT_GAIN,
  USER_SETTINGS_STORAGE_KEY,
  writeUserSettings,
} from "@shared/lib/timerStorage";
import type { Mode, TimerSettings, UserSettings } from "@shared/lib/timerTypes";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActionButtons } from "./ActionButtons";
import { TimerCard } from "./TimerCard";
import { TopControls } from "./TopControls";
import {
  BREAK_MAX_DURATION_MINUTES,
  BREAK_MIN_DURATION_MINUTES,
  clampVolume,
  DEFAULT_PAGE_TITLE,
  FOCUS_MAX_DURATION_MINUTES,
  FOCUS_MIN_DURATION_MINUTES,
  formatTitleTime,
  formatVolumeLabel,
  minutesToSeconds,
  parseValidMinutes,
  percentToVolume,
  secondsToMinutes,
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
  const initialSettings = useMemo(
    () => readUserSettings(USER_SETTINGS_STORAGE_KEY),
    [],
  );
  const [breakDurationSeconds, setBreakDurationSeconds] = useState<number>(
    () => initialSettings.breakDuration,
  );
  const [focusDurationSeconds, setFocusDurationSeconds] = useState<number>(
    () => initialSettings.focusDuration,
  );
  const [focusLastValidMinutes, setFocusLastValidMinutes] = useState<number>(
    () => secondsToMinutes(initialSettings.focusDuration),
  );
  const [breakLastValidMinutes, setBreakLastValidMinutes] = useState<number>(
    () => secondsToMinutes(initialSettings.breakDuration),
  );
  const [focusDraftMinutes, setFocusDraftMinutes] = useState<string>(() =>
    secondsToMinutes(initialSettings.focusDuration).toString(),
  );
  const [breakDraftMinutes, setBreakDraftMinutes] = useState<string>(() =>
    secondsToMinutes(initialSettings.breakDuration).toString(),
  );
  const [activeEditedField, setActiveEditedField] = useState<Mode | null>(null);
  const [autoBreak, setAutoBreak] = useState<boolean>(
    () => initialSettings.autoBreak,
  );
  const [autoFocus, setAutoFocus] = useState<boolean>(
    () => initialSettings.autoFocus,
  );
  const [autoFocusDraft, setAutoFocusDraft] = useState<boolean>(
    () => initialSettings.autoFocus,
  );
  const [autoBreakDraft, setAutoBreakDraft] = useState<boolean>(
    () => initialSettings.autoBreak,
  );
  const [alarmEnabled, setAlarmEnabled] = useState<boolean>(
    () => initialSettings.alarmEnabled,
  );
  const [alarmEnabledDraft, setAlarmEnabledDraft] = useState<boolean>(
    () => initialSettings.alarmEnabled,
  );
  const [alarmVolume, setAlarmVolume] = useState<number>(
    () => initialSettings.alarmVolume,
  );
  const [alarmVolumeDraft, setAlarmVolumeDraft] = useState<number>(
    () => initialSettings.alarmVolume,
  );
  const [uiSoundsEnabled, setUiSoundsEnabled] = useState<boolean>(
    () => initialSettings.uiSoundsEnabled,
  );
  const [uiSoundsEnabledDraft, setUiSoundsEnabledDraft] = useState<boolean>(
    () => initialSettings.uiSoundsEnabled,
  );
  const [uiVolume, setUiVolume] = useState<number>(() => initialSettings.uiVolume);
  const [uiVolumeDraft, setUiVolumeDraft] = useState<number>(
    () => initialSettings.uiVolume,
  );
  const [focusAmbienceEnabled, setFocusAmbienceEnabled] = useState<boolean>(
    () => initialSettings.focusAmbienceEnabled,
  );
  const [focusAmbienceEnabledDraft, setFocusAmbienceEnabledDraft] =
    useState<boolean>(() => initialSettings.focusAmbienceEnabled);
  const [focusAmbienceVolume, setFocusAmbienceVolume] = useState<number>(
    () => initialSettings.focusAmbienceVolume,
  );
  const [focusAmbienceVolumeDraft, setFocusAmbienceVolumeDraft] =
    useState<number>(() => initialSettings.focusAmbienceVolume);
  const [isFocusAmbienceAvailable, setIsFocusAmbienceAvailable] =
    useState<boolean>(Boolean(focusAmbienceSoundSrc));
  const hasLoadedFromServer = useRef(false);

  const currentSettings = useMemo<UserSettings>(
    () => ({
      focusDuration: focusDurationSeconds,
      breakDuration: breakDurationSeconds,
      autoBreak,
      autoFocus,
      alarmEnabled,
      alarmVolume,
      uiSoundsEnabled,
      uiVolume,
      focusAmbienceEnabled,
      focusAmbienceVolume,
    }),
    [
      alarmEnabled,
      alarmVolume,
      autoBreak,
      autoFocus,
      breakDurationSeconds,
      focusAmbienceEnabled,
      focusAmbienceVolume,
      focusDurationSeconds,
      uiSoundsEnabled,
      uiVolume,
    ],
  );

  const timerSettings = useMemo<TimerSettings>(
    () => extractTimerSettings(currentSettings),
    [currentSettings],
  );
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

  const { pushSettingsToCloud } = useSettingsSync(
    currentSettings,
    (cloudSettings: UserSettings) => {
      const nextFocusMinutes = secondsToMinutes(cloudSettings.focusDuration);
      const nextBreakMinutes = secondsToMinutes(cloudSettings.breakDuration);

      setFocusDurationSeconds(cloudSettings.focusDuration);
      setBreakDurationSeconds(cloudSettings.breakDuration);
      setFocusLastValidMinutes(nextFocusMinutes);
      setBreakLastValidMinutes(nextBreakMinutes);
      setFocusDraftMinutes(nextFocusMinutes.toString());
      setBreakDraftMinutes(nextBreakMinutes.toString());
      setActiveEditedField(null);
      setAutoBreak(cloudSettings.autoBreak);
      setAutoBreakDraft(cloudSettings.autoBreak);
      setAutoFocus(cloudSettings.autoFocus);
      setAutoFocusDraft(cloudSettings.autoFocus);
      setAlarmEnabled(cloudSettings.alarmEnabled);
      setAlarmEnabledDraft(cloudSettings.alarmEnabled);
      setAlarmVolume(clampVolume(cloudSettings.alarmVolume));
      setAlarmVolumeDraft(clampVolume(cloudSettings.alarmVolume));
      setUiSoundsEnabled(cloudSettings.uiSoundsEnabled);
      setUiSoundsEnabledDraft(cloudSettings.uiSoundsEnabled);
      setUiVolume(clampVolume(cloudSettings.uiVolume));
      setUiVolumeDraft(clampVolume(cloudSettings.uiVolume));
      setFocusAmbienceEnabled(cloudSettings.focusAmbienceEnabled);
      setFocusAmbienceEnabledDraft(cloudSettings.focusAmbienceEnabled);
      setFocusAmbienceVolume(clampVolume(cloudSettings.focusAmbienceVolume));
      setFocusAmbienceVolumeDraft(clampVolume(cloudSettings.focusAmbienceVolume));
      hasLoadedFromServer.current = true;
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

  const focusDraftError = useMemo(() => {
    return parseValidMinutes("focus", focusDraftMinutes) === null
      ? `Enter ${FOCUS_MIN_DURATION_MINUTES}-${FOCUS_MAX_DURATION_MINUTES} minutes.`
      : null;
  }, [focusDraftMinutes]);

  const breakDraftError = useMemo(() => {
    return parseValidMinutes("break", breakDraftMinutes) === null
      ? `Enter ${BREAK_MIN_DURATION_MINUTES}-${BREAK_MAX_DURATION_MINUTES} minutes.`
      : null;
  }, [breakDraftMinutes]);

  const draftFocusDurationSeconds = useMemo(() => {
    const parsedMinutes = parseValidMinutes("focus", focusDraftMinutes);
    return parsedMinutes === null ? null : minutesToSeconds(parsedMinutes);
  }, [focusDraftMinutes]);

  const draftBreakDurationSeconds = useMemo(() => {
    const parsedMinutes = parseValidMinutes("break", breakDraftMinutes);
    return parsedMinutes === null ? null : minutesToSeconds(parsedMinutes);
  }, [breakDraftMinutes]);

  const hasDurationDraftErrors =
    focusDraftError !== null || breakDraftError !== null;
  const hasTimerSettingsDraftChanges =
    draftFocusDurationSeconds !== focusDurationSeconds ||
    draftBreakDurationSeconds !== breakDurationSeconds ||
    autoFocusDraft !== autoFocus ||
    autoBreakDraft !== autoBreak;
  const hasAudioDraftChanges =
    alarmEnabledDraft !== alarmEnabled ||
    alarmVolumeDraft !== alarmVolume ||
    uiSoundsEnabledDraft !== uiSoundsEnabled ||
    uiVolumeDraft !== uiVolume ||
    focusAmbienceEnabledDraft !== focusAmbienceEnabled ||
    focusAmbienceVolumeDraft !== focusAmbienceVolume;
  const isSettingsDirty = hasTimerSettingsDraftChanges || hasAudioDraftChanges;
  const isTimerSettingsLocked = status === "running";
  const willResetCurrentTimer =
    !isTimerSettingsLocked &&
    !hasDurationDraftErrors &&
    ((mode === "focus" && draftFocusDurationSeconds !== focusDurationSeconds) ||
      (mode === "break" && draftBreakDurationSeconds !== breakDurationSeconds));
  const canSaveSettings =
    !hasDurationDraftErrors &&
    (hasAudioDraftChanges ||
      (!isTimerSettingsLocked && hasTimerSettingsDraftChanges));

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
    if (isTimerSettingsLocked) {
      return;
    }

    setAutoFocusDraft((previous) => !previous);
  }, [isTimerSettingsLocked]);

  const handleToggleAutoBreakDraft = useCallback(() => {
    if (isTimerSettingsLocked) {
      return;
    }

    setAutoBreakDraft((previous) => !previous);
  }, [isTimerSettingsLocked]);

  const handleToggleAlarmEnabledDraft = useCallback(() => {
    setAlarmEnabledDraft((previous) => !previous);
  }, []);

  const handleAlarmVolumeChange = useCallback((nextValue: string) => {
    setAlarmVolumeDraft(percentToVolume(nextValue));
  }, []);

  const handleUiVolumeChange = useCallback((nextValue: string) => {
    setUiVolumeDraft(percentToVolume(nextValue));
  }, []);

  const handleToggleUiSoundsEnabledDraft = useCallback(() => {
    setUiSoundsEnabledDraft((previous) => !previous);
  }, []);

  const handleToggleFocusAmbienceDraft = useCallback(() => {
    setFocusAmbienceEnabledDraft((previous) => !previous);
  }, []);

  const handleFocusAmbienceVolumeChange = useCallback(
    (nextValue: string) => {
      setFocusAmbienceVolumeDraft(percentToVolume(nextValue));
    },
    [],
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

  const restoreSettingsDrafts = useCallback(() => {
    setFocusDraftMinutes(focusLastValidMinutes.toString());
    setBreakDraftMinutes(breakLastValidMinutes.toString());
    setAutoFocusDraft(autoFocus);
    setAutoBreakDraft(autoBreak);
    setAlarmEnabledDraft(alarmEnabled);
    setAlarmVolumeDraft(alarmVolume);
    setUiSoundsEnabledDraft(uiSoundsEnabled);
    setUiVolumeDraft(uiVolume);
    setFocusAmbienceEnabledDraft(focusAmbienceEnabled);
    setFocusAmbienceVolumeDraft(focusAmbienceVolume);
    setActiveEditedField(null);
  }, [
    alarmEnabled,
    alarmVolume,
    autoBreak,
    autoFocus,
    breakLastValidMinutes,
    focusAmbienceEnabled,
    focusAmbienceVolume,
    focusLastValidMinutes,
    uiSoundsEnabled,
    uiVolume,
  ]);

  const handleStartEditField = useCallback(
    (field: Mode) => {
      if (isTimerSettingsLocked) {
        return;
      }

      setActiveEditedField(field);
    },
    [isTimerSettingsLocked],
  );

  const handleDraftChange = useCallback(
    (field: Mode, nextDraft: string) => {
      if (isTimerSettingsLocked) {
        return;
      }

      if (field === "focus") {
        setFocusDraftMinutes(nextDraft);
        return;
      }

      setBreakDraftMinutes(nextDraft);
    },
    [isTimerSettingsLocked],
  );

  const handleCancelEdit = useCallback(
    (field: Mode) => {
      if (activeEditedField === field) {
        setActiveEditedField(null);
      }
    },
    [activeEditedField],
  );

  const handleCancelSettings = useCallback(() => {
    stopPreviewFocusAmbience();
    restoreSettingsDrafts();
  }, [restoreSettingsDrafts, stopPreviewFocusAmbience]);

  const handleSaveSettings = useCallback(() => {
    if (!canSaveSettings) {
      return;
    }

    stopPreviewFocusAmbience();

    const nextFocusDurationSeconds = draftFocusDurationSeconds;
    const nextBreakDurationSeconds = draftBreakDurationSeconds;

    if (
      nextFocusDurationSeconds === null ||
      nextBreakDurationSeconds === null
    ) {
      return;
    }

    const nextFocusMinutes = secondsToMinutes(nextFocusDurationSeconds);
    const nextBreakMinutes = secondsToMinutes(nextBreakDurationSeconds);
    const nextAlarmVolume = clampVolume(alarmVolumeDraft);
    const nextUiVolume = clampVolume(uiVolumeDraft);
    const nextFocusAmbienceVolume = clampVolume(focusAmbienceVolumeDraft);

    hasLoadedFromServer.current = true;

    setFocusDurationSeconds(nextFocusDurationSeconds);
    setBreakDurationSeconds(nextBreakDurationSeconds);
    setFocusLastValidMinutes(nextFocusMinutes);
    setBreakLastValidMinutes(nextBreakMinutes);
    setFocusDraftMinutes(nextFocusMinutes.toString());
    setBreakDraftMinutes(nextBreakMinutes.toString());
    setAutoFocus(autoFocusDraft);
    setAutoBreak(autoBreakDraft);
    setAlarmEnabled(alarmEnabledDraft);
    setAlarmEnabledDraft(alarmEnabledDraft);
    setAlarmVolume(nextAlarmVolume);
    setAlarmVolumeDraft(nextAlarmVolume);
    setUiSoundsEnabled(uiSoundsEnabledDraft);
    setUiSoundsEnabledDraft(uiSoundsEnabledDraft);
    setUiVolume(nextUiVolume);
    setUiVolumeDraft(nextUiVolume);
    setFocusAmbienceEnabled(focusAmbienceEnabledDraft);
    setFocusAmbienceEnabledDraft(focusAmbienceEnabledDraft);
    setFocusAmbienceVolume(nextFocusAmbienceVolume);
    setFocusAmbienceVolumeDraft(nextFocusAmbienceVolume);
    setActiveEditedField(null);
  }, [
    alarmEnabledDraft,
    alarmVolumeDraft,
    autoBreakDraft,
    autoFocusDraft,
    canSaveSettings,
    draftBreakDurationSeconds,
    draftFocusDurationSeconds,
    focusAmbienceEnabledDraft,
    focusAmbienceVolumeDraft,
    stopPreviewFocusAmbience,
    uiSoundsEnabledDraft,
    uiVolumeDraft,
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

  useEffect(() => {
    writeUserSettings(USER_SETTINGS_STORAGE_KEY, currentSettings);

    if (hasLoadedFromServer.current) {
      pushSettingsToCloud(currentSettings);
    }
  }, [currentSettings, pushSettingsToCloud]);

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
            focusDraftMinutes={focusDraftMinutes}
            breakDraftMinutes={breakDraftMinutes}
            activeEditedField={activeEditedField}
            autoFocusDraft={autoFocusDraft}
            autoBreakDraft={autoBreakDraft}
            alarmEnabledDraft={alarmEnabledDraft}
            alarmVolumeDraft={alarmVolumeDraft}
            uiSoundsEnabledDraft={uiSoundsEnabledDraft}
            uiVolumeDraft={uiVolumeDraft}
            focusAmbienceEnabledDraft={focusAmbienceEnabledDraft}
            focusAmbienceVolumeDraft={focusAmbienceVolumeDraft}
            themeAudioHint={themeAudioHint}
            focusAmbienceHint={focusAmbienceHint}
            isTimerSettingsLocked={isTimerSettingsLocked}
            focusDraftError={focusDraftError}
            breakDraftError={breakDraftError}
            isSettingsDirty={isSettingsDirty}
            canSaveSettings={canSaveSettings}
            willResetCurrentTimer={willResetCurrentTimer}
            alarmVolumeLabel={formatVolumeLabel(alarmVolumeDraft)}
            uiVolumeLabel={formatVolumeLabel(uiVolumeDraft)}
            focusAmbienceVolumeLabel={formatVolumeLabel(focusAmbienceVolumeDraft)}
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
