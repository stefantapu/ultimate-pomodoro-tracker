import { describe, expect, it } from "vitest";
import { hasPrerenderedHomepageContent } from "./homepageHydration";

describe("homepage content hydration", () => {
  it("client-renders when development HTML contains only the build marker", () => {
    const container = document.createElement("div");
    container.append(document.createComment("homepage-content"));

    expect(hasPrerenderedHomepageContent(container)).toBe(false);
  });

  it("hydrates when the production build contains prerendered markup", () => {
    const container = document.createElement("div");
    container.append(document.createElement("section"));

    expect(hasPrerenderedHomepageContent(container)).toBe(true);
  });
});
