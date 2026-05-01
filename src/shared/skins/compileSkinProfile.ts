import {
  SKIN_AUDIO_ASSET_KEYS,
  SKIN_CURSOR_ASSET_KEYS,
  SKIN_IMAGE_ASSET_KEYS,
  type SkinAssets,
  type SkinAudio,
  type SkinCursorAssetKey,
  type SkinImageAssetKey,
  type SkinProfile,
} from "./types";

export type SkinDefinition = Omit<SkinProfile, "assets" | "audio"> & {
  assets?: Partial<SkinAssets>;
  audio?: Partial<SkinAudio>;
};

function normalizeAssets(assets: Partial<SkinAssets> = {}): SkinAssets {
  const imageAssets = Object.fromEntries(
    SKIN_IMAGE_ASSET_KEYS.map((key) => [key, assets[key] ?? null]),
  ) as Record<SkinImageAssetKey, SkinAssets[SkinImageAssetKey]>;
  const cursorAssets = Object.fromEntries(
    SKIN_CURSOR_ASSET_KEYS.map((key) => [key, assets[key] ?? null]),
  ) as Record<SkinCursorAssetKey, SkinAssets[SkinCursorAssetKey]>;

  return {
    ...imageAssets,
    ...cursorAssets,
  };
}

function normalizeAudio(audio: Partial<SkinAudio> = {}): SkinAudio {
  return Object.fromEntries(
    SKIN_AUDIO_ASSET_KEYS.map((key) => [key, audio[key] ?? null]),
  ) as SkinAudio;
}

export function createSkinProfile(definition: SkinDefinition): SkinProfile {
  return {
    ...definition,
    assets: normalizeAssets(definition.assets),
    audio: normalizeAudio(definition.audio),
  };
}
