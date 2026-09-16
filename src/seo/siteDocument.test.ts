import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderSiteDocument } from "./siteDocument";

const template = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

describe("site document metadata", () => {
  it.each([
    [
      "privacy" as const,
      "Privacy Policy | Forge Timer",
      "https://forgetimer.dev/privacy",
    ],
    [
      "terms" as const,
      "Terms of Service | Forge Timer",
      "https://forgetimer.dev/terms",
    ],
  ])("renders crawler-visible metadata for %s", (page, title, canonicalUrl) => {
    const html = renderSiteDocument(template, page);
    const document = new DOMParser().parseFromString(html, "text/html");

    expect(document.title).toBe(title);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"))
      .toBe(canonicalUrl);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content"))
      .toBe(canonicalUrl);
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content"))
      .toBe(title);
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute("content"))
      .toBe(title);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content"))
      .toBe("https://forgetimer.dev/images/forge-timer-og-v2.png");
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute("content"))
      .toBe("https://forgetimer.dev/images/forge-timer-og-v2.png");
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
    expect(html).not.toContain("<!--homepage-content-->");
  });

  it("renders parseable factual structured data for the homepage", () => {
    const html = renderSiteDocument(template, "homepage");
    const document = new DOMParser().parseFromString(html, "text/html");
    const script = document.querySelector('script[type="application/ld+json"]');

    expect(script).not.toBeNull();
    expect(() => JSON.parse(script?.textContent ?? "")).not.toThrow();
    expect(JSON.parse(script?.textContent ?? "")["@graph"]).toHaveLength(3);
  });
});
