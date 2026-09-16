export function shouldRenderHomepageContent(pathname: string) {
  return (pathname.replace(/\/+$/, "") || "/") === "/";
}
