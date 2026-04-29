import { buildImageAsset } from "./assetUtils";
import type { SkinAmbientEffect, SkinId, SkinProfile } from "./types";

const warmAmbientEffect: SkinAmbientEffect = {
  kind: "embers",
  count: 100,
  seed: 0x1f2e3d4c,
  colors: [
    "rgba(255, 119, 49, 0.92)",
    "rgba(255, 157, 72, 0.88)",
    "rgba(255, 205, 126, 0.82)",
    "rgba(252, 252, 252, 0.84)",
  ],
  sizeRangePx: [2.8, 6.2],
  durationRangeSec: [10, 17],
  delayRangeSec: [-17, 0],
  opacityRange: [0.34, 0.82],
  startXRangePercent: [0, 100],
  startYRangePercent: [100, 100],
  travelXRangeVw: [0, 0],
  travelYRangeSvh: [-128, -108],
  driftRangeVw: [-9, 9],
};

const warmForegroundEffect: SkinAmbientEffect = {
  kind: "embers",
  count: 44,
  seed: 0x2a3b4c5d,
  colors: [
    "rgba(255, 180, 87, 0.78)",
    "rgba(255, 126, 44, 0.72)",
    "rgba(255, 229, 160, 0.66)",
    "rgba(255, 252, 236, 0.72)",
  ],
  sizeRangePx: [1.8, 4.8],
  durationRangeSec: [8, 15],
  delayRangeSec: [-15, 0],
  opacityRange: [0.18, 0.5],
  startXRangePercent: [2, 98],
  startYRangePercent: [78, 102],
  travelXRangeVw: [-4, 4],
  travelYRangeSvh: [-96, -64],
  driftRangeVw: [-12, 12],
};

const vikingAmbientEffect: SkinAmbientEffect = {
  kind: "snow",
  count: 120,
  seed: 0x5f6a7b8c,
  colors: [
    "rgba(238, 246, 255, 0.86)",
    "rgba(201, 216, 229, 0.72)",
    "rgba(160, 174, 190, 0.58)",
    "rgba(255, 255, 255, 0.76)",
  ],
  sizeRangePx: [1.4, 4.4],
  durationRangeSec: [17, 34],
  delayRangeSec: [-34, 0],
  opacityRange: [0.18, 0.62],
  startXRangePercent: [-8, 2],
  startYRangePercent: [4, 94],
  travelXRangeVw: [108, 128],
  travelYRangeSvh: [-10, 12],
  driftRangeVw: [-4, 7],
};

const vikingForegroundEffect: SkinAmbientEffect = {
  kind: "snow",
  count: 58,
  seed: 0x6c7d8e9f,
  colors: [
    "rgba(244, 251, 255, 0.72)",
    "rgba(215, 231, 245, 0.62)",
    "rgba(201, 216, 229, 0.5)",
    "rgba(255, 255, 255, 0.66)",
  ],
  sizeRangePx: [1.2, 3.8],
  durationRangeSec: [13, 27],
  delayRangeSec: [-27, 0],
  opacityRange: [0.14, 0.42],
  startXRangePercent: [-4, 8],
  startYRangePercent: [0, 96],
  travelXRangeVw: [96, 116],
  travelYRangeSvh: [-12, 16],
  driftRangeVw: [-7, 9],
};

const redLavaModeButton = buildImageAsset(
  "/assets/red_lava_theme/top_control_panel/brek_and_focus_button_background_w335_h95.webp",
  { width: 335, height: 95 },
);
const redLavaSettingsButton = buildImageAsset(
  "/assets/red_lava_theme/exit_icon/exit_button_w150_h150.webp",
  { width: 150, height: 150 },
);
const redLavaSettingsIcon = buildImageAsset(
  "/assets/red_lava_theme/settings_button/settings_icon_100x100.webp",
  { width: 100, height: 100 },
);
const redLavaHistoryIcon = buildImageAsset(
  "/assets/red_lava_theme/history_icon.webp",
  { width: 100, height: 100 },
);
const redLavaExitIcon = buildImageAsset(
  "/assets/red_lava_theme/exit_icon/exit_icon_15x15.webp",
  { width: 15, height: 15 },
);

const warmSkin: SkinProfile = {
  id: "warm",
  label: "Warm",
  description: "Primary warm palette with themed timer controls.",
  capabilities: {
    effects: {
      ambient: warmAmbientEffect,
      foreground: warmForegroundEffect,
    },
    audio: {
      alarm: true,
      primaryTimerControl: true,
      modeControl: true,
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
    modeTabButton: redLavaModeButton,
    focusModeButton: redLavaModeButton,
    breakModeButton: redLavaModeButton,
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
    settingsButton: redLavaSettingsButton,
    settingsIcon: redLavaSettingsIcon,
    historyIcon: redLavaHistoryIcon,
    exitButton: redLavaSettingsButton,
    exitIcon: redLavaExitIcon,
    toolbarButton: redLavaSettingsButton,
    toolbarHistoryIcon: redLavaHistoryIcon,
    toolbarThemeIcon: redLavaSettingsIcon,
    toolbarSettingsIcon: redLavaSettingsIcon,
    toolbarAuthIcon: redLavaExitIcon,
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
    primaryTimerControl: "/sounds/stone_click.mp3",
    modeControl: "/sounds/stone_click.mp3",
    toolbarClick: "/sounds/click_on_elements.mp3",
    focusAmbience: "/sounds/focus_embers_loop.mp3",
  },
  focusAmbienceFadeInMs: 0,
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
    baseStyle: "normal",
    displayStyle: "normal",
    buttonStyle: "normal",
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
      ambient: null,
      foreground: null,
    },
    audio: {
      alarm: false,
      primaryTimerControl: false,
      modeControl: false,
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
    focusModeButton: null,
    breakModeButton: null,
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
    toolbarButton: null,
    toolbarHistoryIcon: null,
    toolbarThemeIcon: null,
    toolbarSettingsIcon: null,
    toolbarAuthIcon: null,
    cursorDefault: null,
    cursorPointer: null,
    cursorText: null,
    cursorDisabled: null,
  },
  audio: {
    alarm: null,
    primaryTimerControl: null,
    modeControl: null,
    toolbarClick: null,
    focusAmbience: null,
  },
  focusAmbienceFadeInMs: 0,
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
    baseStyle: "normal",
    displayStyle: "normal",
    buttonStyle: "normal",
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

const vikingSkin: SkinProfile = {
  id: "viking",
  label: "Viking",
  description: "Frosted Norse theme with carved wood panels and winter ambience.",
  capabilities: {
    effects: {
      ambient: vikingAmbientEffect,
      foreground: vikingForegroundEffect,
    },
    audio: {
      alarm: true,
      primaryTimerControl: true,
      modeControl: true,
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
    pageBackground: buildImageAsset(
      "/assets/Viking Theme/Viking Background.webp",
      { width: 2730, height: 1536 },
    ),
    notesPanel: buildImageAsset("/assets/Viking Theme/Notes panel.webp", {
      width: 342,
      height: 460,
    }),
    heatmapPanel: buildImageAsset("/assets/Viking Theme/heatmap panel.webp", {
      width: 493,
      height: 215,
    }),
    statsPanel: buildImageAsset("/assets/Viking Theme/Stats panel.webp", {
      width: 223,
      height: 213,
    }),
    dragonPanel: buildImageAsset("/assets/Viking Theme/Dragon panel.webp", {
      width: 334,
      height: 209,
    }),
    topControlsPanel: null,
    modeTabButton: null,
    focusModeButton: buildImageAsset("/assets/Viking Theme/Focus button.webp", {
      width: 233,
      height: 76,
    }),
    breakModeButton: buildImageAsset("/assets/Viking Theme/Break button.webp", {
      width: 234,
      height: 76,
    }),
    timerPanel: buildImageAsset("/assets/Viking Theme/Timer panel.webp", {
      width: 769,
      height: 319,
    }),
    timerPanelMobile: buildImageAsset(
      "/assets/Viking Theme/Timer panel square.webp",
      { width: 676, height: 676 },
    ),
    startButton: buildImageAsset("/assets/Viking Theme/Start button.webp", {
      width: 230,
      height: 80,
    }),
    resetButton: buildImageAsset("/assets/Viking Theme/Reset Button.webp", {
      width: 227,
      height: 79,
    }),
    autoFocusButton: null,
    autoBreakButton: null,
    soundButton: null,
    settingsButton: null,
    settingsIcon: null,
    historyIcon: null,
    exitButton: null,
    exitIcon: null,
    toolbarButton: buildImageAsset(
      "/assets/Viking Theme/Background of top buttons.webp",
      { width: 74, height: 70 },
    ),
    toolbarHistoryIcon: buildImageAsset(
      "/assets/Viking Theme/Statistics icon.webp",
      { width: 75, height: 81 },
    ),
    toolbarThemeIcon: buildImageAsset("/assets/Viking Theme/Theme icon.webp", {
      width: 77,
      height: 79,
    }),
    toolbarSettingsIcon: buildImageAsset(
      "/assets/Viking Theme/Settings icon.webp",
      { width: 71, height: 73 },
    ),
    toolbarAuthIcon: buildImageAsset(
      "/assets/Viking Theme/Login Logout icon.webp",
      { width: 74, height: 86 },
    ),
    cursorDefault: {
      src: "/assets/Viking Theme/Cursor/d4-normal-select.cur",
      hotspotX: 0,
      hotspotY: 0,
    },
    cursorPointer: {
      src: "/assets/Viking Theme/Cursor/d4-link-select.cur",
      hotspotX: 0,
      hotspotY: 0,
    },
    cursorText: {
      src: "/assets/Viking Theme/Cursor/d4-text-select.cur",
      hotspotX: 0,
      hotspotY: 0,
    },
    cursorDisabled: {
      src: "/assets/Viking Theme/Cursor/d4-unavailable.cur",
      hotspotX: 0,
      hotspotY: 0,
    },
  },
  audio: {
    alarm:
      "/assets/Viking Theme/Sound effects/Alarm-on-timer-finish-sound.mp3",
    primaryTimerControl:
      "/assets/Viking Theme/Sound effects/Start-Pause-Click.mp3",
    modeControl: "/assets/Viking Theme/Sound effects/Focus-Break-Click.mp3",
    toolbarClick:
      "/assets/Viking Theme/Sound effects/Top buttons sounds  click.mp3",
    focusAmbience:
      "/assets/Viking Theme/Sound effects/Storm, Wind, Winter Background Viking Theme Loop.mp3",
  },
  focusAmbienceFadeInMs: 1800,
  colors: {
    dashboardBg: "#201f21",
    surface: "#313134",
    surfaceRaised: "#434449",
    surfaceInset: "#201f21",
    panel: "#2a2b2f",
    panelBorder: "#6f7d8d",
    panelInner: "#c9d0d8",
    text: "#e8f0f7",
    textDark: "#1f252b",
    textMuted: "#a0aebe",
    strokeSoft: "rgba(201, 208, 216, 0.22)",
    button: "#332a24",
    buttonActive: "#585c65",
    buttonText: "#edf5fb",
    input: "#d9dedf",
    track: "#8696a7",
    fill: "#c9d0d8",
    accent: "#d7e7f5",
    toolbarBg: "rgba(32, 31, 33, 0.42)",
    toolbarBorder: "rgba(201, 208, 216, 0.24)",
    modalOverlay: "rgba(19, 21, 24, 0.74)",
    modalSurface: "#2b2d31",
    modalBorder: "#6f7d8d",
    shadowRaised:
      "0 16px 30px rgba(11, 13, 16, 0.38), inset 0 1px 0 rgba(232, 240, 247, 0.08)",
    shadowInset:
      "inset 0 1px 0 rgba(232, 240, 247, 0.08), inset 0 -1px 0 rgba(12, 14, 16, 0.56)",
    shadowGlow: "0 0 1rem rgba(201, 216, 229, 0.18)",
  },
  typography: {
    baseFamily: "'VikingTimer', 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    displayFamily: "'VikingTimer', 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    buttonFamily: "'VikingTimer', 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    baseStyle: "normal",
    displayStyle: "normal",
    buttonStyle: "normal",
    buttonWeight: 700,
    buttonLetterSpacing: "0.04em",
    buttonTransform: "uppercase",
  },
  layout: {
    timerPanelMaxWidth: "100%",
    timerPanelMinHeight: "220px",
    timerPanelOverlayOpacity: 0.96,
    actionButtonMinHeight: "4.2rem",
    squareButtonMinHeight: "4.2rem",
    panelRadius: "0.4rem",
    buttonRadius: "0.4rem",
    modalRadius: "0",
  },
};

const skinCatalog = {
  warm: warmSkin,
  neumorphism: neumorphismSkin,
  viking: vikingSkin,
} satisfies Record<SkinId, SkinProfile>;

const skins: readonly SkinProfile[] = [
  skinCatalog.warm,
  skinCatalog.neumorphism,
  skinCatalog.viking,
];

const skinById = new Map<SkinId, SkinProfile>([
  ["warm", skinCatalog.warm],
  ["neumorphism", skinCatalog.neumorphism],
  ["viking", skinCatalog.viking],
]);

const legacySkinIds = new Map<string, SkinId>([["soft-form", "neumorphism"]]);

export const DEFAULT_SKIN_ID: SkinId = "viking";

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
