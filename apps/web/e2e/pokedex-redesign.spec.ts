import { expect, test } from "@playwright/test";

const catalog = {
  species: [
    { name: "Corviknight", types: ["Flying", "Steel"], baseStats: { hp: 98, atk: 87, def: 105, spa: 53, spd: 85, spe: 67 }, pokedexEligible: true, nationalDexId: 823, pokedexSlug: "corviknight", pokedexIsBaseForm: true },
    { name: "Rookidee", types: ["Flying"], baseStats: { hp: 38, atk: 47, def: 35, spa: 33, spd: 35, spe: 57 }, pokedexEligible: true, nationalDexId: 821, pokedexSlug: "rookidee", pokedexIsBaseForm: true },
    { name: "Corvisquire", types: ["Flying"], baseStats: { hp: 68, atk: 67, def: 55, spa: 77, spd: 55, spe: 77 }, pokedexEligible: true, nationalDexId: 822, pokedexSlug: "corvisquire", pokedexIsBaseForm: true },
    { name: "Ababo", types: ["Normal"], baseStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 }, pokedexEligible: false }
  ],
  moves: [], abilities: [], items: [], types: ["Flying", "Steel", "Normal"], natures: []
};
const family = {
  source: "PokéAPI",
  nodes: [
    { key: "rookidee", name: "Rookidee", pokedexId: 821, pokedexSlug: "rookidee", iconCandidates: [] },
    { key: "corvisquire", name: "Corvisquire", pokedexId: 822, pokedexSlug: "corvisquire", iconCandidates: [] },
    { key: "corviknight", name: "Corviknight", pokedexId: 823, pokedexSlug: "corviknight", iconCandidates: [] }
  ],
  edges: [
    { from: "rookidee", to: "corvisquire", alternatives: [["Level 18"]], conditionAlternatives: [[{ field: "trigger", value: "level-up" }, { field: "min_level", value: 18 }]] },
    { from: "corvisquire", to: "corviknight", alternatives: [["Level 38"]], conditionAlternatives: [[{ field: "trigger", value: "level-up" }, { field: "min_level", value: 38 }]] }
  ],
  megaForms: []
};

test("Pokédex details, evolution family, and moves fit desktop and phone layouts", async ({ page }) => {
  await page.route("https://raw.githubusercontent.com/PokeAPI/sprites/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360"><circle cx="180" cy="180" r="110" fill="#dcebe5"/></svg>'
  }));
  await page.route("**/api/catalog", (route) => route.fulfill({ json: catalog }));
  await page.route("**/api/type-chart", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ json: {} }));
  await page.route("**/api/site-config", (route) => route.fulfill({ json: { publicBaseUrl: new URL(route.request().url()).origin, deployEnv: "development" } }));
  await page.route("**/api/pokedex/Corvisquire/evolution", (route) => route.fulfill({ json: family }));
  await page.route("**/api/pokedex/Corvisquire/moves", (route) => route.fulfill({ json: {
    source: {
      provider: "PokéAPI", repository: "https://github.com/PokeAPI/pokeapi",
      revision: "2bf639e5572812a67d2b94903fdcb9d095f5aeb2", versionGroup: "scarlet-violet", versionGroupId: 25
    },
    species: "Corvisquire",
    moves: [{ name: "Peck", type: "Flying", category: "physical", acquisition: [{ method: "level-up", level: 1 }] }]
  } }));
  await page.route("**/api/pokedex/Corvisquire", (route) => route.fulfill({ json: {
    source: "PokéAPI", pokedexId: 822, familyKey: "corvisquire",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/822.webp",
    artwork: {
      normal: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/822.webp"],
      shiny: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/shiny/822.webp"],
      genderVariants: {
        male: {
          normal: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/822.webp"],
          shiny: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/shiny/822.webp"]
        },
        female: {
          normal: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/female/822.webp"],
          shiny: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/shiny/female/822.webp"]
        }
      }
    },
    abilities: [
      { name: "Keen Eye", isHidden: false, description: "Prevents other Pokémon from lowering accuracy." },
      { name: "Unnerve", isHidden: true, description: "Makes opposing Pokémon unable to eat Berries." }
    ]
  } }));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("link", { name: "Pokédex" }).click();
  await expect(page.getByRole("link", { name: /Ababo/ })).toHaveCount(0);
  await expect(page.locator(".species-list .species-name").nth(0)).toHaveText("Rookidee");
  await expect(page.locator(".species-list .species-national-number").nth(0)).toHaveText("#0821");
  await expect(page.locator(".species-list .species-name").nth(1)).toHaveText("Corvisquire");
  await expect(page.locator(".species-list .species-name").nth(2)).toHaveText("Corviknight");
  await page.getByRole("link", { name: /Corvisquire/ }).click();
  await expect(page).toHaveURL(/\/pokedex\/corvisquire$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new URL("/pokedex/corvisquire", page.url()).href);
  await page.goBack();
  await expect(page).toHaveURL(/\/pokedex$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/pokedex\/corvisquire$/);
  await expect(page.getByText("National Pokédex #822")).toBeVisible();
  await expect(page.getByText("Level 18")).toBeVisible();
  await expect(page.getByText("Level 38")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Moves" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Scarlet/Violet" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Level" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Peck")).toBeVisible();
  await expect(page.getByRole("img", { name: "Category: Physical" })).toBeVisible();
  await expect(page.getByText("Total").locator(".." )).toContainText("399");
  await expect(page.getByRole("heading", { name: "Abilities" })).toBeVisible();
  await expect(page.getByText("Hidden ability")).toBeVisible();
  const femaleArtwork = page.getByRole("button", { name: "Female artwork" });
  await expect(femaleArtwork).toBeEnabled();
  await femaleArtwork.click();
  await expect(femaleArtwork).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByAltText("Corvisquire")).toHaveAttribute("src", /female\/822\.webp/);
  await page.getByRole("button", { name: "Male artwork", exact: true }).click();
  await page.screenshot({ path: "test-results/pokedex-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Keen Eye" }).hover();
  await expect(page.getByRole("tooltip").filter({ hasText: "Prevents other Pokémon from lowering accuracy." })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.mouse.move(8, 8);
  await expect(page.getByText("National Pokédex #822")).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
    artwork: document.querySelector(".pokemon-artwork-frame")?.getBoundingClientRect().width ?? 0,
    evolution: document.querySelector(".evolution-panel")?.getBoundingClientRect().width ?? 0,
    moves: document.querySelector(".pokedex-moves")?.getBoundingClientRect().width ?? 0
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.artwork).toBeLessThanOrEqual(320);
  expect(dimensions.evolution).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.moves).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("button", { name: "Unnerve" })).toBeVisible();
  await page.screenshot({ path: "test-results/pokedex-phone.png", fullPage: true });

  await page.goto("/pokedex/not-a-pokemon");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();

  await page.goto("/pokedex/corvisquire");
  await expect(page.getByText("National Pokédex #822")).toBeVisible();
  await expect(page).toHaveTitle("Corvisquire · Pokédex | Pokémon Tools");
});
