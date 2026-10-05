import { calculate, Field, Generations, Move, Pokemon } from "@smogon/calc";
import type { ApiValidationIssue, DamageRequest, DamageResponse, PokemonSet } from "@pokemon-tools/contracts";
import { knownAbility, knownItem, knownMove, knownNature, knownSpecies, knownType } from "../catalog/catalog.js";
import { InputValidationError } from "../../http-errors.js";
import { errorText, validationIssueMessage } from "../../resources/errors.js";

const gen = Generations.get(9);
const status = { Healthy: "", Burned: "brn", Poisoned: "psn", "Badly Poisoned": "tox", Paralyzed: "par", Asleep: "slp", Frozen: "frz" } as const;

export function validateKnownSetIssues(set: PokemonSet, path: ApiValidationIssue["path"] = []): ApiValidationIssue[] {
  const issues: ApiValidationIssue[] = [];
  if (!knownSpecies(set.species)) issues.push({ code: "unknown-species", path: [...path, "species"], value: set.species });
  if (!knownAbility(set.ability)) issues.push({ code: "unknown-ability", path: [...path, "ability"], value: set.ability });
  if (!knownItem(set.item)) issues.push({ code: "unknown-item", path: [...path, "item"], value: set.item });
  if (!knownNature(set.nature)) issues.push({ code: "unknown-nature", path: [...path, "nature"], value: set.nature });
  if (set.teraType && !knownType(set.teraType)) issues.push({ code: "unknown-type", path: [...path, "teraType"], value: set.teraType });
  for (const [index, move] of set.moves.entries()) if (!knownMove(move)) issues.push({ code: "unknown-move", path: [...path, "moves", index], value: move });
  return issues;
}

export function validateKnownSet(set: PokemonSet): string[] {
  return validateKnownSetIssues(set).map(validationIssueMessage);
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
  const issues = [...validateKnownSetIssues(input.attacker, ["attacker"]), ...validateKnownSetIssues(input.defender, ["defender"])];
  if (!knownMove(input.move)) issues.push({ code: "unknown-move", path: ["move"], value: input.move });
  if (input.field.attackerTerastallized && !input.attacker.teraType) issues.push({ code: "missing-attacker-tera-type", path: ["attacker", "teraType"] });
  if (input.field.defenderTerastallized && !input.defender.teraType) issues.push({ code: "missing-defender-tera-type", path: ["defender", "teraType"] });
  if (issues.length) throw new InputValidationError(issues.map(validationIssueMessage).join("; "), issues);
  const attacker = pokemon(input.attacker, input.field.attackerTerastallized);
  const defender = pokemon(input.defender, input.field.defenderTerastallized);
  const move = new Move(gen, input.move, { isCrit: input.field.critical });
  const matchup = { attacker: attacker.species.name, defender: defender.species.name, move: move.name };
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
    defenderHp: hp, description: max === 0 ? errorText.noEffect(input.move, input.defender.species) : result.desc(),
    matchup, hasEffect: max > 0
  };
}
