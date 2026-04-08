import type { CSSProperties } from "react";
import type { SkinCursorAsset, SkinImageAsset, SkinProfile } from "./types";

type SkinCSSVariables = CSSProperties & Record<`--${string}`, string>;

function toImageVariable(asset: SkinImageAsset | null) {
  return asset ? `url("${asset.src}")` : "none";
}

function toCursorVariable(asset: SkinCursorAsset | null, fallback: string) {
  if (!asset) {
    return fallback;
  }

  return `url("${asset.src}") ${asset.hotspotX} ${asset.hotspotY}, ${fallback}`;
}

export function mapSkinToCssVariables(skin: SkinProfile): SkinCSSVariables {
  return {
    "--dashboard-bg": skin.colors.dashboardBg,
    "--dashboard-panel": skin.colors.panel,
    "--dashboard-panel-border": skin.colors.panelBorder,
    "--dashboard-panel-inner": skin.colors.panelInner,
    "--dashboard-text": skin.colors.text,
    "--dashboard-text-dark": skin.colors.textDark,
    "--dashboard-text-muted": skin.colors.textMuted,
    "--dashboard-button": skin.colors.button,
    "--dashboard-button-active": skin.colors.buttonActive,
    "--dashboard-button-text": skin.colors.buttonText,
    "--dashboard-input": skin.colors.input,
    "--dashboard-track": skin.colors.track,
    "--dashboard-fill": skin.colors.fill,
    "--dashboard-accent": skin.colors.accent,
    "--dashboard-toolbar-bg": skin.colors.toolbarBg,
    "--dashboard-toolbar-border": skin.colors.toolbarBorder,
    "--dashboard-modal-overlay": skin.colors.modalOverlay,
    "--dashboard-modal-surface": skin.colors.modalSurface,
    "--dashboard-modal-border": skin.colors.modalBorder,
    "--dashboard-font-family": skin.typography.baseFamily,
    "--dashboard-display-font-family": skin.typography.displayFamily,
    "--dashboard-button-font-family": skin.typography.buttonFamily,
    "--dashboard-button-font-weight": String(skin.typography.buttonWeight),
    "--dashboard-button-letter-spacing": skin.typography.buttonLetterSpacing,
    "--dashboard-button-text-transform": skin.typography.buttonTransform,
    "--skin-page-background-image": toImageVariable(skin.assets.pageBackground),
    "--skin-notes-panel-image": toImageVariable(skin.assets.notesPanel),
    "--skin-heatmap-panel-image": toImageVariable(skin.assets.heatmapPanel),
    "--skin-stats-panel-image": toImageVariable(skin.assets.statsPanel),
    "--skin-dragon-panel-image": toImageVariable(skin.assets.dragonPanel),
    "--skin-top-controls-panel-image": toImageVariable(skin.assets.topControlsPanel),
    "--skin-mode-tab-button-image": toImageVariable(skin.assets.modeTabButton),
    "--skin-timer-panel-image": toImageVariable(skin.assets.timerPanel),
    "--skin-timer-panel-image-mobile": toImageVariable(
      skin.assets.timerPanelMobile,
    ),
    "--skin-start-button-image": toImageVariable(skin.assets.startButton),
    "--skin-reset-button-image": toImageVariable(skin.assets.resetButton),
    "--skin-auto-focus-button-image": toImageVariable(skin.assets.autoFocusButton),
    "--skin-auto-break-button-image": toImageVariable(skin.assets.autoBreakButton),
    "--skin-sound-button-image": toImageVariable(skin.assets.soundButton),
    "--skin-settings-button-image": toImageVariable(skin.assets.settingsButton),
    "--skin-settings-icon-image": toImageVariable(skin.assets.settingsIcon),
    "--skin-history-icon-image": toImageVariable(skin.assets.historyIcon),
    "--skin-exit-button-image": toImageVariable(skin.assets.exitButton),
    "--skin-exit-icon-image": toImageVariable(skin.assets.exitIcon),
    "--skin-cursor-default": toCursorVariable(
      skin.assets.cursorDefault,
      "auto",
    ),
    "--skin-cursor-pointer": toCursorVariable(
      skin.assets.cursorPointer,
      "pointer",
    ),
    "--skin-cursor-text": toCursorVariable(skin.assets.cursorText, "text"),
    "--skin-cursor-disabled": toCursorVariable(
      skin.assets.cursorDisabled,
      "not-allowed",
    ),
    "--skin-timer-panel-aspect-ratio": String(
      skin.assets.timerPanel?.aspectRatio ?? 2.68,
    ),
    "--skin-timer-panel-mobile-aspect-ratio": String(
      skin.assets.timerPanelMobile?.aspectRatio ?? 1,
    ),
    "--skin-action-button-aspect-ratio": String(
      skin.assets.startButton?.aspectRatio ?? 3,
    ),
    "--skin-square-button-aspect-ratio": String(
      skin.assets.autoFocusButton?.aspectRatio ?? 1,
    ),
    "--skin-notes-panel-aspect-ratio": String(
      skin.assets.notesPanel?.aspectRatio ?? 0.76,
    ),
    "--skin-heatmap-panel-aspect-ratio": String(
      skin.assets.heatmapPanel?.aspectRatio ?? 2.39,
    ),
    "--skin-stats-panel-aspect-ratio": String(
      skin.assets.statsPanel?.aspectRatio ?? 0.8967,
    ),
    "--skin-top-controls-panel-aspect-ratio": String(
      skin.assets.topControlsPanel?.aspectRatio ?? 6.5,
    ),
    "--skin-mode-tab-button-aspect-ratio": String(
      skin.assets.modeTabButton?.aspectRatio ?? 3.53,
    ),
    "--skin-timer-panel-max-width": skin.layout.timerPanelMaxWidth,
    "--skin-timer-panel-min-height": skin.layout.timerPanelMinHeight,
    "--skin-timer-panel-overlay-opacity": String(
      skin.layout.timerPanelOverlayOpacity,
    ),
    "--skin-action-button-min-height": skin.layout.actionButtonMinHeight,
    "--skin-square-button-min-height": skin.layout.squareButtonMinHeight,
  };
}

