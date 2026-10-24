import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pokemonSetSchema, teamInputSchema, type CatalogResponse, type DamageResponse, type EvolutionResponse, type PokedexResponse, type SavedTeamResponse, type TeamDraft } from "@pokemon-tools/contracts";
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
  moves: ["Thunderbolt", "Protect", "Flamethrower"], abilities: [], items: [], types: ["Electric", "Fire", "Flying"], natures: ["Serious"],
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

  it("shows the private library in its own tab and disables it while signed out", async () => {
    let signedOut = false;
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve(signedOut ? {} : { user: { id: "owner-1", name: "Trainer", email: "trainer@example.test", username: "trainer_1" } });
      if (path === "/me/teams") return Promise.resolve([savedTeam]);
      if (path === "/auth/sign-out") { signedOut = true; return Promise.resolve(undefined); }
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    await screen.findByText("trainer_1");
    fireEvent.click(screen.getByRole("link", { name: "Account" }));
    expect(await screen.findByText("Manage your username and account.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();

    fireEvent.click(screen.getByRole("link", { name: "Private library" }));
    const table = await screen.findByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Team name" })).toBeTruthy();
    expect(within(table).getByRole("columnheader", { name: "Pokémon" })).toBeTruthy();
    expect(within(table).getByRole("columnheader", { name: "Delete" })).toBeTruthy();
    expect(within(table).getByRole("row", { name: /Saved team Pikachu/ })).toBeTruthy();
    fireEvent.click(within(table).getByRole("button", { name: "Delete Saved team" }));
    await waitFor(() => {
      expect(apiMock.mock.calls.some(([path, options]) => path === "/me/teams/team-1" && options?.method === "DELETE")).toBe(true);
      expect(screen.getByText("You haven't saved any teams yet.")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("link", { name: "Team builder" }));
    expect(screen.getAllByLabelText("Load saved team")).toHaveLength(2);
    expect(screen.queryByRole("option", { name: /Saved team — Pikachu/ })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Account" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    await screen.findByText("Guest mode");
    const disabledLibrary = screen.getByRole("button", { name: "Private library" });
    expect(disabledLibrary.getAttribute("aria-disabled")).toBe("true");
    const tooltipId = disabledLibrary.getAttribute("aria-describedby");
    expect(tooltipId).toBe("private-library-tooltip");
    expect(document.getElementById(tooltipId ?? "")?.getAttribute("role")).toBe("tooltip");
    expect(document.getElementById(tooltipId ?? "")?.textContent).toBe("Create an account to use the private library.");
    fireEvent.click(disabledLibrary);
    expect(window.location.pathname).toBe("/account");
    expect(screen.queryByRole("table")).toBeNull();

    fireEvent.click(screen.getByRole("link", { name: "Overview" }));
    fireEvent.click(screen.getByRole("link", { name: /Save your teams/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Private library" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { name: "Private library" })).toHaveLength(1);
    const privateLibraryPanel = screen.getByRole("region", { name: "Private library" });
    expect(within(privateLibraryPanel).getByText("Create an account to use the private library.")).toBeTruthy();
    expect(within(privateLibraryPanel).getByRole("link", { name: "Go to Account" })).toBeTruthy();
  });

  it("shows trainer details with localized account creation dates", async () => {
    const user = {
      id: "owner-1",
      name: "Trainer",
      email: "trainer@example.test",
      username: "trainer_1",
      createdAt: "2026-10-03T10:00:00.000Z"
    };
    const onDone = vi.fn(async () => user);
    const account = () => (
      <LocaleProvider>
        <Account user={user} savedTeams={[savedTeam, { ...savedTeam, id: "team-2" }]} libraryStatus="ready" onDone={onDone} onSigningOut={() => undefined} onNotice={() => undefined} />
      </LocaleProvider>
    );
    const { container, rerender } = render(account());

    const card = screen.getByRole("region", { name: "Trainer card" });
    const details = card.querySelector(".trainer-card-details");
    const memberDate = container.querySelector<HTMLTimeElement>(".trainer-card-details time");
    expect(within(card).getByText("trainer_1")).toBeTruthy();
    expect(within(card).getByText("2", { exact: true })).toBeTruthy();
    expect(memberDate?.dateTime).toBe("2026-10-03T10:00:00.000Z");
    expect(memberDate?.textContent).toBe(new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(user.createdAt)));
    expect(details?.querySelectorAll(":scope > div")).toHaveLength(3);
    expect(card.textContent).not.toContain(user.email);

    const englishDate = memberDate?.textContent;
    await act(async () => { setLocale("es-ES"); });
    rerender(account());
    const spanishDate = container.querySelector<HTMLTimeElement>(".trainer-card-details time");
    expect(spanishDate?.textContent).not.toBe(englishDate);
    expect(spanishDate?.textContent).toBe(new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(user.createdAt)));
  });

  it("omits an invalid creation date and shows a real zero team count for an empty library", () => {
    const user = { id: "owner-1", name: "Trainer", email: "trainer@example.test", createdAt: "not-a-date" };
    const renderAccount = (accountUser: typeof user | { id: string; name: string; email: string }) => (
      <LocaleProvider>
        <Account user={accountUser} savedTeams={[]} libraryStatus="ready" onDone={async () => user} onSigningOut={() => undefined} onNotice={() => undefined} />
      </LocaleProvider>
    );
    const { rerender } = render(renderAccount(user));

    const card = screen.getByRole("region", { name: "Trainer card" });
    const details = card.querySelector("dl");
    expect(within(card).getByText("Not set yet")).toBeTruthy();
    expect(within(card).getByText("0", { exact: true })).toBeTruthy();
    expect(within(card).queryByText("Member since")).toBeNull();
    expect(details?.querySelectorAll(":scope > div")).toHaveLength(2);
    const usernameForm = card.querySelector(".trainer-card-username-form");
    expect(usernameForm?.querySelector(".trainer-card-help")?.textContent).toContain("3–30");
    expect(usernameForm?.querySelector("button")?.textContent).toBe("Set username");
    expect(card.querySelector(".trainer-card-footer button")?.textContent).toBe("Sign out");

    rerender(renderAccount({ id: user.id, name: user.name, email: user.email }));
    expect(screen.getByRole("region", { name: "Trainer card" }).querySelector("time")).toBeNull();
  });

  it("shows a loading state and omits the team count when the library cannot be loaded", () => {
    const user = { id: "owner-1", name: "Trainer", email: "trainer@example.test", username: "trainer_1" };
    const { rerender } = render(
      <LocaleProvider>
        <Account user={user} savedTeams={[]} libraryStatus="loading" onDone={async () => user} onSigningOut={() => undefined} onNotice={() => undefined} />
      </LocaleProvider>
    );

    const card = screen.getByRole("region", { name: "Trainer card" });
    expect(within(card).getByRole("status").textContent).toBe("Loading…");
    expect(within(card).getByText("Saved teams")).toBeTruthy();
    rerender(
      <LocaleProvider>
        <Account user={user} savedTeams={[]} libraryStatus="error" onDone={async () => user} onSigningOut={() => undefined} onNotice={() => undefined} />
      </LocaleProvider>
    );

    expect(screen.getByRole("region", { name: "Trainer card" }).querySelector("dt")?.textContent).toBe("Username");
    expect(screen.getByRole("region", { name: "Trainer card" }).textContent).not.toContain("Saved teams");
  });

  it("keeps a saved library hidden after logout and ignores a delayed old-session list", async () => {
    const oldList = deferred<SavedTeamResponse[]>();
    let sessions = 0;
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve(++sessions === 1 ? { user: { id: "owner-1", name: "Trainer", email: "trainer@example.test", username: "trainer_1" } } : {});
      if (path === "/me/teams") return oldList.promise;
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    await screen.findByText("trainer_1");
    fireEvent.click(screen.getByRole("link", { name: "Account" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    await screen.findByText("Guest mode");
    await act(async () => oldList.resolve([savedTeam]));

    fireEvent.click(screen.getByRole("link", { name: "Team builder" }));
    expect(screen.queryByRole("option", { name: /Saved team/ })).toBeNull();
  });

  it("loads saved sets independently into either editor, updates a saved snapshot, and can load it again", async () => {
    apiMock.mockImplementation((path: string, options?: RequestInit) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({ user: { id: "owner-1", name: "Trainer", email: "trainer@example.test", username: "trainer_1" } });
      if (path === "/me/teams" && !options?.method) return Promise.resolve([savedTeam]);
      if (path === "/me/teams/team-1" && options?.method === "PUT") {
        return Promise.resolve({ ...savedTeam, ...JSON.parse(options.body as string), updatedAt: "2026-10-04T10:00:00.000Z" });
      }
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    await screen.findByText("trainer_1");
    fireEvent.click(screen.getByRole("link", { name: "Team builder" }));
    await waitFor(() => expect((screen.getAllByLabelText("Load saved team")[0] as HTMLSelectElement).disabled).toBe(false));
    const loaders = screen.getAllByLabelText("Load saved team") as HTMLSelectElement[];
    fireEvent.change(loaders[0]!, { target: { value: "team-1" } });
    fireEvent.change(loaders[1]!, { target: { value: "team-1" } });
    expect((screen.getAllByLabelText("Team name")[0] as HTMLInputElement).value).toBe("Saved team");
    expect((screen.getAllByLabelText("Team name")[1] as HTMLInputElement).value).toBe("Saved team");

    fireEvent.change(screen.getAllByLabelText("Team name")[0]!, { target: { value: "Edited A" } });
    expect((screen.getAllByLabelText("Team name")[1] as HTMLInputElement).value).toBe("Saved team");
    fireEvent.click(screen.getAllByRole("button", { name: "Save changes" })[0]!);
    await screen.findByText("Saved team updated.");
    const updateCall = apiMock.mock.calls.find(([path, options]) => path === "/me/teams/team-1" && options?.method === "PUT");
    expect(JSON.parse(updateCall?.[1]?.body as string).name).toBe("Edited A");
    expect((screen.getAllByLabelText("Team name")[1] as HTMLInputElement).value).toBe("Saved team");

    fireEvent.change(screen.getAllByLabelText("Load saved team")[0]!, { target: { value: "team-1" } });
    expect((screen.getAllByLabelText("Team name")[0] as HTMLInputElement).value).toBe("Edited A");
  });

  it("keeps the signed-in user when private library loading fails and retries successfully", async () => {
    let listRequests = 0;
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({ user: { id: "owner-1", name: "Trainer", email: "trainer@example.test", username: "trainer_1" } });
      if (path === "/me/teams" && ++listRequests === 1) return Promise.reject(new Error("offline"));
      if (path === "/me/teams") return Promise.resolve([savedTeam]);
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    await screen.findByText("trainer_1");
    fireEvent.click(screen.getByRole("link", { name: "Private library" }));
    expect(await screen.findByText("Your saved teams could not be loaded. Your account is still signed in.")).toBeTruthy();
    expect(screen.getByText("trainer_1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("table")).toBeTruthy();
    expect(screen.getByText("trainer_1")).toBeTruthy();
  });

  it("blocks saving a team with a catalog name that does not exist", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve({ user: { id: "owner-1", name: "Trainer", email: "trainer@example.test", username: "trainer_1" } });
      if (path === "/me/teams") return Promise.resolve([]);
      return Promise.resolve(undefined);
    });

    render(<LocaleProvider><App /></LocaleProvider>);
    await screen.findByText("trainer_1");
    fireEvent.click(screen.getByRole("link", { name: "Team builder" }));
    await waitFor(() => expect((screen.getAllByRole("button", { name: "Save your team" })[0] as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getAllByRole("button", { name: "+ Add Pokémon" })[0]!);
    fireEvent.change(screen.getByLabelText("Species"), { target: { value: "Missingmon" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Save your team" })[0]!);

    expect(screen.getAllByRole("alert").some((alert) => alert.textContent?.includes("Missingmon"))).toBe(true);
    expect(apiMock.mock.calls.some(([path, options]) => path === "/me/teams" && options?.method === "POST")).toBe(false);
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
    render(<MemoryRouter><TeamEditor title="Your team" team={source} onChange={(next) => { updated = next; }} catalog={catalog} /></MemoryRouter>);

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
      return <MemoryRouter><TeamEditor title="Your team" team={team} onChange={setTeam} catalog={catalog} /></MemoryRouter>;
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

  it("clamps a Team Builder EV edit to the 510 point budget without changing other stats", () => {
    const initialTeam = teamInputSchema.parse({ name: "Draft", pokemon: [{ species: "Pikachu", evs: { atk: 252, spe: 252 } }] }) as TeamDraft;
    let updated = initialTeam;

    function TeamEditorHarness() {
      const [team, setTeam] = useState(initialTeam);
      return <MemoryRouter><TeamEditor title="Your team" team={team} onChange={(next) => { updated = next; setTeam(next); }} catalog={catalog} /></MemoryRouter>;
    }

    render(<TeamEditorHarness />);
    const hpEvs = screen.getByRole("spinbutton", { name: "HP EVs" }) as HTMLInputElement;
    expect(hpEvs.getAttribute("max")).toBe("6");
    fireEvent.focus(hpEvs);
    fireEvent.change(hpEvs, { target: { value: "500" } });

    expect(hpEvs.value).toBe("6");
    expect(updated.pokemon[0]?.evs).toMatchObject({ hp: 6, atk: 252, spe: 252 });
    expect(screen.getByText("EV total: 510/510")).toBeTruthy();
    expect(screen.getByText("Capped at 6; the other stats use 504/510 EVs.")).toBeTruthy();
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
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "Trainer_1" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "trainer@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct horse battery" } });
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    await act(async () => fireEvent.submit(form!));

    expect(apiMock.mock.calls[0]?.[0]).toBe("/auth/sign-up/email");
    expect(JSON.parse(apiMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      name: "Trainer",
      username: "trainer_1",
      email: "trainer@example.test",
      password: "correct horse battery"
    });
    expect(onDone).toHaveBeenCalledOnce();
    expect(onNotice).toHaveBeenCalledOnce();
    expect(events).toEqual(["request:/auth/sign-up/email", "refresh", "notice"]);
  });

  it("uses the email endpoint when the username-or-email field contains an email address", async () => {
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
    fireEvent.change(screen.getByLabelText("Username or email"), { target: { value: "trainer@example.test" } });
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

  it("uses the normalized username endpoint when signing in with a username", async () => {
    apiMock.mockResolvedValue(undefined);
    const onDone = vi.fn(async () => ({ id: "owner-1", name: "Trainer", email: "trainer@example.test", username: "trainer_1" }));
    render(<Account user={null} onDone={onDone} onSigningOut={() => undefined} onNotice={() => undefined} />);
    fireEvent.change(screen.getByLabelText("Username or email"), { target: { value: "Trainer_1" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct horse battery" } });
    const form = screen.getByLabelText("Username or email").closest("form");
    expect(form).not.toBeNull();
    await act(async () => fireEvent.submit(form!));

    expect(apiMock.mock.calls[0]?.[0]).toBe("/auth/sign-in/username");
    expect(JSON.parse(apiMock.mock.calls[0]?.[1]?.body as string)).toEqual({ username: "trainer_1", password: "correct horse battery" });
  });

  it("lets an existing account claim a normalized username without changing its display name", async () => {
    apiMock.mockResolvedValue(undefined);
    const onDone = vi.fn(async () => ({ id: "owner-1", name: "Existing Display Name", email: "legacy@example.test", username: "legacy_1" }));
    render(<Account user={{ id: "owner-1", name: "Existing Display Name", email: "legacy@example.test" }} onDone={onDone} onSigningOut={() => undefined} onNotice={() => undefined} />);
    fireEvent.change(screen.getByLabelText("Choose a username"), { target: { value: "Legacy_1" } });
    const form = screen.getByLabelText("Choose a username").closest("form");
    expect(form).not.toBeNull();
    await act(async () => fireEvent.submit(form!));

    expect(apiMock.mock.calls[0]?.[0]).toBe("/auth/update-user");
    expect(JSON.parse(apiMock.mock.calls[0]?.[1]?.body as string)).toEqual({ username: "legacy_1" });
    expect(onDone).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Trainer card" })).toBeTruthy();
  });

  it("hides a calculator response when its inputs change before the response arrives", async () => {
    const response = deferred<DamageResponse>();
    apiMock.mockReturnValue(response.promise);
    render(<Damage catalog={null} />);

    fireEvent.click(screen.getByText("EVs and IVs (optional)"));
    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));
    fireEvent.change(screen.getByLabelText("Attacker Attack EVs"), { target: { value: "252" } });
    await act(async () => response.resolve({ generation: 9, min: 90, max: 110, minPercent: 90, maxPercent: 110, koChanceOnHit: 1, defenderHp: 100, description: "old matchup" }));

    expect(screen.queryByText("90–110%")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Your changes aren't reflected in this result");
  });

  it("uses optional per-side spreads, keeps team values in blank fields, and resets one side independently", async () => {
    const initialAttacker = pokemonSetSchema.parse({ species: "Pikachu", moves: ["Thunderbolt"], evs: { atk: 252 }, ivs: { atk: 0 } });
    const initialDefender = pokemonSetSchema.parse({ species: "Charizard", moves: ["Flamethrower"], evs: { hp: 252 } });
    apiMock.mockResolvedValue({ generation: 9, min: 18, max: 20, minPercent: 18, maxPercent: 20, koChanceOnHit: 0, defenderHp: 100, description: "test" });
    render(<Damage catalog={catalog} initialAttacker={initialAttacker} initialDefender={initialDefender} />);

    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));
    await screen.findByText("18–20%");
    const baseline = JSON.parse(apiMock.mock.calls[0]?.[1]?.body as string);
    expect(baseline.attacker.evs.atk).toBe(252);
    expect(baseline.attacker.ivs.atk).toBe(0);
    expect(baseline.defender.evs.hp).toBe(252);
    expect(baseline.defender.ivs.hp).toBe(31);

    fireEvent.click(screen.getByText("EVs and IVs (optional)"));
    fireEvent.change(screen.getByLabelText("Attacker Attack EVs"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Defender Hit Points IVs"), { target: { value: "0" } });
    fireEvent.click(screen.getByText("EVs and IVs (optional)"));
    fireEvent.click(screen.getByText("EVs and IVs (optional)"));
    expect((screen.getByLabelText("Attacker Attack EVs") as HTMLInputElement).value).toBe("100");

    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));
    await screen.findByText("18–20%");
    const overridden = JSON.parse(apiMock.mock.calls[1]?.[1]?.body as string);
    expect(overridden.attacker.evs.atk).toBe(100);
    expect(overridden.attacker.ivs.atk).toBe(0);
    expect(overridden.defender.ivs.hp).toBe(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Reset overrides" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));
    await screen.findByText("18–20%");
    const resetAttacker = JSON.parse(apiMock.mock.calls[2]?.[1]?.body as string);
    expect(resetAttacker.attacker.evs.atk).toBe(252);
    expect(resetAttacker.defender.ivs.hp).toBe(0);
    expect(initialAttacker.evs.atk).toBe(252);
  });

  it("caps a Damage EV override to the remaining budget and keeps it when clearing would inherit an invalid total", () => {
    const initialAttacker = pokemonSetSchema.parse({ species: "Pikachu", moves: ["Thunderbolt"], evs: { atk: 252, spe: 252 } });
    initialAttacker.evs.hp = 8;
    const initialDefender = pokemonSetSchema.parse({ species: "Charizard", moves: ["Flamethrower"] });
    render(<Damage catalog={catalog} initialAttacker={initialAttacker} initialDefender={initialDefender} />);
    fireEvent.click(screen.getByText("EVs and IVs (optional)"));

    const attackEvs = screen.getByLabelText("Attacker Attack EVs") as HTMLInputElement;
    expect(attackEvs.getAttribute("max")).toBe("250");
    fireEvent.focus(attackEvs);
    fireEvent.change(attackEvs, { target: { value: "500" } });
    expect(attackEvs.value).toBe("250");
    expect(screen.getByText("Capped at 250; the other stats use 260/510 EVs.")).toBeTruthy();
    expect(screen.getByText("EV total: 510/510")).toBeTruthy();

    fireEvent.change(attackEvs, { target: { value: "" } });
    fireEvent.blur(attackEvs);
    expect(attackEvs.value).toBe("250");
    expect(screen.getByText("Kept an explicit value of 250 because inheriting the source would exceed the 510 EV budget.")).toBeTruthy();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("shows localized side-specific spread validation and does not submit invalid values", () => {
    setLocale("es-ES");
    render(<Damage catalog={catalog} />);
    fireEvent.click(screen.getByText("EV e IV (opcionales)"));
    fireEvent.change(screen.getByLabelText("EV de Ataque del Atacante"), { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: /Calcular daño/ }));

    expect(apiMock).not.toHaveBeenCalled();
    expect(screen.getByText("Introduce un número entero.")).toBeTruthy();
    expect(screen.getByText("Corrige los campos numéricos resaltados antes de continuar.")).toBeTruthy();
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
    await waitFor(() => expect(screen.getByLabelText("Move").getAttribute("aria-invalid")).toBe("false"));
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
