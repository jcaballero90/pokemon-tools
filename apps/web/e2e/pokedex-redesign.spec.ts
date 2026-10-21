import { expect, test } from "@playwright/test";

const catalog = {
  species: [
    { name: "Rookidee", types: ["Flying"], baseStats: { hp: 38, atk: 47, def: 35, spa: 33, spd: 35, spe: 57 }, pokedexEligible: true },
    { name: "Corvisquire", types: ["Flying"], baseStats: { hp: 68, atk: 67, def: 55, spa: 77, spd: 55, spe: 77 }, pokedexEligible: true },
    { name: "Corviknight", types: ["Flying", "Steel"], baseStats: { hp: 98, atk: 87, def: 105, spa: 53, spd: 85, spe: 67 }, pokedexEligible: true },
    { name: "Ababo", types: ["Normal"], baseStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 }, pokedexEligible: false }
  ],
  moves: [], abilities: [], items: [], types: ["Flying", "Steel", "Normal"], natures: []
};
const family = {
  source: "PokéAPI",
  nodes: [
    { key: "rookidee", name: "Rookidee", pokedexId: 821, iconCandidates: [] },
    { key: "corvisquire", name: "Corvisquire", pokedexId: 822, iconCandidates: [] },
    { key: "corviknight", name: "Corviknight", pokedexId: 823, iconCandidates: [] }
  ],
  edges: [
    { from: "rookidee", to: "corvisquire", alternatives: [["Level 18"]] },
    { from: "corvisquire", to: "corviknight", alternatives: [["Level 38"]] }
  ],
  megaForms: []
};

test("Pokédex detail and evolution family fit desktop and phone layouts", async ({ page }) => {
  await page.route("https://raw.githubusercontent.com/PokeAPI/sprites/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360"><circle cx="180" cy="180" r="110" fill="#dcebe5"/></svg>'
  }));
  await page.route("**/api/catalog", (route) => route.fulfill({ json: catalog }));
  await page.route("**/api/type-chart", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ json: {} }));
  await page.route("**/api/pokedex/Corvisquire/evolution", (route) => route.fulfill({ json: family }));
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
  await page.getByRole("button", { name: "Pokédex" }).click();
  await expect(page.getByRole("button", { name: /Ababo/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Corvisquire/ }).click();
  await expect(page.getByText("National Pokédex #822")).toBeVisible();
  await expect(page.getByText("Level 18")).toBeVisible();
  await expect(page.getByText("Level 38")).toBeVisible();
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
    evolution: document.querySelector(".evolution-panel")?.getBoundingClientRect().width ?? 0
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.artwork).toBeLessThanOrEqual(320);
  expect(dimensions.evolution).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("button", { name: "Unnerve" })).toBeVisible();
  await page.screenshot({ path: "test-results/pokedex-phone.png", fullPage: true });
});
