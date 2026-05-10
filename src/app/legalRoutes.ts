export type LegalPageKind = "privacy" | "terms";

export function getLegalPageKind(pathname: string): LegalPageKind | null {
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPathname === "/privacy") {
    return "privacy";
  }

  if (normalizedPathname === "/terms") {
    return "terms";
  }

  return null;
}
