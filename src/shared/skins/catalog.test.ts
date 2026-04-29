import { describe, expect, it } from "vitest";
import {
  DEFAULT_SKIN_ID,
  getSkinById,
  isSkinId,
  listSkins,
} from "./catalog";
import {
  SKIN_AUDIO_ASSET_KEYS,
  SKIN_CURSOR_ASSET_KEYS,
  SKIN_IMAGE_ASSET_KEYS,
} from "./types";

describe("skin catalog contract", () => {
  it("returns the declared skins with unique ids", () => {
    const skins = listSkins();
    const ids = skins.map((skin) => skin.id);

    expect(ids).toEqual(["warm", "neumorphism", "viking"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ensures each skin entry exposes all required contract sections", () => {
    for (const skin of listSkins()) {
      for (const key of SKIN_IMAGE_ASSET_KEYS) {
        expect(key in skin.assets).toBe(true);
      }

      for (const key of SKIN_CURSOR_ASSET_KEYS) {
        expect(key in skin.assets).toBe(true);
      }

      for (const key of SKIN_AUDIO_ASSET_KEYS) {
        expect(key in skin.audio).toBe(true);
      }

      if (skin.capabilities.effects.ambient) {
        expect(["embers", "snow"]).toContain(
          skin.capabilities.effects.ambient.kind,
        );
      }
      if (skin.capabilities.effects.foreground) {
        expect(["embers", "snow"]).toContain(
          skin.capabilities.effects.foreground.kind,
        );
      }
      expect(typeof skin.capabilities.audio.alarm).toBe("boolean");
      expect(typeof skin.capabilities.audio.primaryTimerControl).toBe(
        "boolean",
      );
      expect(typeof skin.capabilities.audio.modeControl).toBe("boolean");
      expect(typeof skin.capabilities.audio.toolbarClick).toBe("boolean");
      expect(typeof skin.capabilities.audio.focusAmbience).toBe("boolean");
      expect(typeof skin.capabilities.visual.timerPanelArt).toBe("boolean");
      expect(typeof skin.capabilities.visual.toolbarIconArt).toBe("boolean");
      expect(typeof skin.capabilities.visual.customCursors).toBe("boolean");
    }
  });

  it("resolves known ids and falls back unknown ids to default", () => {
    const warm = getSkinById("warm");
    const neumorphism = getSkinById("neumorphism");
    const viking = getSkinById("viking");
    const legacyNeumorphism = getSkinById("soft-form");
    const fallback = getSkinById("unknown-skin-id");

    expect(warm.id).toBe("warm");
    expect(neumorphism.id).toBe("neumorphism");
    expect(viking.id).toBe("viking");
    expect(legacyNeumorphism.id).toBe("neumorphism");
    expect(fallback.id).toBe(DEFAULT_SKIN_ID);
  });

  it("uses Viking as the default skin", () => {
    expect(DEFAULT_SKIN_ID).toBe("viking");
    expect(getSkinById("unknown-skin-id").id).toBe("viking");
  });

  it("validates ids through isSkinId", () => {
    expect(isSkinId("warm")).toBe(true);
    expect(isSkinId("neumorphism")).toBe(true);
    expect(isSkinId("viking")).toBe(true);
    expect(isSkinId("unknown")).toBe(false);
  });

  it("maps expanded audio roles without changing warm and silent neumorphism behavior", () => {
    expect(getSkinById("warm").audio).toMatchObject({
      alarm: "/sounds/alarm.mp3",
      primaryTimerControl: "/sounds/stone_click.mp3",
      modeControl: "/sounds/stone_click.mp3",
      toolbarClick: "/sounds/click_on_elements.mp3",
    });
    expect(getSkinById("neumorphism").audio).toEqual({
      alarm: null,
      primaryTimerControl: null,
      modeControl: null,
      toolbarClick: null,
      focusAmbience: null,
    });
    expect(getSkinById("viking").audio).toMatchObject({
      alarm:
        "/assets/Viking Theme/Sound effects/Alarm-on-timer-finish-sound.mp3",
      primaryTimerControl:
        "/assets/Viking Theme/Sound effects/Start-Pause-Click.mp3",
      modeControl: "/assets/Viking Theme/Sound effects/Focus-Break-Click.mp3",
      toolbarClick:
        "/assets/Viking Theme/Sound effects/Top buttons sounds  click.mp3",
    });
  });
});
