import { buildImageAsset } from "./assetUtils";
import type { SkinId, SkinProfile } from "./types";

const minimalSkin: SkinProfile = {
  id: "minimal",
  label: "Ultra Minimal",
  description: "Current clean monochrome dashboard.",
  assets: {
    pageBackground: null,
    timerPanel: null,
    startButton: null,
    resetButton: null,
    autoFocusButton: null,
    autoBreakButton: null,
    soundButton: null,
  },
  colors: {
    dashboardBg: "#d9d9d9",
    panel: "#232323",
    panelBorder: "#141414",
    panelInner: "#efefef",
    text: "#f7f7f7",
    textDark: "#1f1f1f",
    textMuted: "#c7c7c7",
    button: "#202020",
    buttonActive: "#4a4a4a",
    buttonText: "#f5f5f5",
    input: "#2d2d2d",
    track: "#d7d7d7",
    fill: "#707070",
    accent: "#7d7d7d",
    toolbarBg: "transparent",
    toolbarBorder: "transparent",
    modalOverlay: "rgba(0, 0, 0, 0.45)",
    modalSurface: "#202020",
    modalBorder: "#444",
  },
  typography: {
    baseFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    displayFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    buttonFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    buttonWeight: 500,
    buttonLetterSpacing: "0.06em",
    buttonTransform: "uppercase",
  },
  layout: {
    timerPanelMaxWidth: "100%",
    timerPanelMinHeight: "260px",
    timerPanelOverlayOpacity: 0,
    actionButtonMinHeight: "4.5rem",
    squareButtonMinHeight: "4.5rem",
  },
};

const warmSkin: SkinProfile = {
  id: "warm",
  label: "Red Lava",
  description: "Warm fantasy palette with themed timer controls.",
  assets: {
    pageBackground: buildImageAsset(
      "/assets/red_lava_theme/background.webp",
      { width: 1920, height: 1080 },
    ),
    timerPanel: buildImageAsset(
      "/assets/red_lava_theme/timer_panel_w1047_h390.webp",
      { width: 1047, height: 390 },
    ),
    startButton: buildImageAsset(
      "/assets/red_lava_theme/start_button_w321_h107.webp",
      { width: 321, height: 107 },
    ),
    resetButton: buildImageAsset(
      "/assets/red_lava_theme/reset_button_w321_h107.webp",
      { width: 321, height: 107 },
    ),
    autoFocusButton: buildImageAsset(
      "/assets/red_lava_theme/auto_focus_w150_h150.webp",
      { width: 150, height: 150 },
    ),
    autoBreakButton: buildImageAsset(
      "/assets/red_lava_theme/auto_break_w150_h150.webp",
      { width: 150, height: 150 },
    ),
    soundButton: buildImageAsset(
      "/assets/red_lava_theme/audio_button_w150_h150.webp",
      { width: 150, height: 150 },
    ),
  },
  colors: {
    dashboardBg: "#2b1109",
    panel: "#4a1f0f",
    panelBorder: "#8f4b1f",
    panelInner: "#f4d9b7",
    text: "#fff0dc",
    textDark: "#2f1a0d",
    textMuted: "#e7b985",
    button: "#5e2812",
    buttonActive: "#914121",
    buttonText: "#fff2de",
    input: "#3d1609",
    track: "#dcb58a",
    fill: "#ff922f",
    accent: "#ffab3b",
    toolbarBg: "rgba(53, 20, 8, 0.68)",
    toolbarBorder: "rgba(255, 177, 100, 0.34)",
    modalOverlay: "rgba(23, 8, 3, 0.7)",
    modalSurface: "#3a180b",
    modalBorder: "#965226",
  },
  typography: {
    baseFamily: "'Trebuchet MS', 'Lucida Sans Unicode', 'Segoe UI', sans-serif",
    displayFamily: "'Palatino Linotype', 'Book Antiqua', serif",
    buttonFamily: "'Palatino Linotype', 'Book Antiqua', serif",
    buttonWeight: 700,
    buttonLetterSpacing: "0.05em",
    buttonTransform: "uppercase",
  },
  layout: {
    timerPanelMaxWidth: "100%",
    timerPanelMinHeight: "220px",
    timerPanelOverlayOpacity: 0.94,
    actionButtonMinHeight: "4.2rem",
    squareButtonMinHeight: "4.2rem",
  },
};

const skins: SkinProfile[] = [minimalSkin, warmSkin];

const skinById = new Map<SkinId, SkinProfile>(
  skins.map((skin) => [skin.id, skin]),
);

export const DEFAULT_SKIN_ID: SkinId = "minimal";

export function listSkins(): SkinProfile[] {
  return skins;
}

export function getSkinById(skinId: string): SkinProfile {
  if (skinById.has(skinId as SkinId)) {
    return skinById.get(skinId as SkinId)!;
  }

  return skinById.get(DEFAULT_SKIN_ID)!;
}

export function isSkinId(value: string): value is SkinId {
  return skinById.has(value as SkinId);
}
