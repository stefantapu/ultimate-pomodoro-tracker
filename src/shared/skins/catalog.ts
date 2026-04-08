import { buildImageAsset } from "./assetUtils";
import type { SkinId, SkinProfile } from "./types";

const warmSkin: SkinProfile = {
  id: "warm",
  label: "Warm",
  description: "Primary warm palette with themed timer controls.",
  assets: {
    pageBackground: buildImageAsset("/assets/red_lava_theme/background.webp", {
      width: 1920,
      height: 1080,
    }),
    notesPanel: buildImageAsset(
      "/assets/red_lava_theme/notes_panel/notes_panel_w545_h717.webp",
      { width: 545, height: 717 },
    ),
    heatmapPanel: buildImageAsset(
      "/assets/red_lava_theme/heatmap_panel/heatmap_panel_w920_h384.webp",
      { width: 920, height: 384 },
    ),
    statsPanel: buildImageAsset(
      "/assets/red_lava_theme/stats_panel/stats_panel_w334_h489.webp",
      { width: 191, height: 213 },
    ),
    dragonPanel: buildImageAsset(
      "/assets/red_lava_theme/dragon_panel/dragon_panel.webp",
      { width: 545, height: 351 },
    ),
    topControlsPanel: buildImageAsset(
      "/assets/red_lava_theme/top_control_panel/top_panel_w1303_h200.webp",
      { width: 1303, height: 200 },
    ),
    modeTabButton: buildImageAsset(
      "/assets/red_lava_theme/top_control_panel/brek_and_focus_button_background_w335_h95.webp",
      { width: 335, height: 95 },
    ),
    timerPanel: buildImageAsset(
      "/assets/red_lava_theme/timer_panel_w1047_h390.webp",
      { width: 1047, height: 390 },
    ),
    timerPanelMobile: buildImageAsset(
      "/assets/red_lava_theme/timer_panel/timer_panel_square_mobile.webp",
      { width: 1, height: 1 },
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
    settingsButton: buildImageAsset(
      "/assets/red_lava_theme/exit_icon/exit_button_w150_h150.webp",
      { width: 150, height: 150 },
    ),
    settingsIcon: buildImageAsset(
      "/assets/red_lava_theme/settings_button/settings_icon_100x100.webp",
      { width: 100, height: 100 },
    ),
    exitButton: buildImageAsset(
      "/assets/red_lava_theme/exit_icon/exit_button_w150_h150.webp",
      { width: 150, height: 150 },
    ),
    exitIcon: buildImageAsset(
      "/assets/red_lava_theme/exit_icon/exit_icon_15x15.webp",
      { width: 15, height: 15 },
    ),
    cursorDefault: {
      src: "/assets/red_lava_theme/cursors/diablo/DII.cur",
      hotspotX: 0,
      hotspotY: 5,
    },
    cursorPointer: {
      src: "/assets/red_lava_theme/cursors/diablo/DII-Link.cur",
      hotspotX: 0,
      hotspotY: 5,
    },
    cursorText: {
      src: "/assets/red_lava_theme/cursors/diablo/DII-Beam.cur",
      hotspotX: 0,
      hotspotY: 9,
    },
    cursorDisabled: {
      src: "/assets/red_lava_theme/cursors/diablo/DII-No.cur",
      hotspotX: 0,
      hotspotY: 10,
    },
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
    baseFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    displayFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    buttonFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
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

const skins: SkinProfile[] = [warmSkin];

const skinById = new Map<SkinId, SkinProfile>(
  skins.map((skin) => [skin.id, skin]),
);

export const DEFAULT_SKIN_ID: SkinId = "warm";

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

