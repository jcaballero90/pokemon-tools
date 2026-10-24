import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { teamInputSchema, type CatalogResponse, type TeamDraft, type TypeChartResponse } from "@pokemon-tools/contracts";
import { setLocale } from "../../i18n.js";
import { Compare } from "./Compare";
import { standardTypes } from "./comparison-model";

const catalog: CatalogResponse = {
  species: [
    { name: "Pikachu", types: ["Electric"], baseStats: { spe: 90 } },
    { name: "Blastoise", types: ["Water"], baseStats: { spe: 78 } },
    { name: "Garchomp", types: ["Dragon", "Ground"], baseStats: { spe: 102 } }
  ],
  moves: ["Thunderbolt", "Protect", "Weather Ball", "Surf"],
  moveDetails: {
    Thunderbolt: { type: "Electric", category: "Special" },
    Protect: { type: "Normal", category: "Status" },
    "Weather Ball": { type: "Normal", category: "Special" },
    Surf: { type: "Water", category: "Special" }
  },
  abilities: [], items: [], types: [...standardTypes], natures: ["Serious", "Timid"]
};

const chart: TypeChartResponse = standardTypes.map((attack) => {
  const against = Object.fromEntries(standardTypes.map((type) => [type, 1]));
  if (attack === "Electric") Object.assign(against, { Water: 2, Electric: 0.5, Dragon: 0.5, Ground: 0 });
  if (attack === "Ground") Object.assign(against, { Electric: 2 });
  return { attack, against };
});

function team(species: string, moves = ["Thunderbolt"]): TeamDraft {
  return teamInputSchema.parse({ name: species, pokemon: [{ species, moves }] });
}

function openMatchup() {
  fireEvent.mouseDown(screen.getByRole("tab", { name: "A vs B" }), { button: 0, ctrlKey: false });
}

function openBalance() {
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Team balance" }), { button: 0, ctrlKey: false });
}

const ready = { catalog, chart, catalogStatus: "ready", chartStatus: "ready" } as const;

beforeEach(() => setLocale("en"));
afterEach(cleanup);

describe("team comparison interface", () => {
  it("starts with A vs B and keeps defensive insights available in the balance tab", () => {
    const left = team("Pikachu");
    left.pokemon.push({ ...left.pokemon[0]!, species: "Missingmon" });
    render(<Compare {...ready} left={left} right={team("Blastoise")} />);

    expect(screen.getByRole("tab", { name: "A vs B" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByRole("heading", { name: "Defensive gaps" })).toBeNull();
    openBalance();
    expect(screen.getByRole("tab", { name: "Team balance" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("1 of 2 Pokémon analyzed")).toBeTruthy();
    expect(screen.getByText("Not analyzed: 2. Missingmon.")).toBeTruthy();
    expect(screen.getAllByRole("heading", { name: "Defensive gaps" })).toHaveLength(2);
    fireEvent.click(screen.getAllByText("Full defensive breakdown")[0]!);
    const table = screen.getAllByRole("table", { name: "Native-type defensive coverage" })[0]!;
    expect(within(table).getAllByRole("row")).toHaveLength(19);
    const ground = within(table).getByRole("row", { name: /Ground/ });
    expect(within(ground).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["1", "0", "0", "0"]);
  });

  it("uses selected attacks, changes direction, and updates when move slots change", () => {
    const left = team("Pikachu");
    const right = team("Blastoise", ["Protect"]);
    right.pokemon.push(team("Garchomp").pokemon[0]!);
    const { rerender } = render(<Compare {...ready} left={left} right={right} />);
    openMatchup();

    const grid = screen.getByRole("table", { name: "Best selected move type effectiveness" });
    const row = within(grid).getByRole("row", { name: /1\. Pikachu/ });
    expect(within(row).getAllByRole("cell").map((cell) => cell.querySelector("b")?.textContent)).toEqual(["2×", "0×"]);
    expect(within(row).getAllByRole("cell").map((cell) => cell.querySelector("small")?.textContent)).toEqual(["Thunderbolt", "Thunderbolt"]);
    fireEvent.click(screen.getByRole("button", { name: "B attacks A" }));
    expect(screen.getByRole("button", { name: "B attacks A" }).getAttribute("aria-pressed")).toBe("true");
    expect(within(grid).getByText("Status moves only")).toBeTruthy();
    const statusCell = within(within(grid).getByRole("row", { name: /1\. Blastoise/ })).getByRole("cell");
    expect(within(statusCell).getByRole("button")).toHaveProperty("disabled", true);
    expect(within(statusCell).getByRole("tooltip").textContent).toContain("No usable damaging move");

    fireEvent.click(screen.getByRole("button", { name: "A attacks B" }));
    rerender(<Compare {...ready} left={team("Pikachu", ["Protect"])} right={right} />);
    expect(within(grid).getByText("Status moves only")).toBeTruthy();
    expect(within(grid).queryByText("Thunderbolt")).toBeNull();
  });

  it("keeps omitted moves visible and reformats active diagnostics in Spanish", () => {
    render(<Compare {...ready} left={team("Pikachu", ["Thunderbolt", "Weather Ball"])} right={team("Blastoise")} />);
    openMatchup();

    expect(screen.queryByText(/Team A: known super-effective coverage/)).toBeNull();
    expect(screen.getByText(/Weather Ball — special mechanics not modeled/)).toBeTruthy();
    act(() => setLocale("es-ES"));
    expect(screen.getByRole("tab", { name: "A contra B" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: "B ataca a A" })).toBeTruthy();
    expect(screen.getByText(/Weather Ball — mecánicas especiales no contempladas/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Velocidad sin modificar" })).toBeTruthy();
  });

  it("distinguishes loading, unavailable charts and missing move metadata", () => {
    const left = team("Pikachu");
    const right = team("Blastoise");
    const { rerender } = render(<Compare {...ready} left={left} right={right} catalog={null} catalogStatus="loading" />);
    expect(screen.getByRole("status").textContent).toContain("Loading Pokémon");
    expect(screen.queryByText("No uncovered weaknesses among the analyzed Pokémon.")).toBeNull();

    rerender(<Compare {...ready} left={left} right={right} chart={chart.slice(0, 1)} />);
    expect(screen.getByRole("status").textContent).toContain("Comparison data is unavailable");

    rerender(<Compare {...ready} left={left} right={right} catalog={{ ...catalog, moveDetails: undefined }} />);
    openMatchup();
    expect(screen.getByText("Move details are unavailable. Selected-move coverage cannot be calculated.")).toBeTruthy();
    expect(screen.getByRole("table", { name: "Unmodified Speed ranking" })).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Best selected move type effectiveness" })).toBeNull();
  });

  it("shows Speed ties and flags invalid set values", () => {
    const left = team("Pikachu");
    left.pokemon.push({ ...left.pokemon[0]!, level: 0 });
    render(<Compare {...ready} left={left} right={team("Pikachu")} />);
    openMatchup();

    const speed = screen.getByRole("table", { name: "Unmodified Speed ranking" });
    expect(within(speed).getAllByText("Speed tie")).toHaveLength(2);
    expect(within(speed).getAllByRole("row")).toHaveLength(3);
    const grid = screen.getByRole("table", { name: "Best selected move type effectiveness" });
    expect(within(grid).getByRole("img", { name: "? unavailable" })).toBeTruthy();
    expect(screen.getByText(/invalid level or Speed values/)).toBeTruthy();
  });

  it("distinguishes empty attack slots from unsupported attacks and unknown opponents", () => {
    const left = team("Pikachu", []);
    const right = team("Blastoise");
    const { rerender } = render(<Compare {...ready} left={left} right={right} />);
    openMatchup();
    const grid = screen.getByRole("table", { name: "Best selected move type effectiveness" });
    expect(within(grid).getByRole("cell").querySelector("b")?.textContent).toBe("—");

    rerender(<Compare {...ready} left={team("Pikachu", ["Weather Ball"])} right={right} />);
    const unsupportedCell = within(grid).getByRole("cell");
    expect(unsupportedCell.querySelector("b")?.textContent).toBe("?");
    expect(within(unsupportedCell).getByRole("button")).toHaveProperty("disabled", true);
    expect(within(unsupportedCell).getByRole("tooltip").textContent).toContain("No usable damaging move");

    rerender(<Compare {...ready} left={left} right={team("Missingmon")} />);
    expect(within(grid).getByRole("cell").querySelector("b")?.textContent).toBe("?");
    const unknownSpeciesCell = within(grid).getByRole("cell");
    expect(within(unknownSpeciesCell).getByRole("button")).toHaveProperty("disabled", true);
    expect(within(unknownSpeciesCell).getByRole("tooltip").textContent).toContain("Correct both Pokémon sets");
  });

  it("opens the selected cell pair with its canonical move and reverses the speed cue", () => {
    const onOpenDamage = vi.fn();
    const left = team("Pikachu");
    const right = team("Blastoise", ["Surf"]);
    render(<Compare {...ready} left={left} right={right} onOpenDamage={onOpenDamage} />);

    const grid = screen.getByRole("table", { name: "Best selected move type effectiveness" });
    const pikachuCell = within(within(grid).getByRole("row", { name: /1\. Pikachu/ })).getByRole("cell");
    expect(within(pikachuCell).getByRole("img", { name: "↑ faster" })).toBeTruthy();
    fireEvent.click(within(pikachuCell).getByRole("button", { name: "Open 1. Pikachu versus 1. Blastoise in Damage" }));
    expect(onOpenDamage).toHaveBeenCalledWith({
      attacker: left.pokemon[0],
      defender: right.pokemon[0],
      move: "Thunderbolt"
    });

    fireEvent.click(screen.getByRole("button", { name: "B attacks A" }));
    const reverseGrid = screen.getByRole("table", { name: "Best selected move type effectiveness" });
    const blastoiseCell = within(within(reverseGrid).getByRole("row", { name: /1\. Blastoise/ })).getByRole("cell");
    expect(within(blastoiseCell).getByRole("img", { name: "↓ slower" })).toBeTruthy();
    fireEvent.click(within(blastoiseCell).getByRole("button", { name: "Open 1. Blastoise versus 1. Pikachu in Damage" }));
    expect(onOpenDamage).toHaveBeenLastCalledWith({
      attacker: right.pokemon[0],
      defender: left.pokemon[0],
      move: "Surf"
    });
  });

  it("transfers the selected slot when a team contains duplicate species", () => {
    const onOpenDamage = vi.fn();
    const left = team("Pikachu");
    const duplicate = teamInputSchema.parse({
      name: "Second Pikachu",
      pokemon: [{
        species: "Pikachu", nickname: "Sparky", level: 73, nature: "Timid", moves: ["Surf"],
        evs: { spe: 252 }, ivs: { atk: 0 }, boosts: { spe: 1 }, status: "Paralyzed", teraType: "Electric"
      }]
    }).pokemon[0]!;
    left.pokemon.push(duplicate);
    render(<Compare {...ready} left={left} right={team("Blastoise")} onOpenDamage={onOpenDamage} />);

    const grid = screen.getByRole("table", { name: "Best selected move type effectiveness" });
    const duplicateCell = within(within(grid).getByRole("row", { name: /2\. Sparky/ })).getByRole("cell");
    fireEvent.click(within(duplicateCell).getByRole("button", { name: "Open 2. Sparky (Pikachu) versus 1. Blastoise in Damage" }));

    expect(onOpenDamage).toHaveBeenCalledWith({ attacker: duplicate, defender: expect.any(Object), move: "Surf" });
    const transferred = onOpenDamage.mock.calls[0]?.[0].attacker;
    expect(transferred).not.toBe(duplicate);
    expect(transferred?.moves).not.toBe(duplicate.moves);
    expect(transferred?.evs).not.toBe(duplicate.evs);
    expect(transferred).toEqual(duplicate);
  });

  it("disables transfer for invalid sets and shows Speed ties", () => {
    const left = team("Pikachu");
    const right = team("Pikachu");
    right.pokemon[0]!.item = "Unknown Item";
    render(<Compare {...ready} left={left} right={right} />);

    const grid = screen.getByRole("table", { name: "Best selected move type effectiveness" });
    const cell = within(grid).getByRole("cell");
    expect(within(cell).getByRole("img", { name: "= tied" })).toBeTruthy();
    expect(within(cell).getByRole("button", { name: "Open 1. Pikachu versus 1. Pikachu in Damage" })).toHaveProperty("disabled", true);
    expect(within(cell).getByRole("tooltip").textContent).toContain("Correct both Pokémon sets");
  });
});
