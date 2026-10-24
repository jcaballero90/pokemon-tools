import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { teamInputSchema, type CatalogResponse } from "@pokemon-tools/contracts";
import { setLocale } from "../../i18n.js";
import { ShowdownTeamExport } from "./ShowdownTeamExport";

const catalog: CatalogResponse = {
  species: [{ name: "Pikachu", types: ["Electric"], baseStats: { spe: 90 } }],
  moves: ["Thunderbolt"], moveDetails: { Thunderbolt: { type: "Electric", category: "Special" } },
  abilities: [], items: [], types: ["Electric"], natures: ["Serious"]
};

afterEach(() => {
  cleanup();
  setLocale("en");
});

describe("Showdown export validation", () => {
  it("shows no invalid paste and disables copy for an unknown catalog value", () => {
    const team = teamInputSchema.parse({ name: "Draft", pokemon: [{ species: "Missingmon", moves: ["Thunderbolt"] }] });
    render(<ShowdownTeamExport team={team} catalog={catalog} numericInputsValid onCancel={vi.fn()} />);

    expect((screen.getByLabelText("Showdown export") as HTMLTextAreaElement).value).toBe("");
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("alert").textContent).toContain("Missingmon");
  });

  it("blocks copy for invalid numeric drafts even when the stored set is otherwise valid", () => {
    const team = teamInputSchema.parse({ name: "Draft", pokemon: [{ species: "Pikachu", moves: ["Thunderbolt"] }] });
    render(<ShowdownTeamExport team={team} catalog={catalog} numericInputsValid={false} onCancel={vi.fn()} />);

    expect((screen.getByLabelText("Showdown export") as HTMLTextAreaElement).value).toBe("");
    const copy = screen.getByRole("button", { name: "Copy to clipboard" });
    expect(copy).toHaveProperty("disabled", true);
    fireEvent.click(copy);
    expect(screen.getByRole("alert").textContent).toContain("whole-number");
  });
});
