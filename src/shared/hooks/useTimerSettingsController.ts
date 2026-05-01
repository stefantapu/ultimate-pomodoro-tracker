import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettingsSync } from "@shared/hooks/useSettingsSync";
import {
  extractTimerSettings,
  readUserSettings,
  USER_SETTINGS_STORAGE_KEY,
  writeUserSettings,
} from "@shared/lib/timerStorage";
import type {
  Mode,
  TimerSettings,
  TimerStatus,
  UserSettings,
} from "@shared/lib/timerTypes";
import {
  BREAK_MAX_DURATION_MINUTES,
  BREAK_MIN_DURATION_MINUTES,
  FOCUS_MAX_DURATION_MINUTES,
  FOCUS_MIN_DURATION_MINUTES,
  clampVolume,
  formatVolumeLabel,
  minutesToSeconds,
  parseValidMinutes,
  percentToVolume,
  secondsToMinutes,
} from "@shared/lib/timerUiUtils";

type TimerSettingsDraft = {
  focusDraftMinutes: string;
  breakDraftMinutes: string;
  autoFocusDraft: boolean;
  autoBreakDraft: boolean;
  alarmEnabledDraft: boolean;
  alarmVolumeDraft: number;
  uiSoundsEnabledDraft: boolean;
  uiVolumeDraft: number;
  focusAmbienceEnabledDraft: boolean;
  focusAmbienceVolumeDraft: number;
};

type TimerSettingsDerivation = {
  focusDraftError: string | null;
  breakDraftError: string | null;
  draftFocusDurationSeconds: number | null;
  draftBreakDurationSeconds: number | null;
  hasDurationDraftErrors: boolean;
  hasTimerSettingsDraftChanges: boolean;
  hasAudioDraftChanges: boolean;
  isSettingsDirty: boolean;
  isTimerSettingsLocked: boolean;
  willResetCurrentTimer: boolean;
  canSaveSettings: boolean;
  alarmVolumeLabel: string;
  uiVolumeLabel: string;
  focusAmbienceVolumeLabel: string;
};

function createDraftFromSettings(settings: UserSettings): TimerSettingsDraft {
  return {
    focusDraftMinutes: secondsToMinutes(settings.focusDuration).toString(),
    breakDraftMinutes: secondsToMinutes(settings.breakDuration).toString(),
    autoFocusDraft: settings.autoFocus,
    autoBreakDraft: settings.autoBreak,
    alarmEnabledDraft: settings.alarmEnabled,
    alarmVolumeDraft: clampVolume(settings.alarmVolume),
    uiSoundsEnabledDraft: settings.uiSoundsEnabled,
    uiVolumeDraft: clampVolume(settings.uiVolume),
    focusAmbienceEnabledDraft: settings.focusAmbienceEnabled,
    focusAmbienceVolumeDraft: clampVolume(settings.focusAmbienceVolume),
  };
}

function mergeDraftIntoSettings(
  draft: TimerSettingsDraft,
  draftFocusDurationSeconds: number,
  draftBreakDurationSeconds: number,
): UserSettings {
  return {
    focusDuration: draftFocusDurationSeconds,
    breakDuration: draftBreakDurationSeconds,
    autoBreak: draft.autoBreakDraft,
    autoFocus: draft.autoFocusDraft,
    alarmEnabled: draft.alarmEnabledDraft,
    alarmVolume: clampVolume(draft.alarmVolumeDraft),
    uiSoundsEnabled: draft.uiSoundsEnabledDraft,
    uiVolume: clampVolume(draft.uiVolumeDraft),
    focusAmbienceEnabled: draft.focusAmbienceEnabledDraft,
    focusAmbienceVolume: clampVolume(draft.focusAmbienceVolumeDraft),
  };
}

export function useTimerSettingsController(
  settingsStorageKey = USER_SETTINGS_STORAGE_KEY,
) {
  const initialSettings = useMemo(
    () => readUserSettings(settingsStorageKey),
    [settingsStorageKey],
  );
  const [currentSettings, setCurrentSettings] =
    useState<UserSettings>(initialSettings);
  const [draft, setDraft] = useState<TimerSettingsDraft>(() =>
    createDraftFromSettings(initialSettings),
  );
  const [activeEditedField, setActiveEditedField] = useState<Mode | null>(null);
  const [focusLastValidMinutes, setFocusLastValidMinutes] = useState(() =>
    secondsToMinutes(initialSettings.focusDuration),
  );
  const [breakLastValidMinutes, setBreakLastValidMinutes] = useState(() =>
    secondsToMinutes(initialSettings.breakDuration),
  );
  const hasLoadedFromServer = useRef(false);

  const timerSettings = useMemo<TimerSettings>(
    () => extractTimerSettings(currentSettings),
    [currentSettings],
  );

  const applySettings = useCallback((settings: UserSettings) => {
    const nextFocusMinutes = secondsToMinutes(settings.focusDuration);
    const nextBreakMinutes = secondsToMinutes(settings.breakDuration);
    const nextSettings: UserSettings = {
      ...settings,
      alarmVolume: clampVolume(settings.alarmVolume),
      uiVolume: clampVolume(settings.uiVolume),
      focusAmbienceVolume: clampVolume(settings.focusAmbienceVolume),
    };

    setCurrentSettings(nextSettings);
    setFocusLastValidMinutes(nextFocusMinutes);
    setBreakLastValidMinutes(nextBreakMinutes);
    setDraft(createDraftFromSettings(nextSettings));
    setActiveEditedField(null);
  }, []);

  const { pushSettingsToCloud } = useSettingsSync(
    currentSettings,
    (cloudSettings: UserSettings) => {
      applySettings(cloudSettings);
      hasLoadedFromServer.current = true;
    },
  );

  const getDerivation = useCallback(
    (mode: Mode, status: TimerStatus): TimerSettingsDerivation => {
      const focusDraftError =
        parseValidMinutes("focus", draft.focusDraftMinutes) === null
          ? `Enter ${FOCUS_MIN_DURATION_MINUTES}-${FOCUS_MAX_DURATION_MINUTES} minutes.`
          : null;
      const breakDraftError =
        parseValidMinutes("break", draft.breakDraftMinutes) === null
          ? `Enter ${BREAK_MIN_DURATION_MINUTES}-${BREAK_MAX_DURATION_MINUTES} minutes.`
          : null;
      const draftFocusMinutes = parseValidMinutes(
        "focus",
        draft.focusDraftMinutes,
      );
      const draftBreakMinutes = parseValidMinutes(
        "break",
        draft.breakDraftMinutes,
      );
      const draftFocusDurationSeconds =
        draftFocusMinutes === null ? null : minutesToSeconds(draftFocusMinutes);
      const draftBreakDurationSeconds =
        draftBreakMinutes === null ? null : minutesToSeconds(draftBreakMinutes);
      const hasDurationDraftErrors =
        focusDraftError !== null || breakDraftError !== null;
      const hasTimerSettingsDraftChanges =
        draftFocusDurationSeconds !== currentSettings.focusDuration ||
        draftBreakDurationSeconds !== currentSettings.breakDuration ||
        draft.autoFocusDraft !== currentSettings.autoFocus ||
        draft.autoBreakDraft !== currentSettings.autoBreak;
      const hasAudioDraftChanges =
        draft.alarmEnabledDraft !== currentSettings.alarmEnabled ||
        draft.alarmVolumeDraft !== currentSettings.alarmVolume ||
        draft.uiSoundsEnabledDraft !== currentSettings.uiSoundsEnabled ||
        draft.uiVolumeDraft !== currentSettings.uiVolume ||
        draft.focusAmbienceEnabledDraft !==
          currentSettings.focusAmbienceEnabled ||
        draft.focusAmbienceVolumeDraft !== currentSettings.focusAmbienceVolume;
      const isTimerSettingsLocked = status === "running";
      const canSaveSettings =
        !hasDurationDraftErrors &&
        (hasAudioDraftChanges ||
          (!isTimerSettingsLocked && hasTimerSettingsDraftChanges));

      return {
        focusDraftError,
        breakDraftError,
        draftFocusDurationSeconds,
        draftBreakDurationSeconds,
        hasDurationDraftErrors,
        hasTimerSettingsDraftChanges,
        hasAudioDraftChanges,
        isSettingsDirty: hasTimerSettingsDraftChanges || hasAudioDraftChanges,
        isTimerSettingsLocked,
        willResetCurrentTimer:
          !isTimerSettingsLocked &&
          !hasDurationDraftErrors &&
          ((mode === "focus" &&
            draftFocusDurationSeconds !== currentSettings.focusDuration) ||
            (mode === "break" &&
              draftBreakDurationSeconds !== currentSettings.breakDuration)),
        canSaveSettings,
        alarmVolumeLabel: formatVolumeLabel(draft.alarmVolumeDraft),
        uiVolumeLabel: formatVolumeLabel(draft.uiVolumeDraft),
        focusAmbienceVolumeLabel: formatVolumeLabel(
          draft.focusAmbienceVolumeDraft,
        ),
      };
    },
    [currentSettings, draft],
  );

  const restoreSettingsDrafts = useCallback(() => {
    setDraft({
      ...createDraftFromSettings(currentSettings),
      focusDraftMinutes: focusLastValidMinutes.toString(),
      breakDraftMinutes: breakLastValidMinutes.toString(),
    });
    setActiveEditedField(null);
  }, [breakLastValidMinutes, currentSettings, focusLastValidMinutes]);

  const saveSettings = useCallback(
    (derivation: TimerSettingsDerivation) => {
      if (
        !derivation.canSaveSettings ||
        derivation.draftFocusDurationSeconds === null ||
        derivation.draftBreakDurationSeconds === null
      ) {
        return false;
      }

      const nextSettings = mergeDraftIntoSettings(
        draft,
        derivation.draftFocusDurationSeconds,
        derivation.draftBreakDurationSeconds,
      );

      hasLoadedFromServer.current = true;
      applySettings(nextSettings);
      return true;
    },
    [applySettings, draft],
  );

  const startEditField = useCallback((field: Mode, isLocked: boolean) => {
    if (!isLocked) {
      setActiveEditedField(field);
    }
  }, []);

  const changeDurationDraft = useCallback(
    (field: Mode, nextDraft: string, isLocked: boolean) => {
      if (isLocked) {
        return;
      }

      setDraft((previous) => ({
        ...previous,
        [field === "focus" ? "focusDraftMinutes" : "breakDraftMinutes"]:
          nextDraft,
      }));
    },
    [],
  );

  const cancelEdit = useCallback((field: Mode) => {
    setActiveEditedField((previous) => (previous === field ? null : previous));
  }, []);

  const toggleAutoFocusDraft = useCallback((isLocked: boolean) => {
    if (!isLocked) {
      setDraft((previous) => ({
        ...previous,
        autoFocusDraft: !previous.autoFocusDraft,
      }));
    }
  }, []);

  const toggleAutoBreakDraft = useCallback((isLocked: boolean) => {
    if (!isLocked) {
      setDraft((previous) => ({
        ...previous,
        autoBreakDraft: !previous.autoBreakDraft,
      }));
    }
  }, []);

  const toggleDraftBoolean = useCallback(
    (
      key:
        | "alarmEnabledDraft"
        | "uiSoundsEnabledDraft"
        | "focusAmbienceEnabledDraft",
    ) => {
      setDraft((previous) => ({
        ...previous,
        [key]: !previous[key],
      }));
    },
    [],
  );

  const setVolumeDraft = useCallback(
    (
      key: "alarmVolumeDraft" | "uiVolumeDraft" | "focusAmbienceVolumeDraft",
      nextValue: string,
    ) => {
      setDraft((previous) => ({
        ...previous,
        [key]: percentToVolume(nextValue),
      }));
    },
    [],
  );

  useEffect(() => {
    writeUserSettings(settingsStorageKey, currentSettings);

    if (hasLoadedFromServer.current) {
      pushSettingsToCloud(currentSettings);
    }
  }, [currentSettings, pushSettingsToCloud, settingsStorageKey]);

  return {
    currentSettings,
    timerSettings,
    activeEditedField,
    draft,
    getDerivation,
    restoreSettingsDrafts,
    saveSettings,
    startEditField,
    changeDurationDraft,
    cancelEdit,
    toggleAutoFocusDraft,
    toggleAutoBreakDraft,
    toggleAlarmEnabledDraft: () => toggleDraftBoolean("alarmEnabledDraft"),
    toggleUiSoundsEnabledDraft: () => toggleDraftBoolean("uiSoundsEnabledDraft"),
    toggleFocusAmbienceDraft: () =>
      toggleDraftBoolean("focusAmbienceEnabledDraft"),
    setAlarmVolumeDraft: (nextValue: string) =>
      setVolumeDraft("alarmVolumeDraft", nextValue),
    setUiVolumeDraft: (nextValue: string) =>
      setVolumeDraft("uiVolumeDraft", nextValue),
    setFocusAmbienceVolumeDraft: (nextValue: string) =>
      setVolumeDraft("focusAmbienceVolumeDraft", nextValue),
  };
}
