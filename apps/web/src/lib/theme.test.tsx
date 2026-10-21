import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "./use-theme.js";
import { readSystemTheme, readThemePreference, resolveTheme, saveThemePreference, THEME_STORAGE_KEY } from "./theme.js";

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button role="switch" aria-label="Dark theme" aria-checked={theme === "dark"} onClick={toggleTheme}>
      {theme}
    </button>
  );
}

function createMediaQuery(initiallyDark: boolean) {
  let prefersDark = initiallyDark;
  const target = new EventTarget();
  const query = Object.assign(target, {
    get matches() { return prefersDark; },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined
  }) as unknown as MediaQueryList;

  return {
    query,
    setDark(value: boolean) {
      prefersDark = value;
      const event = new Event("change");
      Object.defineProperty(event, "matches", { value });
      target.dispatchEvent(event);
    }
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.removeProperty("color-scheme");
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("browser theme preference", () => {
  it("uses a saved preference before the browser setting and ignores invalid values", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("sepia", true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it("reads valid choices and ignores malformed or unavailable storage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readThemePreference()).toBe("dark");

    localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    expect(readThemePreference()).toBeNull();

    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } });
    expect(readThemePreference()).toBeNull();
    expect(saveThemePreference("dark")).toBe(false);
  });

  it("detects the browser preference and falls back to light without matchMedia", () => {
    vi.stubGlobal("matchMedia", () => createMediaQuery(true).query);
    expect(readSystemTheme()).toBe("dark");

    vi.stubGlobal("matchMedia", undefined);
    expect(readSystemTheme()).toBe("light");
  });

  it("follows browser changes until a manual choice is saved", () => {
    const media = createMediaQuery(true);
    vi.stubGlobal("matchMedia", () => media.query);
    const { unmount } = render(<ThemeProbe />);
    const toggle = screen.getByRole("switch", { name: "Dark theme" });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(document.documentElement.dataset.theme).toBe("dark");

    act(() => media.setDark(false));
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    act(() => media.setDark(false));
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    unmount();
    render(<ThemeProbe />);
    expect(screen.getByRole("switch", { name: "Dark theme" }).getAttribute("aria-checked")).toBe("true");
  });

  it("keeps a manual switch usable if storage writes fail", () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => { throw new Error("blocked"); } });
    vi.stubGlobal("matchMedia", () => createMediaQuery(false).query);
    render(<ThemeProbe />);

    const toggle = screen.getByRole("switch", { name: "Dark theme" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
