export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "pokemon-tools:theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(preference: unknown, prefersDark: boolean): Theme {
  if (isTheme(preference)) return preference;
  return prefersDark ? "dark" : "light";
}

export function readThemePreference(): Theme | null {
  try {
    const preference = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(preference) ? preference : null;
  } catch {
    return null;
  }
}

export function readSystemTheme(): Theme {
  try {
    if (typeof globalThis.matchMedia === "function") {
      return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
  } catch {
    // Browsers without usable media queries fall back to the light theme.
  }

  return "light";
}

export function saveThemePreference(theme: Theme): boolean {
  try {
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
