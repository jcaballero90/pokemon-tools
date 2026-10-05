import { describe, expect, it } from "vitest";
import { pokemonSetSchema, teamInputSchema } from "@pokemon-tools/contracts";
import { en } from "../locales/en";
import { formatApiFailure, formatUiError, UserFacingError } from "./errors";

describe("locale-formatted errors", () => {
  it("formats structured unknown names and validation limits instead of server prose", () => {
    expect(formatApiFailure(400, { error: "untranslated server prose", code: "unknown-move", issues: [{ code: "unknown-move", path: ["move"], value: "Draft move" }] })).toBe("Unknown move: Draft move");
    expect(formatApiFailure(400, { error: "untranslated server prose", code: "validation-failed", issues: [{ code: "validation-failed", path: ["attacker", "level"], rule: "maximum", maximum: 100 }] })).toBe("Attacker · Level must be at most 100.");
  });

  it("maps library auth codes and unknown HTTP failures to locale messages", () => {
    expect(formatApiFailure(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "library prose" })).toBe(en.errors.auth.invalidCredentials);
    expect(formatApiFailure(500, { error: "private server detail" })).toBe(en.errors.codes["internal-error"]);
    expect(formatApiFailure(429, {})).toBe(en.errors.codes["rate-limited"]);
  });

  it("formats local Zod constraints and EV totals without reading their English messages", () => {
    const invalidTeam = teamInputSchema.safeParse({ name: "", pokemon: [] });
    expect(invalidTeam.success).toBe(false);
    if (!invalidTeam.success) expect(formatUiError(invalidTeam.error)).toContain("Team name must contain at least 1");
    const invalidSet = pokemonSetSchema.safeParse({ species: "Pikachu", evs: { hp: 252, atk: 252, def: 8 } });
    expect(invalidSet.success).toBe(false);
    if (!invalidSet.success) expect(formatUiError(invalidSet.error)).toBe(en.errors.validation.evTotal);
  });

  it("keeps already formatted errors and sanitizes unclassified failures", () => {
    expect(formatUiError(new UserFacingError("Localized message"))).toBe("Localized message");
    expect(formatUiError(new Error("private detail"))).toBe(en.errors.codes["request-failed"]);
  });
});
