import { readFileSync } from "node:fs";
import process from "node:process";
import { parseDocument } from "yaml";

const files = [
  ".github/workflows/checks.yml", ".github/workflows/codeql.yml",
  ".github/workflows/staging.yml", ".github/workflows/production.yml",
  ".github/dependabot.yml", "infra/compose/staging.yaml",
  "infra/compose/production.yaml", "infra/compose/caddy.yaml"
];
for (const file of files) {
  const doc = parseDocument(readFileSync(file, "utf8"), { uniqueKeys: true });
  if (doc.errors.length) throw new Error(`${file}: ${doc.errors.map((error) => error.message).join("; ")}`);
  const data = doc.toJS();
  if (file.includes("compose/") && file.includes("staging") || file.includes("compose/") && file.includes("production")) {
    if (data.services.api.ports || data.services.api.network_mode === "host") throw new Error(`${file}: API must not publish a host port`);
    if (!data.services.api.networks.includes("edge") || !data.services.api.networks.includes("database")) throw new Error(`${file}: API networks are incomplete`);
    if (data.services.db.networks.includes("edge")) throw new Error(`${file}: database joined edge network`);
  }
  if (file.endsWith("caddy.yaml")) {
    const ports = data.services.caddy.ports;
    if (!ports.includes("127.0.0.1:18081:8081") || !ports.includes("127.0.0.1:18082:8082")) throw new Error("Tailscale listeners must publish on loopback only");
  }
}
process.stdout.write(`Validated ${files.length} YAML files and Compose network boundaries\n`);
