import { describe, expect, it } from "vitest";
import { getPageMetadata, getStructuredData } from "./siteMetadata";

describe("site metadata", () => {
  it("aligns homepage metadata with the visible product positioning", () => {
    expect(getPageMetadata("homepage")).toEqual({
      title: "Forge Timer: Gamified Pomodoro Timer for Visible Progress",
      description:
        "Turn every focus session into XP, levels, streaks, and visible progress with a browser-based Pomodoro timer for focused work and deliberate breaks.",
      canonicalUrl: "https://forgetimer.dev/",
    });
  });

  it.each([
    [
      "privacy" as const,
      "Privacy Policy | Forge Timer",
      "Learn how Forge Timer handles account data, timer sessions, notes, local browser storage, and your privacy choices.",
      "https://forgetimer.dev/privacy",
    ],
    [
      "terms" as const,
      "Terms of Service | Forge Timer",
      "Read the terms for using Forge Timer, including accounts, user content, acceptable use, availability, and account deletion.",
      "https://forgetimer.dev/terms",
    ],
  ])("selects route-specific %s metadata", (page, title, description, canonicalUrl) => {
    expect(getPageMetadata(page)).toEqual({ title, description, canonicalUrl });
  });
});

describe("homepage structured data", () => {
  it("describes the visible website, application, and author without fabricated social proof", () => {
    const structuredData = getStructuredData();

    expect(structuredData).toMatchObject({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          name: "Forge Timer",
          url: "https://forgetimer.dev/",
        },
        {
          "@type": "SoftwareApplication",
          name: "Forge Timer",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
        },
        {
          "@type": "Person",
          name: "Stefan Tapu",
          sameAs: ["https://www.linkedin.com/in/stefan-tapu/"],
        },
      ],
    });
    expect(JSON.stringify(structuredData)).not.toMatch(
      /aggregateRating|review|testimonial|userCount/,
    );
  });
});
