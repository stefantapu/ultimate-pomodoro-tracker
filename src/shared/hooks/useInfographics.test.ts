import { describe, expect, it } from "vitest";
import { getLocalISODate, shiftISODate } from "./useInfographics";

describe("useInfographics date helpers", () => {
  it("formats a date into a local ISO date string", () => {
    expect(getLocalISODate(new Date(2026, 3, 15))).toBe("2026-04-15");
  });

  it("shifts an ISO date across month boundaries", () => {
    expect(shiftISODate("2026-03-31", 1)).toBe("2026-04-01");
    expect(shiftISODate("2026-01-01", -1)).toBe("2025-12-31");
  });
});
