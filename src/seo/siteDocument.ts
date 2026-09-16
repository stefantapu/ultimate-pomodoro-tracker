import {
  getPageMetadata,
  getStructuredData,
  type SitePage,
} from "./siteMetadata.ts";

const metadataStartMarker = "<!--site-metadata:start-->";
const metadataEndMarker = "<!--site-metadata:end-->";
const homepageContentMarker = "<!--homepage-content-->";
const socialImageUrl = "https://forgetimer.dev/images/forge-timer-og.png";

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderMetadata(page: SitePage) {
  const metadata = getPageMetadata(page);
  const title = escapeAttribute(metadata.title);
  const description = escapeAttribute(metadata.description);
  const canonicalUrl = escapeAttribute(metadata.canonicalUrl);
  const structuredData =
    page === "homepage"
      ? `\n  <script type="application/ld+json">\n${JSON.stringify(getStructuredData(), null, 2)}\n  </script>`
      : "";

  return `${metadataStartMarker}
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="description" content="${description}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Forge Timer" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${socialImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Forge Timer gamified Pomodoro timer" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${socialImageUrl}" />${structuredData}
  <title>${metadata.title}</title>
  ${metadataEndMarker}`;
}

export function renderSiteDocument(template: string, page: SitePage) {
  const startIndex = template.indexOf(metadataStartMarker);
  const endIndex = template.indexOf(metadataEndMarker);

  if (startIndex < 0 || endIndex < startIndex) {
    throw new Error("Site metadata markers are missing or out of order.");
  }

  const metadataEndIndex = endIndex + metadataEndMarker.length;
  const withMetadata = `${template.slice(0, startIndex)}${renderMetadata(page)}${template.slice(metadataEndIndex)}`;

  return page === "homepage"
    ? withMetadata
    : withMetadata.replace(homepageContentMarker, "");
}
