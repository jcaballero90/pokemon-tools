import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { readSystemTheme, readThemePreference, saveThemePreference, type Theme } from "./theme";

type ThemeState = {
  theme: Theme;
  followsSystem: boolean;
};

function getInitialThemeState(): ThemeState {
  const preference = readThemePreference();
  return {
    theme: preference ?? readSystemTheme(),
    followsSystem: preference === null
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === "dark" ? "#101827" : "#f5f7f8";
}

export function useTheme() {
  const [state, setState] = useState(getInitialThemeState);

  useLayoutEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  useEffect(() => {
    if (!state.followsSystem || typeof globalThis.matchMedia !== "function") return;

    let mediaQuery: MediaQueryList;
    try {
      mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }

    function followSystemPreference(event: MediaQueryListEvent) {
      setState((current) => current.followsSystem
        ? { ...current, theme: event.matches ? "dark" : "light" }
        : current);
    }

    mediaQuery.addEventListener("change", followSystemPreference);
    return () => mediaQuery.removeEventListener("change", followSystemPreference);
  }, [state.followsSystem]);

  const toggleTheme = useCallback(() => {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    saveThemePreference(nextTheme);
    setState({ theme: nextTheme, followsSystem: false });
  }, [state.theme]);

  return { theme: state.theme, toggleTheme };
}
