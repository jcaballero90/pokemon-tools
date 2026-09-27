import type { TeamInput } from "@pokemon-tools/contracts";
import { validateSet } from "../damage/damage.js";

export interface TeamStore {
  list(ownerId: string): Promise<unknown[]>;
  create(ownerId: string, team: TeamInput): Promise<unknown>;
  remove(ownerId: string, id: string): Promise<boolean>;
}

export function validateTeam(team: TeamInput) {
  return team.pokemon.flatMap((set, index) => validateSet(set).map((error) => `Pokemon ${index + 1}: ${error}`));
}

export function listTeams(store: TeamStore, ownerId: string) { return store.list(ownerId); }
export function saveTeam(store: TeamStore, ownerId: string, team: TeamInput) { return store.create(ownerId, team); }
export function deleteTeam(store: TeamStore, ownerId: string, id: string) { return store.remove(ownerId, id); }
