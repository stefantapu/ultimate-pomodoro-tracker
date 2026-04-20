export type SkinId = "warm" | "soft-form";

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

export type SkinAssets = {
  pageBackground: SkinImageAsset | null;
  notesPanel: SkinImageAsset | null;
  heatmapPanel: SkinImageAsset | null;
  statsPanel: SkinImageAsset | null;
  dragonPanel: SkinImageAsset | null;
  topControlsPanel: SkinImageAsset | null;
  modeTabButton: SkinImageAsset | null;
  timerPanel: SkinImageAsset | null;
  timerPanelMobile: SkinImageAsset | null;
  startButton: SkinImageAsset | null;
  resetButton: SkinImageAsset | null;
  autoFocusButton: SkinImageAsset | null;
  autoBreakButton: SkinImageAsset | null;
  soundButton: SkinImageAsset | null;
  settingsButton: SkinImageAsset | null;
  settingsIcon: SkinImageAsset | null;
  historyIcon: SkinImageAsset | null;
  exitButton: SkinImageAsset | null;
  exitIcon: SkinImageAsset | null;
  cursorDefault: SkinCursorAsset | null;
  cursorPointer: SkinCursorAsset | null;
  cursorText: SkinCursorAsset | null;
  cursorDisabled: SkinCursorAsset | null;
};

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

export type SkinAudio = {
  alarm: string | null;
  timerControl: string | null;
  toolbarClick: string | null;
  focusAmbience: string | null;
};

export type SkinProfile = {
  id: SkinId;
  label: string;
  description: string;
  assets: SkinAssets;
  audio: SkinAudio;
  colors: SkinColors;
  typography: SkinTypography;
  layout: SkinLayout;
};
