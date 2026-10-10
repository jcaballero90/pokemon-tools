import { describe, expect, it } from "vitest";
import { catalogId, catalogLabel, catalogOptions, resolveCatalogInput, type CatalogCategory, type CatalogTranslations } from "./catalog-labels.js";

const translations: CatalogTranslations = {
  species: { mrMime: "Ignored non-normalized key", mrmime: "M. Mime" },
  moves: { thunderbolt: "Rayo", protect: "Protección" },
  items: { leftovers: "Restos" }, abilities: { intimidate: "Intimidación" },
  natures: { adamant: "Firme" }, types: { electric: "Eléctrico" }
};

describe("canonical catalog values and translated labels", () => {
  it("uses normalized IDs for all six categories and retains canonical option values", () => {
    expect(catalogId("Mr. Mime")).toBe("mrmime");
    const examples: [CatalogCategory, string, string][] = [
      ["species", "Mr. Mime", "M. Mime"], ["moves", "Thunderbolt", "Rayo"],
      ["items", "Leftovers", "Restos"], ["abilities", "Intimidate", "Intimidación"],
      ["natures", "Adamant", "Firme"], ["types", "Electric", "Eléctrico"]
    ];
    for (const [category, canonical, label] of examples) {
      expect(catalogLabel(category, canonical, translations)).toBe(label);
      expect(catalogOptions(category, [canonical], translations)).toEqual([{ value: canonical, label }]);
      expect(resolveCatalogInput(category, label, [canonical], translations)).toBe(canonical);
    }
  });

  it("falls back to canonical English names for missing dictionaries, entries, or blank labels", () => {
    expect(catalogLabel("moves", "Thunderbolt")).toBe("Thunderbolt");
    expect(catalogLabel("moves", "Surf", translations)).toBe("Surf");
    expect(catalogLabel("moves", "Thunderbolt", { moves: { thunderbolt: "" } })).toBe("Thunderbolt");
  });

  it("recognizes English and translated names while preserving incomplete edits exactly", () => {
    const options = ["Thunderbolt", "Protect"];
    expect(resolveCatalogInput("moves", "  rAyO  ", options, translations)).toBe("Thunderbolt");
    expect(resolveCatalogInput("moves", "THUNDERBOLT", options, translations)).toBe("Thunderbolt");
    for (const edit of ["  R  ", "Prote", "Unknown move", " ", ""]) {
      expect(resolveCatalogInput("moves", edit, options, translations)).toBe(edit);
    }
  });

  it("disambiguates duplicate translated suggestions and preserves ambiguous unsuffixed edits", () => {
    const options = ["Thunderbolt", "Protect"];
    const duplicateLabels: CatalogTranslations = { moves: { thunderbolt: "Shared", protect: "Shared" } };
    expect(catalogOptions("moves", options, duplicateLabels)).toEqual([
      { value: "Thunderbolt", label: "Shared (Thunderbolt)" }, { value: "Protect", label: "Shared (Protect)" }
    ]);
    expect(resolveCatalogInput("moves", "  shared  ", options, duplicateLabels)).toBe("  shared  ");
    expect(resolveCatalogInput("moves", "Shared (Thunderbolt)", options, duplicateLabels)).toBe("Thunderbolt");
    expect(resolveCatalogInput("moves", "Shared (Protect)", options, duplicateLabels)).toBe("Protect");
    expect(resolveCatalogInput("moves", "Rayo", ["Thunderbolt", "Thunderbolt"], translations)).toBe("Thunderbolt");
  });

  it("keeps canonical names authoritative when a translated label matches a different canonical name", () => {
    const options = ["Thunderbolt", "Protect"];
    const collision: CatalogTranslations = { moves: { thunderbolt: "Protect" } };
    expect(catalogOptions("moves", options, collision)).toEqual([
      { value: "Thunderbolt", label: "Protect (Thunderbolt)" }, { value: "Protect", label: "Protect" }
    ]);
    expect(resolveCatalogInput("moves", "  protect  ", options, collision)).toBe("Protect");
    expect(resolveCatalogInput("moves", "Protect (Thunderbolt)", options, collision)).toBe("Thunderbolt");
    expect(resolveCatalogInput("moves", "Thunderbolt", options, collision)).toBe("Thunderbolt");
  });
});
