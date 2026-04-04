import type { SkinImageAsset } from "./types";

const DIMENSION_PATTERN = /_w(?<width>\d+)_h(?<height>\d+)(?:\.[a-z0-9]+)?$/i;

type ParsedAssetDimensions = {
  width: number;
  height: number;
};

export function parseAssetDimensionsFromFilename(
  assetPath: string,
): ParsedAssetDimensions | null {
  const fileName = assetPath.split("/").at(-1);

  if (!fileName) {
    return null;
  }

  const matches = fileName.match(DIMENSION_PATTERN);

  if (!matches?.groups?.width || !matches.groups.height) {
    return null;
  }

  const width = Number(matches.groups.width);
  const height = Number(matches.groups.height);

  if (
    Number.isNaN(width) ||
    Number.isNaN(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return { width, height };
}

export function buildImageAsset(
  src: string,
  fallbackDimensions: ParsedAssetDimensions = { width: 1, height: 1 },
): SkinImageAsset {
  const parsedDimensions = parseAssetDimensionsFromFilename(src) ?? fallbackDimensions;

  return {
    src,
    width: parsedDimensions.width,
    height: parsedDimensions.height,
    aspectRatio: parsedDimensions.width / parsedDimensions.height,
  };
}

