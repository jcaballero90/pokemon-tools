import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);
const parser = require("typescript-eslint").parser;
const sourceRoot = resolve(import.meta.dirname, "../src");
const visibleAttributes = new Set(["aria-label", "aria-description", "alt", "title", "placeholder", "label"]);
const findings = [];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collect(path);
    return /\.tsx$/.test(entry.name) && !/\.(test|spec)\.tsx$/.test(entry.name) ? [path] : [];
  }));
  return files.flat();
}

function isUserCopy(value) {
  const text = value.trim();
  if (!text || /^[\d\s.,%:;#/+\-–—→←↗↘✦◇×]+$/.test(text)) return false;
  if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) return false;
  return /[\p{L}]/u.test(text);
}

function addFinding(sourcePath, node, value, context) {
  if (!isUserCopy(value)) return;
  findings.push(`${relative(sourceRoot, sourcePath)}:${node.loc?.start.line ?? "?"} ${context}: ${JSON.stringify(value.trim())}`);
}

for (const file of await collect(sourceRoot)) {
  const text = await readFile(file, "utf8");
  const source = parser.parseForESLint(text, { loc: true, range: true, sourceType: "module", ecmaFeatures: { jsx: true }, filePath: file }).ast;
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXText") addFinding(file, node, node.value, "JSX text");
    if (node.type === "JSXAttribute" && typeof node.name?.name === "string" && visibleAttributes.has(node.name.name) && node.value?.type === "Literal" && typeof node.value.value === "string") {
      addFinding(file, node, node.value.value, `JSX ${node.name.name}`);
    }
    if (node.type === "JSXExpressionContainer" && node.expression?.type === "Literal" && typeof node.expression.value === "string") {
      addFinding(file, node, node.expression.value, "JSX string expression");
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object" && typeof value.type === "string") visit(value);
    }
  }
  visit(source);
}

if (findings.length) {
  process.stderr.write(`Found user-facing literals outside locale dictionaries:\n${findings.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("No static user-facing literals found outside locale dictionaries.\n");
}
