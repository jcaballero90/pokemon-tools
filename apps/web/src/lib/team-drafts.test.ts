import { beforeEach, describe, expect, it, vi } from "vitest";
import { teamInputSchema } from "@pokemon-tools/contracts";
import type { TeamDraft } from "@pokemon-tools/contracts";
import { loadStoredTeamDraft, loadTeamDraft, saveTeamDraft } from "./team-drafts.js";

const empty = teamInputSchema.parse({ name: "New team", pokemon: [] });
const validPokemon = teamInputSchema.parse({ name: "x", pokemon: [{ species: "Pikachu" }] }).pokemon[0];
const incomplete = { ...empty, name: "", pokemon: [{ ...validPokemon, species: "", moves: ["", "Protect", "", ""] }] } as TeamDraft;

describe("browser team drafts", () => {
  beforeEach(() => localStorage.clear());

  it("migrates the old key and preserves incomplete edits and empty move slots", () => {
    localStorage.setItem("pokemon-guest-team", JSON.stringify(incomplete));

    expect(loadTeamDraft("team", empty)).toEqual(incomplete);
    expect(localStorage.getItem("pokemon-guest-team")).toBeNull();
    expect(JSON.parse(localStorage.getItem("pokemon-draft:v1:team")!)).toEqual({ version: 1, team: incomplete });
  });

  it("keeps a malformed value untouched while returning the default draft", () => {
    localStorage.setItem("pokemon-draft:v1:team", "not-json");

    expect(loadTeamDraft("team", empty)).toEqual(empty);
    expect(localStorage.getItem("pokemon-draft:v1:team")).toBe("not-json");
  });

  it("reports blocked or full browser storage instead of throwing", () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); } });
    expect(loadTeamDraft("team", empty)).toEqual(empty);
    expect(saveTeamDraft("team", empty)).toBe(false);
    vi.unstubAllGlobals();
  });

  it("writes a versioned value without applying submission validation", () => {
    expect(saveTeamDraft("team", incomplete)).toBe(true);
    expect(JSON.parse(localStorage.getItem("pokemon-draft:v1:team")!).team.name).toBe("");
  });

  it("persists an optional saved-team association and still reads older draft envelopes", () => {
    const source = { ownerId: "owner-1", teamId: "team-1" };
    expect(saveTeamDraft("team", incomplete, source)).toBe(true);
    expect(loadStoredTeamDraft("team", empty)).toEqual({ team: incomplete, source });
    localStorage.setItem("pokemon-draft:v1:comparison", JSON.stringify({ version: 1, team: empty }));
    expect(loadStoredTeamDraft("comparison", incomplete)).toEqual({ team: empty, source: null });
    expect(loadTeamDraft("comparison", incomplete)).toEqual(empty);
  });

  it("keeps an incomplete draft when its optional saved-team metadata is malformed", () => {
    localStorage.setItem("pokemon-draft:v1:team", JSON.stringify({ version: 1, team: incomplete, source: { ownerId: 42, teamId: null } }));

    expect(loadStoredTeamDraft("team", empty)).toEqual({ team: incomplete, source: null });
  });
});
