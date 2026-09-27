import { Generations, toID } from "@smogon/calc";

const gen = Generations.get(9);
export const catalog = {
  species: [...gen.species].map((p) => ({ name: p.name, types: p.types, baseStats: p.baseStats })).sort((a, b) => a.name.localeCompare(b.name)),
  moves: [...gen.moves].map((m) => m.name).sort(),
  abilities: [...gen.abilities].map((a) => a.name).sort(),
  items: [...gen.items].map((i) => i.name).sort(),
  types: [...gen.types].map((t) => t.name).filter((name) => name !== "???").sort(),
  natures: [...gen.natures].map((n) => n.name).sort()
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
