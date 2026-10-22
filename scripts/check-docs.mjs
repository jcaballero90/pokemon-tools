import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excludedDirectory = `${path.sep}prompts${path.sep}`;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') files.push(...await walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

const docs = (await walk(path.join(root, 'docs')))
  .filter((file) => !file.includes(excludedDirectory));
const markdown = [
  path.join(root, 'README.md'),
  path.join(root, 'README.es.md'),
  path.join(root, 'infra', 'secrets', 'README.md'),
  path.join(root, 'infra', 'secrets', 'README.es.md'),
  ...docs,
];
const issues = [];

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

for (const file of markdown) {
  const isSpanish = file.endsWith('.es.md');
  const counterpart = isSpanish ? file.replace(/\.es\.md$/, '.md') : file.replace(/\.md$/, '.es.md');
  try {
    await stat(counterpart);
  } catch {
    issues.push(`Missing ${isSpanish ? 'English source' : 'Spanish translation'} for ${relative(file)} (expected ${relative(counterpart)})`);
    continue;
  }
  const firstLines = (await readFile(file, 'utf8')).split(/\r?\n/).slice(0, 3).join('\n');
  const counterpartName = path.basename(counterpart);
  if (!firstLines.includes(`](${counterpartName})`)) {
    issues.push(`Missing reciprocal language link in ${relative(file)} to ${counterpartName}`);
  }
}

function stripHtmlTags(value) {
  let result = '';
  let tagBuffer = '';
  let insideTag = false;
  let quote = '';

  for (const character of value) {
    if (!insideTag) {
      if (character === '<') {
        insideTag = true;
        tagBuffer = character;
      } else {
        result += character;
      }
      continue;
    }

    tagBuffer += character;
    if (quote) {
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      insideTag = false;
      tagBuffer = '';
    }
  }

  // Keep a literal or malformed less-than sequence instead of dropping text.
  if (insideTag) result += tagBuffer;
  return result;
}

function headingSlug(heading) {
  return stripHtmlTags(heading)
    .replace(/!?(\[[^\]]*\])\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function anchorsFor(file) {
  const source = await readFile(file, 'utf8');
  const anchors = new Set();
  const used = new Map();
  for (const match of source.matchAll(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const slug = headingSlug(match[1]);
    const count = used.get(slug) ?? 0;
    used.set(slug, count + 1);
    anchors.add(count ? `${slug}-${count}` : slug);
  }
  for (const match of source.matchAll(/<a\s+(?:[^>]*\s)?(?:id|name)=["']([^"']+)["']/gi)) anchors.add(match[1]);
  return anchors;
}

function markdownWithoutCode(source) {
  return source.replace(/^```[\s\S]*?^```\s*$/gm, '').replace(/^~~~[\s\S]*?^~~~\s*$/gm, '');
}

for (const file of markdown) {
  const source = markdownWithoutCode(await readFile(file, 'utf8'));
  const linkPattern = /!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)/g;
  for (const match of source.matchAll(linkPattern)) {
    let destination = match[1].replace(/^<|>$/g, '').replace(/\\ /g, ' ');
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination) || destination.startsWith('#')) continue;
    const hash = destination.indexOf('#');
    const fragment = hash >= 0 ? decodeURIComponent(destination.slice(hash + 1)) : '';
    const target = (hash >= 0 ? destination.slice(0, hash) : destination).split('?')[0];
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target || '.'));
    let targetFile = resolved;
    try {
      const info = await stat(resolved);
      if (info.isDirectory() && fragment) {
        const candidates = file.endsWith('.es.md') ? ['README.es.md', 'README.md'] : ['README.md', 'README.es.md'];
        let found;
        for (const name of candidates) {
          const candidate = path.join(resolved, name);
          try { await stat(candidate); found = candidate; break; } catch { /* try next language */ }
        }
        if (found) targetFile = found;
      }
    } catch {
      issues.push(`Broken link in ${relative(file)}: ${destination}`);
      continue;
    }
    if (fragment && targetFile.toLowerCase().endsWith('.md')) {
      const anchors = await anchorsFor(targetFile);
      if (!anchors.has(fragment)) issues.push(`Broken anchor in ${relative(file)}: ${destination}`);
    }
  }
}

if (issues.length) {
  process.stderr.write(`Documentation check failed with ${issues.length} issue(s):\n`);
  for (const issue of issues) process.stderr.write(`- ${issue}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Documentation check passed: ${markdown.length} Markdown files have language pairs and local links resolve.\n`);
}
