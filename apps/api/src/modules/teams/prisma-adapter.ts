import type { TeamInput } from "@pokemon-tools/contracts";
import type { Database } from "../../db.js";
import type { TeamStore } from "./teams.js";

export class PrismaTeamStore implements TeamStore {
  constructor(private readonly db: Database) {}
  list(ownerId: string) { return this.db.team.findMany({ where: { ownerId }, orderBy: { updatedAt: "desc" } }); }
  create(ownerId: string, team: TeamInput) {
    return this.db.team.create({ data: { ownerId, name: team.name, notes: team.notes, format: team.format, pokemon: team.pokemon } });
  }
  async remove(ownerId: string, id: string) {
    return (await this.db.team.deleteMany({ where: { id, ownerId } })).count > 0;
  }
}
