export type SitePage = "homepage" | "privacy" | "terms";

export type PageMetadata = {
  title: string;
  description: string;
  canonicalUrl: string;
};

const metadataByPage: Record<SitePage, PageMetadata> = {
  homepage: {
    title: "Forge Timer: Gamified Pomodoro Timer for Visible Progress",
    description:
      "Turn every focus session into XP, levels, streaks, and visible progress with a browser-based Pomodoro timer for focused work and deliberate breaks.",
    canonicalUrl: "https://forgetimer.dev/",
  },
  privacy: {
    title: "Privacy Policy | Forge Timer",
    description:
      "Learn how Forge Timer handles account data, timer sessions, notes, local browser storage, and your privacy choices.",
    canonicalUrl: "https://forgetimer.dev/privacy",
  },
  terms: {
    title: "Terms of Service | Forge Timer",
    description:
      "Read the terms for using Forge Timer, including accounts, user content, acceptable use, availability, and account deletion.",
    canonicalUrl: "https://forgetimer.dev/terms",
  },
};

export function getPageMetadata(page: SitePage): PageMetadata {
  return metadataByPage[page];
}

export function getStructuredData() {
  const homepage = getPageMetadata("homepage");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${homepage.canonicalUrl}#website`,
        name: "Forge Timer",
        url: homepage.canonicalUrl,
        description: homepage.description,
        creator: { "@id": `${homepage.canonicalUrl}#stefan-tapu` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${homepage.canonicalUrl}#software-application`,
        name: "Forge Timer",
        url: homepage.canonicalUrl,
        description: homepage.description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: { "@id": `${homepage.canonicalUrl}#stefan-tapu` },
      },
      {
        "@type": "Person",
        "@id": `${homepage.canonicalUrl}#stefan-tapu`,
        name: "Stefan Tapu",
        url: homepage.canonicalUrl,
        sameAs: ["https://www.linkedin.com/in/stefan-tapu/"],
      },
    ],
  } as const;
}
