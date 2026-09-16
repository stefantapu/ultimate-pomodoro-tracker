import { StrictMode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/providers/AuthProvider.tsx";
import { HomepageContent } from "./seo/HomepageContent.tsx";
import { hasPrerenderedHomepageContent } from "./seo/homepageHydration.ts";
import { shouldRenderHomepageContent } from "./seo/homepageRoute.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  </StrictMode>,
);

const homepageContentRoot = document.getElementById("homepage-content-root");

if (homepageContentRoot) {
  if (shouldRenderHomepageContent(window.location.pathname)) {
    const homepageContent = (
      <StrictMode>
        <HomepageContent />
      </StrictMode>
    );

    if (hasPrerenderedHomepageContent(homepageContentRoot)) {
      hydrateRoot(homepageContentRoot, homepageContent);
    } else {
      createRoot(homepageContentRoot).render(homepageContent);
    }
  } else {
    homepageContentRoot.remove();
  }
}
