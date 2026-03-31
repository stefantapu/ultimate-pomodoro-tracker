import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ThemeName = "cyber-dark" | "classic";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

const THEME_STORAGE_KEY = "ultimate-pomodoro-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeName {
  if (typeof window === "undefined") {
    return "cyber-dark";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "classic" ? "classic" : "cyber-dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(() => readStoredTheme());

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
