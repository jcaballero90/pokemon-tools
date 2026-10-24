import { statIds, type PokemonSet } from "@pokemon-tools/contracts";

export type DamageSpreadStat = (typeof statIds)[number];
export type DamageSpreadId = "attacker" | "defender";
export type DamageSpreadDraft = {
  evs: Record<DamageSpreadStat, string>;
  ivs: Record<DamageSpreadStat, string>;
};

export function blankDamageSpreadDraft(): DamageSpreadDraft {
  const blankStats = Object.fromEntries(statIds.map((stat) => [stat, ""])) as Record<DamageSpreadStat, string>;
  return { evs: { ...blankStats }, ivs: { ...blankStats } };
}

/** Merge optional string drafts without losing explicit zeroes or invalid values. */
export function mergeDamageSpreadOverrides(set: PokemonSet, draft: DamageSpreadDraft): unknown {
  return {
    ...set,
    moves: set.moves.filter(Boolean),
    evs: mergeBlock(set.evs, draft.evs),
    ivs: mergeBlock(set.ivs, draft.ivs)
  };
}

function mergeBlock(
  current: Record<DamageSpreadStat, number>,
  overrides: Record<DamageSpreadStat, string>
): Record<DamageSpreadStat, unknown> {
  return Object.fromEntries(statIds.map((stat) => {
    const raw = overrides[stat].trim();
    if (!raw) return [stat, current[stat]];
    const numeric = Number(raw);
    return [stat, Number.isFinite(numeric) ? numeric : raw];
  })) as Record<DamageSpreadStat, unknown>;
}
