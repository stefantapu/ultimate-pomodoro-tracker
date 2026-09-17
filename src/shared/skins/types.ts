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
  "timerPanelDesktop",
  "timerPanelMobile",
  "profileFrame",
  "avatarIdle",
  "avatarFocused",
  "toolbarButtonFrame",
  "toolbarSettingsIcon",
  "toolbarThemeIcon",
  "modeControlFrame",
  "focusModeIcon",
  "breakModeIcon",
  "primaryActionFrame",
  "heatmapPanel",
  "statsPanel",
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
  "timerPanelDesktop",
  "timerPanelMobile",
  "profileFrame",
  "toolbarButtonFrame",
  "modeControlFrame",
  "primaryActionFrame",
  "heatmapPanel",
  "statsPanel",
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
  timelineFocus: string;
  timelineBreak: string;
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

export type SkinEffects = {
  ambient: SkinAmbientEffect | null;
  foreground: SkinAmbientEffect | null;
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
    timerPanelDesktop: 769 / 319,
    timerPanelMobile: 1,
    profileFrame: 3.52,
    toolbarButtonFrame: 1,
    modeControlFrame: 1,
    primaryActionFrame: 2.875,
    heatmapPanel: 400 / 167,
    statsPanel: 180 / 167,
  },
};

export type SkinProfile = {
  id: SkinId;
  label: string;
  description: string;
  effects: SkinEffects;
  assets: SkinAssets;
  audio: SkinAudio;
  focusAmbienceFadeInMs: number;
  focusAmbienceOutputGain: number;
  colors: SkinColors;
  typography: SkinTypography;
  layout: SkinLayout;
};
