import { useAlarm } from "@shared/hooks/useAlarm";
import { usePomodoroTimer } from "@shared/hooks/usePomodoroTimer";
import { useSettingsSync } from "@shared/hooks/useSettingsSync";
import {
  extractTimerSettings,
  readUserSettings,
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

const LazySettingsModal = lazy(() =>
  import("./SettingsModal").then((module) => ({
    default: module.SettingsModal,
  })),
);

const STATE_STORAGE_KEY = "pomodoro-timer-state";
const FOCUS_MIN_DURATION_MINUTES = 15;
const FOCUS_MAX_DURATION_MINUTES = 90;
const BREAK_MIN_DURATION_MINUTES = 5;
const BREAK_MAX_DURATION_MINUTES = 30;
const DEFAULT_PAGE_TITLE = "Forge Timer - Pomodoro";
const FOCUS_AMBIENCE_SOUND_SRC = "/sounds/focus_embers_loop.mp3";

function minutesToSeconds(minutes: number) {
  return minutes * 60;
}

function secondsToMinutes(seconds: number) {
  return Math.floor(seconds / 60);
}

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

function percentToVolume(nextValue: string) {
  const parsedValue = Number(nextValue);

  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return clampVolume(parsedValue / 100);
}

function formatVolumeLabel(value: number) {
  return `${Math.round(clampVolume(value) * 100)}%`;
}

function formatTitleTime(seconds: number) {
  const normalized = Math.max(0, seconds);
  const minutes = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const secondsDisplay = (normalized % 60).toString().padStart(2, "0");
  return `${minutes}:${secondsDisplay}`;
}

function getDurationLimits(field: Mode) {
  if (field === "focus") {
    return {
      min: FOCUS_MIN_DURATION_MINUTES,
      max: FOCUS_MAX_DURATION_MINUTES,
    };
  }

  return {
    min: BREAK_MIN_DURATION_MINUTES,
    max: BREAK_MAX_DURATION_MINUTES,
  };
}

function parseValidMinutes(field: Mode, value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  const { min, max } = getDurationLimits(field);

  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function SettingsModalFallback() {
  return (
    <div className="settings-modal__overlay">
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
    useState<boolean>(false);
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

  const { play: playAlarm } = useAlarm("/sounds/alarm.mp3", alarmVolume);
  const { play: previewAlarm } = useAlarm("/sounds/alarm.mp3", alarmVolumeDraft);
  const { play: playStoneClick } = useAlarm("/sounds/stone_click.mp3", uiVolume);
  const { play: previewUiClick } = useAlarm(
    "/sounds/click_on_elements.mp3",
    uiVolumeDraft,
  );
  const { play: playFocusAmbience, stop: stopFocusAmbience } = useAlarm(
    FOCUS_AMBIENCE_SOUND_SRC,
    focusAmbienceVolume,
    { loop: true },
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
    activeSkin.id === "warm" &&
    focusAmbienceEnabled &&
    focusAmbienceVolume > 0 &&
    mode === "focus" &&
    status === "running";

  const focusAmbienceHint = useMemo(() => {
    if (!isFocusAmbienceAvailable) {
      return "Add /sounds/focus_embers_loop.mp3 to enable this ambience.";
    }

    if (activeSkin.id !== "warm") {
      return "This ambience plays only on the warm skin during focus sessions.";
    }

    return "Loops only while a focus timer is running on the warm skin.";
  }, [activeSkin.id, isFocusAmbienceAvailable]);

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
    if (!isFocusAmbienceAvailable) {
      return;
    }

    setFocusAmbienceEnabledDraft((previous) => !previous);
  }, [isFocusAmbienceAvailable]);

  const handleFocusAmbienceVolumeChange = useCallback(
    (nextValue: string) => {
      if (!isFocusAmbienceAvailable) {
        return;
      }

      setFocusAmbienceVolumeDraft(percentToVolume(nextValue));
    },
    [isFocusAmbienceAvailable],
  );

  const handlePreviewAlarm = useCallback(() => {
    if (alarmVolumeDraft <= 0) {
      return;
    }

    previewAlarm();
  }, [alarmVolumeDraft, previewAlarm]);

  const handlePreviewUiSounds = useCallback(() => {
    if (uiVolumeDraft <= 0) {
      return;
    }

    previewUiClick();
  }, [previewUiClick, uiVolumeDraft]);

  const playButtonClick = useCallback(() => {
    if (!uiSoundsEnabled || uiVolume <= 0) {
      return;
    }

    playStoneClick();
  }, [playStoneClick, uiSoundsEnabled, uiVolume]);

  const handlePrimaryAction = useCallback(() => {
    playButtonClick();

    if (status === "running") {
      pause();
      return;
    }

    start();
  }, [pause, playButtonClick, start, status]);

  const handleResetTimer = useCallback(() => {
    playButtonClick();
    reset();
  }, [playButtonClick, reset]);

  const handleSelectMode = useCallback(
    (nextMode: Mode) => {
      playButtonClick();
      switchMode(nextMode);
    },
    [playButtonClick, switchMode],
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
    restoreSettingsDrafts();
  }, [restoreSettingsDrafts]);

  const handleSaveSettings = useCallback(() => {
    if (!canSaveSettings) {
      return;
    }

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
    uiSoundsEnabledDraft,
    uiVolumeDraft,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;

    const checkAvailability = async () => {
      try {
        const response = await window.fetch(FOCUS_AMBIENCE_SOUND_SRC, {
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
  }, []);

  useEffect(() => {
    if (resetTimerTrigger > 0) {
      hardReset();
    }
  }, [hardReset, resetTimerTrigger]);

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
        <Suspense fallback={<SettingsModalFallback />}>
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
            isFocusAmbienceAvailable={isFocusAmbienceAvailable}
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
