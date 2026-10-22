import identities from "./pokedex-identities.json" with { type: "json" };
import { toID } from "@smogon/calc";

export type PokedexIdentity = {
  eligible: boolean;
  pokemonId: number | null;
  pokemonName: string | null;
  pokemonIsDefault: boolean;
  pokemonFormId: number | null;
  pokemonFormName: string | null;
  pokemonFormIsDefault: boolean;
  speciesId: number | null;
  evolutionChainId: number | null;
  spriteStems: string[];
  spriteFormNames: string[];
  isMega: boolean;
  baseKey: string;
  nationalDexId: number;
  pokedexSlug: string;
  pokedexIsBaseForm: boolean;
};

type Manifest = { entries: Record<string, PokedexIdentity> };
const manifest = identities as Manifest;

export const pokedexIdentities = manifest.entries;
const eligibleIdentitiesBySlug = new Map(Object.values(pokedexIdentities)
  .filter((identity) => identity.eligible && identity.nationalDexId > 0)
  .map((identity) => [identity.pokedexSlug, identity]));

export function pokedexIdentity(name: string): PokedexIdentity | undefined {
  return pokedexIdentities[toID(name)];
}

export function pokedexIdentityBySlug(slug: string): PokedexIdentity | undefined {
  return eligibleIdentitiesBySlug.get(slug.toLowerCase());
}

export function eligiblePokedexSlugs(): string[] {
  return [...eligibleIdentitiesBySlug.keys()].sort();
}
