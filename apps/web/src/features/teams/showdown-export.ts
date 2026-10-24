import type { PokemonSet, TeamDraft } from "@pokemon-tools/contracts";
import type { CatalogResponse } from "@pokemon-tools/contracts";
import { validateTeamDraft, type SetValidationIssue } from "./set-validation";

const statLabels: Array<[keyof PokemonSet["evs"], string]> = [
  ["hp", "HP"],
  ["atk", "Atk"],
  ["def", "Def"],
  ["spa", "SpA"],
  ["spd", "SpD"],
  ["spe", "Spe"]
];

export type ShowdownExportResult = {
  text: string;
  missingSpecies: number[];
  validationIssues: SetValidationIssue[];
};

function exportPokemon(set: PokemonSet): string {
  const species = set.species.trim();
  const nickname = set.nickname?.trim();
  const headerName = nickname && nickname.toLowerCase() !== species.toLowerCase()
    ? `${nickname} (${species})`
    : species;
  const header = set.item.trim() ? `${headerName} @ ${set.item.trim()}` : headerName;
  const lines = [header];

  if (set.ability.trim()) lines.push(`Ability: ${set.ability.trim()}`);
  if (set.teraType?.trim()) lines.push(`Tera Type: ${set.teraType.trim()}`);
  if (set.level !== 100) lines.push(`Level: ${set.level}`);

  const evs = statLabels
    .filter(([stat]) => set.evs[stat] !== 0)
    .map(([stat, label]) => `${set.evs[stat]} ${label}`);
  if (evs.length) lines.push(`EVs: ${evs.join(" / ")}`);

  if (set.nature.trim()) lines.push(`${set.nature.trim()} Nature`);

  const ivs = statLabels
    .filter(([stat]) => set.ivs[stat] !== 31)
    .map(([stat, label]) => `${set.ivs[stat]} ${label}`);
  if (ivs.length) lines.push(`IVs: ${ivs.join(" / ")}`);

  for (const move of set.moves) {
    if (move.trim()) lines.push(`- ${move.trim()}`);
  }

  return lines.join("\n");
}

export function exportShowdownPaste(team: TeamDraft, catalog?: CatalogResponse | null, numericInputsValid = true): ShowdownExportResult {
  const missingSpecies: number[] = [];
  const sets = team.pokemon.flatMap((set, index) => {
    if (!set.species.trim()) {
      missingSpecies.push(index + 1);
      return [];
    }
    return [exportPokemon(set)];
  });

  const validationIssues = catalog === undefined ? [] : validateTeamDraft(team, catalog);
  const invalidNumericDraft = !numericInputsValid;
  const text = validationIssues.length || invalidNumericDraft || missingSpecies.length ? "" : sets.join("\n\n");
  return { text, missingSpecies, validationIssues };
}
