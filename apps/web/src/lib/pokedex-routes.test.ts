import { describe, expect, it } from "vitest";
import type { CatalogResponse } from "@pokemon-tools/contracts";
import { resolveSiteRoute, speciesPath, speciesSlug } from "./pokedex-routes.js";

const catalog: CatalogResponse = {
  species: [
    { name: "Abra", types: ["Psychic"], baseStats: {}, pokedexEligible: true, pokedexSlug: "abra" },
    { name: "Mr. Mime", types: ["Psychic", "Fairy"], baseStats: {}, pokedexEligible: true, pokedexSlug: "mr-mime" },
    { name: "Nidoran-F", types: ["Poison"], baseStats: {}, pokedexEligible: true, pokedexSlug: "nidoran-f" },
    { name: "Farfetch’d", types: ["Normal", "Flying"], baseStats: {}, pokedexEligible: true, pokedexSlug: "farfetchd" },
    { name: "Charizard-Mega-X", types: ["Fire", "Dragon"], baseStats: {}, pokedexEligible: true, pokedexSlug: "charizard-mega-x" },
    { name: "Custommon", types: ["Normal"], baseStats: {}, pokedexEligible: false, pokedexSlug: "custommon" }
  ],
  moves: [], abilities: [], items: [], types: [], natures: []
};

describe("Pokédex routes", () => {
  it("resolves direct Pokémon URLs through stable catalog slugs", () => {
    expect(resolveSiteRoute("/pokedex/abra", catalog)).toMatchObject({ kind: "page", tab: "pokedex", species: { name: "Abra" } });
    expect(resolveSiteRoute("/pokedex/mr-mime", catalog)).toMatchObject({ kind: "page", species: { name: "Mr. Mime" } });
    expect(resolveSiteRoute("/pokedex/nidoran-f", catalog)).toMatchObject({ kind: "page", species: { name: "Nidoran-F" } });
    expect(resolveSiteRoute("/pokedex/farfetchd", catalog)).toMatchObject({ kind: "page", species: { name: "Farfetch’d" } });
    expect(resolveSiteRoute("/pokedex/charizard-mega-x", catalog)).toMatchObject({ kind: "page", species: { name: "Charizard-Mega-X" } });
  });

  it("uses lowercase canonical paths, defers slug validation until catalog load, and rejects invalid entries", () => {
    expect(resolveSiteRoute("/pokedex/ABRA/", catalog)).toMatchObject({ kind: "page", canonicalPath: "/pokedex/abra" });
    expect(resolveSiteRoute("/pokedex/abra", null)).toMatchObject({ kind: "page", tab: "pokedex", pendingSlug: "abra" });
    expect(resolveSiteRoute("/pokedex/not-a-pokemon", catalog)).toEqual({ kind: "notFound" });
    expect(resolveSiteRoute("/pokedex/custommon", catalog)).toEqual({ kind: "notFound" });
    expect(resolveSiteRoute("/pokedex/%2F", catalog)).toEqual({ kind: "notFound" });
  });

  it("maps every top-level page and builds exceptional slugs", () => {
    expect(resolveSiteRoute("/type-chart", catalog)).toMatchObject({ kind: "page", tab: "typeChart" });
    expect(resolveSiteRoute("/team-builder", catalog)).toMatchObject({ kind: "page", tab: "teamBuilder" });
    expect(speciesPath(catalog.species[4]!)).toBe("/pokedex/charizard-mega-x");
    expect(speciesSlug("Mr. Mime")).toBe("mr-mime");
    expect(resolveSiteRoute("/missing", catalog)).toEqual({ kind: "notFound" });
  });
});
