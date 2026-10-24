import { describe, expect, it } from "vitest";
import { catalogResponseSchema, evolutionResponseSchema, pokedexResponseSchema } from "./index.js";

describe("localized catalog contracts", () => {
  it("accepts Spain Spanish labels while retaining canonical catalog identifiers", () => {
    const catalog = catalogResponseSchema.parse({
      species: [{
        name: "Bulbasaur", types: ["Grass", "Poison"], baseStats: { hp: 45 },
        pokedexEligible: true, nationalDexId: 1, pokedexSlug: "bulbasaur", pokedexIsBaseForm: true
      }],
      moves: ["Tackle"], abilities: ["Overgrow"], items: [], types: ["Grass", "Poison"], natures: ["Hardy"],
      translations: {
        species: { bulbasaur: "Bulbasaur" }, moves: { tackle: "Placaje" },
        abilities: { overgrow: "Espesura" }, items: {}, types: { grass: "Planta", poison: "Veneno" },
        natures: { hardy: "Fuerte" }
      }
    });

    expect(catalog.species[0]).toMatchObject({ name: "Bulbasaur", nationalDexId: 1, pokedexSlug: "bulbasaur" });
    expect(catalog.translations?.types.grass).toBe("Planta");
    expect(catalog.moves).toEqual(["Tackle"]);
    expect(catalog.moveDetails).toBeUndefined();
  });

  it("accepts canonical move details and rejects missing or invalid metadata", () => {
    const catalog = {
      species: [], moves: ["Thunderbolt", "Swords Dance"], abilities: [], items: [], types: [], natures: [],
      moveDetails: {
        Thunderbolt: { type: "Electric", category: "Special" },
        "Swords Dance": { type: "Normal", category: "Status" }
      }
    };

    expect(catalogResponseSchema.parse(catalog).moveDetails).toEqual(catalog.moveDetails);
    expect(catalogResponseSchema.safeParse({
      ...catalog, moveDetails: { Thunderbolt: { type: "Electric", category: "special" } }
    }).success).toBe(false);
    expect(catalogResponseSchema.safeParse({
      ...catalog, moveDetails: { Thunderbolt: { category: "Special" } }
    }).success).toBe(false);
    expect(catalogResponseSchema.safeParse({
      ...catalog, moveDetails: { Thunderbolt: { type: " ", category: "Special" } }
    }).success).toBe(false);
  });

  it("accepts sourced bilingual ability text and structured evolution metadata", () => {
    const details = pokedexResponseSchema.parse({
      source: "PokéAPI", pokedexId: 25, familyKey: "pikachu",
      abilities: [{
        name: "Static", isHidden: false,
        description: "May paralyze attackers that make contact.",
        descriptions: {
          en: "May paralyze attackers that make contact.",
          esES: "La electricidad estática puede paralizar al contacto.",
          sources: { en: "scarlet-violet", esES: "sword-shield" }
        }
      }]
    });
    const evolution = evolutionResponseSchema.parse({
      source: "PokéAPI",
      nodes: [{ key: "pichu", name: "Pichu", pokedexId: 172, pokedexSlug: "pichu", pokedexIsBaseForm: true, iconCandidates: [] }],
      edges: [{
        from: "Pichu", to: "Pikachu", alternatives: [["Happiness"]],
        conditionAlternatives: [[{ field: "min_happiness", value: 160 }, { field: "trigger", value: "level-up" }]]
      }],
      megaForms: []
    });

    expect(details.abilities?.[0]?.descriptions?.sources).toEqual({ en: "scarlet-violet", esES: "sword-shield" });
    expect(evolution.edges[0]?.conditionAlternatives?.[0]).toEqual([
      { field: "min_happiness", value: 160 }, { field: "trigger", value: "level-up" }
    ]);
  });
});
