import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { teamInputSchema, type CatalogResponse, type TeamDraft } from "@pokemon-tools/contracts";
import { setLocale } from "../../i18n.js";
import { TeamEditor } from "./TeamEditor";

const catalog: CatalogResponse = {
  species: [
    { name: "Pikachu", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } },
    { name: "Charizard", types: ["Fire", "Flying"], baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 } }
  ],
  moves: ["Thunderbolt", "Protect"],
  abilities: ["Static", "Blaze"],
  items: ["Light Ball"],
  types: ["Electric", "Fire", "Flying"],
  natures: ["Serious"]
};

const validPaste = "Pikachu @ Light Ball\nAbility: Static\n- Thunderbolt";

function makeTeam(name: string, species: string): TeamDraft {
  return teamInputSchema.parse({
    name,
    notes: `${name} notes`,
    pokemon: [{ species, moves: ["Protect"] }]
  }) as TeamDraft;
}

function createSingleEditorHarness(initial: TeamDraft, onChange: (team: TeamDraft) => void) {
  return function EditorHarness() {
    const [team, setTeam] = useState(initial);
    return <TeamEditor title="Your team" team={team} onChange={(next) => { onChange(next); setTeam(next); }} catalog={catalog} />;
  };
}

beforeEach(() => setLocale("en"));
let clipboardDescriptor: PropertyDescriptor | undefined;
afterEach(() => {
  cleanup();
  if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else Reflect.deleteProperty(navigator, "clipboard");
  clipboardDescriptor = undefined;
});

describe("Showdown import controls", () => {
  it("replaces only the chosen panel’s Pokémon and keeps its name and notes", () => {
    let leftDraft = makeTeam("Left team", "Charizard");
    let rightDraft = makeTeam("Right team", "Charizard");

    function TeamsHarness() {
      const [left, setLeft] = useState(leftDraft);
      const [right, setRight] = useState(rightDraft);
      return (
        <>
          <TeamEditor title="Your team" team={left} onChange={(next) => { leftDraft = next; setLeft(next); }} catalog={catalog} />
          <TeamEditor title="Comparison team" team={right} onChange={(next) => { rightDraft = next; setRight(next); }} catalog={catalog} side="b" />
        </>
      );
    }

    render(<TeamsHarness />);
    fireEvent.click(screen.getAllByRole("button", { name: "Import from Showdown" })[0]!);
    fireEvent.change(screen.getByLabelText("Showdown paste"), { target: { value: validPaste } });
    fireEvent.click(screen.getByRole("button", { name: "Review paste" }));

    expect(screen.getByText("This replaces the 1 Pokémon currently in this panel. The team name and notes will be kept.")).toBeTruthy();
    expect(screen.getByText("Pikachu")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Replace team" }));

    expect(leftDraft).toMatchObject({
      name: "Left team",
      notes: "Left team notes",
      pokemon: [{ species: "Pikachu", item: "Light Ball", ability: "Static", moves: ["Thunderbolt"] }]
    });
    expect(rightDraft).toMatchObject({
      name: "Right team",
      notes: "Right team notes",
      pokemon: [{ species: "Charizard", moves: ["Protect"] }]
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Import from Showdown" })[1]!);
    fireEvent.change(screen.getByLabelText("Showdown paste"), { target: { value: validPaste } });
    fireEvent.click(screen.getByRole("button", { name: "Review paste" }));
    fireEvent.click(screen.getByRole("button", { name: "Replace team" }));

    expect(leftDraft.pokemon[0]?.species).toBe("Pikachu");
    expect(rightDraft).toMatchObject({
      name: "Right team",
      notes: "Right team notes",
      pokemon: [{ species: "Pikachu", moves: ["Thunderbolt"] }]
    });
  });

  it("exports the selected panel as a Showdown paste and copies it without changing the team", async () => {
    const original = makeTeam("Export me", "Pikachu");
    let draft = original;
    const EditorHarness = createSingleEditorHarness(original, (next) => { draft = next; });
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });

    render(<EditorHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Export to Showdown" }));

    const paste = screen.getByLabelText("Showdown export") as HTMLTextAreaElement;
    expect(paste.value).toContain("Pikachu");
    expect(paste.value).toContain("Serious Nature");
    expect(paste.value).toContain("- Protect");
    expect(screen.getByText(/does not retain this panel’s team name or notes/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    expect(await screen.findByText("Showdown team copied.")).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(paste.value);
    expect(draft).toEqual(original);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Showdown export")).toBeNull();
    expect(draft).toEqual(original);
  });

  it("shows the export controls in Spanish", () => {
    setLocale("es-ES");
    const EditorHarness = createSingleEditorHarness(makeTeam("Equipo", "Pikachu"), () => undefined);

    render(<EditorHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Exportar a Showdown" }));

    expect(screen.getByRole("heading", { name: "Exportar un equipo de Showdown" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copiar al portapapeles" })).toBeTruthy();
  });

  it("keeps the draft when review fails or is cancelled", () => {
    const original = makeTeam("Original", "Charizard");
    let draft = original;
    const EditorHarness = createSingleEditorHarness(original, (next) => { draft = next; });

    render(<EditorHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Import from Showdown" }));
    fireEvent.change(screen.getByLabelText("Showdown paste"), { target: { value: "Missingmon\n- Thunderbolt" } });
    fireEvent.click(screen.getByRole("button", { name: "Review paste" }));

    expect(screen.getByRole("alert").textContent).toContain("Unknown species: Missingmon");
    expect((screen.getByRole("button", { name: "Replace team" }) as HTMLButtonElement).disabled).toBe(true);
    expect(draft).toEqual(original);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Showdown paste")).toBeNull();
    expect(draft).toEqual(original);
  });

  it("reformats structured diagnostics when the locale changes", () => {
    const original = makeTeam("Original", "Charizard");
    const EditorHarness = createSingleEditorHarness(original, () => undefined);

    setLocale("es-ES");
    render(<EditorHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Importar desde Showdown" }));
    fireEvent.change(screen.getByLabelText("Texto de Showdown"), { target: { value: "Missingmon\n- Thunderbolt" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar texto" }));

    expect(screen.getByRole("alert").textContent).toContain("Especie desconocida: Missingmon");
    act(() => setLocale("en"));
    expect(screen.getByRole("alert").textContent).toContain("Unknown species: Missingmon");
  });
});
