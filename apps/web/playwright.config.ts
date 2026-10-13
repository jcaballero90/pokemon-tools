import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const apiDirectory = fileURLToPath(new URL("../api", import.meta.url));
const webDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:5173", ...devices["Desktop Chrome"], channel: process.env.PLAYWRIGHT_CHANNEL === "msedge" ? "msedge" : undefined },
  webServer: [
    { command: "node --env-file-if-exists=.env --import tsx src/main.ts", cwd: apiDirectory, url: "http://127.0.0.1:4000/api/health", reuseExistingServer: !process.env.CI, timeout: 60_000 },
    { command: "node node_modules/vite/bin/vite.js --host 127.0.0.1", cwd: webDirectory, url: "http://127.0.0.1:5173", reuseExistingServer: !process.env.CI, timeout: 60_000 }
  ],
  retries: process.env.CI ? 1 : 0
});
