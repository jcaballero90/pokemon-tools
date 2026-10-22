import { describe, expect, it } from "vitest";
import { pokedexMoves } from "./pokedex-moves.js";

describe("pinned Scarlet/Violet learnsets", () => {
  it("returns typed moves with grouped acquisition data and source provenance", () => {
    const result = pokedexMoves("Pikachu");
    const thunderbolt = result.moves.find((move) => move.name === "Thunderbolt");

    expect(result.source).toMatchObject({ provider: "PokéAPI", versionGroup: "scarlet-violet", versionGroupId: 25 });
    expect(thunderbolt).toMatchObject({ name: "Thunderbolt", type: "Electric", category: "special" });
    expect(thunderbolt?.acquisition).toContainEqual({ method: "machine", machineNumbers: [126] });
    expect(result.moves.every((move) => move.acquisition.length > 0)).toBe(true);
  });

  it("represents level-zero event acquisition without a numeric level", () => {
    const result = pokedexMoves("Abomasnow");
    const eventMove = result.moves.find((move) => move.acquisition.some((method) => method.event));

    expect(eventMove).toBeDefined();
    expect(eventMove?.acquisition.some((method) => method.event && method.level === undefined)).toBe(true);
  });

  it("retains egg-move acquisition without asserting parent candidates", () => {
    const result = pokedexMoves("Aipom");
    const slam = result.moves.find((move) => move.name === "Slam");

    expect(slam?.acquisition).toContainEqual({ method: "egg" });
    expect(slam).not.toHaveProperty("eggParents");
  });

  it("marks a species with no base Scarlet/Violet entry as unavailable", () => {
    expect(pokedexMoves("Abra")).toMatchObject({
      species: "Abra",
      moves: [],
      unavailable: true,
      unavailableReasonCode: "no-scarlet-violet-learnset"
    });
  });

  it("rejects species outside the eligible Pokédex", () => {
    expect(() => pokedexMoves("Not a Pokémon")).toThrow("Unknown Generation 9 species");
  });
});
