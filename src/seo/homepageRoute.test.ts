import { describe, expect, it } from "vitest";
import { shouldRenderHomepageContent } from "./homepageRoute";

describe("homepage content route", () => {
  it("includes the content only on the homepage", () => {
    expect(shouldRenderHomepageContent("/")).toBe(true);
    expect(shouldRenderHomepageContent("/privacy")).toBe(false);
    expect(shouldRenderHomepageContent("/terms/")).toBe(false);
  });
});
