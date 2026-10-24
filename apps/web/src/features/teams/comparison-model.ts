import type { CatalogResponse, TeamDraft, TypeChartResponse } from "@pokemon-tools/contracts";

export const standardTypes = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"
] as const;

export interface ComparisonMember {
  index: number;
  species: string;
  name: string;
  types: string[];
}

export interface MemberIssue {
  member: ComparisonMember;
  reason: "unknown-species" | "missing-types" | "missing-chart";
}

export interface DefenseRow {
  type: string;
  weak: ComparisonMember[];
  quadrupleWeak: ComparisonMember[];
  resistant: ComparisonMember[];
  immune: ComparisonMember[];
}

export interface TeamDefense {
  members: ComparisonMember[];
  analyzed: ComparisonMember[];
  excluded: MemberIssue[];
  breakdown: DefenseRow[];
  gaps: DefenseRow[];
  sharedWeaknesses: DefenseRow[];
  partial: boolean;
}

export interface MoveIssue {
  move: string;
  reason: "unknown-move" | "missing-metadata" | "unsupported" | "unknown-type" | "missing-chart";
}

export interface MatchupCell {
  defender: ComparisonMember;
  multiplier: number | null;
  move: string | null;
  partial: boolean;
}

export interface AttackRow {
  member: ComparisonMember;
  cells: MatchupCell[];
  supportedMoves: string[];
  statusMoves: string[];
  issues: MoveIssue[];
  state: "ready" | "no-moves" | "status-only" | "unsupported" | "unknown-species" | "missing-data";
}

export interface DirectionAnalysis {
  attackers: AttackRow[];
  defenders: ComparisonMember[];
  covered: number;
  analyzedDefenders: number;
  totalDefenders: number;
  partial: boolean;
  excludedDefenders: MemberIssue[];
}

export interface SpeedEntry {
  member: ComparisonMember;
  team: "a" | "b";
  speed: number;
  rank: number;
  tied: boolean;
}

export interface SpeedIssue {
  member: ComparisonMember;
  team: "a" | "b";
  reason: "unknown-species" | "invalid-speed-data" | "unknown-nature";
}

export interface SpeedRanking {
  entries: SpeedEntry[];
  excluded: SpeedIssue[];
}

type MoveDetail = NonNullable<CatalogResponse["moveDetails"]>[string];
type SupportedMove = { name: string; detail: MoveDetail };
type ChartIndex = Map<string, Map<string, number>>;

function normalized(value: string): string {
  return value.toLowerCase().replaceAll("♀", "f").replaceAll("♂", "m").replace(/[^a-z0-9]/g, "");
}

function indexChart(chart: TypeChartResponse): ChartIndex {
  return new Map(chart.map((row) => [normalized(row.attack), new Map(
    Object.entries(row.against).map(([type, factor]) => [normalized(type), factor])
  )]));
}

function rosterMembers(team: TeamDraft, catalog: CatalogResponse): ComparisonMember[] {
  const speciesByName = new Map(catalog.species.map((species) => [normalized(species.name), species]));
  return team.pokemon.map((set, index) => {
    const nativeTypes = speciesByName.get(normalized(set.species))?.types ?? [];
    const distinctTypes = new Map<string, string>();
    nativeTypes.forEach((type) => {
      const key = normalized(type);
      if (!distinctTypes.has(key)) distinctTypes.set(key, type);
    });
    return {
      index,
      species: set.species.trim(),
      name: set.nickname?.trim() || set.species.trim(),
      types: [...distinctTypes.values()]
    };
  });
}

function memberIssue(member: ComparisonMember, catalog: CatalogResponse): MemberIssue | null {
  const species = catalog.species.find((entry) => normalized(entry.name) === normalized(member.species));
  if (!species) return { member, reason: "unknown-species" };
  const knownTypes = new Set<string>(standardTypes.map(normalized));
  if (!member.types.length || member.types.some((type) => !knownTypes.has(normalized(type)))) {
    return { member, reason: "missing-types" };
  }
  return null;
}

function typeMultiplier(attack: string, defendingTypes: string[], chart: ChartIndex): number | null {
  const row = chart.get(normalized(attack));
  if (!row || !defendingTypes.length) return null;
  let result = 1;
  for (const type of defendingTypes) {
    const factor = row.get(normalized(type));
    if (factor === undefined || !Number.isFinite(factor) || factor < 0) return null;
    result *= factor;
  }
  return result;
}

export function analyzeTeamDefense(
  team: TeamDraft,
  catalog: CatalogResponse,
  chart: TypeChartResponse
): TeamDefense {
  const members = rosterMembers(team, catalog);
  const chartIndex = indexChart(chart);
  const analyzed: ComparisonMember[] = [];
  const excluded: MemberIssue[] = [];
  const breakdown: DefenseRow[] = standardTypes.map((type) => ({
    type, weak: [], quadrupleWeak: [], resistant: [], immune: []
  }));

  for (const member of members) {
    const issue = memberIssue(member, catalog);
    if (issue) {
      excluded.push(issue);
      continue;
    }
    const multipliers = standardTypes.map((type) => typeMultiplier(type, member.types, chartIndex));
    if (multipliers.some((value) => value === null)) {
      excluded.push({ member, reason: "missing-chart" });
      continue;
    }
    analyzed.push(member);
    multipliers.forEach((factor, index) => {
      const row = breakdown[index];
      if (factor === null || !row) return;
      if (factor > 1) row.weak.push(member);
      if (factor >= 4) row.quadrupleWeak.push(member);
      if (factor > 0 && factor < 1) row.resistant.push(member);
      if (factor === 0) row.immune.push(member);
    });
  }

  const gaps = breakdown.filter((row) => row.weak.length && !row.resistant.length && !row.immune.length);
  const sharedWeaknesses = breakdown.filter((row) => row.weak.length).sort((left, right) => (
    right.weak.length - left.weak.length || right.quadrupleWeak.length - left.quadrupleWeak.length ||
    standardTypes.indexOf(left.type as typeof standardTypes[number]) - standardTypes.indexOf(right.type as typeof standardTypes[number])
  )).slice(0, 3);
  return { members, analyzed, excluded, breakdown, gaps, sharedWeaknesses, partial: excluded.length > 0 };
}

// These moves need battle state, a variable type, fixed damage, or special
// effectiveness rules outside native-type coverage. Status move callers must
// be checked here before ordinary status moves are ignored.
const unsupportedMoves = new Set([
  "Weather Ball", "Terrain Pulse", "Natural Gift", "Judgment", "Techno Blast", "Multi-Attack",
  "Revelation Dance", "Aura Wheel", "Raging Bull", "Tera Blast", "Tera Starstorm", "Ivy Cudgel",
  "Struggle", "Thousand Arrows", "Synchronoise", "Sky Drop",
  "Dragon Rage", "Sonic Boom", "Seismic Toss", "Night Shade", "Psywave", "Super Fang",
  "Nature's Madness", "Ruination", "Guardian of Alola", "Endeavor", "Final Gambit",
  "Counter", "Mirror Coat", "Metal Burst", "Bide", "Comeuppance",
  "Fissure", "Guillotine", "Horn Drill", "Sheer Cold",
  "Metronome", "Mirror Move", "Mimic", "Sketch", "Sleep Talk", "Copycat", "Assist",
  "Me First", "Nature Power", "Instruct", "Transform"
].map(normalized));

function isUnsupportedMove(name: string): boolean {
  const key = normalized(name);
  return unsupportedMoves.has(key) || key === "hiddenpower";
}

function moveMultiplier(move: SupportedMove, member: ComparisonMember, chart: ChartIndex): number | null {
  const key = normalized(move.name);
  if (key === "freezedry") {
    let result = 1;
    for (const type of member.types) {
      const factor = normalized(type) === "water" ? 2 : typeMultiplier("Ice", [type], chart);
      if (factor === null) return null;
      result *= factor;
    }
    return result;
  }
  if (key === "flyingpress") {
    const fighting = typeMultiplier("Fighting", member.types, chart);
    const flying = typeMultiplier("Flying", member.types, chart);
    if (fighting === null || flying === null) return null;
    return fighting * flying;
  }
  return typeMultiplier(move.detail.type, member.types, chart);
}

function selectedMoves(set: TeamDraft["pokemon"][number], catalog: CatalogResponse) {
  const knownMoves = new Map(catalog.moves.map((name) => [normalized(name), name]));
  const details = new Map(Object.entries(catalog.moveDetails ?? {}).map(([name, detail]) => [normalized(name), detail]));
  const knownTypes = new Set<string>(standardTypes.map(normalized));
  const supported: SupportedMove[] = [];
  const status: string[] = [];
  const issues: MoveIssue[] = [];
  const nonEmpty = [...new Set(set.moves.map((name) => name.trim()).filter(Boolean))];

  for (const enteredName of nonEmpty) {
    const name = knownMoves.get(normalized(enteredName));
    if (!name) {
      issues.push({ move: enteredName, reason: "unknown-move" });
      continue;
    }
    if (isUnsupportedMove(name)) {
      issues.push({ move: name, reason: "unsupported" });
      continue;
    }
    const detail = details.get(normalized(name));
    if (!detail || !["Physical", "Special", "Status"].includes(detail.category)) {
      issues.push({ move: name, reason: "missing-metadata" });
      continue;
    }
    if (detail.category === "Status") {
      status.push(name);
      continue;
    }
    if (!knownTypes.has(normalized(detail.type))) {
      issues.push({ move: name, reason: "unknown-type" });
      continue;
    }
    supported.push({ name, detail });
  }
  return { supported, status, issues, selected: nonEmpty.length };
}

function attackState(
  selected: number,
  supported: number,
  status: number,
  issues: MoveIssue[],
  hasKnownEffect: boolean
): AttackRow["state"] {
  if (!selected) return "no-moves";
  if (supported && hasKnownEffect) return "ready";
  if (status === selected) return "status-only";
  if (issues.length && issues.every((issue) => issue.reason === "unsupported")) return "unsupported";
  return "missing-data";
}

export function analyzeDirection(
  attackingTeam: TeamDraft,
  defendingTeam: TeamDraft,
  catalog: CatalogResponse,
  chart: TypeChartResponse
): DirectionAnalysis {
  const attackers = rosterMembers(attackingTeam, catalog);
  const defenders = rosterMembers(defendingTeam, catalog);
  const chartIndex = indexChart(chart);
  const excludedDefenders = defenders.map((member) => memberIssue(member, catalog)).filter((issue) => issue !== null);
  const invalidDefenders = new Set(excludedDefenders.map((issue) => issue.member.index));
  const rows = attackers.map((member): AttackRow => {
    const invalidAttacker = memberIssue(member, catalog);
    if (invalidAttacker) {
      return {
        member,
        cells: defenders.map((defender) => ({ defender, multiplier: null, move: null, partial: true })),
        supportedMoves: [], statusMoves: [], issues: [],
        state: invalidAttacker.reason === "unknown-species" ? "unknown-species" : "missing-data"
      };
    }
    const moves = selectedMoves(attackingTeam.pokemon[member.index]!, catalog);
    const issues = [...moves.issues];
    const missingChart = new Set<string>();
    const cells = defenders.map((defender): MatchupCell => {
      if (invalidDefenders.has(defender.index)) return { defender, multiplier: null, move: null, partial: true };
      let multiplier: number | null = null;
      let selectedMove: string | null = null;
      let partial = moves.issues.length > 0;
      for (const move of moves.supported) {
        const factor = moveMultiplier(move, defender, chartIndex);
        if (factor === null) {
          missingChart.add(move.name);
          partial = true;
          continue;
        }
        if (multiplier === null || factor > multiplier) {
          multiplier = factor;
          selectedMove = move.name;
        }
      }
      return { defender, multiplier, move: selectedMove, partial };
    });
    missingChart.forEach((move) => issues.push({ move, reason: "missing-chart" }));
    const hasKnownEffect = cells.some((cell) => cell.multiplier !== null) || defenders.length === 0;
    return {
      member, cells, supportedMoves: moves.supported.map((move) => move.name), statusMoves: moves.status,
      issues,
      state: attackState(moves.selected, moves.supported.length, moves.status.length, issues, hasKnownEffect)
    };
  });
  const covered = defenders.filter((defender) => rows.some((row) => (
    (row.cells[defender.index]?.multiplier ?? 0) > 1
  ))).length;
  const partial = excludedDefenders.length > 0 || rows.some((row) => (
    row.issues.length > 0 || row.cells.some((cell) => cell.partial) ||
    ["unknown-species", "missing-data", "no-moves"].includes(row.state)
  ));
  return {
    attackers: rows, defenders, covered, analyzedDefenders: defenders.length - excludedDefenders.length,
    totalDefenders: defenders.length, partial, excludedDefenders
  };
}

const natureNames = new Set([
  "Hardy", "Lonely", "Brave", "Adamant", "Naughty", "Bold", "Docile", "Relaxed", "Impish", "Lax",
  "Timid", "Hasty", "Serious", "Jolly", "Naive", "Modest", "Mild", "Quiet", "Bashful", "Rash",
  "Calm", "Gentle", "Sassy", "Careful", "Quirky"
].map(normalized));
const speedRaisingNatures = new Set(["Timid", "Hasty", "Jolly", "Naive"].map(normalized));
const speedLoweringNatures = new Set(["Brave", "Relaxed", "Quiet", "Sassy"].map(normalized));

function integerInRange(value: number | undefined, minimum: number, maximum: number): value is number {
  return value !== undefined && Number.isInteger(value) && value >= minimum && value <= maximum;
}

export function rankUnmodifiedSpeed(teamA: TeamDraft, teamB: TeamDraft, catalog: CatalogResponse): SpeedRanking {
  const entries: SpeedEntry[] = [];
  const excluded: SpeedIssue[] = [];
  const knownNatures = new Set(catalog.natures.map(normalized));
  const teams = [{ team: teamA, side: "a" as const }, { team: teamB, side: "b" as const }];
  for (const { team, side } of teams) {
    const members = rosterMembers(team, catalog);
    for (const member of members) {
      const set = team.pokemon[member.index]!;
      const species = catalog.species.find((entry) => normalized(entry.name) === normalized(member.species));
      if (!species) {
        excluded.push({ member, team: side, reason: "unknown-species" });
        continue;
      }
      const nature = normalized(set.nature);
      if (!knownNatures.has(nature) || !natureNames.has(nature)) {
        excluded.push({ member, team: side, reason: "unknown-nature" });
        continue;
      }
      const base = species.baseStats.spe;
      const ev = set.evs.spe;
      const iv = set.ivs.spe;
      if (!integerInRange(base, 1, 255) || !integerInRange(ev, 0, 252) ||
        !integerInRange(iv, 0, 31) || !integerInRange(set.level, 1, 100)) {
        excluded.push({ member, team: side, reason: "invalid-speed-data" });
        continue;
      }
      const unmodified = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * set.level) / 100) + 5;
      let speed = unmodified;
      if (speedRaisingNatures.has(nature)) speed = Math.floor(unmodified * 110 / 100);
      if (speedLoweringNatures.has(nature)) speed = Math.floor(unmodified * 90 / 100);
      entries.push({ member, team: side, speed, rank: 0, tied: false });
    }
  }
  entries.sort((left, right) => right.speed - left.speed);
  entries.forEach((entry, index) => {
    entry.rank = entries.findIndex((candidate) => candidate.speed === entry.speed) + 1;
    entry.tied = entries[index - 1]?.speed === entry.speed || entries[index + 1]?.speed === entry.speed;
  });
  return { entries, excluded };
}
