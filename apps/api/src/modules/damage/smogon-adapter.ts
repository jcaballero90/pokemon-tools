import { calculate, Field, Generations, Move, Pokemon } from "@smogon/calc";
import type { DamageRequest, DamageResponse, PokemonSet } from "@pokemon-tools/contracts";
import { knownAbility, knownItem, knownMove, knownNature, knownSpecies, knownType } from "../catalog/catalog.js";

const gen = Generations.get(9);
const status = { Healthy: "", Burned: "brn", Poisoned: "psn", "Badly Poisoned": "tox", Paralyzed: "par", Asleep: "slp", Frozen: "frz" } as const;

export function validateKnownSet(set: PokemonSet): string[] {
  const errors: string[] = [];
  if (!knownSpecies(set.species)) errors.push(`Unknown species: ${set.species}`);
  if (!knownAbility(set.ability)) errors.push(`Unknown ability: ${set.ability}`);
  if (!knownItem(set.item)) errors.push(`Unknown item: ${set.item}`);
  if (!knownNature(set.nature)) errors.push(`Unknown nature: ${set.nature}`);
  if (set.teraType && !knownType(set.teraType)) errors.push(`Unknown Tera type: ${set.teraType}`);
  for (const move of set.moves) if (!knownMove(move)) errors.push(`Unknown move: ${move}`);
  return errors;
}

function pokemon(set: PokemonSet, terastallized: boolean) {
  return new Pokemon(gen, set.species, {
    level: set.level, item: set.item || undefined, ability: set.ability || undefined,
    nature: set.nature, evs: set.evs, ivs: set.ivs, boosts: set.boosts,
    teraType: terastallized ? set.teraType as Pokemon["teraType"] : undefined,
    status: status[set.status] as Pokemon["status"]
  });
}

export function computeSmogonDamage(input: DamageRequest): DamageResponse {
  const errors = [...validateKnownSet(input.attacker), ...validateKnownSet(input.defender)];
  if (!knownMove(input.move)) errors.push(`Unknown move: ${input.move}`);
  if (input.field.attackerTerastallized && !input.attacker.teraType) errors.push("Attacker Tera type required when Terastallized");
  if (input.field.defenderTerastallized && !input.defender.teraType) errors.push("Defender Tera type required when Terastallized");
  if (errors.length) throw new Error(errors.join("; "));
  const attacker = pokemon(input.attacker, input.field.attackerTerastallized);
  const defender = pokemon(input.defender, input.field.defenderTerastallized);
  const move = new Move(gen, input.move, { isCrit: input.field.critical });
  const field = new Field({
    gameType: input.field.gameType,
    weather: input.field.weather ? input.field.weather as Field["weather"] : undefined,
    terrain: input.field.terrain ? input.field.terrain as Field["terrain"] : undefined,
    attackerSide: { isHelpingHand: input.field.helpingHand },
    defenderSide: {
      isReflect: input.field.reflect, isLightScreen: input.field.lightScreen,
      isAuroraVeil: input.field.auroraVeil, isFriendGuard: input.field.friendGuard,
      isSR: input.field.stealthRock, spikes: input.field.spikes
    }
  });
  const result = calculate(gen, attacker, defender, move, field);
  const [min, max] = result.range();
  const hp = defender.maxHP();
  const ko = max === 0 ? { chance: 0, n: 1 } : result.kochance(false);
  return {
    generation: 9, min, max, minPercent: Math.round(min / hp * 1000) / 10,
    maxPercent: Math.round(max / hp * 1000) / 10,
    koChanceOnHit: ko.n === 1 ? ko.chance ?? 0 : 0,
    defenderHp: hp, description: max === 0 ? `${input.move} has no effect on ${input.defender.species}` : result.desc()
  };
}
