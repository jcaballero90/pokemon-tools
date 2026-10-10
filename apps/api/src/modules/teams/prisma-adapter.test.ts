import { describe, expect, it, vi } from "vitest";
import type { Database } from "../../db.js";
import { PrismaTeamStore } from "./prisma-adapter.js";

describe("Prisma team ownership filters", () => {
  it("lists and removes records only inside the requested owner's scope", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const db = { team: { findMany, deleteMany } } as unknown as Database;
    const store = new PrismaTeamStore(db);

    await store.list("owner-a");
    await store.remove("owner-a", "team-b");

    expect(findMany).toHaveBeenCalledWith({ where: { ownerId: "owner-a" }, orderBy: { updatedAt: "desc" } });
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "team-b", ownerId: "owner-a" } });
  });

  it("takes the saved owner from the authenticated route, not the team payload", async () => {
    const create = vi.fn().mockResolvedValue({ id: "team-1" });
    const db = { team: { create } } as unknown as Database;
    const store = new PrismaTeamStore(db);

    await store.create("session-owner", { name: "Practice", notes: "", format: "gen9", pokemon: [] });

    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ ownerId: "session-owner", name: "Practice" }) });
  });
});
