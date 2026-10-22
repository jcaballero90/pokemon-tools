import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogResponse } from "@pokemon-tools/contracts";
import { App } from "./main.js";
import { LocaleProvider } from "./i18n/LocaleProvider.js";
import { setLocale } from "./i18n.js";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock("./lib/api.js", () => ({ api: apiMock }));
vi.mock("./i18n/presentation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./i18n/presentation")>();
  function pseudo(value: unknown): unknown {
    if (typeof value === "string") return `⟦${value}⟧`;
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, pseudo(child)]));
  }
  return { ...actual, t: pseudo(actual.t) };
});

const catalog: CatalogResponse = {
  species: [{ name: "Pikachu", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } }],
  moves: ["Thunderbolt"], abilities: [], items: [], types: ["Electric"], natures: ["Serious"]
};

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  localStorage.clear();
  setLocale("en");
  apiMock.mockImplementation((path: string) => {
    if (path === "/catalog") return Promise.resolve(catalog);
    if (path === "/type-chart") return Promise.resolve([]);
    if (path === "/auth/get-session") return Promise.resolve({});
    return Promise.resolve([]);
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("pseudolocale runtime screen audit", () => {
  it("renders every primary screen through locale dictionary messages", async () => {
    render(<LocaleProvider><App /></LocaleProvider>);
    expect(screen.getByRole("heading", { name: "⟦Overview⟧" })).toBeTruthy();
    const screens = [
      ["Type chart", "⟦Type chart⟧"],
      ["Pokédex", "⟦Pokédex⟧"],
      ["Team builder", "⟦Team builder⟧"],
      ["Damage", "⟦Damage⟧"],
      ["Account", "⟦Account⟧"]
    ] as const;
    for (const [buttonText, headingText] of screens) {
      fireEvent.click(screen.getByRole("link", { name: `⟦${buttonText}⟧` }));
      expect(screen.getByRole("heading", { name: headingText })).toBeTruthy();
    }
  });
});
