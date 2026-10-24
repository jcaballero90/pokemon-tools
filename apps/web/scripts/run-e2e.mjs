import console from "node:console";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const webDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDirectory = resolve(webDirectory, "../api");
const apiPort = configuredPort("E2E_API_PORT", 4101);
const webPort = configuredPort("E2E_WEB_PORT", 5175);
const webUrl = `http://127.0.0.1:${webPort}`;
let interrupted = false;
let runner;
const servers = [];

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    interrupted = true;
    if (runner && runner.exitCode === null) runner.kill("SIGTERM");
  });
}

function startServer(command, args, cwd, env) {
  const child = spawn(command, args, { cwd, env, stdio: "ignore", windowsHide: true });
  child.once("error", (error) => { child.startupError = error; });
  servers.push(child);
  return child;
}

function configuredPort(name, fallback) {
  const port = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error(`${name} must be an available TCP port from 1024 to 65535.`);
  }
  return port;
}

async function waitForServer(url, children, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    if (interrupted) throw new Error("End-to-end test run was interrupted.");
    for (const child of children) {
      if (child.startupError) throw child.startupError;
      if (child.exitCode !== null) throw new Error(`A test server exited early with code ${child.exitCode}.`);
    }
    try {
      const response = await globalThis.fetch(url, { signal: globalThis.AbortSignal.timeout(1_000) });
      if (response.ok) return;
      lastError = new Error(`${url} returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}. ${lastError instanceof Error ? lastError.message : ""}`);
}

async function stopChild(child) {
  if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolveExit) => child.once("exit", resolveExit));
  child.kill("SIGTERM");
  const stopped = await Promise.race([exited.then(() => true), delay(5_000).then(() => false)]);
  if (!stopped && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await exited;
  }
}

let exitCode;
try {
  const api = startServer(process.execPath, ["--env-file-if-exists=.env", "--import", "tsx", "src/main.ts"], apiDirectory, {
    ...process.env,
    NODE_ENV: "test",
    PORT: String(apiPort),
    PUBLIC_BASE_URL: webUrl,
    TRUSTED_ORIGINS: webUrl
  });
  const web = startServer(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort), "--strictPort"], webDirectory, {
    ...process.env,
    API_PORT: String(apiPort)
  });
  await Promise.all([
    waitForServer(`http://127.0.0.1:${apiPort}/api/health`, [api]),
    waitForServer(webUrl, [web])
  ]);
  if (interrupted) throw new Error("End-to-end test run was interrupted.");

  runner = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], {
    cwd: webDirectory,
    env: { ...process.env, E2E_EXTERNAL_SERVERS: "1" },
    stdio: "inherit",
    windowsHide: true
  });
  const code = await new Promise((resolveExit, reject) => {
    runner.once("error", reject);
    runner.once("exit", (status, signal) => resolveExit(status ?? (signal ? 1 : 0)));
  });
  exitCode = interrupted ? 130 : code;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  exitCode = interrupted ? 130 : 1;
} finally {
  for (const child of servers.reverse()) await stopChild(child);
}

process.exitCode = exitCode;
