import { describe, expect, it } from "vitest";
import { catalog, typeChart } from "./catalog.js";

describe("move details from pinned Generation 9 battle data", () => {
  it("retains every canonical move and its type and category", () => {
    expect(Object.keys(catalog.moveDetails).sort()).toEqual(catalog.moves);
    expect(catalog.moveDetails.Thunderbolt).toEqual({ type: "Electric", category: "Special" });
    expect(catalog.moveDetails["Flying Press"]).toEqual({ type: "Fighting", category: "Physical" });
    expect(catalog.moveDetails["Freeze-Dry"]).toEqual({ type: "Ice", category: "Special" });
    expect(catalog.moveDetails.thunderbolt).toBeUndefined();
  });

  it("distinguishes status moves from damaging moves with zero base power", () => {
    expect(catalog.moveDetails["Swords Dance"]).toEqual({ type: "Normal", category: "Status" });
    expect(catalog.moveDetails["Night Shade"]).toEqual({ type: "Ghost", category: "Special" });
    expect(catalog.moveDetails["Seismic Toss"]).toEqual({ type: "Fighting", category: "Physical" });
  });
});

describe("type chart from pinned battle data", () => {
  it("keeps known Generation 9 matchups", () => {
    const fire = typeChart().find((row) => row.attack === "Fire");
    expect(fire?.against.Grass).toBe(2);
    expect(fire?.against.Water).toBe(0.5);
    const electric = typeChart().find((row) => row.attack === "Electric");
    expect(electric?.against.Ground).toBe(0);
  });
});

describe("official Spain Spanish catalog snapshot", () => {
  it("uses canonical battle identifiers and official localized labels", () => {
    expect(catalog.translations.types.grass).toBe("Planta");
    expect(catalog.translations.species.bulbasaur).toBe("Bulbasaur");
    expect(catalog.translations.moves.tackle).toBe("Placaje");
    expect(catalog.translations.abilities.overgrow).toBe("Espesura");
    expect(catalog.translations.items.choicescarf).toBe("Pañuelo Elección");
    expect(catalog.translations.natures.hardy).toBe("Fuerte");
    expect(catalog.translations.evolutionLocations.esES.mtcoronet).toBe("Monte Corona");
    expect(catalog.translations.evolutionLocations.esES.eternaforest).toBe("Bosque Vetusto");
    expect(catalog.translations.evolutionLocations.esES.chargestonecave).toBe("Cueva Electrorroca");
    expect(catalog.translations.species.ababo).toBeUndefined();
    expect(Object.values(catalog.translations.types).every((label) => label.trim().length > 0)).toBe(true);
  });
});
