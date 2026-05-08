import { describe, expect, it } from "vitest";
import { createPreviewHeatmapData } from "./previewHeatmapData";

describe("createPreviewHeatmapData", () => {
  it("creates a deterministic 183-day heatmap ending today", () => {
    const today = new Date("2026-05-08T12:30:00");
    const firstRun = createPreviewHeatmapData(today);
    const secondRun = createPreviewHeatmapData(today);

    expect(firstRun).toEqual(secondRun);
    expect(firstRun).toHaveLength(183);
    expect(firstRun[0].date).toBe("2025-11-07");
    expect(firstRun.at(-1)?.date).toBe("2026-05-08");
  });

  it("keeps preview focus values realistic between 0 and 4 hours", () => {
    const previewData = createPreviewHeatmapData(
      new Date("2026-05-08T12:30:00"),
    );
    const values = previewData.map((day) => day.value);

    expect(Math.min(...values)).toBe(0);
    expect(Math.max(...values)).toBe(4 * 60 * 60);
    expect(values.every((value) => value >= 0 && value <= 4 * 60 * 60)).toBe(
      true,
    );
  });
});
