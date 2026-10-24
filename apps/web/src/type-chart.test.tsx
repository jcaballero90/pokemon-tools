import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CatalogResponse, TypeChartResponse } from "@pokemon-tools/contracts";
import { TypeChart } from "./features/type-chart/TypeChart";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock("./lib/api", () => ({ api: apiMock }));

const standardTypes = [
  "Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel",
  "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"
];

const matchups: Record<string, Record<string, number>> = {
  Bug: { Grass: 2 },
  Electric: { Ground: 0, Water: 2, Grass: 0.5 },
  Fire: { Grass: 2, Water: 0.5, Dragon: 0.5 },
  Flying: { Grass: 2 },
  Ground: { Electric: 2, Fire: 2, Grass: 0.5 },
  Ice: { Grass: 2, Ground: 2 },
  Rock: { Ground: 0.5 },
  Water: { Grass: 0.5, Ground: 2 }
};

const chart: TypeChartResponse = [
  ...standardTypes.map((attack) => ({
    attack,
    against: Object.fromEntries(
      standardTypes.map((defend) => [defend, matchups[attack]?.[defend] ?? 1])
    )
  })),
  { attack: "Stellar", against: { Ground: 1 } },
  { attack: "???", against: {} }
];

const catalog: CatalogResponse = {
  species: [
    { name: "Bulbasaur", types: ["Grass", "Poison"], baseStats: {} },
    { name: "Charizard", types: ["Fire", "Flying"], baseStats: {} },
    { name: "Pikachu", types: ["Electric"], baseStats: {} }
  ],
  moves: [],
  abilities: [],
  items: [],
  types: [...standardTypes, "Stellar"],
  natures: []
};

function renderChart() {
  return render(
    <TypeChart
      chart={chart}
      catalog={catalog}
      chartStatus="ready"
      catalogStatus="ready"
    />
  );
}

function getMultiplierTypes(multiplier: string) {
  return within(screen.getByRole("region", { name: multiplier }))
    .getAllByRole("listitem")
    .map((card) => card.textContent?.trim());
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("defensive type chart", () => {
  it("groups all Grass/Ground attack types by combined effectiveness", () => {
    renderChart();
    const defendingTypes = within(screen.getByRole("group", { name: "Or choose up to two types" }));
    expect(defendingTypes.getAllByRole("button").length).toBe(18);
    const grassIcon = screen.getByRole("button", { name: "Grass" }).querySelector("img");
    expect(grassIcon?.getAttribute("src")).toBe(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/small/12.png"
    );
    expect(grassIcon?.getAttribute("alt")).toBe("");
    expect(grassIcon?.getAttribute("aria-hidden")).toBe("true");
    fireEvent.error(grassIcon!);
    expect((grassIcon as HTMLImageElement).hidden).toBe(true);
    expect(screen.getByRole("button", { name: "Grass" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Grass" }));
    fireEvent.click(screen.getByRole("button", { name: "Ground" }));

    expect(getMultiplierTypes("4×")).toEqual(["Ice"]);
    expect(getMultiplierTypes("2×")).toEqual(["Bug", "Fire", "Flying"]);
    expect(getMultiplierTypes("1×")).toEqual([
      "Dark", "Dragon", "Fairy", "Fighting", "Ghost", "Grass", "Normal", "Poison",
      "Psychic", "Steel", "Water"
    ]);
    expect(getMultiplierTypes("0.5×")).toEqual(["Ground", "Rock"]);
    expect(getMultiplierTypes("0×")).toEqual(["Electric"]);
    expect(screen.queryByRole("region", { name: "0.25×" })).toBeNull();

    const displayedAttackTypes = screen.getAllByRole("listitem").map((card) => card.textContent?.trim());
    expect(displayedAttackTypes).toHaveLength(18);
    expect(displayedAttackTypes).not.toContain("Stellar");
    expect(displayedAttackTypes).not.toContain("???");
  });

  it("limits selection to two types, allows deselection, and calculates single-type matchups", () => {
    renderChart();
    const fire = screen.getByRole("button", { name: "Fire" });
    const ground = screen.getByRole("button", { name: "Ground" });
    const grass = screen.getByRole("button", { name: "Grass" });

    fireEvent.click(fire);
    expect(fire.getAttribute("aria-pressed")).toBe("true");
    expect(getMultiplierTypes("2×")).toContain("Ground");
    expect((ground as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(ground);
    expect((grass as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Deselect a type to choose another.")).toBeTruthy();

    fireEvent.click(fire);
    expect(fire.getAttribute("aria-pressed")).toBe("false");
    expect((grass as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByRole("region", { name: "4×" })).toBeNull();
  });

  it("keeps an immunity when one type would otherwise be weak", () => {
    renderChart();
    fireEvent.click(screen.getByRole("button", { name: "Water" }));
    fireEvent.click(screen.getByRole("button", { name: "Ground" }));

    expect(getMultiplierTypes("0×")).toEqual(["Electric"]);
    expect(screen.queryByRole("region", { name: "4×" })).toBeNull();
  });

  it("shows a quarter multiplier when both defending types resist", () => {
    renderChart();
    fireEvent.click(screen.getByRole("button", { name: "Water" }));
    fireEvent.click(screen.getByRole("button", { name: "Dragon" }));

    expect(getMultiplierTypes("0.25×")).toEqual(["Fire"]);
  });

  it("autoselects a Pokémon's types and clears the species when a type is edited", async () => {
    apiMock.mockResolvedValue({
      source: "PokéAPI",
      sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
    });
    renderChart();

    fireEvent.change(screen.getByRole("combobox", { name: "Find a Pokémon" }), {
      target: { value: "Charizard" }
    });
    expect(screen.getByRole("button", { name: "Fire" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Flying" }).getAttribute("aria-pressed")).toBe("true");
    expect(await screen.findByAltText("Charizard")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Flying" }));
    expect(screen.queryByLabelText("Selected Pokémon")).toBeNull();
    expect((screen.getByRole("combobox", { name: "Find a Pokémon" }) as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("button", { name: "Fire" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Flying" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps existing types while a finder query is incomplete", () => {
    renderChart();
    fireEvent.click(screen.getByRole("button", { name: "Fire" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Find a Pokémon" }), {
      target: { value: "Char" }
    });

    expect(screen.getByRole("button", { name: "Fire" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByLabelText("Selected Pokémon")).toBeNull();
  });

  it("clears both Pokémon and manual selections", async () => {
    apiMock.mockResolvedValue({
      source: "PokéAPI",
      sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
    });
    renderChart();
    fireEvent.change(screen.getByRole("combobox", { name: "Find a Pokémon" }), {
      target: { value: "Charizard" }
    });
    expect(await screen.findByAltText("Charizard")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));

    expect((screen.getByRole("combobox", { name: "Find a Pokémon" }) as HTMLInputElement).value).toBe("");
    expect(screen.queryByLabelText("Selected Pokémon")).toBeNull();
    expect(screen.queryByRole("region", { name: "2×" })).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Choose a Pokémon or one or two types");
  });

  it("keeps the matchup available when a Pokémon sprite cannot be loaded", async () => {
    apiMock.mockRejectedValue(new Error("Sprite unavailable"));
    renderChart();
    fireEvent.change(screen.getByRole("combobox", { name: "Find a Pokémon" }), {
      target: { value: "Pikachu" }
    });

    expect(await screen.findByText("Sprite unavailable")).toBeTruthy();
    expect(getMultiplierTypes("1×")).toContain("Fire");
  });

  it("ignores a slower sprite response for a Pokémon that is no longer selected", async () => {
    const first = deferred<{ source: "PokéAPI"; pokedexId: number; sprite: string }>();
    const second = deferred<{ source: "PokéAPI"; pokedexId: number; sprite: string }>();
    apiMock.mockImplementation((path: string) => path.endsWith("Charizard") ? first.promise : second.promise);
    renderChart();
    const finder = screen.getByRole("combobox", { name: "Find a Pokémon" });

    fireEvent.change(finder, { target: { value: "Charizard" } });
    fireEvent.change(finder, { target: { value: "Bulbasaur" } });
    await act(async () => second.resolve({
      source: "PokéAPI",
      pokedexId: 1,
      sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
    }));

    expect(await screen.findByAltText("Bulbasaur")).toBeTruthy();
    await act(async () => first.resolve({
      source: "PokéAPI",
      pokedexId: 6,
      sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
    }));
    expect(screen.queryByAltText("Charizard")).toBeNull();
    expect(screen.getByAltText("Bulbasaur")).toBeTruthy();
  });

  it("does not display an empty matrix or calculated results while type data is loading", () => {
    render(<TypeChart chart={null} catalog={catalog} chartStatus="loading" catalogStatus="ready" />);

    expect(screen.getByRole("status").textContent).toContain("Loading the Generation 9 type chart");
    expect(screen.queryByRole("button", { name: "Fire" })).toBeNull();
    expect(screen.queryByRole("region", { name: "0×" })).toBeNull();
  });

  it("reports unavailable chart data", () => {
    render(<TypeChart chart={[]} catalog={catalog} chartStatus="unavailable" catalogStatus="ready" />);

    expect(screen.getByRole("alert").textContent).toContain("We couldn't load the type chart");
  });
});
