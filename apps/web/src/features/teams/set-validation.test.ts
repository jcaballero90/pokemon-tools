import { describe, expect, it } from "vitest";
import { type CatalogResponse } from "@pokemon-tools/contracts";
import { validatePokemonSet } from "./set-validation";

const catalog: CatalogResponse = {
  species: [{ name: "Pikachu", types: ["Electric"], baseStats: { spe: 90 } }],
  moves: ["Thunderbolt"], moveDetails: { Thunderbolt: { type: "Electric", category: "Special" } },
  abilities: ["Static"], items: ["Light Ball"], types: ["Electric"], natures: ["Timid"]
};

describe("team set validation", () => {
  it("accepts optional blank fields and unused move slots", () => {
    expect(validatePokemonSet({
      species: "Pikachu", item: "", ability: "", nature: "Timid", teraType: "",
      level: 50, evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      boosts: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, moves: ["", "Thunderbolt"]
    }, catalog)).toEqual([]);
  });

  it("flags unknown catalog values and illegal numeric values", () => {
    const issues = validatePokemonSet({
      species: "Missingmon", item: "Made Up Item", ability: "Made Up Ability", nature: "Unknown",
      teraType: "Not a type", level: 101,
      evs: { hp: 253, atk: 252, def: 252, spa: 0, spd: 0, spe: 0 },
      ivs: { hp: -1, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      boosts: { hp: 0, atk: 7, def: 0, spa: 0, spd: 0, spe: 0 }, moves: ["Unknown move"]
    }, catalog);

    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "unknown-species", "unknown-item", "unknown-ability", "unknown-nature", "unknown-type",
      "unknown-move", "out-of-range", "ev-total"
    ]));
  });
});
