import type { DamageRequest, DamageResponse, PokemonSet } from "@pokemon-tools/contracts";
import { computeSmogonDamage, validateKnownSet } from "./smogon-adapter.js";

export interface DamageCalculator {
  compute(input: DamageRequest): DamageResponse;
  validateSet(set: PokemonSet): string[];
}

export const smogonCalculator: DamageCalculator = {
  compute: computeSmogonDamage,
  validateSet: validateKnownSet
};

export function computeDamage(input: DamageRequest, calculator: DamageCalculator = smogonCalculator) {
  return calculator.compute(input);
}

export function validateSet(set: PokemonSet, calculator: DamageCalculator = smogonCalculator) {
  return calculator.validateSet(set);
}
