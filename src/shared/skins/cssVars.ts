import type { CSSProperties } from "react";
import {
  SKIN_ASPECT_RATIO_FALLBACK_KEYS,
  SKIN_CURSOR_ASSET_KEYS,
  SKIN_FALLBACK_CONTRACT,
  SKIN_IMAGE_ASSET_KEYS,
  type SkinAssets,
  type SkinCursorAsset,
  type SkinCursorAssetKey,
  type SkinCursorFallbackKeyword,
  type SkinImageAsset,
  type SkinImageAssetKey,
  type SkinProfile,
} from "./types";

type SkinCSSVariables = CSSProperties & Record<`--${string}`, string>;

const IMAGE_ASSET_TO_CSS_VARIABLE: Record<
  SkinImageAssetKey,
  `--skin-${string}`
> = {
  pageBackground: "--skin-page-background-image",
  timerPanelDesktop: "--skin-timer-panel-desktop-image",
  timerPanelMobile: "--skin-timer-panel-mobile-image",
  profileFrame: "--skin-profile-frame-image",
  avatarIdle: "--skin-avatar-idle-image",
  avatarFocused: "--skin-avatar-focused-image",
  toolbarButtonFrame: "--skin-toolbar-button-frame-image",
  toolbarSettingsIcon: "--skin-toolbar-settings-icon-image",
  toolbarThemeIcon: "--skin-toolbar-theme-icon-image",
  modeControlFrame: "--skin-mode-control-frame-image",
  focusModeIcon: "--skin-focus-mode-icon-image",
  breakModeIcon: "--skin-break-mode-icon-image",
  primaryActionFrame: "--skin-primary-action-frame-image",
  heatmapPanel: "--skin-heatmap-panel-image",
  statsPanel: "--skin-stats-panel-image",
};

const CURSOR_ASSET_TO_CSS_VARIABLE: Record<
  SkinCursorAssetKey,
  `--skin-${string}`
> = {
  cursorDefault: "--skin-cursor-default",
  cursorPointer: "--skin-cursor-pointer",
  cursorText: "--skin-cursor-text",
  cursorDisabled: "--skin-cursor-disabled",
};

const ASPECT_RATIO_TO_CSS_VARIABLE: Record<
  (typeof SKIN_ASPECT_RATIO_FALLBACK_KEYS)[number],
  `--skin-${string}`
> = {
  timerPanelDesktop: "--skin-timer-panel-desktop-aspect-ratio",
  timerPanelMobile: "--skin-timer-panel-mobile-aspect-ratio",
  profileFrame: "--skin-profile-frame-aspect-ratio",
  toolbarButtonFrame: "--skin-toolbar-button-frame-aspect-ratio",
  modeControlFrame: "--skin-mode-control-frame-aspect-ratio",
  primaryActionFrame: "--skin-primary-action-frame-aspect-ratio",
  heatmapPanel: "--skin-heatmap-panel-aspect-ratio",
  statsPanel: "--skin-stats-panel-aspect-ratio",
};

type ImageCssVariableName =
  (typeof IMAGE_ASSET_TO_CSS_VARIABLE)[SkinImageAssetKey];
type CursorCssVariableName =
  (typeof CURSOR_ASSET_TO_CSS_VARIABLE)[SkinCursorAssetKey];
type AspectRatioCssVariableName =
  (typeof ASPECT_RATIO_TO_CSS_VARIABLE)[(typeof SKIN_ASPECT_RATIO_FALLBACK_KEYS)[number]];

function toImageVariable(asset: SkinImageAsset | null) {
  return asset
    ? `url("${asset.src}")`
    : SKIN_FALLBACK_CONTRACT.imageCssValueForMissingAsset;
}

function toCursorVariable(
  asset: SkinCursorAsset | null,
  fallback: SkinCursorFallbackKeyword,
) {
  if (!asset) {
    return fallback;
  }

  return `url("${asset.src}") ${asset.hotspotX} ${asset.hotspotY}, ${fallback}`;
}

function mapImageAssetVariables(
  assets: SkinAssets,
): Record<ImageCssVariableName, string> {
  const entries = SKIN_IMAGE_ASSET_KEYS.map((key) => [
    IMAGE_ASSET_TO_CSS_VARIABLE[key],
    toImageVariable(assets[key]),
  ] as const);

  return Object.fromEntries(entries) as Record<ImageCssVariableName, string>;
}

function mapCursorVariables(
  assets: SkinAssets,
): Record<CursorCssVariableName, string> {
  const entries = SKIN_CURSOR_ASSET_KEYS.map((key) => [
    CURSOR_ASSET_TO_CSS_VARIABLE[key],
    toCursorVariable(
      assets[key],
      SKIN_FALLBACK_CONTRACT.cursorCssFallbackKeywords[key],
    ),
  ] as const);

  return Object.fromEntries(entries) as Record<CursorCssVariableName, string>;
}

function mapAspectRatioVariables(
  assets: SkinAssets,
): Record<AspectRatioCssVariableName, string> {
  const entries = SKIN_ASPECT_RATIO_FALLBACK_KEYS.map((key) => [
    ASPECT_RATIO_TO_CSS_VARIABLE[key],
    String(
      assets[key]?.aspectRatio ?? SKIN_FALLBACK_CONTRACT.aspectRatioDefaults[key],
    ),
  ] as const);

  return Object.fromEntries(entries) as Record<AspectRatioCssVariableName, string>;
}

export function mapSkinToCssVariables(skin: SkinProfile): SkinCSSVariables {
  return {
    "--dashboard-bg": skin.colors.dashboardBg,
    "--dashboard-surface": skin.colors.surface,
    "--dashboard-surface-raised": skin.colors.surfaceRaised,
    "--dashboard-surface-inset": skin.colors.surfaceInset,
    "--dashboard-panel": skin.colors.panel,
    "--dashboard-panel-border": skin.colors.panelBorder,
    "--dashboard-panel-inner": skin.colors.panelInner,
    "--dashboard-text": skin.colors.text,
    "--dashboard-text-dark": skin.colors.textDark,
    "--dashboard-text-muted": skin.colors.textMuted,
    "--dashboard-stroke-soft": skin.colors.strokeSoft,
    "--dashboard-button": skin.colors.button,
    "--dashboard-button-active": skin.colors.buttonActive,
    "--dashboard-button-text": skin.colors.buttonText,
    "--dashboard-input": skin.colors.input,
    "--dashboard-track": skin.colors.track,
    "--dashboard-fill": skin.colors.fill,
    "--dashboard-accent": skin.colors.accent,
    "--dashboard-timeline-focus": skin.colors.timelineFocus,
    "--dashboard-timeline-break": skin.colors.timelineBreak,
    "--dashboard-toolbar-bg": skin.colors.toolbarBg,
    "--dashboard-toolbar-border": skin.colors.toolbarBorder,
    "--dashboard-modal-overlay": skin.colors.modalOverlay,
    "--dashboard-modal-surface": skin.colors.modalSurface,
    "--dashboard-modal-border": skin.colors.modalBorder,
    "--dashboard-shadow-raised": skin.colors.shadowRaised,
    "--dashboard-shadow-inset": skin.colors.shadowInset,
    "--dashboard-shadow-glow": skin.colors.shadowGlow,
    "--dashboard-font-family": skin.typography.baseFamily,
    "--dashboard-display-font-family": skin.typography.displayFamily,
    "--dashboard-button-font-family": skin.typography.buttonFamily,
    "--dashboard-font-style": skin.typography.baseStyle,
    "--dashboard-display-font-style": skin.typography.displayStyle,
    "--dashboard-button-font-style": skin.typography.buttonStyle,
    "--dashboard-button-font-weight": String(skin.typography.buttonWeight),
    "--dashboard-button-letter-spacing": skin.typography.buttonLetterSpacing,
    "--dashboard-button-text-transform": skin.typography.buttonTransform,
    ...mapImageAssetVariables(skin.assets),
    ...mapCursorVariables(skin.assets),
    ...mapAspectRatioVariables(skin.assets),
    "--skin-timer-panel-max-width": skin.layout.timerPanelMaxWidth,
    "--skin-timer-panel-min-height": skin.layout.timerPanelMinHeight,
    "--skin-timer-panel-overlay-opacity": String(
      skin.layout.timerPanelOverlayOpacity,
    ),
    "--skin-action-button-min-height": skin.layout.actionButtonMinHeight,
    "--skin-square-button-min-height": skin.layout.squareButtonMinHeight,
    "--dashboard-panel-radius": skin.layout.panelRadius,
    "--dashboard-button-radius": skin.layout.buttonRadius,
    "--dashboard-modal-radius": skin.layout.modalRadius,
  };
}
