import { expect, test } from "@playwright/test";

test("Overview links every tool and sends comparison links to the comparison section", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Build your next Pokémon team." })).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);

  const features = page.getByRole("navigation", { name: "Pokémon tools" });
  await expect(features.getByRole("link")).toHaveCount(6);
  await expect(features.getByRole("link", { name: /Type chart/ })).toHaveAttribute("href", "/type-chart");
  await expect(features.getByRole("link", { name: /Pokédex/ })).toHaveAttribute("href", "/pokedex");
  await expect(features.getByRole("link", { name: /Team builder/ })).toHaveAttribute("href", "/team-builder");
  await expect(features.getByRole("link", { name: /Team comparison/ })).toHaveAttribute("href", "/team-builder#team-comparison");
  await expect(features.getByRole("link", { name: /Damage calculator/ })).toHaveAttribute("href", "/damage");
  await expect(features.getByRole("link", { name: /Save your teams/ })).toHaveAttribute("href", "/private-library");

  await expect.poll(() => page.locator(".hero h1").evaluate((heading) => getComputedStyle(heading).fontWeight)).toBe("600");
  await expect.poll(() => page.locator(".hero p").evaluate((paragraph) => getComputedStyle(paragraph).fontWeight)).toBe("400");
  await expect.poll(() => page.locator(".feature h2").first().evaluate((heading) => getComputedStyle(heading).fontWeight)).toBe("600");
  await expect.poll(() => page.locator(".feature p").first().evaluate((paragraph) => getComputedStyle(paragraph).fontWeight)).toBe("400");

  await features.getByRole("link", { name: /Team comparison/ }).click();
  await expect(page).toHaveURL(/\/team-builder#team-comparison$/);
  await expect(page.locator("#team-comparison")).toBeFocused();
  await page.getByRole("link", { name: "Pokémon Tools" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Build your next Pokémon team." })).toBeVisible();
});

test("the Quick Ball brand and home layout work in both themes, languages and phone widths", async ({ page }) => {
  await page.route("https://assets.dittobase.com/items/scarlet-violet/quick-ball.png", (route) => route.fulfill({
    status: 200,
    contentType: "image/png",
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/5Z8AAAAASUVORK5CYII=", "base64")
  }));
  await page.goto("/");
  const logo = page.locator(".brand-mark");
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(logo).toHaveAttribute("src", "https://assets.dittobase.com/items/scarlet-violet/quick-ball.png");
  const faviconPath = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(faviconPath).toBe("https://assets.dittobase.com/items/scarlet-violet/quick-ball.png");
  const typography = await page.evaluate(() => ({
    root: getComputedStyle(document.documentElement).fontFamily,
    heading: getComputedStyle(document.querySelector("h1")!).fontFamily,
    body: getComputedStyle(document.querySelector(".hero p")!).fontFamily
  }));
  expect(typography.heading).toBe(typography.root);
  expect(typography.body).toBe(typography.root);
  expect(typography.root).toContain("Inter");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Pokémon Tools" })).toBeFocused();

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await page.locator(".theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator(".locale-toggle").click();
  await expect(page.getByRole("heading", { level: 1, name: "Prepara tu próximo equipo Pokémon." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Herramientas Pokémon" }).getByRole("link", { name: /Comparar equipos/ })).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await page.locator(".theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator(".locale-toggle").click();
  await expect(page.getByRole("heading", { level: 1, name: "Build your next Pokémon team." })).toBeVisible();
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
