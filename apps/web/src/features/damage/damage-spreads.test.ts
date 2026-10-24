import { damageRequestSchema, pokemonSetSchema } from "@pokemon-tools/contracts";
import { describe, expect, it } from "vitest";
import { blankDamageSpreadDraft, mergeDamageSpreadOverrides } from "./damage-spreads.js";

describe("optional damage spread overrides", () => {
  it("keeps current values when every draft field is blank", () => {
    const set = pokemonSetSchema.parse({ species: "Pikachu", evs: { atk: 252 }, ivs: { atk: 0 } });
    const request = damageRequestSchema.parse({
      attacker: mergeDamageSpreadOverrides(set, blankDamageSpreadDraft()),
      defender: pokemonSetSchema.parse({ species: "Charizard" }),
      move: "Thunderbolt"
    });

    expect(request.attacker.evs).toEqual(set.evs);
    expect(request.attacker.ivs).toEqual(set.ivs);
  });

  it("applies partial overrides and preserves explicit zeroes", () => {
    const set = pokemonSetSchema.parse({ species: "Pikachu", evs: { atk: 252 }, ivs: { atk: 31 } });
    const draft = blankDamageSpreadDraft();
    draft.evs.spe = "128";
    draft.ivs.atk = "0";
    const request = damageRequestSchema.parse({
      attacker: mergeDamageSpreadOverrides(set, draft),
      defender: pokemonSetSchema.parse({ species: "Charizard" }),
      move: "Thunderbolt"
    });

    expect(request.attacker.evs).toMatchObject({ atk: 252, spe: 128 });
    expect(request.attacker.ivs.atk).toBe(0);
    expect(request.attacker.ivs.hp).toBe(31);
  });

  it.each([
    ["fractional", "1.5", "evs", "hp"],
    ["negative", "-1", "ivs", "atk"],
    ["over the per-stat maximum", "253", "evs", "spa"]
  ])("rejects %s values through the existing damage schema", (_label, value, spread, stat) => {
    const set = pokemonSetSchema.parse({ species: "Pikachu", evs: { atk: 252 } });
    const draft = blankDamageSpreadDraft();
    draft[spread as "evs" | "ivs"][stat as keyof typeof draft.evs] = value;
    const parsed = damageRequestSchema.safeParse({
      attacker: mergeDamageSpreadOverrides(set, draft),
      defender: pokemonSetSchema.parse({ species: "Charizard" }),
      move: "Thunderbolt"
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects an EV total above 510 after merging with existing team values", () => {
    const set = pokemonSetSchema.parse({ species: "Pikachu", evs: { atk: 252 } });
    const draft = blankDamageSpreadDraft();
    draft.evs.spe = "252";
    draft.evs.hp = "8";
    const parsed = damageRequestSchema.safeParse({
      attacker: mergeDamageSpreadOverrides(set, draft),
      defender: pokemonSetSchema.parse({ species: "Charizard" }),
      move: "Thunderbolt"
    });

    expect(parsed.success).toBe(false);
  });
});
