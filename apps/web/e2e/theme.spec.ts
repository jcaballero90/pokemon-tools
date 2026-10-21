import { expect, test } from "@playwright/test";

test("theme follows browser preference until a saved choice is made", async ({ page }) => {
  const longName = "Trainer With A Very Long Account Name That Needs Truncation";
  let signedIn = false;

  await page.emulateMedia({ colorScheme: "dark" });
  await page.route("**/api/catalog", (route) => route.fulfill({ json: {
    species: [{ name: "Pikachu", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } }],
    moves: ["Thunderbolt"], abilities: [], items: [], types: ["Electric"], natures: ["Serious"]
  } }));
  await page.route("**/api/type-chart", (route) => route.fulfill({ json: [
    { attack: "Electric", against: { Electric: 1 } }
  ] }));
  await page.route("**/api/pokedex/Pikachu/evolution", (route) => route.fulfill({ json: {
    source: "PokéAPI", nodes: [], edges: [], megaForms: [], unavailable: true
  } }));
  await page.route("**/api/pokedex/Pikachu", (route) => route.fulfill({ json: {
    source: "PokéAPI", pokedexId: 25, familyKey: "pikachu", unavailable: true
  } }));
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ json: signedIn
    ? { user: { id: "theme-user", name: longName, email: "trainer@example.test" } }
    : {}
  }));

  await page.goto("/");
  const toggle = page.getByRole("switch", { name: "Dark theme" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Guest mode")).toBeVisible();

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#101827");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.evaluate(() => localStorage.removeItem("pokemon-tools:theme"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  signedIn = true;
  await page.reload();
  await expect(page.getByText(longName)).toBeVisible();
  const header = page.locator(".site-header");
  await expect(header.getByRole("switch", { name: "Dark theme" })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 1000 });
  const themeToggle = header.getByRole("switch", { name: "Dark theme" });
  for (const theme of ["dark", "light"] as const) {
    if ((await themeToggle.getAttribute("aria-checked")) !== String(theme === "dark")) {
      await themeToggle.click();
    }

    for (const tab of ["Overview", "Type chart", "Pokédex", "Team builder", "Damage", "Account"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      if (tab === "Pokédex") {
        await page.getByRole("button", { name: /Pikachu/ }).click();
        await expect(page.getByRole("heading", { name: "Pikachu" })).toBeVisible();
      }
      await page.screenshot({ path: `test-results/theme-${theme}-${tab.toLowerCase().replaceAll(" ", "-")}.png`, fullPage: true });
    }
  }

  await page.setViewportSize({ width: 320, height: 760 });
  await expect(header.getByRole("switch", { name: "Dark theme" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(header.locator(".header-user")).toHaveCSS("text-overflow", "ellipsis");
});
