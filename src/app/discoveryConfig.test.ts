import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderSiteDocument } from "../seo/siteDocument";

type VercelRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

type VercelConfig = {
  redirects?: VercelRedirect[];
  rewrites?: Array<{ source: string; destination: string }>;
};

const projectPath = (...segments: string[]) => resolve(process.cwd(), ...segments);

describe("search discovery configuration", () => {
  it("permanently redirects every obsolete timer landing-page path to the homepage", () => {
    const config = JSON.parse(
      readFileSync(projectPath("vercel.json"), "utf8"),
    ) as VercelConfig;

    expect(config.redirects).toEqual([
      { source: "/pomodoro-timer", destination: "/", permanent: true },
      { source: "/pomodoro-timer/", destination: "/", permanent: true },
      { source: "/focus-timer", destination: "/", permanent: true },
      { source: "/focus-timer/", destination: "/", permanent: true },
      { source: "/study-timer", destination: "/", permanent: true },
      { source: "/study-timer/", destination: "/", permanent: true },
    ]);

    for (const directory of ["pomodoro-timer", "focus-timer", "study-timer"]) {
      expect(existsSync(projectPath("public", directory, "index.html"))).toBe(
        false,
      );
    }
  });

  it("lists only the canonical homepage in the sitemap", () => {
    const sitemap = readFileSync(projectPath("public", "sitemap.xml"), "utf8");
    const sitemapDocument = new DOMParser().parseFromString(
      sitemap,
      "application/xml",
    );

    expect(sitemapDocument.querySelector("parsererror")).toBeNull();
    expect(
      [...sitemapDocument.querySelectorAll("url > loc")].map(
        (location) => location.textContent,
      ),
    ).toEqual(["https://forgetimer.dev/"]);
    expect(sitemap).not.toContain("/llms.txt");
    expect(sitemap).not.toContain("/ai/forge-timer.md");

    expect(existsSync(projectPath("public", "llms.txt"))).toBe(true);
    expect(existsSync(projectPath("public", "ai", "forge-timer.md"))).toBe(true);
  });

  it("keeps the homepage canonical URL", () => {
    const homepage = renderSiteDocument(
      readFileSync(projectPath("index.html"), "utf8"),
      "homepage",
    );

    expect(homepage).toContain(
      '<link rel="canonical" href="https://forgetimer.dev/" />',
    );
  });

  it("serves route-specific production documents for legal routes", () => {
    const config = JSON.parse(
      readFileSync(projectPath("vercel.json"), "utf8"),
    ) as VercelConfig;

    expect(config.rewrites).toEqual([
      { source: "/privacy", destination: "/privacy/index.html" },
      { source: "/privacy/", destination: "/privacy/index.html" },
      { source: "/terms", destination: "/terms/index.html" },
      { source: "/terms/", destination: "/terms/index.html" },
    ]);
  });
});
