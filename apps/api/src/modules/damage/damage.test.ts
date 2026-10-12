import { describe, expect, it } from "vitest";
import { damageRequestSchema } from "@pokemon-tools/contracts";
import { computeDamage, validateSet } from "./damage.js";

describe("Generation 9 damage", () => {
  it("uses a valid range and conditional one-hit KO probability", () => {
    const input = damageRequestSchema.parse({ attacker: { species: "Pikachu", moves: ["Thunderbolt"] }, defender: { species: "Charizard" }, move: "Thunderbolt", field: {} });
    const result = computeDamage(input);
    expect(result.min).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
    expect(result.koChanceOnHit).toBeGreaterThanOrEqual(0);
    expect(result.koChanceOnHit).toBeLessThanOrEqual(1);
    expect(result.matchup).toEqual({ attacker: "Pikachu", defender: "Charizard", move: "Thunderbolt" });
    expect(result.hasEffect).toBe(true);
  });
  it("rejects unknown catalog names", () => {
    expect(validateSet(damageRequestSchema.parse({ attacker: { species: "Madeupmon" }, defender: { species: "Pikachu" }, move: "Thunderbolt" }).attacker)).toContain("Unknown species: Madeupmon");
  });
  it("returns canonical English names even for accepted case and punctuation aliases", () => {
    const result = computeDamage(damageRequestSchema.parse({ attacker: { species: "pikachu" }, defender: { species: "charizard" }, move: "thunder-bolt" }));
    expect(result.matchup).toEqual({ attacker: "Pikachu", defender: "Charizard", move: "Thunderbolt" });
    expect(result.hasEffect).toBe(true);
  });
  it("only applies a stored Tera type when explicitly activated", () => {
    const base = { attacker: { species: "Pikachu" }, defender: { species: "Charizard", teraType: "Ground" }, move: "Thunderbolt" };
    const ordinary = computeDamage(damageRequestSchema.parse(base));
    const terastallized = computeDamage(damageRequestSchema.parse({ ...base, field: { defenderTerastallized: true } }));
    expect(ordinary.max).toBeGreaterThan(0);
    expect(terastallized.max).toBe(0);
    expect(terastallized.matchup).toEqual({ attacker: "Pikachu", defender: "Charizard", move: "Thunderbolt" });
    expect(terastallized.hasEffect).toBe(false);
  });
});
