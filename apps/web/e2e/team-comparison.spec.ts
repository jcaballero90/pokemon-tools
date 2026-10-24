import { expect, test, type Locator, type Page } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const types = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"
];

const interactions: Record<string, { weak: string[]; resistant: string[]; immune?: string[] }> = {
  Normal: { weak: [], resistant: ["Rock", "Steel"], immune: ["Ghost"] },
  Fire: { weak: ["Grass", "Ice", "Bug", "Steel"], resistant: ["Fire", "Water", "Rock", "Dragon"] },
  Water: { weak: ["Fire", "Ground", "Rock"], resistant: ["Water", "Grass", "Dragon"] },
  Electric: { weak: ["Water", "Flying"], resistant: ["Electric", "Grass", "Dragon"], immune: ["Ground"] },
  Grass: { weak: ["Water", "Ground", "Rock"], resistant: ["Fire", "Grass", "Poison", "Flying", "Bug", "Dragon", "Steel"] },
  Ice: { weak: ["Grass", "Ground", "Flying", "Dragon"], resistant: ["Fire", "Water", "Ice", "Steel"] },
  Fighting: { weak: ["Normal", "Ice", "Rock", "Dark", "Steel"], resistant: ["Poison", "Flying", "Psychic", "Bug", "Fairy"], immune: ["Ghost"] },
  Poison: { weak: ["Grass", "Fairy"], resistant: ["Poison", "Ground", "Rock", "Ghost"], immune: ["Steel"] },
  Ground: { weak: ["Fire", "Electric", "Poison", "Rock", "Steel"], resistant: ["Grass", "Bug"], immune: ["Flying"] },
  Flying: { weak: ["Grass", "Fighting", "Bug"], resistant: ["Electric", "Rock", "Steel"] },
  Psychic: { weak: ["Fighting", "Poison"], resistant: ["Psychic", "Steel"], immune: ["Dark"] },
  Bug: { weak: ["Grass", "Psychic", "Dark"], resistant: ["Fire", "Fighting", "Poison", "Flying", "Ghost", "Steel", "Fairy"] },
  Rock: { weak: ["Fire", "Ice", "Flying", "Bug"], resistant: ["Fighting", "Ground", "Steel"] },
  Ghost: { weak: ["Psychic", "Ghost"], resistant: ["Dark"], immune: ["Normal"] },
  Dragon: { weak: ["Dragon"], resistant: ["Steel"], immune: ["Fairy"] },
  Dark: { weak: ["Psychic", "Ghost"], resistant: ["Fighting", "Dark", "Fairy"] },
  Steel: { weak: ["Ice", "Rock", "Fairy"], resistant: ["Fire", "Water", "Electric", "Steel"] },
  Fairy: { weak: ["Fighting", "Dragon", "Dark"], resistant: ["Fire", "Poison", "Steel"] }
};

const typeChart = types.map((attack) => {
  const { weak, resistant, immune = [] } = interactions[attack];
  const against = Object.fromEntries(types.map((defend) => {
    if (immune.includes(defend)) return [defend, 0];
    if (weak.includes(defend)) return [defend, 2];
    if (resistant.includes(defend)) return [defend, 0.5];
    return [defend, 1];
  }));
  return { attack, against };
});

const catalog = {
  species: [
    { name: "Pikachu", types: ["Electric"], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } },
    { name: "Charizard", types: ["Fire", "Flying"], baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 } },
    { name: "Blastoise", types: ["Water"], baseStats: { hp: 79, atk: 83, def: 100, spa: 85, spd: 105, spe: 78 } },
    { name: "Venusaur", types: ["Grass", "Poison"], baseStats: { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 } }
  ],
  moves: ["Thunderbolt", "Flamethrower", "Surf", "Sludge Bomb", "Protect"],
  moveDetails: {
    Thunderbolt: { type: "Electric", category: "Special" },
    Flamethrower: { type: "Fire", category: "Special" },
    Surf: { type: "Water", category: "Special" },
    "Sludge Bomb": { type: "Poison", category: "Special" },
    Protect: { type: "Normal", category: "Status" }
  },
  abilities: [],
  items: [],
  types,
  natures: ["Serious", "Timid"]
};

const teamA = `Pikachu
Serious Nature
- Thunderbolt

Charizard
Serious Nature
IVs: 0 Spe
- Flamethrower`;

const teamB = `Blastoise
Serious Nature
- Surf

Venusaur
Serious Nature
- Sludge Bomb`;

async function importTeam(editor: Locator, paste: string, count = 2) {
  await editor.getByRole("button", { name: "Import from Showdown" }).click();
  await editor.getByLabel("Showdown paste").fill(paste);
  await editor.getByRole("button", { name: "Review paste" }).click();
  await expect(editor.getByText(`${count} Pokémon ready to import.`)).toBeVisible();
  await editor.getByRole("button", { name: /^(Import|Replace) team$/ }).click();
  await expect(editor.locator(".set-card")).toHaveCount(count);
}

async function stubData(page: Page) {
  await page.route("https://assets.dittobase.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/png",
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jmk0AAAAASUVORK5CYII=", "base64")
  }));
  await page.route("**/api/site-config", (route) => route.fulfill({ json: {
    publicBaseUrl: "http://127.0.0.1:5175",
    deployEnv: "development"
  } }));
  await page.route("**/api/catalog", (route) => route.fulfill({ json: catalog }));
  await page.route("**/api/type-chart", (route) => route.fulfill({ json: typeChart }));
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ json: {} }));
}

async function openTeamBuilder(page: Page) {
  await page.goto("/team-builder");
  await expect(page).toHaveURL(/\/team-builder$/);
  await expect(page).toHaveTitle("Team builder | Pokémon Tools");
  await expect(page.getByRole("heading", { name: "Team builder", exact: true })).toBeVisible();
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
}

async function screenshot(page: Page, state: string) {
  const path = join(tmpdir(), `pokemon-tools-comparison-${state}.png`);
  if (state.startsWith("phone")) {
    await page.getByRole("region", { name: "Team comparison", exact: true }).screenshot({ path });
  } else {
    await page.screenshot({ path, fullPage: true });
  }
  console.log(`Comparison screenshot: ${path}`);
}

test("equal editors support independent expansion and live selected-move coverage", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await stubData(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openTeamBuilder(page);

  const a = page.locator(".team-editor").filter({ has: page.getByRole("heading", { name: "Your team", exact: true }) });
  const b = page.locator(".team-editor").filter({ has: page.getByRole("heading", { name: "Comparison team", exact: true }) });
  await a.getByLabel("Team name").fill("Coverage A");
  await b.getByLabel("Team name").fill("Coverage B");
  await importTeam(a, teamA);
  await importTeam(b, teamB);

  for (const editor of [a, b]) {
    await expect(editor.locator(".set-card").nth(0)).not.toHaveAttribute("open", "");
    await expect(editor.locator(".set-card").nth(1)).toHaveAttribute("open", "");
  }
  await a.locator(".set-card summary").nth(0).click();
  await expect(a.locator(".set-card").nth(0)).toHaveAttribute("open", "");
  await expect(a.locator(".set-card").nth(1)).toHaveAttribute("open", "");
  await expect(b.locator(".set-card").nth(0)).not.toHaveAttribute("open", "");
  await a.locator(".set-card summary").nth(0).click();

  const aBox = await a.boundingBox();
  const bBox = await b.boundingBox();
  expect(aBox).not.toBeNull();
  expect(bBox).not.toBeNull();
  expect(Math.abs(aBox!.width - bBox!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(aBox!.height - bBox!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(aBox!.y - bBox!.y)).toBeLessThanOrEqual(1);

  const comparison = page.getByRole("region", { name: "Team comparison", exact: true });
  await expect(comparison.getByRole("tab", { name: "A vs B", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(comparison.locator(".comparison-coverage-headlines")).toHaveCount(0);
  await comparison.getByRole("tab", { name: "Team balance", exact: true }).click();
  await expect(comparison.getByRole("heading", { name: "Defensive gaps", exact: true })).toHaveCount(2);
  await expect(comparison.getByRole("heading", { name: "Shared weaknesses", exact: true })).toHaveCount(2);
  await expect(comparison.getByText("Rock", { exact: true }).first()).toBeVisible();
  await expect(comparison.getByText("4×", { exact: false }).first()).toBeVisible();
  await screenshot(page, "desktop-balance");

  await comparison.getByRole("tab", { name: "A vs B", exact: true }).click();
  await expect(comparison.getByRole("button", { name: "A attacks B", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(comparison.getByRole("heading", { name: "Unmodified Speed", exact: true })).toBeVisible();
  const speeds = comparison.getByRole("table", { name: "Unmodified Speed ranking", exact: true });
  await expect(speeds.getByRole("row", { name: /Charizard/ })).toContainText("205");
  await expect(speeds.getByRole("row", { name: /Pikachu/ })).toContainText("216");
  const grid = comparison.getByRole("table").first();
  await expect(grid.getByRole("row", { name: /Pikachu/ })).toContainText("Thunderbolt");
  await expect(grid.getByRole("row", { name: /Charizard/ })).toContainText("Flamethrower");
  await expect(grid.getByRole("row", { name: /Charizard/ })).toContainText("2×");

  await a.locator(".set-card").nth(1).getByPlaceholder("Move 1").fill("Protect");
  await expect(grid.getByRole("row", { name: /Charizard/ })).not.toContainText("Flamethrower");
  await expect(grid.getByRole("row", { name: /Charizard/ })).not.toContainText("2×");
  await comparison.getByRole("button", { name: "B attacks A", exact: true }).click();
  await expect(comparison.getByRole("button", { name: "B attacks A", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(grid.getByRole("row", { name: /Blastoise/ })).toContainText("Surf");
  await expect(grid.getByRole("row", { name: /Blastoise/ })).toContainText("2×");

  await comparison.getByRole("button", { name: "A attacks B", exact: true }).click();
  const firstTransfer = comparison.getByRole("button", { name: "Open 1. Pikachu versus 1. Blastoise in Damage" });
  await expect(comparison.locator("#damage-pair-0-0")).toHaveCSS("visibility", "hidden");
  await firstTransfer.focus();
  await expect(firstTransfer).toBeFocused();
  await expect(comparison.locator("#damage-pair-0-0")).toBeVisible();
  await firstTransfer.press("Enter");
  await expect(page).toHaveURL(/\/damage$/);
  await expect(page.getByRole("combobox", { name: "Attacker", exact: true })).toHaveValue("Pikachu");
  await expect(page.getByRole("combobox", { name: "Defender", exact: true })).toHaveValue("Blastoise");
  await expect(page.getByRole("combobox", { name: "Move", exact: true })).toHaveValue("Thunderbolt");
  await expect(page.locator(".damage-transfer-summary")).toContainText("Pikachu");
  await expect(page.locator(".damage-transfer-summary")).toContainText("Thunderbolt");
  await expect(page.locator(".result-card h2")).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Weather", exact: true })).toHaveValue("");
  await expect(page.getByRole("combobox", { name: "Terrain", exact: true })).toHaveValue("");
  await expect(page.getByRole("checkbox", { name: "Attacker Terastallized" })).not.toBeChecked();
  await page.getByText("EVs and IVs (optional)").click();
  await expect(page.getByLabel("Attacker Attack EVs")).toHaveAttribute("placeholder", "0–252");
  await expect(page.getByLabel("Attacker Attack EVs").locator("..")).toContainText("Inherited: 0");
  await expect(page.getByLabel("Attacker Attack IVs")).toHaveAttribute("placeholder", "0–31");
  await expect(page.getByLabel("Attacker Attack IVs").locator("..")).toContainText("Inherited: 31");
  await page.getByRole("link", { name: "Team builder", exact: true }).click();
  await a.locator(".set-card").first().locator("summary").click();
  await expect(page.locator(".team-editor").first().locator(".set-card").first().getByLabel("Species")).toHaveValue("Pikachu");
  await expect(a.locator(".set-card").first().getByRole("spinbutton", { name: "Level" })).toHaveValue("100");
  await expect(a.locator(".set-card").first().getByRole("spinbutton", { name: "Atk EVs" })).toHaveValue("0");

  await a.locator(".set-card").nth(1).getByPlaceholder("Move 1").fill("Flamethrower");
  await comparison.getByRole("button", { name: "Open 2. Charizard versus 1. Blastoise in Damage" }).click();
  await expect(page).toHaveURL(/\/damage$/);
  await expect(page.getByRole("combobox", { name: "Attacker", exact: true })).toHaveValue("Charizard");
  await expect(page.getByRole("combobox", { name: "Defender", exact: true })).toHaveValue("Blastoise");
  await expect(page.getByRole("combobox", { name: "Move", exact: true })).toHaveValue("Flamethrower");
  await expect(page.locator(".damage-transfer-summary")).toContainText("Charizard");
  await expect(page.locator(".damage-transfer-summary")).toContainText("Blastoise");
  await expect(page.locator(".damage-transfer-summary")).toContainText("Spe 0");
  await page.getByRole("link", { name: "Team builder", exact: true }).click();

  await a.getByRole("button", { name: "Export to Showdown" }).click();
  await expect(a.getByLabel("Showdown export")).toHaveValue(/- Flamethrower/);
  await a.getByRole("button", { name: "Cancel" }).click();
  await expect(a.getByLabel("Team name")).toHaveValue("Coverage A");
  await expect(b.getByLabel("Team name")).toHaveValue("Coverage B");
  await screenshot(page, "desktop-matchups");

  await page.reload();
  await expect(a.locator(".set-card").nth(1).getByPlaceholder("Move 1")).toHaveValue("Flamethrower");
  await expect(b.locator(".set-card").nth(1).getByPlaceholder("Move 1")).toHaveValue("Sludge Bomb");
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("comparison tables remain within a phone viewport in both themes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await stubData(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openTeamBuilder(page);
  await importTeam(page.locator(".team-editor").nth(0), teamA);
  await importTeam(page.locator(".team-editor").nth(1), [teamB, teamB, teamB].join("\n\n"), 6);
  const comparison = page.getByRole("region", { name: "Team comparison", exact: true });
  const toggle = page.getByRole("switch", { name: "Dark theme" });

  for (const theme of ["light", "dark"]) {
    if ((await toggle.getAttribute("aria-checked")) !== String(theme === "dark")) await toggle.click();
    await comparison.getByRole("tab", { name: "Team balance", exact: true }).click();
    await comparison.getByText("Full defensive breakdown", { exact: true }).first().click();
    await expect(comparison.getByRole("table").first().getByRole("row")).toHaveCount(19);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await screenshot(page, `phone-${theme}-balance`);

    await comparison.getByRole("tab", { name: "A vs B", exact: true }).click();
    await expect(comparison.getByRole("table").first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const scrollContainer = comparison.getByRole("table").first().locator("..");
    const scroll = await scrollContainer.evaluate((element) => ({
      width: element.clientWidth,
      content: element.scrollWidth,
      overflow: getComputedStyle(element).overflowX
    }));
    expect(scroll.overflow).toMatch(/auto|scroll/);
    expect(scroll.content).toBeGreaterThan(scroll.width);
    await scrollContainer.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    await expect.poll(() => scrollContainer.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    const attacker = comparison.getByRole("table").first().getByRole("row").nth(1).getByRole("rowheader");
    const attackerBox = await attacker.boundingBox();
    const scrollBox = await scrollContainer.boundingBox();
    expect(attackerBox).not.toBeNull();
    expect(scrollBox).not.toBeNull();
    expect(attackerBox!.x).toBeGreaterThanOrEqual(scrollBox!.x);
    expect(attackerBox!.x + attackerBox!.width).toBeLessThanOrEqual(scrollBox!.x + scrollBox!.width);

    const speeds = comparison.getByRole("table", { name: "Unmodified Speed ranking", exact: true });
    const speedDimensions = await speeds.evaluate((table) => {
      const container = table.parentElement!;
      const box = container.getBoundingClientRect();
      const values = [...table.querySelectorAll("tbody td:last-child b")].map((cell) => {
        const value = cell.getBoundingClientRect();
        return { text: cell.textContent, left: value.left, right: value.right };
      });
      return {
        tableWidth: table.clientWidth,
        tableContent: table.scrollWidth,
        containerWidth: container.clientWidth,
        containerContent: container.scrollWidth,
        left: box.left,
        right: box.right,
        values
      };
    });
    expect(speedDimensions.tableContent).toBeLessThanOrEqual(speedDimensions.tableWidth);
    expect(speedDimensions.containerContent).toBeLessThanOrEqual(speedDimensions.containerWidth);
    expect(speedDimensions.values).toHaveLength(8);
    for (const value of speedDimensions.values) {
      expect(value.text).toMatch(/^\d+$/);
      expect(value.left).toBeGreaterThanOrEqual(speedDimensions.left);
      expect(value.right).toBeLessThanOrEqual(speedDimensions.right);
    }
    await expect(speeds.locator("tbody td:last-child b").first()).toBeVisible();
    await screenshot(page, `phone-${theme}-matchups`);
  }
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  expect(errors).toEqual([]);
});
