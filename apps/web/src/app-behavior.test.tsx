import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { teamInputSchema, type CatalogResponse, type DamageResponse, type SavedTeamResponse, type TeamDraft } from "@pokemon-tools/contracts";
import { App } from "./main.js";
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
  moves: ["Thunderbolt", "Protect"], abilities: [], items: [], types: ["Electric", "Fire", "Flying"], natures: ["Serious"]
};

const savedTeam: SavedTeamResponse = {
  ...teamInputSchema.parse({ name: "Saved team", pokemon: [{ species: "Pikachu" }] }),
  id: "team-1", ownerId: "owner-1", createdAt: "2026-10-03T10:00:00.000Z", updatedAt: "2026-10-03T10:00:00.000Z"
};

const defaults = () => teamInputSchema.parse({ name: "Draft", pokemon: [] });

beforeEach(() => {
  localStorage.clear();
  apiMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("website interaction regressions", () => {
  it("removes a previously rendered private library as soon as the user signs out", async () => {
    let signedOut = false;
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart" || path === "/pro-teams") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve(signedOut ? {} : { user: { id: "owner-1", name: "Trainer", email: "trainer@example.test" } });
      if (path === "/me/teams") return Promise.resolve([savedTeam]);
      if (path === "/auth/sign-out") { signedOut = true; return Promise.resolve(undefined); }
      return Promise.resolve(undefined);
    });

    render(<App />);
    await screen.findByText("Trainer");
    fireEvent.click(screen.getByRole("button", { name: "Team builder" }));
    expect(await screen.findByRole("button", { name: "Saved team" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    await screen.findByText("Guest mode");
    fireEvent.click(screen.getByRole("button", { name: "Team builder" }));

    expect(screen.queryByRole("button", { name: "Saved team" })).toBeNull();
  });

  it("keeps a saved library hidden after logout and ignores a delayed old-session list", async () => {
    const oldList = deferred<SavedTeamResponse[]>();
    let sessions = 0;
    apiMock.mockImplementation((path: string) => {
      if (path === "/catalog") return Promise.resolve(catalog);
      if (path === "/type-chart" || path === "/pro-teams") return Promise.resolve([]);
      if (path === "/auth/get-session") return Promise.resolve(++sessions === 1 ? { user: { id: "owner-1", name: "Trainer", email: "trainer@example.test" } } : {});
      if (path === "/me/teams") return oldList.promise;
      return Promise.resolve(undefined);
    });

    render(<App />);
    await screen.findByText("Trainer");
    fireEvent.click(screen.getByRole("button", { name: "Account" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    await screen.findByText("Guest mode");
    await act(async () => oldList.resolve([savedTeam]));

    fireEvent.click(screen.getByRole("button", { name: "Team builder" }));
    expect(screen.queryByRole("button", { name: "Saved team" })).toBeNull();
  });

  it("shows only the newest selected Pokémon when older descriptive responses finish late", async () => {
    const first = deferred<{ source: "PokéAPI"; pokedexId: number; sprite: string }>();
    const second = deferred<{ source: "PokéAPI"; pokedexId: number; sprite: string }>();
    apiMock.mockImplementation((path: string) => path.endsWith("Pikachu") ? first.promise : second.promise);

    render(<Pokedex catalog={catalog} />);
    fireEvent.click(screen.getByRole("button", { name: /Pikachu/ }));
    fireEvent.click(screen.getByRole("button", { name: /Charizard/ }));
    await act(async () => second.resolve({ source: "PokéAPI", pokedexId: 6, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" }));
    expect(await screen.findByAltText("Charizard")).toBeTruthy();
    await act(async () => first.resolve({ source: "PokéAPI", pokedexId: 25, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" }));
    expect(screen.queryByAltText("Pikachu")).toBeNull();
    expect(screen.getByText("National Pokédex #6")).toBeTruthy();
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
      if (path === "/type-chart" || path === "/pro-teams") return Promise.resolve([]);
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

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Damage$/ }));
    fireEvent.change(screen.getByLabelText("Move"), { target: { value: "Protect" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate damage/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Overview$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Damage$/ }));
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
