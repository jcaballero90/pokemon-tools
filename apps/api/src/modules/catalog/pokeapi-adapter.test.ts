import { afterEach, describe, expect, it, vi } from "vitest";
import type { Database } from "../../../db.js";
import { catalog } from "./catalog.js";
import { isAllowedSprite, pokedex, pokedexEvolution } from "./pokeapi-adapter.js";
import { pokedexIdentities } from "./pokedex-identities.js";

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
    let reads = 0;
    const db = cache(async () => ++reads === 1 ? null : ({
      fetchedAt: new Date(0),
      payload: { source: "PokéAPI", pokedexId: 25, sprite: "https://evil.example/pixel.png", heightDecimeters: 4, weightHectograms: 60 }
    }));

    await expect(pokedex(db, "Pikachu")).resolves.toMatchObject({ stale: true, sprite: null, pokedexId: 25 });
  });

  it("returns ability names and caches English descriptions independently", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        id: 25, height: 4, weight: 60,
        abilities: [
          { ability: { name: "static", url: "https://pokeapi.co/api/v2/ability/9/" }, is_hidden: false },
          { ability: { name: "lightning-rod", url: "https://pokeapi.co/api/v2/ability/31/" }, is_hidden: true }
        ],
        sprites: { front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" }
      }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ effect_entries: [
        { short_effect: "May paralyze a Pokémon that makes contact.", language: { name: "en" } },
        { short_effect: "別の言語の説明", language: { name: "ja" } }
      ] }) })
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const findUnique = vi.fn(async () => null);
    const upsert = vi.fn(async () => ({}));

    const result = await pokedex(cache(findUnique, upsert), "Pikachu");

    expect(result.abilities).toEqual([
      { name: "Static", isHidden: false, description: "May paralyze a Pokémon that makes contact." },
      { name: "Lightning Rod", isHidden: true }
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://pokeapi.co/api/v2/ability/9", expect.any(Object));
    expect(findUnique).toHaveBeenCalledWith({ where: { key: "ability:v1:9" } });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { key: "ability:v1:9" },
      create: { key: "ability:v1:9", payload: { description: "May paralyze a Pokémon that makes contact." } }
    }));
  });

  it("reports invalid species as a safe input error", async () => {
    await expect(pokedex(cache(async () => null), "Not a Pokémon")).rejects.toMatchObject({ name: "InputValidationError", message: "Unknown Generation 9 species" });
  });

  it("keeps the pinned official identity resolver complete and separates National and resource IDs", () => {
    const entries = Object.values(pokedexIdentities);
    expect(entries.filter((entry) => entry.eligible)).toHaveLength(1324);
    expect(entries.filter((entry) => entry.eligible).every((entry) => entry.nationalDexId > 0)).toBe(true);
    expect(catalog.species.find((entry) => entry.name === "Ababo")?.pokedexEligible).toBe(false);
    expect(catalog.species.find((entry) => entry.name === "Charizard")?.pokedexEligible).toBe(true);
    expect(pokedexIdentities.charizardmegax).toMatchObject({ nationalDexId: 6, speciesId: 6, pokemonId: 10034, pokemonFormId: 10134, isMega: true });
    expect(pokedexIdentities.meowthgalar).toMatchObject({ nationalDexId: 52, speciesId: 52, pokemonId: 10161 });
    expect(pokedexIdentities.ogerpontealtera).toMatchObject({ eligible: true, nationalDexId: 1017, pokemonId: null });
    expect(catalog.species.find((entry) => entry.name === "Aegislash-Both")?.pokedexEligible).toBe(false);
  });

  it("returns ordered Gen IX artwork and a separate shiny-only candidate list", async () => {
    const url = (path: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/${path}`;
    const sv = url("scarlet-violet/25.webp");
    const svBack = url("scarlet-violet/back/25.webp");
    const svShiny = url("scarlet-violet/shiny/25.webp");
    const svFemale = url("scarlet-violet/female/25.webp");
    const svShinyFemale = url("scarlet-violet/shiny/female/25.webp");
    const za = url("legends-za/25.webp");
    const champions = url("champions/25.webp");
    const home = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/25.png";
    const official = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 25, height: 4, weight: 60,
        sprites: {
          versions: { "generation-ix": {
            "scarlet-violet": { front_default: sv, back_default: svBack, front_shiny: svShiny, front_female: svFemale, front_shiny_female: svShinyFemale },
            "legends-za": { front_default: za },
            champions: { front_default: champions }
          } },
          other: { home: { front_default: home }, "official-artwork": { front_default: official } }
        }
      })
    }));
    const findUnique = vi.fn(async () => null);
    const db = cache(findUnique);

    const result = await pokedex(db, "Pikachu");
    expect(result).toMatchObject({ pokedexId: 25, sprite: sv, artwork: {
      normal: [sv, svBack, za, champions, home, official], shiny: [svShiny],
      genderVariants: {
        male: { normal: [sv, svBack, za, champions, home, official], shiny: [svShiny] },
        female: { normal: [svFemale], shiny: [svShinyFemale] }
      }
    } });
    expect(findUnique).toHaveBeenCalledWith({ where: { key: "pokedex:v4:pikachu" } });
    expect(fetch).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/25", expect.any(Object));
  });

  it("resolves curated female forms by their exact Pokémon resource ID", async () => {
    const url = (path: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/${path}`;
    const female = url("female/10025.webp");
    const front = url("10025.webp");
    const backFemale = url("back/female/10025.webp");
    const back = url("back/10025.webp");
    const shinyFemale = url("shiny/female/10025.webp");
    const shiny = url("shiny/10025.webp");
    const backShinyFemale = url("back/shiny/female/10025.webp");
    const backShiny = url("back/shiny/10025.webp");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      id: 10025,
      sprites: { versions: { "generation-ix": { "scarlet-violet": {
        front_female: female, front_default: front, back_female: backFemale, back_default: back,
        front_shiny_female: shinyFemale, front_shiny: shiny,
        back_shiny_female: backShinyFemale, back_shiny: backShiny
      } } } },
      height: 6, weight: 85
    }) }));
    const result = await pokedex(cache(async () => null), "Meowstic-F");
    expect(fetch).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/10025", expect.any(Object));
    expect(result).toMatchObject({ pokedexId: 678, familyKey: "meowsticf", artwork: {
      normal: [female, backFemale, front, back],
      shiny: [shinyFemale, backShinyFemale, shiny, backShiny],
      genderVariants: {
        male: { normal: [], shiny: [] },
        female: { normal: [female, backFemale, front, back], shiny: [shinyFemale, backShinyFemale, shiny, backShiny] }
      }
    } });
  });

  it("keeps both gender choices available for a catalog default backed by a male resource", async () => {
    const url = (path: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/${path}`;
    const male = url("10023.webp");
    const female = url("female/10023.webp");
    const maleShiny = url("shiny/10023.webp");
    const femaleShiny = url("shiny/female/10023.webp");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      id: 10023,
      sprites: { versions: { "generation-ix": { "scarlet-violet": {
        front_default: male, front_female: female, front_shiny: maleShiny, front_shiny_female: femaleShiny
      } } } }
    }) }));

    const result = await pokedex(cache(async () => null), "Meowstic");

    expect(result.artwork?.genderVariants).toEqual({
      male: { normal: [male], shiny: [maleShiny] },
      female: { normal: [female], shiny: [femaleShiny] }
    });
  });

  it("builds Corvisquire's clickable family from one cached evolution-chain request", async () => {
    const chain = {
      species: { name: "rookidee", url: "https://pokeapi.co/api/v2/pokemon-species/821/" },
      evolution_details: [],
      evolves_to: [{
        species: { name: "corvisquire", url: "https://pokeapi.co/api/v2/pokemon-species/822/" },
        evolution_details: [{ trigger: { name: "level-up" }, min_level: 18, version_group: { name: "sword-shield" }, is_default: true }],
        evolves_to: [{
          species: { name: "corviknight", url: "https://pokeapi.co/api/v2/pokemon-species/823/" },
          evolution_details: [{ trigger: { name: "level-up" }, min_level: 38, version_group: { name: "sword-shield" }, is_default: true }],
          evolves_to: []
        }]
      }]
    };
    let stored: unknown = null;
    const findUnique = vi.fn(async () => stored);
    const upsert = vi.fn(async (input: { create: { key: string; payload: unknown } }) => {
      stored = { payload: input.create.payload, fetchedAt: new Date() };
      return {};
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ chain }) }));
    const db = cache(findUnique, upsert);

    const result = await pokedexEvolution(db, "Corvisquire");
    expect(result.nodes.map((node) => node.name)).toEqual(["Rookidee", "Corvisquire", "Corviknight"]);
    expect(result.nodes.map((node) => node.pokedexId)).toEqual([821, 822, 823]);
    expect(result.edges.map((edge) => edge.alternatives)).toEqual([[ ["Level 18"] ], [ ["Level 38"] ]]);
    expect(result.nodes[0]?.iconCandidates[0]).toContain("generation-ix/scarlet-violet/icons/821.png");
    expect(result.nodes[0]?.iconCandidates[1]).toContain("other/official-artwork/821.png");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { key: "evolution:v1:434" }, create: { key: "evolution:v1:434", payload: { chain } } }));

    await pokedexEvolution(db, "Rookidee");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("keeps Eevee's item branches and regional form-specific evolution paths", async () => {
    const eeveeChain = {
      species: { name: "eevee", url: "https://pokeapi.co/api/v2/pokemon-species/133/" },
      evolution_details: [],
      evolves_to: [
        { species: { name: "vaporeon", url: "https://pokeapi.co/api/v2/pokemon-species/134/" }, evolution_details: [
          { trigger: { name: "use-item" }, item: { name: "water-stone" }, version_group: { name: "red-blue" }, is_default: false },
          { trigger: { name: "use-item" }, item: { name: "water-stone" }, version_group: { name: "sword-shield" }, is_default: true },
          { trigger: { name: "level-up" }, min_level: 16, is_default: false }
        ], evolves_to: [] },
        { species: { name: "jolteon", url: "https://pokeapi.co/api/v2/pokemon-species/135/" }, evolution_details: [{ trigger: { name: "use-item" }, item: { name: "thunder-stone" } }], evolves_to: [] }
      ]
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ chain: eeveeChain }) }));
    const eevee = await pokedexEvolution(cache(async () => null), "Eevee");
    expect(eevee.edges.map((edge) => edge.to)).toEqual(["vaporeon", "jolteon"]);
    expect(eevee.edges[0]?.alternatives).toEqual([["Use Water Stone"]]);
    expect(eevee.edges[1]?.alternatives).toEqual([["Use Thunder Stone"]]);

    const meowthChain = {
      species: { name: "meowth", url: "https://pokeapi.co/api/v2/pokemon-species/52/" },
      evolution_details: [],
      evolves_to: [
        { species: { name: "persian", url: "https://pokeapi.co/api/v2/pokemon-species/53/" }, evolution_details: [{ trigger: { name: "level-up" }, min_level: 28 }], evolves_to: [] },
        { species: { name: "perrserker", url: "https://pokeapi.co/api/v2/pokemon-species/863/" }, evolution_details: [{ trigger: { name: "level-up" }, min_level: 28, required_pokemon_form: { name: "meowth-galar" }, evolved_pokemon_form: { name: "perrserker" } }], evolves_to: [] }
      ]
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ chain: meowthChain }) }));
    const meowth = await pokedexEvolution(cache(async () => null), "Perrserker");
    expect(meowth.nodes.map((node) => node.name)).toEqual(["Meowth", "Persian", "Meowth-Galar", "Perrserker"]);
    expect(meowth.edges.find((edge) => edge.to === "perrserker")?.from).toBe("meowthgalar");
  });

  it("keeps normal and Hisuian Arcanine on their own evolution branches", async () => {
    const chain = {
      species: { name: "growlithe", url: "https://pokeapi.co/api/v2/pokemon-species/58/" },
      evolution_details: [],
      evolves_to: [{
        species: { name: "arcanine", url: "https://pokeapi.co/api/v2/pokemon-species/59/" },
        evolution_details: [
          { trigger: { name: "use-item" }, item: { name: "fire-stone" }, is_default: true },
          {
            trigger: { name: "use-item" }, item: { name: "fire-stone" },
            required_pokemon_form: { name: "growlithe-hisui" }, evolved_pokemon_form: { name: "arcanine-hisui" },
            is_default: true
          }
        ],
        evolves_to: []
      }]
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ chain }) }));

    const result = await pokedexEvolution(cache(async () => null), "Arcanine-Hisui");

    expect(result.nodes.map((node) => node.name)).toEqual(["Growlithe", "Arcanine", "Growlithe-Hisui", "Arcanine-Hisui"]);
    expect(result.edges.map(({ from, to }) => [from, to])).toEqual([
      ["growlithe", "arcanine"],
      ["growlithehisui", "arcaninehisui"]
    ]);
  });

  it("maps official Ogerpon Tera states to the ordinary family node", async () => {
    const chain = {
      species: { name: "ogerpon", url: "https://pokeapi.co/api/v2/pokemon-species/1017/" },
      evolution_details: [], evolves_to: []
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ chain }) }));
    const result = await pokedexEvolution(cache(async () => null), "Ogerpon-Teal-Tera");

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]).toMatchObject({ key: "ogerpon", name: "Ogerpon", pokedexId: 1017 });
    expect(result.nodes[0]?.iconCandidates[0]).toContain("scarlet-violet/icons/1017.png");
    expect(result.nodes[0]?.iconCandidates[1]).toContain("other/official-artwork/1017.png");
  });

  it("keeps Mega forms as separate family links under the ordinary evolution line", async () => {
    const chain = {
      species: { name: "charmander", url: "https://pokeapi.co/api/v2/pokemon-species/4/" },
      evolution_details: [],
      evolves_to: [{
        species: { name: "charmeleon", url: "https://pokeapi.co/api/v2/pokemon-species/5/" },
        evolution_details: [{ trigger: { name: "level-up" }, min_level: 16 }],
        evolves_to: [{
          species: { name: "charizard", url: "https://pokeapi.co/api/v2/pokemon-species/6/" },
          evolution_details: [{ trigger: { name: "level-up" }, min_level: 36 }],
          evolves_to: []
        }]
      }]
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ chain }) }));
    const result = await pokedexEvolution(cache(async () => null), "Charizard-Mega-X");

    expect(result.nodes.map((node) => node.name)).toEqual(["Charmander", "Charmeleon", "Charizard"]);
    expect(result.megaForms.map((node) => node.name)).toContain("Charizard-Mega-X");
    expect(result.megaForms.find((node) => node.name === "Charizard-Mega-X")?.iconCandidates[0]).toContain("scarlet-violet/icons/10034.png");
    expect(result.megaForms.find((node) => node.name === "Charizard-Mega-X")?.iconCandidates[1]).toContain("other/official-artwork/10034.png");
  });

  it("uses flat official artwork when Scarlet/Violet has no evolution icon", async () => {
    const chain = {
      species: { name: "anorith", url: "https://pokeapi.co/api/v2/pokemon-species/347/" },
      evolution_details: [], evolves_to: []
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ chain }) }));
    const result = await pokedexEvolution(cache(async () => null), "Anorith");

    expect(result.nodes[0]?.iconCandidates).toEqual([
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/icons/347.png",
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/347.png"
    ]);
  });
});
