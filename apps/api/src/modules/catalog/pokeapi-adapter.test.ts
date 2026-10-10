import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "../../../db.js";
import { isAllowedSprite, pokedex } from "./pokeapi-adapter.js";

function cache(findUnique: () => Promise<unknown>, upsert: () => Promise<unknown> = async () => ({})): Database {
  return { pokedexCache: { findUnique, upsert } } as unknown as Database;
}

const response = () => ({
  ok: true,
  json: async () => ({ id: 25, sprites: { front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" }, height: 4, weight: 60 })
});

describe("PokéAPI descriptive cache", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("allows only the intended HTTPS sprite host and path", () => {
    expect(isAllowedSprite("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png")).toBe(true);
    expect(isAllowedSprite("http://raw.githubusercontent.com/PokeAPI/sprites/master/a.png")).toBe(false);
    expect(isAllowedSprite("https://example.test/PokeAPI/sprites/a.png")).toBe(false);
    expect(isAllowedSprite("https://raw.githubusercontent.com/other/repo/a.png")).toBe(false);
  });

  it("fetches and returns live details when the database cache cannot be read or written", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response()));
    const db = cache(async () => { throw new Error("database private detail"); }, async () => { throw new Error("cache write failure"); });

    await expect(pokedex(db, "Pikachu")).resolves.toMatchObject({ pokedexId: 25, heightDecimeters: 4 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("returns validated stale cache when refresh fails and never renders an unapproved sprite", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const db = cache(async () => ({
      fetchedAt: new Date(0),
      payload: { source: "PokéAPI", pokedexId: 25, sprite: "https://evil.example/pixel.png", heightDecimeters: 4, weightHectograms: 60 }
    }));

    await expect(pokedex(db, "Pikachu")).resolves.toMatchObject({ stale: true, sprite: null, pokedexId: 25 });
  });

  it("reports invalid species as a safe input error", async () => {
    await expect(pokedex(cache(async () => null), "Not a Pokémon")).rejects.toMatchObject({ name: "InputValidationError", message: "Unknown Generation 9 species" });
  });
});
