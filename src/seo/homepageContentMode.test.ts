import { describe, expect, it } from "vitest";
import {
  HOMEPAGE_CONTENT_MODE_STORAGE_KEY,
  getInitialHomepageContentMode,
  persistHomepageContentMode,
} from "./homepageContentMode";

describe("homepage content color mode", () => {
  it("uses a stored valid preference before the system preference", () => {
    const storage = {
      getItem: () => "light",
      setItem: () => undefined,
    };

    expect(getInitialHomepageContentMode(storage, true)).toBe("light");
  });

  it("falls back to the system preference for missing or corrupt values", () => {
    const storage = {
      getItem: () => "sepia",
      setItem: () => undefined,
    };

    expect(getInitialHomepageContentMode(storage, true)).toBe("dark");
    expect(getInitialHomepageContentMode(storage, false)).toBe("light");
  });

  it("persists only the selected content mode", () => {
    const stored: Array<[string, string]> = [];
    const storage = {
      getItem: () => null,
      setItem: (key: string, value: string) => stored.push([key, value]),
    };

    persistHomepageContentMode(storage, "dark");

    expect(stored).toEqual([[HOMEPAGE_CONTENT_MODE_STORAGE_KEY, "dark"]]);
  });
});
