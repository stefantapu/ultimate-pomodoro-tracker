export type SkinId = "warm" | "neumorphism" | "viking";

export type SkinImageAsset = {
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
};

export type SkinCursorAsset = {
  src: string;
  hotspotX: number;
  hotspotY: number;
};

export const SKIN_IMAGE_ASSET_KEYS = [
  "pageBackground",
  "notesPanel",
  "heatmapPanel",
  "statsPanel",
  "dragonPanel",
  "topControlsPanel",
  "modeTabButton",
  "focusModeButton",
  "breakModeButton",
  "timerPanel",
  "timerPanelMobile",
  "startButton",
  "resetButton",
  "autoFocusButton",
  "autoBreakButton",
  "soundButton",
  "settingsButton",
  "settingsIcon",
  "historyIcon",
  "exitButton",
  "exitIcon",
  "toolbarButton",
  "toolbarHistoryIcon",
  "toolbarThemeIcon",
  "toolbarSettingsIcon",
  "toolbarAuthIcon",
] as const;

export type SkinImageAssetKey = (typeof SKIN_IMAGE_ASSET_KEYS)[number];

export const SKIN_CURSOR_ASSET_KEYS = [
  "cursorDefault",
  "cursorPointer",
  "cursorText",
  "cursorDisabled",
] as const;

export type SkinCursorAssetKey = (typeof SKIN_CURSOR_ASSET_KEYS)[number];

export const SKIN_AUDIO_ASSET_KEYS = [
  "alarm",
  "primaryTimerControl",
  "modeControl",
  "toolbarClick",
  "focusAmbience",
] as const;

export type SkinAudioAssetKey = (typeof SKIN_AUDIO_ASSET_KEYS)[number];

export const SKIN_ASPECT_RATIO_FALLBACK_KEYS = [
  "timerPanel",
  "timerPanelMobile",
  "startButton",
  "focusModeButton",
  "breakModeButton",
  "toolbarButton",
  "autoFocusButton",
  "notesPanel",
  "heatmapPanel",
  "statsPanel",
  "topControlsPanel",
  "modeTabButton",
] as const;

export type SkinAspectRatioFallbackKey =
  (typeof SKIN_ASPECT_RATIO_FALLBACK_KEYS)[number];

export type SkinImageAssets = Record<SkinImageAssetKey, SkinImageAsset | null>;

export type SkinCursorAssets = Record<
  SkinCursorAssetKey,
  SkinCursorAsset | null
>;

export type SkinAssets = SkinImageAssets & SkinCursorAssets;

export type SkinColors = {
  dashboardBg: string;
  surface: string;
  surfaceRaised: string;
  surfaceInset: string;
  panel: string;
  panelBorder: string;
  panelInner: string;
  text: string;
  textDark: string;
  textMuted: string;
  strokeSoft: string;
  button: string;
  buttonActive: string;
  buttonText: string;
  input: string;
  track: string;
  fill: string;
  accent: string;
  toolbarBg: string;
  toolbarBorder: string;
  modalOverlay: string;
  modalSurface: string;
  modalBorder: string;
  shadowRaised: string;
  shadowInset: string;
  shadowGlow: string;
};

export type SkinTypography = {
  baseFamily: string;
  displayFamily: string;
  buttonFamily: string;
  baseStyle: "normal" | "italic";
  displayStyle: "normal" | "italic";
  buttonStyle: "normal" | "italic";
  buttonWeight: number;
  buttonLetterSpacing: string;
  buttonTransform: "none" | "uppercase";
};

export type SkinLayout = {
  timerPanelMaxWidth: string;
  timerPanelMinHeight: string;
  timerPanelOverlayOpacity: number;
  actionButtonMinHeight: string;
  squareButtonMinHeight: string;
  panelRadius: string;
  buttonRadius: string;
  modalRadius: string;
};

export type SkinAudio = Record<SkinAudioAssetKey, string | null>;

export type SkinAmbientEffect = {
  kind: "embers" | "snow";
  count: number;
  seed: number;
  colors: readonly string[];
  sizeRangePx: readonly [number, number];
  durationRangeSec: readonly [number, number];
  delayRangeSec: readonly [number, number];
  opacityRange: readonly [number, number];
  startXRangePercent: readonly [number, number];
  startYRangePercent: readonly [number, number];
  travelXRangeVw: readonly [number, number];
  travelYRangeSvh: readonly [number, number];
  driftRangeVw: readonly [number, number];
};

export type SkinCapabilities = {
  effects: {
    ambient: SkinAmbientEffect | null;
    foreground: SkinAmbientEffect | null;
  };
  audio: {
    alarm: boolean;
    primaryTimerControl: boolean;
    modeControl: boolean;
    toolbarClick: boolean;
    focusAmbience: boolean;
  };
  visual: {
    timerPanelArt: boolean;
    toolbarIconArt: boolean;
    customCursors: boolean;
  };
};

export type SkinCursorFallbackKeyword =
  | "auto"
  | "pointer"
  | "text"
  | "not-allowed";

export type SkinFallbackContract = {
  imageCssValueForMissingAsset: "none";
  cursorCssFallbackKeywords: Record<
    SkinCursorAssetKey,
    SkinCursorFallbackKeyword
  >;
  aspectRatioDefaults: Record<SkinAspectRatioFallbackKey, number>;
};

export const SKIN_FALLBACK_CONTRACT: SkinFallbackContract = {
  imageCssValueForMissingAsset: "none",
  cursorCssFallbackKeywords: {
    cursorDefault: "auto",
    cursorPointer: "pointer",
    cursorText: "text",
    cursorDisabled: "not-allowed",
  },
  aspectRatioDefaults: {
    timerPanel: 2.68,
    timerPanelMobile: 1,
    startButton: 3,
    focusModeButton: 3.53,
    breakModeButton: 3.53,
    toolbarButton: 1,
    autoFocusButton: 1,
    notesPanel: 0.76,
    heatmapPanel: 2.39,
    statsPanel: 0.8967,
    topControlsPanel: 6.5,
    modeTabButton: 3.53,
  },
};

export type SkinProfile = {
  id: SkinId;
  label: string;
  description: string;
  capabilities: SkinCapabilities;
  assets: SkinAssets;
  audio: SkinAudio;
  focusAmbienceFadeInMs: number;
  focusAmbienceOutputGain: number;
  colors: SkinColors;
  typography: SkinTypography;
  layout: SkinLayout;
};
