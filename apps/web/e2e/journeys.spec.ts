import { expect, test } from "@playwright/test";

test("guest can inspect chart, build a team, and calculate damage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Type chart" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("button", { name: "Team builder" }).click();
  await page.getByRole("button", { name: "+ Add Pokémon" }).first().click();
  await expect(page.getByText("1/6").first()).toBeVisible();
  await page.getByRole("button", { name: "Damage" }).click();
  await page.getByRole("button", { name: "Calculate damage" }).click();
  await expect(page.getByText(/one-hit KO chance/)).toBeVisible();
});

test("account can save a private team", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.invalid`;
  await page.goto("/");
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByLabel("Name").fill("E2E Trainer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("e2e-secure-password-123");
  await page.getByRole("button", { name: "Create account", exact: true }).last().click();
  await expect(page.getByText("Welcome, E2E Trainer")).toBeVisible();
  await page.getByRole("button", { name: "Team builder" }).click();
  await page.getByRole("button", { name: "+ Add Pokémon" }).first().click();
  await page.getByRole("button", { name: "Save your team" }).click();
  await expect(page.getByText("Team saved privately.")).toBeVisible();
});
