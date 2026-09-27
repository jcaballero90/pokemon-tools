import { describe, expect, it } from "vitest";
import { typeChart } from "./catalog.js";

describe("type chart from pinned battle data", () => {
  it("keeps known Generation 9 matchups", () => {
    const fire = typeChart().find((row) => row.attack === "Fire");
    expect(fire?.against.Grass).toBe(2);
    expect(fire?.against.Water).toBe(0.5);
    const electric = typeChart().find((row) => row.attack === "Electric");
    expect(electric?.against.Ground).toBe(0);
  });
});
