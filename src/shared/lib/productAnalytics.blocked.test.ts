import { describe, expect, it, vi } from "vitest";
import { trackProductEvent } from "./productAnalytics";

vi.mock("@vercel/analytics", () => {
  throw new Error("Analytics module blocked by the client");
});

describe("product analytics with a content blocker", () => {
  it("keeps the product action available when the analytics module cannot load", async () => {
    expect(() =>
      trackProductEvent({ name: "seo_cta_click", source: "homepage_cta" }),
    ).not.toThrow();

    await Promise.resolve();
    await Promise.resolve();
  });
});
