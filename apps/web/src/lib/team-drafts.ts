import {
  teamDraftSchema,
  teamDraftSourceSchema,
  versionedTeamDraftSchema,
  type TeamDraft,
  type TeamDraftSource
} from "@pokemon-tools/contracts";

export type DraftSlot = "team" | "comparison";

const currentKey = (slot: DraftSlot) => `pokemon-draft:v1:${slot}`;
const legacyKey = (slot: DraftSlot) => slot === "team" ? "pokemon-guest-team" : "pokemon-comparison-team";

export type StoredTeamDraft = { team: TeamDraft; source: TeamDraftSource | null };

function parseDraft(value: string | null): StoredTeamDraft | null {
  if (value === null) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    const current = versionedTeamDraftSchema.safeParse(parsed);
    if (current.success) return { team: current.data.team, source: current.data.source ?? null };
    if (parsed && typeof parsed === "object" && "version" in parsed && parsed.version === 1 && "team" in parsed) {
      const preservedTeam = teamDraftSchema.safeParse(parsed.team);
      if (preservedTeam.success) {
        const source = teamDraftSourceSchema.safeParse("source" in parsed ? parsed.source : undefined);
        return { team: preservedTeam.data, source: source.success ? source.data : null };
      }
    }
    const legacy = teamDraftSchema.safeParse(parsed);
    return legacy.success ? { team: legacy.data, source: null } : null;
  } catch {
    return null;
  }
}

export function loadTeamDraft(slot: DraftSlot, fallback: TeamDraft): TeamDraft {
  return loadStoredTeamDraft(slot, fallback).team;
}

export function loadStoredTeamDraft(slot: DraftSlot, fallback: TeamDraft): StoredTeamDraft {
  try {
    const storage = globalThis.localStorage;
    const saved = storage.getItem(currentKey(slot));
    if (saved !== null) return parseDraft(saved) ?? { team: fallback, source: null };

    const legacy = storage.getItem(legacyKey(slot));
    const migrated = parseDraft(legacy);
    if (!migrated) return { team: fallback, source: null };
    if (saveTeamDraft(slot, migrated.team)) storage.removeItem(legacyKey(slot));
    return migrated;
  } catch {
    return { team: fallback, source: null };
  }
}

export function saveTeamDraft(slot: DraftSlot, team: TeamDraft, source: TeamDraftSource | null = null): boolean {
  const parsed = teamDraftSchema.safeParse(team);
  if (!parsed.success) return false;
  try {
    globalThis.localStorage.setItem(currentKey(slot), JSON.stringify({ version: 1, team: parsed.data, ...(source ? { source } : {}) }));
    return true;
  } catch {
    return false;
  }
}
