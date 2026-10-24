import { describe, expect, it } from "vitest";
import type { CatalogResponse } from "@pokemon-tools/contracts";
import { parseShowdownPaste } from "./showdown-import";

const speciesNames = [
  "Ninetales-Alola",
  "Bisharp",
  "Gyarados",
  "Krookodile",
  "Slither Wing",
  "Thundurus-Therian",
  "Pikachu"
];
const moves = [
  "Aurora Veil", "Encore", "Freeze-Dry", "Snowscape", "Iron Head", "Sucker Punch",
  "Swords Dance", "Throat Chop", "Dragon Dance", "Scale Shot", "Taunt", "Waterfall",
  "Earthquake", "Knock Off", "Stealth Rock", "Bulk Up", "Flame Charge", "Leech Life",
  "Agility", "Dark Pulse", "Nasty Plot", "Thunderbolt", "Protect"
];

const catalog: CatalogResponse = {
  species: speciesNames.map((name) => ({
    name,
    types: ["Fire"],
    baseStats: { hp: 60, atk: 60, def: 60, spa: 60, spd: 60, spe: 60 }
  })),
  moves,
  abilities: ["Snow Warning", "Defiant", "Moxie", "Intimidate", "Protosynthesis", "Volt Absorb", "Static"],
  items: ["Light Clay", "Eviolite", "Loaded Dice", "Rocky Helmet", "Booster Energy", "Sitrus Berry", "Light Ball"],
  types: ["Fire", "Water", "Dragon", "Steel"],
  natures: ["Serious", "Timid", "Adamant", "Jolly", "Modest"]
};

const examplePaste = `Ninetales-Alola @ Light Clay
Ability: Snow Warning
Gender: F
Tera Type: Water
Timid Nature
EVs: 248 HP / 8 Def / 252 Spe
IVs: 0 Atk
- Aurora Veil
- Encore
- Freeze-Dry
- Snowscape

Bisharp @ Eviolite
Ability: Defiant
Gender: M
Tera Type: Fire
Adamant Nature
EVs: 252 Atk / 4 SpD / 252 Spe
- Iron Head
- Sucker Punch
- Swords Dance
- Throat Chop

Gyarados @ Loaded Dice
Ability: Moxie
Gender: M
Tera Type: Dragon
Adamant Nature
EVs: 252 Atk / 4 SpD / 252 Spe
- Dragon Dance
- Scale Shot
- Taunt
- Waterfall

Krookodile @ Rocky Helmet
Ability: Intimidate
Gender: M
Tera Type: Water
Jolly Nature
EVs: 248 HP / 20 SpD / 240 Spe
- Earthquake
- Knock Off
- Stealth Rock
- Taunt

Slither Wing @ Booster Energy
Ability: Protosynthesis
Tera Type: Fire
Adamant Nature
EVs: 252 Atk / 4 SpD / 252 Spe
- Bulk Up
- Earthquake
- Flame Charge
- Leech Life

Thundurus-Therian @ Sitrus Berry
Ability: Volt Absorb
Gender: M
Tera Type: Steel
Modest Nature
EVs: 232 HP / 176 SpA / 100 Spe
IVs: 0 Atk
- Agility
- Dark Pulse
- Nasty Plot
- Thunderbolt`;

describe("Pokémon Showdown paste parser", () => {
  it("imports the example’s forms, battle fields, zero IVs, and Showdown defaults", () => {
    const result = parseShowdownPaste(examplePaste, catalog);

    expect(result.errors).toEqual([]);
    expect(result.pokemon).toHaveLength(6);
    expect(result.pokemon.map((set) => set.species)).toEqual(speciesNames.slice(0, 6));
    expect(result.pokemon[0]).toMatchObject({
      item: "Light Clay",
      ability: "Snow Warning",
      nature: "Timid",
      level: 100,
      teraType: "Water",
      evs: { hp: 248, atk: 0, def: 8, spe: 252 },
      ivs: { hp: 31, atk: 0, def: 31, spa: 31, spd: 31, spe: 31 },
      moves: ["Aurora Veil", "Encore", "Freeze-Dry", "Snowscape"]
    });
    expect(result.pokemon[1]?.ivs).toEqual({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 });
    expect(result.pokemon[5]?.ivs.atk).toBe(0);
    expect(result.warnings.filter((warning) => warning.code === "gender")).toHaveLength(5);
  });

  it("accepts nickname headers, CRLF, no item, explicit level, and punctuation or case differences", () => {
    const paste = [
      "  Sparky (PIKACHU) (F)  ",
      "Ability: Static",
      "Level: 42",
      "Serious Nature",
      "EVs: 0 HP / 252 Spe",
      "IVs: 0 Atk",
      "- Thunderbolt"
    ].join("\r\n");
    const result = parseShowdownPaste(paste, catalog);

    expect(result.errors).toEqual([]);
    expect(result.pokemon[0]).toMatchObject({
      species: "Pikachu",
      nickname: "Sparky",
      item: "",
      level: 42,
      evs: { hp: 0, spe: 252 },
      ivs: { atk: 0 },
      moves: ["Thunderbolt"]
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "gender", value: "F" }));
  });

  it("reports unknown names, malformed lines, invalid stats, excess moves, and EV totals", () => {
    const result = parseShowdownPaste(`Pikachu
Ability: Static
EVs: 252 HP / 252 Atk / 8 Spe
Mystery: ignored
- Thunderbolt
- Protect
- Encore
- Taunt
- Earthquake

Missingmon
- Thunderbolt`, catalog);

    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "schemaValidation", "unrecognizedLine", "tooManyMoves", "unknownSpecies"
    ]));
    expect(result.errors).toContainEqual(expect.objectContaining({ code: "unrecognizedLine", line: 4 }));
    expect(result.errors).toContainEqual(expect.objectContaining({ code: "tooManyMoves", line: 9 }));
    expect(result.errors).toContainEqual(expect.objectContaining({ code: "unknownSpecies", pokemon: 2, line: 11 }));

    const invalidStats = parseShowdownPaste(`Pikachu
EVs: 10 HP / 12 Accuracy
IVs: 32 Atk
- Thunderbolt`, catalog);
    expect(invalidStats.errors).toContainEqual(expect.objectContaining({ code: "invalidStat", line: 2, value: "Accuracy" }));
    expect(invalidStats.errors).toContainEqual(expect.objectContaining({ code: "invalidNumber", line: 3, value: "32" }));
  });

  it("warns for details the team model cannot retain and rejects empty or oversized teams", () => {
    const result = parseShowdownPaste(`Sparky (Pikachu)
Gender: F
Shiny: Yes
Happiness: 200
- Thunderbolt`, catalog);

    expect(result.errors).toEqual([]);
    expect(result.warnings.map((warning) => warning.code)).toEqual(["gender", "unsupportedField", "unsupportedField"]);
    expect(parseShowdownPaste("  ", catalog).errors[0]?.code).toBe("emptyPaste");

    const oversized = Array.from({ length: 7 }, () => "Pikachu\n- Thunderbolt").join("\n\n");
    expect(parseShowdownPaste(oversized, catalog).errors).toContainEqual(
      expect.objectContaining({ code: "tooManyPokemon", count: 7 })
    );
  });
});
