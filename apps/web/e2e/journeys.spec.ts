import { expect, test } from "@playwright/test";

test("guest can inspect chart, build a team, and calculate damage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Type chart" }).click();
  await expect(page.getByRole("group", { name: "Or choose one or two types" }).getByRole("button")).toHaveCount(18);
  await page.getByRole("button", { name: "Grass" }).click();
  await page.getByRole("button", { name: "Ground" }).click();
  const quadrupleDamage = page.getByRole("region", { name: "4×" });
  await expect(quadrupleDamage.getByText("Ice")).toBeVisible();
  await expect(page.getByRole("region", { name: "2×" }).getByText("Bug")).toBeVisible();
  await expect(page.getByRole("region", { name: "2×" }).getByText("Fire")).toBeVisible();
  await expect(page.getByRole("region", { name: "2×" }).getByText("Flying")).toBeVisible();
  await expect(page.getByRole("region", { name: "0×" }).getByText("Electric")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ice" })).toBeDisabled();
  await page.getByRole("combobox", { name: "Or find a Pokémon" }).fill("Charizard");
  await expect(page.getByText("Charizard", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "Team builder" }).click();
  await page.getByRole("button", { name: "+ Add Pokémon" }).first().click();
  await expect(page.getByText("1/6").first()).toBeVisible();
  await page.getByRole("link", { name: "Damage", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Move", exact: true })).toHaveAttribute("aria-invalid", "false");
  await page.getByRole("button", { name: "Calculate damage" }).click();
  await expect(page.getByText(/one-hit KO chance/)).toBeVisible();
});

test("damage calculator keeps blank spreads, applies EV/IV overrides, and resets them", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Damage", exact: true }).click();
  await page.getByRole("button", { name: "Calculate damage" }).click();
  const result = page.locator(".result-card h2");
  await expect(result).toBeVisible();
  const baseline = await result.textContent();

  await page.getByText("EVs and IVs (optional)").click();
  await page.getByLabel("Attacker Special Attack EVs").fill("252");
  await page.getByLabel("Attacker Special Attack IVs").fill("0");
  await page.getByLabel("Defender Hit Points EVs").fill("252");
  await page.getByRole("button", { name: "Calculate damage" }).click();
  await expect(result).not.toHaveText(baseline ?? "");

  await page.locator(".result-card details summary").click();
  await expect(page.getByText(/Attacker EVs: .*SpA 252/)).toBeVisible();
  await expect(page.getByText(/Attacker IVs: .*SpA 0/)).toBeVisible();
  await expect(page.getByText(/Defender EVs: .*HP 252/)).toBeVisible();

  await page.getByRole("button", { name: "Reset overrides" }).first().click();
  await page.getByRole("button", { name: "Reset overrides" }).last().click();
  await page.getByRole("button", { name: "Calculate damage" }).click();
  await expect(result).toHaveText(baseline ?? "");

  await page.getByRole("switch", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("switch", { name: "Change language to Spain Spanish" }).click();
  await expect(page.getByText("EV e IV (opcionales)")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(390);
});

test("guest drafts retain incomplete edits and move slots after a page reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Team builder" }).click();
  await page.getByLabel("Team name").first().fill("Half-finished draft");
  await page.getByRole("button", { name: "+ Add Pokémon" }).first().click();
  await page.getByPlaceholder("Move 3").first().fill("Protect");
  await page.reload();
  await page.getByRole("link", { name: "Team builder" }).click();

  await expect(page.getByLabel("Team name").first()).toHaveValue("Half-finished draft");
  await expect(page.getByPlaceholder("Move 2").first()).toHaveValue("");
  await expect(page.getByPlaceholder("Move 3").first()).toHaveValue("Protect");
});

test("guest can review a Showdown paste, edit the imported set, and reload the draft", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Team builder" }).click();
  await page.getByRole("button", { name: "Import from Showdown" }).first().click();
  await page.getByLabel("Showdown paste").fill(`Pikachu @ Light Ball
Ability: Static
Level: 42
Tera Type: Water
Timid Nature
EVs: 252 SpA / 4 SpD / 252 Spe
IVs: 0 Atk
- Thunderbolt`);
  await page.getByRole("button", { name: "Review paste" }).click();
  await expect(page.getByText("1 Pokémon ready to import.")).toBeVisible();
  await page.getByRole("button", { name: "Import team" }).click();

  await expect(page.getByText("1/6").first()).toBeVisible();
  await expect(page.getByLabel("Item").first()).toHaveValue("Light Ball");
  await page.getByRole("button", { name: "Export to Showdown" }).first().click();
  const exportedPaste = page.getByLabel("Showdown export");
  await expect.poll(() => exportedPaste.inputValue()).toContain("Pikachu @ Light Ball");
  await expect.poll(() => exportedPaste.inputValue()).toContain("IVs: 0 Atk");
  await expect.poll(() => exportedPaste.inputValue()).toContain("- Thunderbolt");
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByLabel("Team name").first().fill("Imported and edited");
  await page.getByPlaceholder("Move 2").first().fill("Protect");
  await page.reload();
  await page.getByRole("link", { name: "Team builder" }).click();

  await expect(page.getByLabel("Team name").first()).toHaveValue("Imported and edited");
  await expect(page.getByLabel("Item").first()).toHaveValue("Light Ball");
  await expect(page.getByPlaceholder("Move 2").first()).toHaveValue("Protect");
});

test("the defensive chart stays readable on a narrow phone-sized viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "Type chart" }).click();
  const grass = page.getByRole("button", { name: "Grass" });
  await grass.focus();
  await page.keyboard.press("Space");
  await expect(grass).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Ground" }).click();
  await expect(page.getByRole("region", { name: "4×" }).getByText("Ice")).toBeVisible();
  await expect(page.getByRole("region", { name: "0×" }).getByText("Electric")).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});

test("account can save a private team without exposing it to another account", async ({ page, browser }) => {
  const email = `e2e-${Date.now()}@example.invalid`;
  await page.goto("/");
  await page.getByRole("link", { name: "Account" }).click();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("E2E Trainer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("e2e-secure-password-123");
  await page.getByRole("button", { name: "Create account", exact: true }).last().click();
  await expect(page.getByText("Welcome, E2E Trainer")).toBeVisible();
  await page.getByRole("link", { name: "Team builder" }).click();
  await page.getByRole("button", { name: "+ Add Pokémon" }).first().click();
  await page.getByLabel("Team name").first().fill("Private E2E team");
  await page.getByRole("button", { name: "Save your team" }).click();
  await expect(page.getByText("Team saved privately.")).toBeVisible();
  const teamId = await page.evaluate(async () => {
    const response = await fetch("/api/me/teams");
    const teams = await response.json() as Array<{ id: string }>;
    return teams[0]?.id;
  });
  expect(teamId).toBeTruthy();

  const secondContext = await browser.newContext();
  try {
    const secondPage = await secondContext.newPage();
    await secondPage.goto(new URL("/", page.url()).href);
    await secondPage.getByRole("link", { name: "Account" }).click();
    await secondPage.getByRole("button", { name: "Create account" }).click();
    await secondPage.getByLabel("Name").fill("Second Trainer");
    await secondPage.getByLabel("Email").fill(`e2e-second-${Date.now()}@example.invalid`);
    await secondPage.getByLabel("Password").fill("e2e-secure-password-456");
    await secondPage.getByRole("button", { name: "Create account", exact: true }).last().click();
    await expect(secondPage.getByText("Welcome, Second Trainer")).toBeVisible();
    const isolation = await secondPage.evaluate(async (id) => {
      const listed = await fetch("/api/me/teams");
      const teams = await listed.json() as unknown[];
      const removed = await fetch(`/api/me/teams/${encodeURIComponent(id)}`, { method: "DELETE" });
      return { count: teams.length, deleteStatus: removed.status };
    }, teamId);
    expect(isolation).toEqual({ count: 0, deleteStatus: 404 });
  } finally {
    await secondContext.close();
  }

  await page.getByRole("button", { name: "Private E2E team", exact: true }).click();
  await expect(page.getByLabel("Team name").first()).toHaveValue("Private E2E team");
  await page.getByRole("button", { name: "Delete Private E2E team" }).click();
  await expect(page.getByRole("button", { name: "Private E2E team", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Save your team" }).click();
  await expect(page.getByText("Team saved privately.")).toBeVisible();
  await page.getByRole("link", { name: "Account" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("link", { name: "Team builder" }).click();
  await expect(page.getByRole("button", { name: "Private E2E team", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Team name").first()).toHaveValue("Private E2E team");
});
