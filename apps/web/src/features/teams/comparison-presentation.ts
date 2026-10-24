import { label, t } from "../../i18n/presentation";
import type { ComparisonMember } from "./comparison-model";

export function sideLabel(side: "a" | "b"): string {
  return side === "a" ? t.comparison.teamA : t.comparison.teamB;
}

export function memberLabel(member: ComparisonMember): string {
  const species = member.species ? label("species", member.species) : t.team.choosePokemon;
  const name = member.name && member.name !== member.species
    ? `${member.name} (${species})`
    : species;
  return `${member.index + 1}. ${name}`;
}

export function memberList(members: ComparisonMember[]): string {
  return members.length ? members.map(memberLabel).join(" · ") : t.comparison.none;
}
