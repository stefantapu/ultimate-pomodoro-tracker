import { build } from "esbuild";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const targetPath = path.join(projectRoot, "dist", "index.html");
const serverBundlePath = path.join(
  projectRoot,
  "node_modules",
  ".tmp",
  "homepage-content-server.mjs",
);
const marker = "<!--homepage-content-->";

await access(targetPath);

await build({
  entryPoints: [path.join(projectRoot, "src", "seo", "entry-server.tsx")],
  outfile: serverBundlePath,
  bundle: true,
  external: ["react", "react-dom/server", "react/jsx-runtime"],
  format: "esm",
  platform: "node",
  jsx: "automatic",
  loader: { ".css": "empty" },
  logLevel: "silent",
});

try {
  const { renderHomepageContent, renderSiteDocument } = await import(
    `${pathToFileURL(serverBundlePath).href}?t=${Date.now()}`
  );
  const renderedContent = renderHomepageContent();

  if (!renderedContent.includes("Forge Timer: A Gamified Pomodoro Timer")) {
    throw new Error("Homepage content render did not contain the expected heading.");
  }

  const builtHtml = await readFile(targetPath, "utf8");
  const homepageDocument = renderSiteDocument(builtHtml, "homepage");

  if (!homepageDocument.includes(marker)) {
    throw new Error("Homepage content marker is missing from dist/index.html.");
  }

  const prerenderedHtml = homepageDocument.replace(marker, renderedContent);

  if (prerenderedHtml.includes(marker)) {
    throw new Error("Homepage content marker was not fully replaced.");
  }

  await writeFile(targetPath, prerenderedHtml);

  for (const page of ["privacy", "terms"]) {
    const pageDirectory = path.join(projectRoot, "dist", page);
    const pageDocument = renderSiteDocument(builtHtml, page);

    if (pageDocument.includes(marker)) {
      throw new Error(`${page} document still contains the homepage marker.`);
    }

    await mkdir(pageDirectory, { recursive: true });
    await writeFile(path.join(pageDirectory, "index.html"), pageDocument);
  }
} finally {
  await rm(serverBundlePath, { force: true });
}
