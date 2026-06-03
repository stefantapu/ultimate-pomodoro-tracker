import { describe, expect, it } from "vitest";
import { getLevelProgress } from "./levelProgress";

describe("getLevelProgress", () => {
  it("calculates progress inside the current quadratic level band", () => {
    expect(getLevelProgress(375, 2)).toEqual({
      xpInCurrentLevel: 275,
      xpRequiredForNext: 300,
      progressPct: 91.66666666666666,
    });
  });

  it("clamps invalid or overflowing progress", () => {
    expect(getLevelProgress(-50, 0)).toEqual({
      xpInCurrentLevel: 0,
      xpRequiredForNext: 100,
      progressPct: 0,
    });
    expect(getLevelProgress(2000, 2).progressPct).toBe(100);
  });
});
