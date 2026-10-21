import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { teamInputSchema, type CatalogResponse, type DamageResponse, type EvolutionResponse, type TeamDraft } from "@pokemon-tools/contracts";
import { Damage } from "./features/damage/Damage";
import { Pokedex } from "./features/pokedex/Pokedex";
import { TeamEditor } from "./features/teams/TeamEditor";
import { TypeChart } from "./features/type-chart/TypeChart";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock("./lib/api", () => ({ api: apiMock }));
vi.mock("./i18n", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./i18n")>();
  const english = actual.getMessages("en");
  return {
    ...actual,
    resolveLocale: () => "test",
    getMessages: () => ({ ...english, damage: { ...english.damage, matchup: "{move}: {attacker} → {defender}", noEffect: "{move}: {defender} immune" } }),
    getCatalogTranslations: () => ({
      species: { pikachu: "Translated Pikachu", charizard: "Translated Charizard" },
      moves: { thunderbolt: "Translated Thunderbolt", protect: "Translated Protect" },
      natures: { serious: "Translated Serious", timid: "Translated Timid" },
      types: { electric: "Translated Electric", fire: "Translated Fire" }
    })
  };
});

// Synthetic labels exercise a second locale without shipping a new language.
const catalog: CatalogResponse = {
  species: [
    { name: "Pikachu", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } },
    { name: "Charizard", types: ["Fire", "Flying"], baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 } }
  ],
  moves: ["Thunderbolt", "Protect"], abilities: [], items: [], types: ["Electric", "Fire", "Flying"], natures: ["Serious", "Timid"]
};

beforeEach(() => apiMock.mockReset());
afterEach(cleanup);

describe("localized website values", () => {
  it("submits canonical damage inputs and formats structured results through locale resources", async () => {
    const result: DamageResponse = {
      generation: 9, min: 0, max: 0, minPercent: 0, maxPercent: 0, koChanceOnHit: 0, defenderHp: 100,
      description: "Untranslated calculator sentence", matchup: { attacker: "Pikachu", defender: "Charizard", move: "Protect" }, hasEffect: false
    };
    apiMock.mockResolvedValue(result);
    render(<Damage catalog={catalog} />);
    expect((screen.getByLabelText("Attacker") as HTMLInputElement).value).toBe("Translated Pikachu");
    fireEvent.change(screen.getByLabelText("Move"), { target: { value: "Translated Protect" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));

    expect(await screen.findByText("Translated Protect: Translated Charizard immune")).toBeTruthy();
    expect(screen.queryByText(result.description)).toBeNull();
    const input = JSON.parse(apiMock.mock.calls[0]?.[1].body as string);
    expect(input.move).toBe("Protect");
    expect(input.attacker.species).toBe("Pikachu");
    expect(input.defender.species).toBe("Charizard");

    apiMock.mockResolvedValue({ ...result, hasEffect: true });
    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));
    expect(await screen.findByText("Translated Protect: Translated Pikachu → Translated Charizard")).toBeTruthy();
  });

  it("retains canonical draft selections, incomplete text, and all four move positions", () => {
    let draft: TeamDraft = teamInputSchema.parse({ name: "Draft", pokemon: [{ species: "Pikachu", moves: ["Thunderbolt", "Protect"] }] });
    function Editor() {
      const [team, setTeam] = useState(draft);
      return <TeamEditor title="Your team" team={team} onChange={(next) => { draft = next; setTeam(next); }} catalog={catalog} />;
    }
    render(<Editor />);
    expect((screen.getByPlaceholderText("Move 2") as HTMLInputElement).value).toBe("Translated Protect");
    expect((screen.getByRole("option", { name: "Translated Timid" }) as HTMLOptionElement).value).toBe("Timid");
    fireEvent.change(screen.getByLabelText("Nature"), { target: { value: "Timid" } });
    fireEvent.change(screen.getByLabelText("Tera type"), { target: { value: "Fire" } });
    fireEvent.change(screen.getByPlaceholderText("Move 1"), { target: { value: "" } });
    fireEvent.change(screen.getByPlaceholderText("Move 3"), { target: { value: "incomplete translated edit" } });

    expect(draft.pokemon[0]).toMatchObject({ species: "Pikachu", nature: "Timid", teraType: "Fire", moves: ["", "Protect", "incomplete translated edit", ""] });
    expect((screen.getByPlaceholderText("Move 2") as HTMLInputElement).value).toBe("Translated Protect");
  });

  it("finds localized Pokémon labels and requests descriptions using the canonical species", async () => {
    const evolution: EvolutionResponse = { source: "PokéAPI", nodes: [], edges: [], megaForms: [], unavailable: true };
    apiMock.mockImplementation((path: string | undefined) => path?.endsWith("/evolution") ? Promise.resolve(evolution) : Promise.resolve({ source: "PokéAPI", pokedexId: 6, familyKey: "charizard", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" }));
    render(<Pokedex catalog={catalog} />);
    fireEvent.change(screen.getByLabelText("Find a Pokémon"), { target: { value: "Translated Char" } });
    expect(screen.queryByRole("button", { name: /Translated Pikachu/ })).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Translated Charizard/ })));

    expect(apiMock.mock.calls[0]?.[0]).toBe("/pokedex/Charizard");
    expect(await screen.findByAltText("Translated Charizard")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Translated Charizard/ }).textContent).toContain("Translated Fire");
  });

  it("uses translated Pokémon suggestions to select canonical defensive types", async () => {
    apiMock.mockResolvedValue({
      source: "PokéAPI",
      pokedexId: 6,
      sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
    });
    const chart = [
      { attack: "Electric", against: { Fire: 1, Flying: 2 } },
      { attack: "Fire", against: { Fire: 0.5, Flying: 1 } },
      { attack: "Rock", against: { Fire: 2, Flying: 2 } },
      { attack: "Flying", against: { Fire: 1, Flying: 1 } }
    ];
    render(
      <TypeChart chart={chart} catalog={catalog} chartStatus="ready" catalogStatus="ready" />
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Or find a Pokémon" }), {
      target: { value: "Translated Charizard" }
    });

    expect(screen.getByRole("button", { name: "Translated Fire" }).getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Translated Fire" }).querySelector("img")?.getAttribute("src")
    ).toContain("/10.png");
    expect(screen.getByRole("button", { name: "Flying" }).getAttribute("aria-pressed")).toBe("true");
    expect(await screen.findByAltText("Translated Charizard")).toBeTruthy();
    expect(apiMock.mock.calls[0]?.[0]).toBe("/pokedex/Charizard");
  });
});
