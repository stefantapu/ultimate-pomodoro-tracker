export const HOMEPAGE_CONTENT_MODE_STORAGE_KEY =
  "forge-content-color-mode";

export type HomepageContentMode = "light" | "dark";

type ModeStorage = Pick<Storage, "getItem" | "setItem">;

function isHomepageContentMode(value: string | null): value is HomepageContentMode {
  return value === "light" || value === "dark";
}

export function getInitialHomepageContentMode(
  storage: Pick<ModeStorage, "getItem">,
  systemPrefersDark: boolean,
): HomepageContentMode {
  const storedMode = storage.getItem(HOMEPAGE_CONTENT_MODE_STORAGE_KEY);

  if (isHomepageContentMode(storedMode)) {
    return storedMode;
  }

  return systemPrefersDark ? "dark" : "light";
}

export function persistHomepageContentMode(
  storage: Pick<ModeStorage, "setItem">,
  mode: HomepageContentMode,
) {
  storage.setItem(HOMEPAGE_CONTENT_MODE_STORAGE_KEY, mode);
}
