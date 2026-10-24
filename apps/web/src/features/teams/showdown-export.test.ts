import { describe, expect, it } from "vitest";
import { pokemonSetSchema, type TeamDraft } from "@pokemon-tools/contracts";
import { exportShowdownPaste } from "./showdown-export";

describe("Pokémon Showdown paste export", () => {
  it("exports standard set syntax and keeps explicit levels and zero IVs", () => {
    const pokemon = pokemonSetSchema.parse({
      species: "Pikachu",
      nickname: "Sparky",
      ability: "Static",
      nature: "Timid",
      level: 42,
      teraType: "Water",
      evs: { spa: 252, spd: 4, spe: 252 },
      ivs: { atk: 0 },
      moves: ["Thunderbolt", "Protect"]
    });
    const team = {
      name: "Kept name", notes: "Kept notes", format: "gen9",
      pokemon: [{ ...pokemon, moves: ["Thunderbolt", "", "Protect"] }]
    } as unknown as TeamDraft;

    expect(exportShowdownPaste(team)).toEqual({
      missingSpecies: [],
      validationIssues: [],
      text: `Sparky (Pikachu)\nAbility: Static\nTera Type: Water\nLevel: 42\nEVs: 252 SpA / 4 SpD / 252 Spe\nTimid Nature\nIVs: 0 Atk\n- Thunderbolt\n- Protect`
    });
  });

  it("omits default EVs and IVs while exporting a held item and level 100 as Showdown defaults", () => {
    const pokemon = pokemonSetSchema.parse({
      species: "Pikachu",
      item: "Light Ball",
      level: 100,
      moves: ["Thunderbolt"]
    });
    const team = { name: "Team", notes: "", format: "gen9", pokemon: [pokemon] } as TeamDraft;

    expect(exportShowdownPaste(team).text).toBe("Pikachu @ Light Ball\nSerious Nature\n- Thunderbolt");
  });

  it("blocks export when a draft Pokémon has no species instead of silently dropping it", () => {
    const team = {
      name: "Draft", notes: "", format: "gen9",
      pokemon: [pokemonSetSchema.parse({ species: "Pikachu" }), { ...pokemonSetSchema.parse({ species: "Pikachu" }), species: "" }]
    } as TeamDraft;

    expect(exportShowdownPaste(team)).toMatchObject({ missingSpecies: [2] });
  });

  it("blocks generated text for catalog names and values that are not legal", () => {
    const team = {
      name: "Draft", notes: "", format: "gen9",
      pokemon: [{
        ...pokemonSetSchema.parse({ species: "Pikachu", moves: ["Thunderbolt"] }),
        species: "Missingmon",
        evs: { ...pokemonSetSchema.parse({ species: "Pikachu" }).evs, atk: 252, spe: 252, hp: 8 },
        ivs: { ...pokemonSetSchema.parse({ species: "Pikachu" }).ivs, atk: 32 }
      }]
    } as unknown as TeamDraft;
    const catalog = {
      species: [{ name: "Pikachu", types: ["Electric"], baseStats: {} }],
      moves: ["Thunderbolt"], abilities: [], items: [], types: ["Electric"], natures: ["Serious"]
    } as unknown as import("@pokemon-tools/contracts").CatalogResponse;

    const result = exportShowdownPaste(team, catalog);
    expect(result.text).toBe("");
    expect(result.validationIssues.map((issue) => issue.code)).toContain("unknown-species");
    expect(result.validationIssues.map((issue) => issue.code)).toContain("out-of-range");
  });
});
