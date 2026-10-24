import { statIds, type CatalogResponse, type TeamDraft } from "@pokemon-tools/contracts";
import { formatMessage, t } from "../../i18n/presentation";

export type SetValidationField =
  | "species" | "item" | "ability" | "nature" | "teraType" | "level"
  | "evs" | "ivs" | "boosts" | "moves" | `evs.${(typeof statIds)[number]}`
  | `ivs.${(typeof statIds)[number]}` | `boosts.${(typeof statIds)[number]}` | `moves.${number}`;

export type SetValidationCode =
  | "catalog-unavailable" | "required" | "unknown-species" | "unknown-item"
  | "unknown-ability" | "unknown-nature" | "unknown-type" | "unknown-move"
  | "whole-number" | "out-of-range" | "ev-total";

export type SetValidationIssue = {
  field: string;
  code: SetValidationCode;
  min?: number;
  max?: number;
  total?: number;
  value?: string;
};

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function known(value: string, options: readonly string[]) {
  const id = normalized(value);
  return id.length > 0 && options.some((option) => normalized(option) === id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function addIntegerIssue(
  issues: SetValidationIssue[],
  field: SetValidationField,
  value: unknown,
  min: number,
  max: number
) {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    issues.push({ field, code: "whole-number", min, max });
    return;
  }
  if (value < min || value > max) issues.push({ field, code: "out-of-range", min, max });
}

export function validatePokemonSet(value: unknown, catalog: CatalogResponse | null): SetValidationIssue[] {
  const issues: SetValidationIssue[] = [];
  if (!isRecord(value)) return [{ field: "species", code: "required" }];

  const species = typeof value.species === "string" ? value.species.trim() : "";
  if (!species) issues.push({ field: "species", code: "required" });

  if (!catalog) {
    issues.push({ field: "catalog", code: "catalog-unavailable" });
  } else {
    if (species && !known(species, catalog.species.map((entry) => entry.name))) {
      issues.push({ field: "species", code: "unknown-species", value: species });
    }

    const optionalCatalogFields = [
      ["item", "unknown-item", catalog.items],
      ["ability", "unknown-ability", catalog.abilities]
    ] as const;
    for (const [field, code, options] of optionalCatalogFields) {
      const entered = typeof value[field] === "string" ? value[field].trim() : "";
      if (entered && !known(entered, options)) issues.push({ field, code, value: entered });
    }

    const nature = typeof value.nature === "string" ? value.nature.trim() : "";
    if (!nature) issues.push({ field: "nature", code: "required" });
    else if (!known(nature, catalog.natures)) issues.push({ field: "nature", code: "unknown-nature", value: nature });

    const teraType = typeof value.teraType === "string" ? value.teraType.trim() : "";
    if (teraType && !known(teraType, catalog.types)) issues.push({ field: "teraType", code: "unknown-type", value: teraType });

    const moves = Array.isArray(value.moves) ? value.moves : [];
    moves.forEach((move, index) => {
      if (typeof move !== "string" || !move.trim()) return;
      if (!known(move, catalog.moves)) issues.push({ field: `moves.${index}`, code: "unknown-move", value: move.trim() });
    });
  }

  addIntegerIssue(issues, "level", value.level, 1, 100);
  let evTotal = 0;
  for (const stat of statIds) {
    const ev = isRecord(value.evs) ? value.evs[stat] : undefined;
    const iv = isRecord(value.ivs) ? value.ivs[stat] : undefined;
    const boost = isRecord(value.boosts) ? value.boosts[stat] : undefined;
    addIntegerIssue(issues, `evs.${stat}`, ev, 0, 252);
    addIntegerIssue(issues, `ivs.${stat}`, iv, 0, 31);
    addIntegerIssue(issues, `boosts.${stat}`, boost, -6, 6);
    if (typeof ev === "number" && Number.isFinite(ev)) evTotal += ev;
  }
  if (evTotal > 510) issues.push({ field: "evs", code: "ev-total", total: evTotal, max: 510 });
  return issues;
}

export function validateTeamDraft(team: TeamDraft, catalog: CatalogResponse | null): SetValidationIssue[] {
  return team.pokemon.flatMap((set, index) => validatePokemonSet(set, catalog).map((issue) => ({
    ...issue,
    field: `${index}.${issue.field}` as SetValidationField
  })));
}

export function setValidationMessage(issue: SetValidationIssue): string {
  const fieldLabels: Record<string, string> = {
    species: t.team.species,
    item: t.team.item,
    ability: t.team.ability,
    nature: t.team.nature,
    teraType: t.team.teraType,
    level: t.team.level,
    moves: t.team.moves,
    evs: t.team.evs,
    ivs: t.team.ivs,
    boosts: t.team.boosts
  };
  const fieldName = fieldLabels[issue.field.split(".").at(-1) ?? ""] ?? issue.field;
  switch (issue.code) {
    case "catalog-unavailable": return t.team.validation.catalogUnavailable;
    case "required": return formatMessage(t.team.validation.required, { field: fieldName });
    case "unknown-species": return formatMessage(t.team.validation.unknownName, { field: t.team.species, value: issue.value ?? "" });
    case "unknown-item": return formatMessage(t.team.validation.unknownName, { field: t.team.item, value: issue.value ?? "" });
    case "unknown-ability": return formatMessage(t.team.validation.unknownName, { field: t.team.ability, value: issue.value ?? "" });
    case "unknown-nature": return formatMessage(t.team.validation.unknownName, { field: t.team.nature, value: issue.value ?? "" });
    case "unknown-type": return formatMessage(t.team.validation.unknownName, { field: t.team.teraType, value: issue.value ?? "" });
    case "unknown-move": return formatMessage(t.team.validation.unknownName, { field: t.team.move, value: issue.value ?? "" });
    case "whole-number": return formatMessage(t.team.validation.wholeNumberRange, { min: issue.min ?? 0, max: issue.max ?? 0 });
    case "out-of-range": return formatMessage(t.team.validation.outOfRange, { min: issue.min ?? 0, max: issue.max ?? 0 });
    case "ev-total": return formatMessage(t.team.validation.evTotal, { total: issue.total ?? 0, max: issue.max ?? 510 });
  }
}

export function issueForSetField(issues: SetValidationIssue[], field: string): SetValidationIssue | undefined {
  return issues.find((issue) => issue.field === field || issue.field.startsWith(`${field}.`));
}

export function formatSetIssueList(issues: SetValidationIssue[]): string[] {
  return issues.map((issue) => {
    const match = issue.field.match(/^(\d+)\.(.+)$/);
    const message = setValidationMessage({ ...issue, field: (match?.[2] ?? issue.field) as SetValidationField });
    return match ? formatMessage(t.team.validation.pokemonIssue, { number: Number(match[1]) + 1, message }) : message;
  });
}

export function isSetNumericIssue(issue: SetValidationIssue) {
  return issue.field === "level" || issue.field === "evs" || issue.field.startsWith("evs.") ||
    issue.field.startsWith("ivs.") || issue.field.startsWith("boosts.");
}

export function isCatalogMove(value: string, catalog: CatalogResponse | null) {
  return Boolean(catalog && known(value, catalog.moves));
}

