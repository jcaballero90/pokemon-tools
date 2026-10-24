import { expect, test } from "@playwright/test";

test("theme follows browser preference until a saved choice is made", async ({ page }) => {
  test.setTimeout(120_000);
  const longName = "Trainer With A Very Long Account Name That Needs Truncation";
  let signedIn = false;

  await page.emulateMedia({ colorScheme: "dark" });
  await page.route("**/api/catalog", (route) => route.fulfill({ json: {
    species: [{ name: "Pikachu", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } }],
    moves: ["Thunderbolt"], abilities: [], items: [], types: ["Electric"], natures: ["Serious"],
    translations: {
      species: { pikachu: "Pikachu" }, moves: { thunderbolt: "Rayo" }, abilities: {}, items: {},
      types: { electric: "Eléctrico" }, natures: { serious: "Seria" }
    }
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
    ? { user: { id: "theme-user", name: longName, email: "trainer@example.test", username: "trainer_with_long_username_123", createdAt: "2025-01-02T00:00:00.000Z" } }
    : {}
  }));
  await page.route("**/api/me/teams", (route) => route.fulfill({ json: [] }));

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
  await expect(page.getByText("trainer_with_long_username_123").first()).toBeVisible();
  const header = page.locator(".site-header");
  await expect(header.getByRole("switch", { name: "Dark theme" })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 1000 });
  const themeToggle = header.getByRole("switch", { name: "Dark theme" });
  for (const theme of ["dark", "light"] as const) {
    if ((await themeToggle.getAttribute("aria-checked")) !== String(theme === "dark")) {
      await themeToggle.click();
    }

    for (const tab of ["Overview", "Type chart", "Pokédex", "Team builder", "Damage", "Account"]) {
      await page.getByRole("link", { name: tab, exact: true }).click();
      if (tab === "Pokédex") {
        await page.getByRole("link", { name: /Pikachu/ }).click();
        await expect(page.getByRole("heading", { name: "Pikachu" })).toBeVisible();
      }
      if (tab === "Account") {
        const trainerCard = page.getByRole("region", { name: "Trainer card" });
        await expect(trainerCard).toBeVisible();
        await expect(trainerCard.getByText("trainer_with_long_username_123")).toBeVisible();
      }
      await page.screenshot({ path: `test-results/theme-${theme}-${tab.toLowerCase().replaceAll(" ", "-")}.png`, fullPage: true });
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["dark", "light"] as const) {
    if ((await themeToggle.getAttribute("aria-checked")) !== String(theme === "dark")) {
      await themeToggle.click();
    }
    const accountLink = page.getByRole("link", { name: "Account", exact: true });
    await accountLink.click();
    const trainerCard = page.getByRole("region", { name: "Trainer card" });
    const signOut = trainerCard.getByRole("button", { name: "Sign out" });
    await expect(trainerCard).toBeVisible();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(signOut).toBeFocused();
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      card: document.querySelector<HTMLElement>(".trainer-card")?.getBoundingClientRect().width ?? 0,
      button: document.querySelector<HTMLElement>(".trainer-card-footer .button")?.getBoundingClientRect().width ?? 0
    }));
    expect(widths.page).toBeLessThanOrEqual(widths.viewport);
    expect(widths.button).toBeGreaterThan(widths.card * 0.75);
  }

  const languageToggle = header.getByRole("switch", { name: "Change language to Spain Spanish" });
  await languageToggle.click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  await expect(header.getByRole("switch", { name: "Cambiar idioma a inglés" })).toHaveAttribute("aria-checked", "true");
  const spanishThemeToggle = header.getByRole("switch", { name: "Tema oscuro" });
  const spanishTabs = ["Inicio", "Tabla de tipos", "Pokédex", "Creador de equipos", "Daño", "Cuenta"];
  for (const theme of ["dark", "light"] as const) {
    const currentTheme = await spanishThemeToggle.getAttribute("aria-checked");
    if (currentTheme !== String(theme === "dark")) await spanishThemeToggle.click();
    for (const tab of spanishTabs) {
      await page.getByRole("link", { name: tab, exact: true }).click();
      await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
      if (tab === "Cuenta") {
        const trainerCard = page.getByRole("region", { name: "Carné de Entrenador" });
        await expect(trainerCard).toBeVisible();
        await expect(trainerCard.getByText("trainer_with_long_username_123")).toBeVisible();
      }
      if (tab === "Pokédex") {
        await page.getByRole("link", { name: /Pikachu/ }).click();
        await expect(page.getByText("Eléctrico", { exact: true }).first()).toBeVisible();
      }
      await page.screenshot({ path: `test-results/theme-${theme}-es-${tab.toLowerCase().replaceAll(" ", "-")}.png`, fullPage: true });
    }
  }

  await page.setViewportSize({ width: 320, height: 760 });
  await expect(header.getByRole("switch", { name: "Tema oscuro" })).toBeVisible();
  for (const theme of ["dark", "light"] as const) {
    const currentTheme = await header.getByRole("switch", { name: "Tema oscuro" }).getAttribute("aria-checked");
    if (currentTheme !== String(theme === "dark")) await header.getByRole("switch", { name: "Tema oscuro" }).click();
    for (const tab of spanishTabs) {
      await page.getByRole("link", { name: tab, exact: true }).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      if (tab === "Cuenta") {
        const trainerCard = page.getByRole("region", { name: "Carné de Entrenador" });
        await expect(trainerCard).toBeVisible();
        const widths = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          page: document.documentElement.scrollWidth,
          card: document.querySelector<HTMLElement>(".trainer-card")?.getBoundingClientRect().width ?? 0,
          button: document.querySelector<HTMLElement>(".trainer-card-footer .button")?.getBoundingClientRect().width ?? 0
        }));
        expect(widths.page).toBeLessThanOrEqual(widths.viewport);
        expect(widths.button).toBeGreaterThan(widths.card * 0.75);
      }
    }
  }
  await expect(header.locator(".header-user")).toHaveCSS("text-overflow", "ellipsis");
});
