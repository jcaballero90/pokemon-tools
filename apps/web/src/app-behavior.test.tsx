import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { teamInputSchema, type CatalogResponse, type DamageResponse, type EvolutionResponse, type PokedexResponse, type SavedTeamResponse, type TeamDraft } from "@pokemon-tools/contracts";
import { App } from "./main.js";
import { LocaleProvider } from "./i18n/LocaleProvider.js";
import { setLocale } from "./i18n.js";
import { Account } from "./features/account/Account.js";
import { Damage } from "./features/damage/Damage.js";
import { Pokedex } from "./features/pokedex/Pokedex.js";
import { TeamEditor } from "./features/teams/TeamEditor.js";

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock("./lib/api.js", () => ({ api: apiMock }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const catalog: CatalogResponse = {
  species: [
    { name: "Pikachu", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } },
    { name: "Charizard", types: ["Fire", "Flying"], baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 } }
  ],
  moves: ["Thunderbolt", "Protect"], abilities: [], items: [], types: ["Electric", "Fire", "Flying"], natures: ["Serious"],
  translations: {
    species: { pikachu: "Pikachu", charizard: "Charizard" },
    moves: { thunderbolt: "Rayo", protect: "Protección" }, abilities: {}, items: {},
    types: { electric: "Eléctrico", fire: "Fuego", flying: "Volador" }, natures: { serious: "Seria" }
  }
};

const savedTeam: SavedTeamResponse = {
  ...teamInputSchema.parse({ name: "Saved team", pokemon: [{ species: "Pikachu" }] }),
  id: "team-1", ownerId: "owner-1", createdAt: "2026-10-03T10:00:00.000Z", updatedAt: "2026-10-03T10:00:00.000Z"
};

const defaults = () => teamInputSchema.parse({ name: "Draft", pokemon: [] });

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  localStorage.clear();
  setLocale("en");
  apiMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("website interaction regressions", () => {
  it("opens direct Pokémon URLs and updates localized canonical metadata", async () => {
    window.history.replaceState(null, "", "/pokedex/pikachu");
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({});
      if (path === "/site-config") return Promise.resolve({ publicBaseUrl: "https://pokemon.example", deployEnv: "production" });
      if (path.endsWith("/evolution")) return Promise.resolve({ source: "PokéAPI", nodes: [], edges: [], megaForms: [], unavailable: true });
      if (path.endsWith("/moves")) return Promise.resolve({ source: null, moves: [], unavailable: true });
      if (path === "/pokedex/Pikachu") return Promise.resolve({ source: "PokéAPI", pokedexId: 25, familyKey: "pikachu" });
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);

    expect(await screen.findByText("National Pokédex #25")).toBeTruthy();
    expect(document.title).toBe("Pikachu · Pokédex | Pokémon Tools");
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe("https://pokemon.example/pokedex/pikachu");
    expect(document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe("index,follow");

    fireEvent.click(screen.getByRole("switch", { name: "Change language to Spain Spanish" }));
    expect(document.title).toBe("Pikachu · Pokédex | Pokémon Tools");
    expect(document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content).toContain("Consulta los datos de Pikachu");
  });

  it("renders localized not-found content for an unknown Pokémon slug", async () => {
    window.history.replaceState(null, "", "/pokedex/not-a-pokemon");
    setLocale("es-ES");
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({});
      if (path === "/site-config") return Promise.resolve({ publicBaseUrl: "https://pokemon.example", deployEnv: "production" });
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);

    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeTruthy();
    expect(document.title).toBe("Página no encontrada · Pokémon Tools");
    expect(screen.getByRole("link", { name: "Volver a la Pokédex" })).toBeTruthy();
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("switches languages in place and keeps the edited team draft", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({});
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    fireEvent.click(screen.getByRole("link", { name: "Team builder" }));
    const name = screen.getAllByLabelText("Team name")[0] as HTMLInputElement;
    fireEvent.change(name, { target: { value: "My saved draft" } });

    fireEvent.click(screen.getByRole("switch", { name: "Change language to Spain Spanish" }));

    expect(screen.getByRole("link", { name: "Creador de equipos" })).toBeTruthy();
    expect((screen.getAllByLabelText("Nombre del equipo")[0] as HTMLInputElement).value).toBe("My saved draft");
    expect(document.documentElement.lang).toBe("es-ES");
    expect(screen.getByRole("switch", { name: "Cambiar idioma a inglés" }).getAttribute("aria-checked")).toBe("true");
  });

  it("reformats a visible data notice immediately when the locale changes", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.reject(new Error("upstream detail must stay hidden"));
      if (path === "/type-chart") return Promise.resolve([{ attack: "Electric", against: { Electric: 1 } }]);
      if (path === "/auth/get-session") return Promise.resolve({});
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    expect(await screen.findByText("Pokémon data is temporarily unavailable.")).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: "Change language to Spain Spanish" }));
    expect(screen.getByText("Los datos de Pokémon no están disponibles temporalmente.")).toBeTruthy();
  });

  it("keeps the selected Pokédex entry and search text when changing locale", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({});
      if (path.endsWith("/evolution")) return Promise.resolve({ source: "PokéAPI", nodes: [], edges: [], megaForms: [], unavailable: true });
      if (path === "/pokedex/Pikachu") return Promise.resolve({ source: "PokéAPI", pokedexId: 25, familyKey: "pikachu" });
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    fireEvent.click(screen.getByRole("link", { name: "Pokédex" }));
    fireEvent.click(await screen.findByRole("link", { name: /Pikachu/ }));
    fireEvent.change(screen.getByLabelText("Find a Pokémon"), { target: { value: "Pika" } });
    expect((await screen.findAllByText("Electric")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("switch", { name: "Change language to Spain Spanish" }));

    expect((screen.getByLabelText("Buscar un Pokémon") as HTMLInputElement).value).toBe("Pika");
    expect(screen.getAllByText("Eléctrico").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Pikachu" })).toBeTruthy();
  });

  it("renders structured evolution requirements with Spain Spanish wording", async () => {
    const familyCatalog: CatalogResponse = {
      ...catalog,
      species: [
        { name: "Rookidee", types: ["Flying"], baseStats: { hp: 38, atk: 47, def: 35, spa: 33, spd: 35, spe: 57 } },
        { name: "Corvisquire", types: ["Flying"], baseStats: { hp: 68, atk: 67, def: 55, spa: 77, spd: 55, spe: 77 } },
        { name: "Corviknight", types: ["Flying", "Steel"], baseStats: { hp: 98, atk: 87, def: 105, spa: 53, spd: 85, spe: 67 } }
      ],
      translations: { species: {}, moves: {}, abilities: {}, items: {}, types: { flying: "Volador", steel: "Acero" }, natures: {} }
    };
    const family: EvolutionResponse = {
      source: "PokéAPI",
      nodes: [
        { key: "rookidee", name: "Rookidee", pokedexId: 821, iconCandidates: [] },
        { key: "corvisquire", name: "Corvisquire", pokedexId: 822, iconCandidates: [] },
        { key: "corviknight", name: "Corviknight", pokedexId: 823, iconCandidates: [] }
      ],
      edges: [
        { from: "rookidee", to: "corvisquire", alternatives: [["Level 18"]], conditionAlternatives: [[{ field: "trigger", value: "level-up" }, { field: "min_level", value: 18 }]] },
        { from: "corvisquire", to: "corviknight", alternatives: [["Level 38"]], conditionAlternatives: [[{ field: "trigger", value: "level-up" }, { field: "min_level", value: 38 }]] }
      ],
      megaForms: []
    };
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(familyCatalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({});
      if (path.endsWith("/evolution")) return Promise.resolve(family);
      if (path.startsWith("/pokedex/")) return Promise.resolve({ source: "PokéAPI", pokedexId: 822, familyKey: "corvisquire" });
      return Promise.resolve(undefined);
    });

    setLocale("es-ES");
    render(<LocaleProvider><App /></LocaleProvider>);
    fireEvent.click(screen.getByRole("link", { name: "Pokédex" }));
    fireEvent.change(screen.getByLabelText("Buscar un Pokémon"), { target: { value: "Corvisquire" } });
    fireEvent.click(await screen.findByRole("link", { name: /Corvisquire/ }));

    expect(await screen.findByText("Nivel 18")).toBeTruthy();
    expect(screen.getByText("Nivel 38")).toBeTruthy();
  });

  it("lists a Pokémon's abilities and reveals their description by focus or tap", async () => {
    const family: EvolutionResponse = { source: "PokéAPI", nodes: [], edges: [], megaForms: [], unavailable: true };
    apiMock.mockImplementation((path: string) => path.endsWith("/evolution")
      ? Promise.resolve(family)
      : Promise.resolve({ source: "PokéAPI", pokedexId: 25, familyKey: "pikachu", abilities: [
        { name: "Static", isHidden: false, description: "May paralyze a Pokémon that makes contact." },
        { name: "Lightning Rod", isHidden: true, description: "Draws in Electric-type moves." }
      ] }));

    render(<MemoryRouter><Pokedex catalog={catalog} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("link", { name: /Pikachu/ }));

    const staticAbility = await screen.findByRole("button", { name: "Static" });
    expect(screen.getByRole("heading", { name: "Abilities" })).toBeTruthy();
    const tooltipId = staticAbility.getAttribute("aria-describedby");
    expect(tooltipId).toBeTruthy();
    expect(document.getElementById(tooltipId ?? "")?.textContent).toBe("May paralyze a Pokémon that makes contact.");
    fireEvent.click(staticAbility);
    expect(staticAbility.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Hidden ability")).toBeTruthy();
  });

  it("removes a previously rendered private library as soon as the user signs out", async () => {
    let signedOut = false;
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve(signedOut ? {} : { user: { id: "owner-1", name: "Trainer", email: "trainer@example.test" } });
      if (path === "/me/teams") return Promise.resolve([savedTeam]);
      if (path === "/auth/sign-out") { signedOut = true; return Promise.resolve(undefined); }
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    await screen.findByText("Trainer");
    fireEvent.click(screen.getByRole("link", { name: "Team builder" }));
    expect(await screen.findByRole("button", { name: "Saved team" })).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "Account" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    await screen.findByText("Guest mode");
    fireEvent.click(screen.getByRole("link", { name: "Team builder" }));

    expect(screen.queryByRole("button", { name: "Saved team" })).toBeNull();
  });

  it("keeps a saved library hidden after logout and ignores a delayed old-session list", async () => {
    const oldList = deferred<SavedTeamResponse[]>();
    let sessions = 0;
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve(++sessions === 1 ? { user: { id: "owner-1", name: "Trainer", email: "trainer@example.test" } } : {});
      if (path === "/me/teams") return oldList.promise;
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    await screen.findByText("Trainer");
    fireEvent.click(screen.getByRole("link", { name: "Account" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    await screen.findByText("Guest mode");
    await act(async () => oldList.resolve([savedTeam]));

    fireEvent.click(screen.getByRole("link", { name: "Team builder" }));
    expect(screen.queryByRole("button", { name: "Saved team" })).toBeNull();
  });

  it("shows only the newest selected Pokémon when older descriptive responses finish late", async () => {
    const first = deferred<PokedexResponse>();
    const second = deferred<PokedexResponse>();
    const family: EvolutionResponse = { source: "PokéAPI", nodes: [], edges: [], megaForms: [], unavailable: true };
    apiMock.mockImplementation((path: string) => path.endsWith("/evolution") ? Promise.resolve(family) : path.endsWith("Pikachu") ? first.promise : second.promise);

    render(<MemoryRouter><Pokedex catalog={catalog} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("link", { name: /Pikachu/ }));
    fireEvent.click(screen.getByRole("link", { name: /Charizard/ }));
    await act(async () => second.resolve({ source: "PokéAPI", pokedexId: 6, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" }));
    expect(await screen.findByAltText("Charizard")).toBeTruthy();
    await act(async () => first.resolve({ source: "PokéAPI", pokedexId: 25, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" }));
    expect(screen.queryByAltText("Pikachu")).toBeNull();
    expect(screen.getByText("National Pokédex #6")).toBeTruthy();
  });

  it("shows Corvisquire's level requirements and opens clickable relatives without changing search text", async () => {
    const familyCatalog: CatalogResponse = {
      ...catalog,
      species: [
        { name: "Rookidee", types: ["Flying"], baseStats: { hp: 38, atk: 47, def: 35, spa: 33, spd: 35, spe: 57 } },
        { name: "Corvisquire", types: ["Flying"], baseStats: { hp: 68, atk: 67, def: 55, spa: 77, spd: 55, spe: 77 } },
        { name: "Corviknight", types: ["Flying", "Steel"], baseStats: { hp: 98, atk: 87, def: 105, spa: 53, spd: 85, spe: 67 } }
      ]
    };
    const relatives: EvolutionResponse = {
      source: "PokéAPI",
      nodes: [
        { key: "rookidee", name: "Rookidee", pokedexId: 821, iconCandidates: [] },
        { key: "corvisquire", name: "Corvisquire", pokedexId: 822, iconCandidates: [] },
        { key: "corviknight", name: "Corviknight", pokedexId: 823, iconCandidates: [] }
      ],
      edges: [
        { from: "rookidee", to: "corvisquire", alternatives: [["Level 18"]], conditionAlternatives: [[{ field: "trigger", value: "level-up" }, { field: "min_level", value: 18 }]] },
        { from: "corvisquire", to: "corviknight", alternatives: [["Level 38"]], conditionAlternatives: [[{ field: "trigger", value: "level-up" }, { field: "min_level", value: 38 }]] }
      ], megaForms: []
    };
    apiMock.mockImplementation((path: string) => {
      if (path.endsWith("/evolution")) return Promise.resolve(relatives);
      if (path === "/pokedex/Corvisquire") return Promise.resolve({ source: "PokéAPI", pokedexId: 822, familyKey: "corvisquire", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/822.webp", artwork: {
        normal: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/822.webp", "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/legends-za/822.webp"],
        shiny: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/shiny/822.webp"],
        genderVariants: {
          male: {
            normal: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/822.webp", "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/legends-za/822.webp"],
            shiny: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/shiny/822.webp"]
          },
          female: {
            normal: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/female/822.webp"],
            shiny: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/shiny/female/822.webp"]
          }
        }
      } });
      return Promise.resolve({ source: "PokéAPI", pokedexId: 823, familyKey: "corviknight", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/823.webp", artwork: { normal: [], shiny: [] } });
    });

    render(<MemoryRouter><Pokedex catalog={familyCatalog} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Find a Pokémon"), { target: { value: "Corvisquire" } });
    fireEvent.click(screen.getByRole("link", { name: /Corvisquire/ }));

    expect(await screen.findByAltText("Corvisquire")).toBeTruthy();
    const artwork = screen.getByAltText("Corvisquire") as HTMLImageElement;
    expect(artwork.src).toContain("scarlet-violet/822.webp");
    fireEvent.error(artwork);
    expect((screen.getByAltText("Corvisquire") as HTMLImageElement).src).toContain("legends-za/822.webp");
    expect(screen.getByText("Level 18")).toBeTruthy();
    expect(screen.getByText("Level 38")).toBeTruthy();
    const totalMeter = screen.getByRole("meter", { name: "Total" });
    expect(totalMeter.getAttribute("aria-valuenow")).toBe("399");
    expect(totalMeter.getAttribute("aria-valuemax")).toBe("495");
    expect(totalMeter.querySelector(".stat-fill")?.className).toContain("stat-fill--modest");
    const femaleToggle = screen.getByRole("button", { name: "Female artwork" });
    fireEvent.click(femaleToggle);
    expect(femaleToggle.getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByAltText("Corvisquire") as HTMLImageElement).src).toContain("female/822.webp");
    fireEvent.click(screen.getByRole("button", { name: "Male artwork" }));
    expect(screen.getByRole("button", { name: "Male artwork" }).getAttribute("aria-pressed")).toBe("true");
    const shinyToggle = screen.getByRole("button", { name: "Shiny artwork" });
    fireEvent.click(shinyToggle);
    expect(shinyToggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(femaleToggle);
    expect((screen.getByAltText("Corvisquire") as HTMLImageElement).src).toContain("shiny/female/822.webp");

    fireEvent.click(screen.getByRole("link", { name: "View Corviknight details" }));
    expect(await screen.findByAltText("Corviknight")).toBeTruthy();
    expect((screen.getByLabelText("Find a Pokémon") as HTMLInputElement).value).toBe("Corvisquire");
    expect(screen.getByRole("button", { name: "Shiny artwork" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("preserves empty move positions rather than shifting the next move", () => {
    const source = teamInputSchema.parse({ name: "Draft", pokemon: [{ species: "Pikachu", moves: ["Thunderbolt", "Protect"] }] }) as TeamDraft;
    let updated = source;
    render(<TeamEditor title="Your team" team={source} onChange={(next) => { updated = next; }} catalog={catalog} />);

    fireEvent.change(screen.getByPlaceholderText("Move 3"), { target: { value: "U-turn" } });

    expect((screen.getByPlaceholderText("Move 2") as HTMLInputElement).value).toBe("Protect");
    expect(updated.pokemon[0]?.moves).toEqual(["Thunderbolt", "Protect", "U-turn", ""]);
  });

  it("keeps team edits controlled while adding and removing an individual set", () => {
    const initialTeam = teamInputSchema.parse({
      name: "Draft",
      pokemon: [{ species: "Pikachu" }]
    }) as TeamDraft;

    function TeamEditorHarness() {
      const [team, setTeam] = useState(initialTeam);
      return <TeamEditor title="Your team" team={team} onChange={setTeam} catalog={catalog} />;
    }

    const { container } = render(<TeamEditorHarness />);
    fireEvent.change(screen.getByLabelText("Team name"), { target: { value: "Electric team" } });
    fireEvent.change(screen.getByLabelText("Nickname"), { target: { value: "Sparky" } });
    fireEvent.change(screen.getAllByLabelText("HP")[0]!, { target: { value: "45" } });

    expect((screen.getByLabelText("Team name") as HTMLInputElement).value).toBe("Electric team");
    expect((screen.getByLabelText("Nickname") as HTMLInputElement).value).toBe("Sparky");
    expect((screen.getAllByLabelText("HP")[0] as HTMLInputElement).value).toBe("45");

    fireEvent.click(screen.getByRole("button", { name: /Add Pokémon/ }));
    expect(container.querySelector(".section-heading > span")?.textContent).toBe("2/6");
    expect(screen.getByText("02")).toBeTruthy();

    const addedSet = container.querySelectorAll(".set-card")[1];
    expect(addedSet).toBeTruthy();
    fireEvent.click(within(addedSet as HTMLElement).getByRole("button", { name: "Remove Pokémon" }));
    expect(container.querySelector(".section-heading > span")?.textContent).toBe("1/6");
    expect(screen.getByLabelText("Nickname")).toBeTruthy();
  });

  it("submits the selected account mode and refreshes the session before showing success", async () => {
    const events: string[] = [];
    apiMock.mockImplementation((path: string) => {
      events.push(`request:${path}`);
      return Promise.resolve(undefined);
    });
    const onDone = vi.fn(async () => {
      events.push("refresh");
      return { id: "owner-1", name: "Trainer", email: "trainer@example.test" };
    });
    const onNotice = vi.fn(() => events.push("notice"));

    const { container } = render(
      <Account user={null} onDone={onDone} onSigningOut={() => undefined} onNotice={onNotice} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Trainer" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "trainer@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct horse battery" } });
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    await act(async () => fireEvent.submit(form!));

    expect(apiMock.mock.calls[0]?.[0]).toBe("/auth/sign-up/email");
    expect(JSON.parse(apiMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      name: "Trainer",
      email: "trainer@example.test",
      password: "correct horse battery"
    });
    expect(onDone).toHaveBeenCalledOnce();
    expect(onNotice).toHaveBeenCalledOnce();
    expect(events).toEqual(["request:/auth/sign-up/email", "refresh", "notice"]);
  });

  it("submits only email and password when signing in", async () => {
    apiMock.mockResolvedValue(undefined);
    const onDone = vi.fn(async () => ({
      id: "owner-1",
      name: "Trainer",
      email: "trainer@example.test"
    }));

    const { container } = render(
      <Account
        user={null}
        onDone={onDone}
        onSigningOut={() => undefined}
        onNotice={() => undefined}
      />
    );
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "trainer@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct horse battery" } });
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    await act(async () => fireEvent.submit(form!));

    expect(apiMock.mock.calls[0]?.[0]).toBe("/auth/sign-in/email");
    expect(JSON.parse(apiMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      email: "trainer@example.test",
      password: "correct horse battery"
    });
  });

  it("hides a calculator response when its inputs change before the response arrives", async () => {
    const response = deferred<DamageResponse>();
    apiMock.mockReturnValue(response.promise);
    render(<Damage catalog={null} />);

    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));
    fireEvent.change(screen.getByLabelText("Move"), { target: { value: "Protect" } });
    await act(async () => response.resolve({ generation: 9, min: 90, max: 110, minPercent: 90, maxPercent: 110, koChanceOnHit: 1, defenderHp: 100, description: "old matchup" }));

    expect(screen.queryByText("90–110%")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Inputs changed");
  });

  it("resets damage inputs on return and cannot show a delayed result from the previous visit", async () => {
    const firstVisit = deferred<DamageResponse>();
    let damageRequests = 0;
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({});
      if (path === "/damage") {
        damageRequests++;
        return damageRequests === 1 ? firstVisit.promise : Promise.resolve({
          generation: 9, min: 18, max: 20, minPercent: 18, maxPercent: 20, koChanceOnHit: 0, defenderHp: 100,
          description: "current visit", matchup: { attacker: "Pikachu", defender: "Charizard", move: "Thunderbolt" }, hasEffect: true
        });
      }
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    fireEvent.click(screen.getByRole("link", { name: /^Damage$/ }));
    fireEvent.change(screen.getByLabelText("Move"), { target: { value: "Protect" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));
    fireEvent.click(screen.getByRole("link", { name: /^Overview$/ }));
    fireEvent.click(screen.getByRole("link", { name: /^Damage$/ }));
    expect((screen.getByLabelText("Move") as HTMLInputElement).value).toBe("Thunderbolt");

    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));
    expect(damageRequests).toBe(2);
    expect(await screen.findByText("18–20%")).toBeTruthy();
    expect(JSON.parse(apiMock.mock.calls.filter(([path]) => path === "/damage")[1]?.[1].body as string).move).toBe("Thunderbolt");
    await act(async () => firstVisit.resolve({
      generation: 9, min: 90, max: 110, minPercent: 90, maxPercent: 110, koChanceOnHit: 1, defenderHp: 100,
      description: "previous visit", matchup: { attacker: "Pikachu", defender: "Charizard", move: "Protect" }, hasEffect: true
    }));

    expect(screen.getByText("18–20%")).toBeTruthy();
    expect(screen.queryByText("90–110%")).toBeNull();
  });

  it("normalizes blank draft move slots only when preparing a submitted team", () => {
    const draft = { ...defaults(), pokemon: [{ ...teamInputSchema.parse({ name: "X", pokemon: [{ species: "Pikachu" }] }).pokemon[0], moves: ["", "Protect", "", ""] }] } as TeamDraft;
    expect(draft.pokemon[0]?.moves.filter(Boolean)).toEqual(["Protect"]);
  });
});
