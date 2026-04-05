export type SkinId = "warm";

export type SkinImageAsset = {
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
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
  exitButton: SkinImageAsset | null;
  exitIcon: SkinImageAsset | null;
};

export type SkinColors = {
  dashboardBg: string;
  panel: string;
  panelBorder: string;
  panelInner: string;
  text: string;
  textDark: string;
  textMuted: string;
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
};

export type SkinProfile = {
  id: SkinId;
  label: string;
  description: string;
  assets: SkinAssets;
  colors: SkinColors;
  typography: SkinTypography;
  layout: SkinLayout;
};
