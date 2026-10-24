import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const apiDirectory = fileURLToPath(new URL("../api", import.meta.url));
const webDirectory = fileURLToPath(new URL(".", import.meta.url));
const apiPort = configuredPort("E2E_API_PORT", 4101);
const webPort = configuredPort("E2E_WEB_PORT", 5175);
const apiUrl = `http://127.0.0.1:${apiPort}`;
const webUrl = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: webUrl, ...devices["Desktop Chrome"], channel: process.env.PLAYWRIGHT_CHANNEL === "msedge" ? "msedge" : undefined },
  webServer: process.env.E2E_EXTERNAL_SERVERS === "1" ? [] : [
    { command: "node --env-file-if-exists=.env --import tsx src/main.ts", cwd: apiDirectory, url: `${apiUrl}/api/health`, env: { NODE_ENV: "test", PORT: String(apiPort), PUBLIC_BASE_URL: webUrl, TRUSTED_ORIGINS: webUrl }, reuseExistingServer: !process.env.CI, timeout: 60_000 },
    { command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${webPort} --strictPort`, cwd: webDirectory, url: webUrl, env: { API_PORT: String(apiPort) }, reuseExistingServer: !process.env.CI, timeout: 60_000 }
  ],
  retries: process.env.CI ? 1 : 0
});

function configuredPort(name: string, fallback: number) {
  const port = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error(`${name} must be an available TCP port from 1024 to 65535.`);
  }
  return port;
}
