import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(screen.getByRole("heading", { level: 1, name: "⟦Build your next Pokémon team.⟧" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const features = screen.getByRole("navigation", { name: "⟦Pokémon tools⟧" });
    expect(features.querySelectorAll("a")).toHaveLength(6);
    expect(within(features).getByRole("link", { name: /⟦Team comparison⟧/ }).getAttribute("href"))
      .toBe("/team-builder#team-comparison");
    expect(within(features).getByRole("link", { name: /⟦Save your teams⟧/ }).getAttribute("href"))
      .toBe("/private-library");
    expect(screen.getByRole("link", { name: "⟦Pokémon Tools⟧" }).getAttribute("href")).toBe("/");
    fireEvent.click(within(features).getByRole("link", { name: /⟦Team comparison⟧/ }));
    expect(document.activeElement).toBe(document.getElementById("team-comparison"));
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

  it("renders the signed-in trainer card and username claim form through locale messages", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({
        user: { id: "owner-1", name: "Trainer", email: "trainer@example.test", createdAt: "2026-10-03T10:00:00.000Z" }
      });
      if (path === "/me/teams") return Promise.resolve([]);
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    fireEvent.click(screen.getByRole("link", { name: "⟦Account⟧" }));

    const card = await screen.findByRole("region", { name: "⟦Trainer card⟧" });
    expect(within(card).getByText("⟦Username⟧")).toBeTruthy();
    expect(within(card).getByText("⟦Not set yet⟧")).toBeTruthy();
    expect(within(card).getByText("⟦Saved teams⟧")).toBeTruthy();
    expect(within(card).getByText("⟦Member since⟧")).toBeTruthy();
    expect(within(card).getByLabelText("⟦Choose a username⟧")).toBeTruthy();
    expect(within(card).getByText("⟦Use 3–30 letters, numbers, underscores or periods. Usernames are not case-sensitive.⟧")).toBeTruthy();
    expect(within(card).getByRole("button", { name: "⟦Set username⟧" })).toBeTruthy();
  });
});
