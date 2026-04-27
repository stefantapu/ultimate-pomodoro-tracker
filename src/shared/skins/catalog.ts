import { buildImageAsset } from "./assetUtils";
import type { SkinId, SkinProfile } from "./types";

const warmSkin: SkinProfile = {
  id: "warm",
  label: "Warm",
  description: "Primary warm palette with themed timer controls.",
  capabilities: {
    effects: {
      embers: true,
    },
    audio: {
      alarm: true,
      timerControl: true,
      toolbarClick: true,
      focusAmbience: true,
    },
    visual: {
      timerPanelArt: true,
      toolbarIconArt: true,
      customCursors: true,
    },
  },
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
    historyIcon: buildImageAsset("/assets/red_lava_theme/history_icon.webp", {
      width: 100,
      height: 100,
    }),
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
  audio: {
    alarm: "/sounds/alarm.mp3",
    timerControl: "/sounds/stone_click.mp3",
    toolbarClick: "/sounds/click_on_elements.mp3",
    focusAmbience: "/sounds/focus_embers_loop.mp3",
  },
  colors: {
    dashboardBg: "#2b1109",
    surface: "#412016",
    surfaceRaised: "#5a2b19",
    surfaceInset: "#2d1209",
    panel: "#4a1f0f",
    panelBorder: "#8f4b1f",
    panelInner: "#f4d9b7",
    text: "#fff0dc",
    textDark: "#2f1a0d",
    textMuted: "#e7b985",
    strokeSoft: "rgba(255, 195, 134, 0.2)",
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
    shadowRaised:
      "0 16px 28px rgba(13, 4, 2, 0.32), inset 0 1px 0 rgba(255, 221, 174, 0.08)",
    shadowInset:
      "inset 0 1px 0 rgba(255, 217, 164, 0.06), inset 0 -1px 0 rgba(24, 8, 4, 0.48)",
    shadowGlow: "0 0 1rem rgba(255, 120, 39, 0.14)",
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
    panelRadius: "0.4rem",
    buttonRadius: "0.4rem",
    modalRadius: "0",
  },
};

const neumorphismSkin: SkinProfile = {
  id: "neumorphism",
  label: "Neumorphism",
  description:
    "Ultra-light monochrome neumorphic skin with soft depth and calm contrast.",
  capabilities: {
    effects: {
      embers: false,
    },
    audio: {
      alarm: false,
      timerControl: false,
      toolbarClick: false,
      focusAmbience: false,
    },
    visual: {
      timerPanelArt: false,
      toolbarIconArt: false,
      customCursors: false,
    },
  },
  assets: {
    pageBackground: buildImageAsset(
      "/assets/Neumorphism/background/neumorphism.webp",
      { width: 1672, height: 941 },
    ),
    notesPanel: null,
    heatmapPanel: null,
    statsPanel: null,
    dragonPanel: null,
    topControlsPanel: null,
    modeTabButton: null,
    timerPanel: null,
    timerPanelMobile: null,
    startButton: null,
    resetButton: null,
    autoFocusButton: null,
    autoBreakButton: null,
    soundButton: null,
    settingsButton: null,
    settingsIcon: null,
    historyIcon: null,
    exitButton: null,
    exitIcon: null,
    cursorDefault: null,
    cursorPointer: null,
    cursorText: null,
    cursorDisabled: null,
  },
  audio: {
    alarm: null,
    timerControl: null,
    toolbarClick: null,
    focusAmbience: null,
  },
  colors: {
    dashboardBg: "#e8ebef",
    surface: "#eef1f5",
    surfaceRaised: "#f6f8fb",
    surfaceInset: "#e1e5ea",
    panel: "#edf1f5",
    panelBorder: "#d8dde4",
    panelInner: "#f7f9fc",
    text: "#4f5864",
    textDark: "#2f3640",
    textMuted: "#7f8894",
    strokeSoft: "rgba(138, 149, 161, 0.26)",
    button: "#edf1f5",
    buttonActive: "#e3e8ee",
    buttonText: "#39414b",
    input: "#e3e8ee",
    track: "#d7dde5",
    fill: "#8c97a6",
    accent: "#6e7a89",
    toolbarBg: "transparent",
    toolbarBorder: "transparent",
    modalOverlay: "rgba(224, 229, 235, 0.74)",
    modalSurface: "#edf1f5",
    modalBorder: "#d4dae2",
    shadowRaised:
      "12px 12px 28px rgba(177, 186, 196, 0.58), -12px -12px 26px rgba(255, 255, 255, 0.94)",
    shadowInset:
      "inset 7px 7px 14px rgba(192, 199, 208, 0.62), inset -7px -7px 14px rgba(255, 255, 255, 0.98)",
    shadowGlow: "0 18px 38px rgba(163, 171, 181, 0.22)",
  },
  typography: {
    baseFamily: "'DM Sans', 'Segoe UI', sans-serif",
    displayFamily: "'DM Sans', 'Segoe UI', sans-serif",
    buttonFamily: "'DM Sans', 'Segoe UI', sans-serif",
    buttonWeight: 600,
    buttonLetterSpacing: "0.02em",
    buttonTransform: "none",
  },
  layout: {
    timerPanelMaxWidth: "100%",
    timerPanelMinHeight: "220px",
    timerPanelOverlayOpacity: 0,
    actionButtonMinHeight: "4.2rem",
    squareButtonMinHeight: "4.2rem",
    panelRadius: "2rem",
    buttonRadius: "999px",
    modalRadius: "2rem",
  },
};

const skinCatalog = {
  warm: warmSkin,
  neumorphism: neumorphismSkin,
} satisfies Record<SkinId, SkinProfile>;

const skins: readonly SkinProfile[] = [
  skinCatalog.warm,
  skinCatalog.neumorphism,
];

const skinById = new Map<SkinId, SkinProfile>([
  ["warm", skinCatalog.warm],
  ["neumorphism", skinCatalog.neumorphism],
]);

const legacySkinIds = new Map<string, SkinId>([["soft-form", "neumorphism"]]);

export const DEFAULT_SKIN_ID: SkinId = "warm";

export function listSkins(): readonly SkinProfile[] {
  return skins;
}

export function getSkinById(skinId: string): SkinProfile {
  const legacySkinId = legacySkinIds.get(skinId);

  if (legacySkinId) {
    return skinById.get(legacySkinId)!;
  }

  if (skinById.has(skinId as SkinId)) {
    return skinById.get(skinId as SkinId)!;
  }

  return skinById.get(DEFAULT_SKIN_ID)!;
}

export function isSkinId(value: string): value is SkinId {
  return skinById.has(value as SkinId);
}
