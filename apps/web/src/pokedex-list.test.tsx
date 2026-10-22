import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CatalogResponse } from "@pokemon-tools/contracts";
import { LocaleProvider } from "./i18n/LocaleProvider.js";
import { setApiCatalogTranslations, setLocale } from "./i18n.js";
import { Pokedex } from "./features/pokedex/Pokedex.js";

const catalog = createCatalog();

beforeEach(() => {
  setLocale("en");
  setApiCatalogTranslations(catalog.translations);
});

afterEach(() => {
  cleanup();
  setApiCatalogTranslations(undefined);
  setLocale("en");
});

describe("Pokédex species list", () => {
  it("orders by National Pokédex number, puts base forms first, and loads another page", () => {
    render(<MemoryRouter><LocaleProvider><Pokedex catalog={catalog} /></LocaleProvider></MemoryRouter>);

    const initialLinks = document.querySelectorAll(".species-list a");
    expect(initialLinks).toHaveLength(60);
    expect(getSpeciesNames(initialLinks).slice(0, 3)).toEqual(["Base-form", "Alternate-A", "Alternate-Z"]);
    expect(initialLinks[0]?.textContent).toContain("#0001");
    expect(getSpeciesNames(initialLinks)[3]).toBe("Species122");

    fireEvent.click(screen.getByRole("button", { name: "Load more Pokémon" }));
    expect(document.querySelectorAll(".species-list a")).toHaveLength(120);

    fireEvent.click(screen.getByRole("button", { name: "Load more Pokémon" }));
    expect(document.querySelectorAll(".species-list a")).toHaveLength(125);
    expect(screen.queryByRole("button", { name: "Load more Pokémon" })).toBeNull();
  });

  it("loads the next page when the user scrolls to the bottom of the list", () => {
    render(<MemoryRouter><LocaleProvider><Pokedex catalog={catalog} /></LocaleProvider></MemoryRouter>);
    const list = document.querySelector(".species-list");
    expect(list).not.toBeNull();
    if (!list) return;

    Object.defineProperties(list, {
      scrollTop: { configurable: true, value: 1400 },
      clientHeight: { configurable: true, value: 600 },
      scrollHeight: { configurable: true, value: 2000 }
    });
    fireEvent.scroll(list);

    expect(document.querySelectorAll(".species-list a")).toHaveLength(120);
  });

  it("searches all entries by canonical and accent-insensitive Spanish names", () => {
    setLocale("es-ES");
    render(<MemoryRouter><LocaleProvider><Pokedex catalog={catalog} /></LocaleProvider></MemoryRouter>);

    fireEvent.change(screen.getByLabelText("Buscar un Pokémon"), { target: { value: "plantula" } });
    const translatedMatch = screen.getByRole("link", { name: /Plántula/ });
    expect(translatedMatch.textContent).toContain("#0123");
    expect(document.querySelectorAll(".species-list a")).toHaveLength(1);

    fireEvent.change(screen.getByLabelText("Buscar un Pokémon"), { target: { value: "Species001" } });
    expect(screen.getByRole("link", { name: /Plántula/ })).toBeTruthy();
  });

  it("shows a localized empty state when no names match", () => {
    setLocale("es-ES");
    render(<MemoryRouter><LocaleProvider><Pokedex catalog={catalog} /></LocaleProvider></MemoryRouter>);

    fireEvent.change(screen.getByLabelText("Buscar un Pokémon"), { target: { value: "missing-pokemon" } });

    expect(screen.getByRole("status").textContent).toBe("No hay ningún Pokémon que coincida con la búsqueda.");
    expect(screen.queryByRole("button", { name: "Cargar más Pokémon" })).toBeNull();
  });
});

function createCatalog(): CatalogResponse {
  const species: CatalogResponse["species"] = [
    { name: "Alternate-Z", types: ["Normal"], baseStats: {}, pokedexEligible: true, nationalDexId: 1, pokedexIsBaseForm: false },
    { name: "Base-form", types: ["Normal"], baseStats: {}, pokedexEligible: true, nationalDexId: 1, pokedexIsBaseForm: true },
    { name: "Alternate-A", types: ["Normal"], baseStats: {}, pokedexEligible: true, nationalDexId: 1, pokedexIsBaseForm: false },
    ...Array.from({ length: 122 }, (_, index) => {
      const nationalDexId = index + 2;
      const name = `Species${String(124 - nationalDexId).padStart(3, "0")}`;
      return { name, types: ["Normal"], baseStats: {}, pokedexEligible: true, nationalDexId, pokedexIsBaseForm: true };
    })
  ];

  return {
    species,
    moves: [], abilities: [], items: [], types: ["Normal"], natures: [],
    translations: {
      species: { species001: "Plántula" }, moves: {}, abilities: {}, items: {}, types: { normal: "Normal" }, natures: {}
    }
  };
}

function getSpeciesNames(links: NodeListOf<Element>) {
  return [...links].map((link) => link.querySelector(".species-name")?.textContent);
}
