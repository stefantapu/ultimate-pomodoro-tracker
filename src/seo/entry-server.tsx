import { renderToString } from "react-dom/server";
import { HomepageContent } from "./HomepageContent";

export function renderHomepageContent() {
  return renderToString(<HomepageContent />);
}
