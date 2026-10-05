import { describe, expect, it } from "vitest";
import { teamInputSchema } from "@pokemon-tools/contracts";
import { zodValidationIssues } from "./http-errors.js";
import { validateTeam, validateTeamIssues } from "./modules/teams/teams.js";

describe("machine-readable validation", () => {
  it("preserves name-validation messages while supplying team slot paths", () => {
    const team = teamInputSchema.parse({ name: "Test", pokemon: [{ species: "Pikachu", moves: ["Ataque"] }] });
    expect(validateTeam(team)).toEqual(["Pokemon 1: Unknown move: Ataque"]);
    expect(validateTeamIssues(team)).toEqual([{ code: "unknown-move", path: ["pokemon", 0, "moves", 0], value: "Ataque" }]);
  });
  it("derives locale-ready rules from Zod metadata and preserves API constraints", () => {
    const parsed = teamInputSchema.safeParse({ name: "", pokemon: [{ species: "Pikachu", evs: { hp: 252, atk: 252, def: 252 }, level: 101 }] });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(zodValidationIssues(parsed.error.issues)).toEqual(expect.arrayContaining([
      { code: "validation-failed", path: ["name"], rule: "length-minimum", minimum: 1 },
      { code: "validation-failed", path: ["pokemon", 0, "level"], rule: "maximum", maximum: 100 },
      { code: "validation-failed", path: ["pokemon", 0, "evs"], rule: "ev-total", maximum: 510 }
    ]));
  });
});
