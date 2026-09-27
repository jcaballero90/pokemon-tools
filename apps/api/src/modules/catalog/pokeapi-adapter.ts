import { toID } from "@smogon/calc";
import type { Database } from "../../db.js";
import { knownSpecies } from "./catalog.js";

const formMap: Record<string, string> = {
  "Ogerpon-Wellspring": "ogerpon-wellspring-mask",
  "Ogerpon-Hearthflame": "ogerpon-hearthflame-mask",
  "Ogerpon-Cornerstone": "ogerpon-cornerstone-mask",
  "Urshifu-Rapid-Strike": "urshifu-rapid-strike",
  "Indeedee-F": "indeedee-female"
};

export async function pokedex(db: Database, species: string) {
  if (!knownSpecies(species)) throw new Error("Unknown Generation 9 species");
  const key = formMap[species] ?? (species.includes("-") ? null : toID(species));
  if (!key) return { source: "PokéAPI", unavailable: true, reason: "Form mapping not curated" };
  const previous = await db.pokedexCache.findUnique({ where: { key } });
  if (previous && Date.now() - previous.fetchedAt.getTime() < 86_400_000) return previous.payload;
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`PokéAPI ${response.status}`);
    const data = await response.json() as { id: number; sprites: { front_default: string | null }; height: number; weight: number };
    const payload = { source: "PokéAPI", pokedexId: data.id, sprite: data.sprites.front_default, heightDecimeters: data.height, weightHectograms: data.weight };
    await db.pokedexCache.upsert({ where: { key }, update: { payload, fetchedAt: new Date() }, create: { key, payload } });
    return payload;
  } catch {
    return previous?.payload ?? { source: "PokéAPI", unavailable: true };
  }
}
