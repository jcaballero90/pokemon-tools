import { toID } from "@smogon/calc";
import { pokedexResponseSchema, type PokedexResponse } from "@pokemon-tools/contracts";
import type { Database } from "../../db.js";
import { InputValidationError } from "../../http-errors.js";
import { errorText } from "../../resources/errors.js";
import { knownSpecies } from "./catalog.js";

const formMap: Record<string, string> = {
  "Ogerpon-Wellspring": "ogerpon-wellspring-mask",
  "Ogerpon-Hearthflame": "ogerpon-hearthflame-mask",
  "Ogerpon-Cornerstone": "ogerpon-cornerstone-mask",
  "Urshifu-Rapid-Strike": "urshifu-rapid-strike",
  "Indeedee-F": "indeedee-female",
  "Chien-Pao": "chien-pao"
};

const unavailable = (reason?: string) => ({ source: "PokéAPI" as const, unavailable: true, ...(reason ? { reason } : {}) });
const safeCachedDetails = (value: unknown): PokedexResponse | undefined => {
  const result = pokedexResponseSchema.safeParse(value);
  if (!result.success) return undefined;
  if (result.data.sprite && !isAllowedSprite(result.data.sprite)) return { ...result.data, sprite: null };
  return result.data;
};

export function isAllowedSprite(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "raw.githubusercontent.com" &&
      url.port === "" && url.username === "" && url.password === "" &&
      url.pathname.startsWith("/PokeAPI/sprites/");
  } catch {
    return false;
  }
}

export async function pokedex(db: Database, species: string) {
  if (!knownSpecies(species)) throw new InputValidationError(errorText.unknownGeneration9Species, [{ code: "unknown-species", path: ["species"], value: species }], "unknown-species");
  const key = formMap[species] ?? (species.includes("-") ? null : toID(species));
  if (!key) return unavailable("Form mapping not curated");

  let previous: { payload: unknown; fetchedAt: Date } | null = null;
  try {
    previous = await db.pokedexCache.findUnique({ where: { key } });
  } catch {
    // A cache outage should not prevent the descriptive upstream lookup.
  }
  const cached = previous ? safeCachedDetails(previous.payload) : undefined;
  if (cached && previous && Date.now() - previous.fetchedAt.getTime() < 86_400_000) return cached;

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`PokéAPI ${response.status}`);
    const data = await response.json() as { id: number; sprites: { front_default: string | null }; height: number; weight: number };
    const payload = pokedexResponseSchema.parse({
      source: "PokéAPI", pokedexId: data.id,
      sprite: data.sprites.front_default && isAllowedSprite(data.sprites.front_default) ? data.sprites.front_default : null,
      heightDecimeters: data.height, weightHectograms: data.weight
    });
    try {
      await db.pokedexCache.upsert({ where: { key }, update: { payload, fetchedAt: new Date() }, create: { key, payload } });
    } catch {
      // Fresh descriptive data is useful even when PostgreSQL cannot cache it.
    }
    return payload;
  } catch {
    if (cached) return { ...cached, stale: true };
    return unavailable();
  }
}
