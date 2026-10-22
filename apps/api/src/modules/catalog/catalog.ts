import { Generations, toID } from "@smogon/calc";
import { pokedexIdentity } from "./pokedex-identities.js";
import pokemonTranslations from "./pokemon-translations.generated.json" with { type: "json" };

const gen = Generations.get(9);
export const catalog = {
  species: [...gen.species].map((p) => {
    const identity = pokedexIdentity(p.name);
    return {
      name: p.name,
      types: p.types,
      baseStats: p.baseStats,
      pokedexEligible: identity?.eligible ?? false,
      ...(identity?.eligible ? {
        nationalDexId: identity.nationalDexId,
        pokedexSlug: identity.pokedexSlug,
        pokedexIsBaseForm: identity.pokedexIsBaseForm
      } : {})
    };
  }).sort((a, b) => a.name.localeCompare(b.name)),
  moves: [...gen.moves].map((m) => m.name).sort(),
  abilities: [...gen.abilities].map((a) => a.name).sort(),
  items: [...gen.items].map((i) => i.name).sort(),
  types: [...gen.types].map((t) => t.name).filter((name) => name !== "???").sort(),
  natures: [...gen.natures].map((n) => n.name).sort(),
  translations: {
    ...pokemonTranslations.catalog,
    evolutionLocations: pokemonTranslations.evolutionLocations.labels
  }
};

export function knownSpecies(name: string) { return gen.species.get(toID(name)) !== undefined; }
export function knownMove(name: string) { return gen.moves.get(toID(name)) !== undefined; }
export function knownAbility(name: string) { return !name || gen.abilities.get(toID(name)) !== undefined; }
export function knownItem(name: string) { return !name || gen.items.get(toID(name)) !== undefined; }
export function knownNature(name: string) { return gen.natures.get(toID(name)) !== undefined; }
export function knownType(name: string) { return gen.types.get(toID(name)) !== undefined; }

export function typeChart() {
  return catalog.types.map((attack) => ({ attack, against: Object.fromEntries(catalog.types.map((defend) => {
    const type = gen.types.get(toID(attack));
    return [defend, type?.effectiveness[defend as keyof typeof type.effectiveness] ?? 1];
  })) }));
}
