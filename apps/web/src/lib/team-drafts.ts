import {
  teamDraftSchema,
  versionedTeamDraftSchema,
  type TeamDraft
} from "@pokemon-tools/contracts";

export type DraftSlot = "team" | "comparison";

const currentKey = (slot: DraftSlot) => `pokemon-draft:v1:${slot}`;
const legacyKey = (slot: DraftSlot) => slot === "team" ? "pokemon-guest-team" : "pokemon-comparison-team";

function parseDraft(value: string | null): TeamDraft | null {
  if (value === null) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    const current = versionedTeamDraftSchema.safeParse(parsed);
    if (current.success) return current.data.team;
    const legacy = teamDraftSchema.safeParse(parsed);
    return legacy.success ? legacy.data : null;
  } catch {
    return null;
  }
}

export function loadTeamDraft(slot: DraftSlot, fallback: TeamDraft): TeamDraft {
  try {
    const storage = globalThis.localStorage;
    const saved = storage.getItem(currentKey(slot));
    if (saved !== null) return parseDraft(saved) ?? fallback;

    const legacy = storage.getItem(legacyKey(slot));
    const migrated = parseDraft(legacy);
    if (!migrated) return fallback;
    if (saveTeamDraft(slot, migrated)) storage.removeItem(legacyKey(slot));
    return migrated;
  } catch {
    return fallback;
  }
}

export function saveTeamDraft(slot: DraftSlot, team: TeamDraft): boolean {
  const parsed = teamDraftSchema.safeParse(team);
  if (!parsed.success) return false;
  try {
    globalThis.localStorage.setItem(currentKey(slot), JSON.stringify({ version: 1, team: parsed.data }));
    return true;
  } catch {
    return false;
  }
}
