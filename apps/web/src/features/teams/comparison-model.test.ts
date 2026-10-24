import { describe, expect, it } from "vitest";
import { pokemonSetSchema, type CatalogResponse, type PokemonSet, type TeamDraft, type TypeChartResponse } from "@pokemon-tools/contracts";
import { analyzeDirection, analyzeTeamDefense, rankUnmodifiedSpeed, standardTypes } from "./comparison-model";

const species: CatalogResponse["species"] = [
  { name: "Charizard", types: ["Fire", "Flying"], baseStats: { spe: 100 } },
  { name: "Venusaur", types: ["Grass", "Poison"], baseStats: { spe: 80 } },
  { name: "Scizor", types: ["Bug", "Steel"], baseStats: { spe: 65 } },
  { name: "Gyarados", types: ["Water", "Flying"], baseStats: { spe: 81 } },
  { name: "Lapras", types: ["Water", "Ice"], baseStats: { spe: 60 } },
  { name: "Kingdra", types: ["Water", "Dragon"], baseStats: { spe: 85 } },
  { name: "Aggron", types: ["Steel", "Rock"], baseStats: { spe: 50 } },
  { name: "Scrafty", types: ["Dark", "Fighting"], baseStats: { spe: 58 } },
  { name: "Gengar", types: ["Ghost", "Poison"], baseStats: { spe: 110 } },
  { name: "Pikachu", types: ["Electric"], baseStats: { spe: 90 } }
];

const moveDetails: NonNullable<CatalogResponse["moveDetails"]> = {
  Flamethrower: { type: "Fire", category: "Special" },
  Thunderbolt: { type: "Electric", category: "Special" },
  Tackle: { type: "Normal", category: "Physical" },
  "Freeze-Dry": { type: "Ice", category: "Special" },
  "Flying Press": { type: "Fighting", category: "Physical" },
  "Low Kick": { type: "Fighting", category: "Physical" },
  Protect: { type: "Normal", category: "Status" },
  "Swords Dance": { type: "Normal", category: "Status" },
  "Weather Ball": { type: "Normal", category: "Special" },
  "Ivy Cudgel": { type: "Grass", category: "Physical" },
  "Seismic Toss": { type: "Fighting", category: "Physical" },
  Counter: { type: "Fighting", category: "Physical" },
  "Sheer Cold": { type: "Ice", category: "Special" },
  Metronome: { type: "Normal", category: "Status" },
  "Thousand Arrows": { type: "Ground", category: "Physical" },
  "Hidden Power Fire": { type: "Fire", category: "Special" },
  "Hidden Power Ice": { type: "Ice", category: "Special" },
  "Hidden Power": { type: "Normal", category: "Special" }
};

const catalog: CatalogResponse = {
  species,
  moves: Object.keys(moveDetails),
  moveDetails,
  abilities: [], items: [], types: [...standardTypes],
  natures: ["Serious", "Timid", "Jolly", "Brave", "Adamant", "Quiet", "Naive"]
};

const factors: Record<string, Record<string, number>> = {
  Normal: { Rock: 0.5, Steel: 0.5, Ghost: 0 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};
const chart: TypeChartResponse = standardTypes.map((attack) => ({
  attack,
  against: Object.fromEntries(standardTypes.map((type) => [type, factors[attack]?.[type] ?? 1]))
}));

function set(name: string, overrides: Partial<PokemonSet> = {}): PokemonSet {
  return pokemonSetSchema.parse({ species: name, ...overrides });
}

function team(...pokemon: PokemonSet[]): TeamDraft {
  return { name: "", notes: "", format: "gen9", pokemon };
}

describe("native-type team defense", () => {
  it("reports all standard types and separates weaknesses, 4× weaknesses, resistances, and immunities", () => {
    const result = analyzeTeamDefense(team(set("Charizard"), set("Gyarados"), set("Gengar")), catalog, chart);
    expect(result.breakdown.map((row) => row.type)).toEqual(standardTypes);
    const rock = result.breakdown.find((row) => row.type === "Rock")!;
    expect(rock.weak.map((member) => member.species)).toEqual(["Charizard", "Gyarados"]);
    expect(rock.quadrupleWeak.map((member) => member.species)).toEqual(["Charizard"]);
    const ground = result.breakdown.find((row) => row.type === "Ground")!;
    expect(ground.immune.map((member) => member.species)).toEqual(["Charizard", "Gyarados"]);
    expect(ground.resistant).toEqual([]);
    expect(result.analyzed).toHaveLength(3);
    expect(result.partial).toBe(false);
  });

  it("marks unprotected weaknesses as gaps and removes them when a teammate covers them", () => {
    const uncovered = analyzeTeamDefense(team(set("Venusaur"), set("Scizor")), catalog, chart);
    expect(uncovered.gaps.map((row) => row.type)).toContain("Fire");
    const covered = analyzeTeamDefense(team(set("Venusaur"), set("Scizor"), set("Charizard")), catalog, chart);
    expect(covered.gaps.map((row) => row.type)).not.toContain("Fire");
    const fire = covered.breakdown.find((row) => row.type === "Fire")!;
    expect(fire.weak).toHaveLength(2);
    expect(fire.resistant[0]?.species).toBe("Charizard");
  });

  it("ranks the top three weaknesses by count, then 4× count, then canonical type order", () => {
    const result = analyzeTeamDefense(team(set("Charizard"), set("Gyarados"), set("Venusaur")), catalog, chart);
    expect(result.sharedWeaknesses.map((row) => row.type)).toEqual(["Electric", "Rock", "Fire"]);
    expect(result.sharedWeaknesses[0]?.weak).toHaveLength(2);
  });

  it("preserves unknown and empty slots, reports partial data, and keeps nickname identities", () => {
    const result = analyzeTeamDefense(team(set("Pikachu", { nickname: "Sparky" }), { ...set("Pikachu"), species: "" }, set("Unknown")), catalog, chart);
    expect(result.members.map((member) => [member.index, member.name])).toEqual([[0, "Sparky"], [1, ""], [2, "Unknown"]]);
    expect(result.analyzed).toHaveLength(1);
    expect(result.excluded.map((issue) => issue.reason)).toEqual(["unknown-species", "unknown-species"]);
    expect(result.partial).toBe(true);
  });

  it("does not substitute neutral values for missing typing or missing chart factors", () => {
    const missingTypes = { ...catalog, species: [{ name: "Pikachu", types: [], baseStats: { spe: 90 } }] };
    expect(analyzeTeamDefense(team(set("Pikachu")), missingTypes, chart).excluded[0]?.reason).toBe("missing-types");
    const missingChart = chart.filter((row) => row.attack !== "Rock");
    const result = analyzeTeamDefense(team(set("Charizard")), catalog, missingChart);
    expect(result.analyzed).toHaveLength(0);
    expect(result.excluded[0]?.reason).toBe("missing-chart");
    expect(result.breakdown.every((row) => row.weak.length === 0)).toBe(true);
  });

  it("keeps an empty roster distinct from a partially analyzed roster", () => {
    const result = analyzeTeamDefense(team(), catalog, chart);
    expect(result.analyzed).toHaveLength(0);
    expect(result.gaps).toHaveLength(0);
    expect(result.partial).toBe(false);
  });

  it("uses each distinct native type once when catalog typings repeat", () => {
    const repeatedTypes = {
      ...catalog,
      species: [{ name: "Scizor", types: ["Bug", "Steel", "BUG"], baseStats: { spe: 65 } }]
    };
    const result = analyzeTeamDefense(team(set("Scizor")), repeatedTypes, chart);
    expect(result.members[0]?.types).toHaveLength(2);
    expect(result.breakdown.find((row) => row.type === "Fire")?.quadrupleWeak).toHaveLength(1);
    const matchup = analyzeDirection(team(set("Charizard", { moves: ["Flamethrower"] })), team(set("Scizor")), {
      ...repeatedTypes,
      species: [...repeatedTypes.species, species[0]!]
    }, chart);
    expect(matchup.attackers[0]?.cells[0]?.multiplier).toBe(4);
  });
});

describe("selected-move directional coverage", () => {
  it("uses the best selected damaging move, ignores ordinary status moves, and counts covered defenders once", () => {
    const result = analyzeDirection(
      team(set("Pikachu", { moves: ["Tackle", "Thunderbolt", "Protect"] }), set("Charizard", { moves: ["Flamethrower"] })),
      team(set("Gyarados"), set("Scizor"), set("Gengar")), catalog, chart
    );
    expect(result.attackers[0]?.cells.map((cell) => [cell.multiplier, cell.move])).toEqual([
      [4, "Thunderbolt"], [1, "Thunderbolt"], [1, "Thunderbolt"]
    ]);
    expect(result.attackers[0]?.statusMoves).toEqual(["Protect"]);
    expect(result.attackers[1]?.cells[1]?.multiplier).toBe(4);
    expect(result.covered).toBe(2);
    expect(result.partial).toBe(false);
  });

  it("handles Freeze-Dry against Water dual types and normalizes English punctuation", () => {
    const result = analyzeDirection(team(set("Lapras", { moves: ["freeze dry"] })), team(set("Gyarados"), set("Lapras"), set("Kingdra")), catalog, chart);
    expect(result.attackers[0]?.cells.map((cell) => cell.multiplier)).toEqual([4, 1, 4]);
    expect(result.attackers[0]?.supportedMoves).toEqual(["Freeze-Dry"]);
  });

  it("combines Fighting and Flying effectiveness for Flying Press, including immunities", () => {
    const result = analyzeDirection(team(set("Pikachu", { moves: ["Flying Press"] })), team(set("Aggron"), set("Scrafty"), set("Gengar")), catalog, chart);
    expect(result.attackers[0]?.cells.map((cell) => cell.multiplier)).toEqual([1, 4, 0]);
    expect(result.covered).toBe(1);
  });

  it("supports variable-power attacks using their known static type without requiring base power", () => {
    const result = analyzeDirection(team(set("Pikachu", { moves: ["Low Kick"] })), team(set("Aggron")), catalog, chart);
    expect(result.attackers[0]?.cells[0]?.multiplier).toBe(4);
    expect(result.partial).toBe(false);
  });

  it.each(["Weather Ball", "Ivy Cudgel", "Seismic Toss", "Counter", "Sheer Cold", "Metronome", "Thousand Arrows", "Hidden Power"])(
    "identifies unsupported special move %s rather than assigning an ordinary type multiplier",
    (move) => {
      const result = analyzeDirection(team(set("Pikachu", { moves: [move] })), team(set("Gyarados")), catalog, chart);
      expect(result.attackers[0]?.state).toBe("unsupported");
      expect(result.attackers[0]?.issues).toEqual([{ move, reason: "unsupported" }]);
      expect(result.attackers[0]?.cells[0]).toMatchObject({ multiplier: null, move: null, partial: true });
      expect(result.covered).toBe(0);
      expect(result.partial).toBe(true);
    }
  );

  it("keeps supported results and marks them partial when another selected move is unsupported", () => {
    const result = analyzeDirection(team(set("Pikachu", { moves: ["Thunderbolt", "Weather Ball"] })), team(set("Gyarados")), catalog, chart);
    expect(result.attackers[0]?.state).toBe("ready");
    expect(result.attackers[0]?.cells[0]).toMatchObject({ multiplier: 4, move: "Thunderbolt", partial: true });
    expect(result.covered).toBe(1);
    expect(result.partial).toBe(true);
  });

  it("distinguishes status-only sets from empty movesets and preserves blank slots", () => {
    const statusSet = { ...set("Pikachu"), moves: ["Protect", "Swords Dance", ""] };
    const result = analyzeDirection(team(statusSet, set("Gengar", { moves: [] })), team(set("Gyarados")), catalog, chart);
    expect(result.attackers.map((row) => row.state)).toEqual(["status-only", "no-moves"]);
    expect(result.attackers[0]?.cells[0]).toMatchObject({ multiplier: null, move: null, partial: false });
    expect(result.attackers[1]?.cells[0]).toMatchObject({ multiplier: null, move: null, partial: false });
    expect(result.partial).toBe(true);
    const unknownDefender = analyzeDirection(team(set("Pikachu", { moves: [] })), team(set("Unknown")), catalog, chart);
    expect(unknownDefender.attackers[0]?.cells[0]).toMatchObject({ multiplier: null, move: null, partial: true });
  });

  it("uses the declared type for named Hidden Power variants", () => {
    const result = analyzeDirection(team(set("Pikachu", { moves: ["Hidden Power Ice"] })), team(set("Gyarados")), catalog, chart);
    expect(result.attackers[0]?.cells[0]).toMatchObject({ multiplier: 1, move: "Hidden Power Ice", partial: false });
    expect(result.attackers[0]?.issues).toEqual([]);
    expect(result.partial).toBe(false);
  });

  it("reports unknown moves and missing metadata without deriving attacks from species typing", () => {
    const missingMetadata = { ...catalog, moveDetails: undefined };
    const unknown = analyzeDirection(team(set("Charizard", { moves: ["Unknown Move"] })), team(set("Venusaur")), catalog, chart);
    expect(unknown.attackers[0]?.issues).toEqual([{ move: "Unknown Move", reason: "unknown-move" }]);
    const missing = analyzeDirection(team(set("Charizard", { moves: ["Flamethrower"] })), team(set("Venusaur")), missingMetadata, chart);
    expect(missing.attackers[0]?.issues).toEqual([{ move: "Flamethrower", reason: "missing-metadata" }]);
    expect(missing.attackers[0]?.cells[0]?.multiplier).toBeNull();
    expect(missing.covered).toBe(0);
  });

  it("preserves every attacker and defender slot and excludes unknown species from calculations", () => {
    const result = analyzeDirection(team(set("Unknown", { moves: ["Thunderbolt"] }), set("Pikachu", { moves: ["Thunderbolt"] })), team(set("Unknown"), set("Gyarados")), catalog, chart);
    expect(result.attackers).toHaveLength(2);
    expect(result.attackers[0]?.state).toBe("unknown-species");
    expect(result.attackers[0]?.cells.every((cell) => cell.multiplier === null)).toBe(true);
    expect(result.defenders.map((member) => member.index)).toEqual([0, 1]);
    expect(result.attackers[1]?.cells.map((cell) => cell.multiplier)).toEqual([null, 4]);
    expect(result.analyzedDefenders).toBe(1);
    expect(result.totalDefenders).toBe(2);
    expect(result.excludedDefenders[0]?.reason).toBe("unknown-species");
    expect(result.partial).toBe(true);
  });

  it("flags unknown move types and absent chart fields instead of inventing neutral matches", () => {
    const unknownType: CatalogResponse = { ...catalog, moveDetails: { ...moveDetails, Flamethrower: { type: "Stellar", category: "Special" } } };
    const unknown = analyzeDirection(team(set("Charizard", { moves: ["Flamethrower"] })), team(set("Venusaur")), unknownType, chart);
    expect(unknown.attackers[0]?.issues[0]?.reason).toBe("unknown-type");
    const missingChart = chart.map((row) => {
      if (row.attack !== "Fire") return row;
      const against = { ...row.against };
      delete against.Grass;
      return { ...row, against };
    });
    const missing = analyzeDirection(team(set("Charizard", { moves: ["Flamethrower"] })), team(set("Venusaur")), catalog, missingChart);
    expect(missing.attackers[0]?.cells[0]?.multiplier).toBeNull();
    expect(missing.attackers[0]?.issues).toEqual([{ move: "Flamethrower", reason: "missing-chart" }]);
    expect(missing.partial).toBe(true);
  });
});

describe("unmodified Speed ranking", () => {
  it("uses species, level, Speed EVs, IVs and nature, preserving an explicit zero IV", () => {
    const normal = set("Pikachu");
    const zero = { ...normal, ivs: { ...normal.ivs, spe: 0 } };
    const fast = { ...normal, nature: "Jolly", evs: { ...normal.evs, spe: 252 } };
    const result = rankUnmodifiedSpeed(team(normal, zero), team(fast), catalog);
    expect(result.entries.map((entry) => [entry.team, entry.member.index, entry.speed])).toEqual([
      ["b", 0, 156], ["a", 0, 110], ["a", 1, 95]
    ]);
    expect(result.excluded).toEqual([]);
  });

  it("floors EV contributions and nature effects while ignoring boosts, status, item and ability", () => {
    const base = set("Pikachu", { level: 100, nature: "Quiet", item: "Choice Scarf", ability: "Swift Swim", status: "Paralyzed" });
    const modified = { ...base, evs: { ...base.evs, spe: 7 }, boosts: { ...base.boosts, spe: 6 } };
    const result = rankUnmodifiedSpeed(team(modified), team(), catalog);
    expect(result.entries[0]?.speed).toBe(195);
  });

  it("gives tied entries identical competition ranks across both rosters", () => {
    const result = rankUnmodifiedSpeed(team(set("Pikachu"), set("Lapras")), team(set("Pikachu")), catalog);
    expect(result.entries.map((entry) => [entry.speed, entry.rank, entry.tied])).toEqual([
      [110, 1, true], [110, 1, true], [80, 3, false]
    ]);
  });

  it("reports unknown species and natures rather than guessing", () => {
    const result = rankUnmodifiedSpeed(team(set("Unknown"), set("Pikachu", { nature: "Unknown" })), team(), catalog);
    expect(result.entries).toEqual([]);
    expect(result.excluded.map((issue) => issue.reason)).toEqual(["unknown-species", "unknown-nature"]);
  });

  it.each([
    { level: 0 }, { level: 50.5 }, { level: Number.NaN },
    { evs: { ...set("Pikachu").evs, spe: 253 } },
    { evs: { ...set("Pikachu").evs, spe: -1 } },
    { ivs: { ...set("Pikachu").ivs, spe: 32 } },
    { ivs: { ...set("Pikachu").ivs, spe: Number.POSITIVE_INFINITY } }
  ])("excludes invalid numeric Speed inputs from an incomplete draft: %j", (overrides) => {
    const result = rankUnmodifiedSpeed(team({ ...set("Pikachu"), ...overrides }), team(), catalog);
    expect(result.entries).toEqual([]);
    expect(result.excluded[0]?.reason).toBe("invalid-speed-data");
  });

  it("does not mutate either draft while ranking", () => {
    const first = team(set("Lapras"), set("Pikachu"));
    const second = team(set("Gengar"));
    const original = JSON.stringify([first, second]);
    rankUnmodifiedSpeed(first, second, catalog);
    expect(JSON.stringify([first, second])).toBe(original);
  });
});
