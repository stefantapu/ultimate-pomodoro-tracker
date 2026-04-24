import { describe, expect, it } from "vitest";
import { getSkinById } from "./catalog";
import { mapSkinToCssVariables } from "./cssVars";
import { SKIN_FALLBACK_CONTRACT } from "./types";

const EXPECTED_CSS_VARIABLE_KEYS = [
  "--dashboard-bg",
  "--dashboard-surface",
  "--dashboard-surface-raised",
  "--dashboard-surface-inset",
  "--dashboard-panel",
  "--dashboard-panel-border",
  "--dashboard-panel-inner",
  "--dashboard-text",
  "--dashboard-text-dark",
  "--dashboard-text-muted",
  "--dashboard-stroke-soft",
  "--dashboard-button",
  "--dashboard-button-active",
  "--dashboard-button-text",
  "--dashboard-input",
  "--dashboard-track",
  "--dashboard-fill",
  "--dashboard-accent",
  "--dashboard-toolbar-bg",
  "--dashboard-toolbar-border",
  "--dashboard-modal-overlay",
  "--dashboard-modal-surface",
  "--dashboard-modal-border",
  "--dashboard-shadow-raised",
  "--dashboard-shadow-inset",
  "--dashboard-shadow-glow",
  "--dashboard-font-family",
  "--dashboard-display-font-family",
  "--dashboard-button-font-family",
  "--dashboard-button-font-weight",
  "--dashboard-button-letter-spacing",
  "--dashboard-button-text-transform",
  "--skin-page-background-image",
  "--skin-notes-panel-image",
  "--skin-heatmap-panel-image",
  "--skin-stats-panel-image",
  "--skin-dragon-panel-image",
  "--skin-top-controls-panel-image",
  "--skin-mode-tab-button-image",
  "--skin-timer-panel-image",
  "--skin-timer-panel-image-mobile",
  "--skin-start-button-image",
  "--skin-reset-button-image",
  "--skin-auto-focus-button-image",
  "--skin-auto-break-button-image",
  "--skin-sound-button-image",
  "--skin-settings-button-image",
  "--skin-settings-icon-image",
  "--skin-history-icon-image",
  "--skin-exit-button-image",
  "--skin-exit-icon-image",
  "--skin-cursor-default",
  "--skin-cursor-pointer",
  "--skin-cursor-text",
  "--skin-cursor-disabled",
  "--skin-timer-panel-aspect-ratio",
  "--skin-timer-panel-mobile-aspect-ratio",
  "--skin-action-button-aspect-ratio",
  "--skin-square-button-aspect-ratio",
  "--skin-notes-panel-aspect-ratio",
  "--skin-heatmap-panel-aspect-ratio",
  "--skin-stats-panel-aspect-ratio",
  "--skin-top-controls-panel-aspect-ratio",
  "--skin-mode-tab-button-aspect-ratio",
  "--skin-timer-panel-max-width",
  "--skin-timer-panel-min-height",
  "--skin-timer-panel-overlay-opacity",
  "--skin-action-button-min-height",
  "--skin-square-button-min-height",
  "--dashboard-panel-radius",
  "--dashboard-button-radius",
  "--dashboard-modal-radius",
] as const;

const IMAGE_VARIABLE_KEYS = [
  "--skin-page-background-image",
  "--skin-notes-panel-image",
  "--skin-heatmap-panel-image",
  "--skin-stats-panel-image",
  "--skin-dragon-panel-image",
  "--skin-top-controls-panel-image",
  "--skin-mode-tab-button-image",
  "--skin-timer-panel-image",
  "--skin-timer-panel-image-mobile",
  "--skin-start-button-image",
  "--skin-reset-button-image",
  "--skin-auto-focus-button-image",
  "--skin-auto-break-button-image",
  "--skin-sound-button-image",
  "--skin-settings-button-image",
  "--skin-settings-icon-image",
  "--skin-history-icon-image",
  "--skin-exit-button-image",
  "--skin-exit-icon-image",
] as const;

const CURSOR_VARIABLE_KEYS = [
  "--skin-cursor-default",
  "--skin-cursor-pointer",
  "--skin-cursor-text",
  "--skin-cursor-disabled",
] as const;

describe("mapSkinToCssVariables contract", () => {
  it("keeps emitted CSS variable keys stable", () => {
    const warmVars = mapSkinToCssVariables(getSkinById("warm"));
    const neumorphismVars = mapSkinToCssVariables(getSkinById("neumorphism"));
    const expected = [...EXPECTED_CSS_VARIABLE_KEYS].sort();

    expect(Object.keys(warmVars).sort()).toEqual(expected);
    expect(Object.keys(neumorphismVars).sort()).toEqual(expected);
  });

  it("maps warm skin with concrete asset and cursor URLs", () => {
    const warmVars = mapSkinToCssVariables(getSkinById("warm"));

    for (const key of IMAGE_VARIABLE_KEYS) {
      expect(warmVars[key]).toContain("url(");
      expect(warmVars[key]).not.toBe("none");
    }

    for (const key of CURSOR_VARIABLE_KEYS) {
      expect(warmVars[key]).toContain("url(");
    }
  });

  it("maps neumorphism skin with its page background and fallback optional assets", () => {
    const neumorphismVars = mapSkinToCssVariables(getSkinById("neumorphism"));

    for (const key of IMAGE_VARIABLE_KEYS) {
      if (key === "--skin-page-background-image") {
        expect(neumorphismVars[key]).toContain(
          'url("/assets/Neumorphism/background/neumorphism.webp")',
        );
        continue;
      }

      expect(neumorphismVars[key]).toBe(
        SKIN_FALLBACK_CONTRACT.imageCssValueForMissingAsset,
      );
    }

    expect(neumorphismVars["--skin-cursor-default"]).toBe(
      SKIN_FALLBACK_CONTRACT.cursorCssFallbackKeywords.cursorDefault,
    );
    expect(neumorphismVars["--skin-cursor-pointer"]).toBe(
      SKIN_FALLBACK_CONTRACT.cursorCssFallbackKeywords.cursorPointer,
    );
    expect(neumorphismVars["--skin-cursor-text"]).toBe(
      SKIN_FALLBACK_CONTRACT.cursorCssFallbackKeywords.cursorText,
    );
    expect(neumorphismVars["--skin-cursor-disabled"]).toBe(
      SKIN_FALLBACK_CONTRACT.cursorCssFallbackKeywords.cursorDisabled,
    );

    expect(neumorphismVars["--skin-timer-panel-aspect-ratio"]).toBe(
      String(SKIN_FALLBACK_CONTRACT.aspectRatioDefaults.timerPanel),
    );
    expect(neumorphismVars["--skin-timer-panel-mobile-aspect-ratio"]).toBe(
      String(SKIN_FALLBACK_CONTRACT.aspectRatioDefaults.timerPanelMobile),
    );
    expect(neumorphismVars["--skin-action-button-aspect-ratio"]).toBe(
      String(SKIN_FALLBACK_CONTRACT.aspectRatioDefaults.startButton),
    );
    expect(neumorphismVars["--skin-square-button-aspect-ratio"]).toBe(
      String(SKIN_FALLBACK_CONTRACT.aspectRatioDefaults.autoFocusButton),
    );
    expect(neumorphismVars["--skin-notes-panel-aspect-ratio"]).toBe(
      String(SKIN_FALLBACK_CONTRACT.aspectRatioDefaults.notesPanel),
    );
    expect(neumorphismVars["--skin-heatmap-panel-aspect-ratio"]).toBe(
      String(SKIN_FALLBACK_CONTRACT.aspectRatioDefaults.heatmapPanel),
    );
    expect(neumorphismVars["--skin-stats-panel-aspect-ratio"]).toBe(
      String(SKIN_FALLBACK_CONTRACT.aspectRatioDefaults.statsPanel),
    );
    expect(neumorphismVars["--skin-top-controls-panel-aspect-ratio"]).toBe(
      String(SKIN_FALLBACK_CONTRACT.aspectRatioDefaults.topControlsPanel),
    );
    expect(neumorphismVars["--skin-mode-tab-button-aspect-ratio"]).toBe(
      String(SKIN_FALLBACK_CONTRACT.aspectRatioDefaults.modeTabButton),
    );
  });
});
