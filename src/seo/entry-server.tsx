import { renderToString } from "react-dom/server";
import { HomepageContent } from "./HomepageContent";
export { renderSiteDocument } from "./siteDocument";

export function renderHomepageContent() {
  return renderToString(<HomepageContent />);
}
