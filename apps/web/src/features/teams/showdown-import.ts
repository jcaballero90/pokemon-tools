import {
  pokemonSetSchema,
  type ApiValidationIssue,
  type CatalogResponse,
  type PokemonSet
} from "@pokemon-tools/contracts";
import { zodValidationIssues } from "@pokemon-tools/contracts";

const statAliases: Record<string, keyof PokemonSet["evs"]> = {
  hp: "hp",
  atk: "atk",
  attack: "atk",
  def: "def",
  defense: "def",
  spa: "spa",
  spatk: "spa",
  "specialattack": "spa",
  spd: "spd",
  spdef: "spd",
  "specialdefense": "spd",
  spe: "spe",
  speed: "spe"
};

type DiagnosticCode =
  | "emptyPaste"
  | "tooManyPokemon"
  | "malformedHeader"
  | "unknownSpecies"
  | "unknownItem"
  | "unknownAbility"
  | "unknownMove"
  | "unknownNature"
  | "unknownType"
  | "invalidStat"
  | "duplicateStat"
  | "invalidNumber"
  | "tooManyMoves"
  | "unrecognizedLine"
  | "schemaValidation";

export type ShowdownImportDiagnostic = {
  code: DiagnosticCode;
  pokemon?: number;
  line?: number;
  value?: string;
  count?: number;
  issue?: ApiValidationIssue;
};

export type ShowdownImportWarning = {
  code: "gender" | "unsupportedField";
  pokemon: number;
  line: number;
  value: string;
};

export type ShowdownImportResult = {
  pokemon: PokemonSet[];
  errors: ShowdownImportDiagnostic[];
  warnings: ShowdownImportWarning[];
};

type ParseContext = {
  pokemon: number;
  line: number;
};

type SetDraft = {
  context: ParseContext;
  rawSpecies: string;
  species: string;
  nickname?: string;
  item: string;
  ability: string;
  nature: string;
  level: number;
  teraType?: string;
  evsLine?: number;
  evs: PokemonSet["evs"];
  ivs: PokemonSet["ivs"];
  moves: string[];
  valid: boolean;
};

function normalizeName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findCanonical(value: string, options: readonly string[]): string | undefined {
  const id = normalizeName(value);
  return options.find((option) => normalizeName(option) === id);
}

function makeSetDraft(header: string, context: ParseContext, catalog: CatalogResponse, errors: ShowdownImportDiagnostic[]): SetDraft {
  const [initialNamePart = "", ...itemParts] = header.split("@");
  let namePart = initialNamePart.trim();
  const item = itemParts.join("@").trim();

  const genderSuffix = namePart.match(/\s+\(([MFN])\)$/i);
  if (genderSuffix) namePart = namePart.slice(0, genderSuffix.index).trim();

  let rawSpecies = namePart;
  let nickname: string | undefined;
  const nicknameMatch = namePart.match(/^(.*?)\s+\(([^()]*)\)$/);
  if (nicknameMatch?.[1]?.trim() && findCanonical(nicknameMatch[2] ?? "", catalog.species.map((entry) => entry.name))) {
    nickname = nicknameMatch[1].trim();
    rawSpecies = nicknameMatch[2] ?? "";
  }

  const species = findCanonical(rawSpecies, catalog.species.map((entry) => entry.name));
  let valid = Boolean(species);
  if (!namePart || namePart.includes("@")) {
    errors.push({ code: "malformedHeader", ...context, value: header });
    valid = false;
  } else if (!species) {
    errors.push({ code: "unknownSpecies", ...context, value: rawSpecies });
  }

  if (itemParts.length > 1) {
    errors.push({ code: "malformedHeader", ...context, value: header });
    valid = false;
  }

  const canonicalItem = normalizeName(item) === "noitem" ? "" : findCanonical(item, catalog.items);
  if (item && !canonicalItem) {
    errors.push({ code: "unknownItem", ...context, value: item });
    valid = false;
  }

  return {
    context,
    rawSpecies,
    species: species ?? rawSpecies,
    nickname,
    item: canonicalItem ?? "",
    ability: "",
    nature: "Serious",
    level: 100,
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    moves: [],
    valid
  };
}

function parseStatBlock(
  value: string,
  block: "evs" | "ivs",
  set: SetDraft,
  line: number,
  errors: ShowdownImportDiagnostic[]
) {
  const target = block === "evs" ? set.evs : set.ivs;
  const seen = new Set<keyof PokemonSet["evs"]>();

  for (const entry of value.split("/")) {
    const match = entry.trim().match(/^(\d+)\s+(.+)$/);
    if (!match) {
      errors.push({ code: "invalidNumber", pokemon: set.context.pokemon, line, value: entry.trim() });
      set.valid = false;
      continue;
    }

    const amount = Number(match[1]);
    const stat = statAliases[normalizeName(match[2] ?? "")];
    if (!stat) {
      errors.push({ code: "invalidStat", pokemon: set.context.pokemon, line, value: match[2]?.trim() });
      set.valid = false;
      continue;
    }
    if (seen.has(stat)) {
      errors.push({ code: "duplicateStat", pokemon: set.context.pokemon, line, value: match[2]?.trim() });
      set.valid = false;
      continue;
    }
    seen.add(stat);

    const maximum = block === "evs" ? 252 : 31;
    if (amount > maximum) {
      errors.push({ code: "invalidNumber", pokemon: set.context.pokemon, line, value: match[1] });
      set.valid = false;
      continue;
    }

    target[stat] = amount;
  }
}

function parseFieldLine(lineText: string, lineNumber: number, set: SetDraft, catalog: CatalogResponse, errors: ShowdownImportDiagnostic[], warnings: ShowdownImportWarning[]): boolean {
  const context = { pokemon: set.context.pokemon, line: lineNumber };
  const field = lineText.match(/^([\w ]+):\s*(.*)$/);
  if (!field) return false;

  const key = field[1]?.trim().toLowerCase();
  const value = field[2]?.trim() ?? "";
  switch (key) {
    case "ability": {
      const ability = findCanonical(value, catalog.abilities);
      if (value && !ability) {
        errors.push({ code: "unknownAbility", ...context, value });
        set.valid = false;
      } else {
        set.ability = ability ?? "";
      }
      return true;
    }
    case "tera type": {
      const type = findCanonical(value, catalog.types);
      if (value && !type) {
        errors.push({ code: "unknownType", ...context, value });
        set.valid = false;
      } else {
        set.teraType = type;
      }
      return true;
    }
    case "evs":
    case "ivs":
      if (key === "evs") set.evsLine = lineNumber;
      parseStatBlock(value, key, set, lineNumber, errors);
      return true;
    case "level": {
      const level = Number(value);
      if (!/^\d+$/.test(value) || level < 1 || level > 100) {
        errors.push({ code: "invalidNumber", ...context, value });
        set.valid = false;
      } else {
        set.level = level;
      }
      return true;
    }
    case "gender":
      warnings.push({ code: "gender", ...context, value });
      return true;
    case "shiny":
    case "happiness":
    case "friendship":
    case "pokeball":
    case "gigantamax":
    case "dynamax level":
      warnings.push({ code: "unsupportedField", ...context, value: field[1] ?? key });
      return true;
    default:
      return false;
  }
}

export function parseShowdownPaste(paste: string, catalog: CatalogResponse): ShowdownImportResult {
  const errors: ShowdownImportDiagnostic[] = [];
  const warnings: ShowdownImportWarning[] = [];
  const sets: SetDraft[] = [];
  let current: SetDraft | undefined;
  const lines = paste.replace(/\r\n?/g, "\n").split("\n");

  if (!paste.trim()) return { pokemon: [], errors: [{ code: "emptyPaste" }], warnings };

  for (const [index, rawLine] of lines.entries()) {
    const text = rawLine.trim();
    if (!text || text === "---") {
      current = undefined;
      continue;
    }

    const lineNumber = index + 1;
    const move = text.match(/^[-~]\s*(.*)$/);
    if (move) {
      if (!current) {
        errors.push({ code: "malformedHeader", line: lineNumber, value: text });
        continue;
      }
      const rawMove = move[1]?.trim() ?? "";
      const canonicalMove = findCanonical(rawMove, catalog.moves);
      if (!canonicalMove) {
        errors.push({ code: "unknownMove", pokemon: current.context.pokemon, line: lineNumber, value: rawMove });
        current.valid = false;
      } else if (current.moves.length >= 4) {
        errors.push({ code: "tooManyMoves", pokemon: current.context.pokemon, line: lineNumber });
        current.valid = false;
      } else {
        current.moves.push(canonicalMove);
      }
      continue;
    }

    if (!current) {
      const context = { pokemon: sets.length + 1, line: lineNumber };
      current = makeSetDraft(text, context, catalog, errors);
      sets.push(current);
      const headerGender = rawLine.match(/\(([MFN])\)\s*(?:@|$)/i);
      if (headerGender) {
        warnings.push({ code: "gender", pokemon: context.pokemon, line: lineNumber, value: headerGender[1]?.toUpperCase() ?? "" });
      }
      continue;
    }

    const nature = text.match(/^(.+?)\s+nature$/i);
    if (nature) {
      const value = nature[1]?.trim() ?? "";
      const canonicalNature = findCanonical(value, catalog.natures);
      if (!canonicalNature) {
        errors.push({ code: "unknownNature", pokemon: current.context.pokemon, line: lineNumber, value });
        current.valid = false;
      } else {
        current.nature = canonicalNature;
      }
      continue;
    }

    if (parseFieldLine(text, lineNumber, current, catalog, errors, warnings)) continue;

    errors.push({ code: "unrecognizedLine", pokemon: current.context.pokemon, line: lineNumber, value: text });
    current.valid = false;
  }

  if (sets.length > 6) errors.push({ code: "tooManyPokemon", count: sets.length });
  if (!sets.length) errors.push({ code: "emptyPaste" });

  const pokemon: PokemonSet[] = [];
  for (const set of sets) {
    const parsed = pokemonSetSchema.safeParse({
      species: set.species,
      nickname: set.nickname,
      item: set.item,
      ability: set.ability,
      nature: set.nature,
      level: set.level,
      teraType: set.teraType,
      evs: set.evs,
      ivs: set.ivs,
      moves: set.moves
    });
    if (parsed.success) {
      if (set.valid) pokemon.push(parsed.data);
      continue;
    }
    for (const issue of zodValidationIssues(parsed.error.issues)) {
      errors.push({
        code: "schemaValidation",
        ...set.context,
        line: issue.path[0] === "evs" ? set.evsLine ?? set.context.line : set.context.line,
        issue
      });
    }
  }

  return { pokemon, errors, warnings };
}
