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

    expect(ids).toEqual(["warm", "soft-form"]);
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

      expect(typeof skin.capabilities.effects.embers).toBe("boolean");
      expect(typeof skin.capabilities.audio.alarm).toBe("boolean");
      expect(typeof skin.capabilities.audio.timerControl).toBe("boolean");
      expect(typeof skin.capabilities.audio.toolbarClick).toBe("boolean");
      expect(typeof skin.capabilities.audio.focusAmbience).toBe("boolean");
      expect(typeof skin.capabilities.visual.timerPanelArt).toBe("boolean");
      expect(typeof skin.capabilities.visual.toolbarIconArt).toBe("boolean");
      expect(typeof skin.capabilities.visual.customCursors).toBe("boolean");
    }
  });

  it("resolves known ids and falls back unknown ids to default", () => {
    const warm = getSkinById("warm");
    const softForm = getSkinById("soft-form");
    const fallback = getSkinById("unknown-skin-id");

    expect(warm.id).toBe("warm");
    expect(softForm.id).toBe("soft-form");
    expect(fallback.id).toBe(DEFAULT_SKIN_ID);
  });

  it("validates ids through isSkinId", () => {
    expect(isSkinId("warm")).toBe(true);
    expect(isSkinId("soft-form")).toBe(true);
    expect(isSkinId("unknown")).toBe(false);
  });
});
