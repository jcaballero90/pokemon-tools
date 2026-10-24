import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogResponse, PokedexMovesResponse } from "@pokemon-tools/contracts";
import { LocaleProvider } from "./i18n/LocaleProvider.js";
import { setApiCatalogTranslations, setLocale } from "./i18n.js";
import { PokemonMoves } from "./features/pokedex/PokemonMoves.js";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock("./lib/api.js", () => ({ api: apiMock }));

const catalog: CatalogResponse = {
  species: [],
  moves: ["Aerial Ace", "Thunderbolt", "Quick Attack", "Tail Whip", "Struggle", "Wish"],
  abilities: [], items: [], types: ["Electric", "Normal"], natures: []
};
const response: PokedexMovesResponse = {
  source: {
    provider: "PokéAPI",
    repository: "https://github.com/PokeAPI/pokeapi",
    revision: "2bf639e5572812a67d2b94903fdcb9d095f5aeb2",
    versionGroup: "scarlet-violet",
    versionGroupId: 25
  },
  species: "Pikachu",
  moves: [
    { name: "Quick Attack", type: "Normal", category: "physical", acquisition: [{ method: "level-up", level: 1 }] },
    { name: "Struggle", type: null, category: null, acquisition: [{ method: "machine" }] },
    { name: "Tail Whip", type: "Normal", category: "status", acquisition: [{ method: "level-up", event: true }] },
    { name: "Thunderbolt", type: "Electric", category: "special", acquisition: [{ method: "level-up", level: 26 }, { method: "machine", machineNumbers: [126] }] },
    { name: "Wish", type: "Normal", category: "status", acquisition: [{ method: "egg" }] }
  ]
};
const unavailable: PokedexMovesResponse = {
  ...response,
  species: "Abra",
  moves: [],
  unavailable: true,
  unavailableReasonCode: "no-scarlet-violet-learnset"
};

beforeEach(() => {
  setLocale("en");
  setApiCatalogTranslations({
    moves: { thunderbolt: "Impactrueno", quickattack: "Ataque Rápido", tailwhip: "Látigo", aerialace: "Golpe Aéreo" },
    types: { electric: "Eléctrico", normal: "Normal" }
  });
  apiMock.mockReset();
});
afterEach(() => {
  cleanup();
  setApiCatalogTranslations(undefined);
  setLocale("en");
});

describe("Pokédex move panel", () => {
  it("localizes move labels and separates type, battle category, and acquisition", async () => {
    setLocale("es-ES");
    apiMock.mockResolvedValue(response);
    render(<LocaleProvider><PokemonMoves species="Pikachu" catalog={catalog} /></LocaleProvider>);

    expect(await screen.findByRole("heading", { name: "Movimientos" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Escarlata/Púrpura" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Nivel" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "MT" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Huevo" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "Otros" })).toBeNull();
    expect(screen.getAllByText("Impactrueno")).toHaveLength(1);
    expect(screen.getAllByRole("img", { name: "Tipo: Eléctrico" })).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Categoría: Físico" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Categoría: Especial" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Categoría: Estado" })).toBeTruthy();
    expect(screen.getByText("Nivel 1")).toBeTruthy();
    expect(screen.getByText("Movimiento de evento")).toBeTruthy();
    expect(screen.queryByText("Tipo")).toBeNull();
    expect(screen.queryByText("Categoría")).toBeNull();
    expect(screen.queryByText("Nivel 0")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Aprendidos por nivel" })).toBeNull();
    const levelCategoryIconUrls = [...document.querySelectorAll<HTMLImageElement>(".pokedex-move-category-icon img")].map((icon) => icon.src);
    expect(levelCategoryIconUrls).toEqual(expect.arrayContaining([
      "https://archives.bulbagarden.net/media/upload/b/b4/PhysicalIC_SV.png",
      "https://archives.bulbagarden.net/media/upload/5/5b/SpecialIC_SV.png",
      "https://archives.bulbagarden.net/media/upload/e/e0/StatusIC_SV.png"
    ]));

    fireEvent.click(screen.getByRole("tab", { name: "MT" }));
    expect(screen.getByText("MT 126")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Tipo no disponible" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Categoría no disponible" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Huevo" }));
    expect(screen.getByText("Wish")).toBeTruthy();
    expect(screen.queryByText(/progenitor/i)).toBeNull();
  });

  it("searches canonical and Spanish names and distinguishes absent known moves", async () => {
    setLocale("es-ES");
    apiMock.mockResolvedValue(response);
    render(<LocaleProvider><PokemonMoves species="Pikachu" catalog={catalog} /></LocaleProvider>);
    const search = screen.getByLabelText("Buscar movimientos de este Pokémon");
    await screen.findAllByText("Impactrueno");

    fireEvent.change(search, { target: { value: "impactrueno" } });
    expect(screen.getAllByText("Impactrueno")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Nivel" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByText("Ataque Rápido")).toBeNull();

    fireEvent.change(search, { target: { value: "Golpe Aéreo" } });
    expect(screen.getByRole("status").textContent).toContain("Golpe Aéreo");
    expect(screen.getByRole("status").textContent).toContain("no consta");

    fireEvent.change(search, { target: { value: "sin-coincidencias" } });
    expect(screen.getByRole("status").textContent).toBe("No hay movimientos que coincidan con la búsqueda.");
  });

  it("shows the Other folder only when a learnset has an uncommon acquisition method", async () => {
    setLocale("es-ES");
    const withTutorMove: PokedexMovesResponse = {
      ...response,
      moves: [...response.moves, { name: "Aerial Ace", type: "Flying", category: "physical", acquisition: [{ method: "tutor" }] }]
    };
    apiMock.mockResolvedValue(withTutorMove);
    render(<LocaleProvider><PokemonMoves species="Pikachu" catalog={catalog} /></LocaleProvider>);

    expect(await screen.findByRole("tab", { name: "Otros" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Otros" }));
    expect(screen.getByRole("heading", { name: "Aprendidos con tutor" })).toBeTruthy();
    expect(screen.getByText("Golpe Aéreo")).toBeTruthy();
  });

  it("shows explicit unavailable learnset state for Abra", async () => {
    setLocale("es-ES");
    apiMock.mockResolvedValue(unavailable);
    render(<LocaleProvider><PokemonMoves species="Abra" catalog={catalog} /></LocaleProvider>);

    expect(await screen.findByText("No hay datos de movimientos de Escarlata y Púrpura para este Pokémon.")).toBeTruthy();
    expect(screen.queryByText("No hay movimientos que coincidan con la búsqueda.")).toBeNull();
  });

  it("ignores a slower response after switching Pokédex entries", async () => {
    let resolvePikachu: ((value: PokedexMovesResponse) => void) | undefined;
    apiMock.mockImplementation((path: string) => path.includes("Abra")
      ? Promise.resolve(unavailable)
      : new Promise((resolve) => { resolvePikachu = resolve; }));
    const view = render(<LocaleProvider><PokemonMoves species="Pikachu" catalog={catalog} /></LocaleProvider>);

    view.rerender(<LocaleProvider><PokemonMoves species="Abra" catalog={catalog} /></LocaleProvider>);
    expect(await screen.findByText("Scarlet/Violet move data isn't available for this Pokémon.")).toBeTruthy();
    resolvePikachu?.(response);
    await Promise.resolve();
    expect(screen.queryByText("Impactrueno")).toBeNull();
  });
});
