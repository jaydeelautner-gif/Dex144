// Downloads every sprite the app displays into public/sprites so nothing is
// fetched from an external host at runtime.
//
// Run: npm run generate:sprites   (tsx scripts/downloadSprites.ts)
//
// Matching is authoritative rather than guessed: Pokemon Showdown's og:image
// directory listings for `dex` and `dex-shiny` define which files exist, and
// each species name is resolved against them (Showdown's toID form, then a
// hyphenated form). Anything Showdown lacks falls back to the PokeAPI pixel
// sprite for that species id. Female and alternate-form sprites come from
// PokeAPI (Showdown's dex folder has no -f files).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInitialNationalDex } from '../src/data/pokemonData';

const root = fileURLToPath(new URL('..', import.meta.url));
const SHOWDOWN = 'https://play.pokemonshowdown.com/sprites';
const POKEAPI = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const CONCURRENCY = 12;

/** Showdown's own id rule: lowercase with every non-alphanumeric removed. */
const toId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Fallback naming: lowercase, punctuation dropped, spaces/hyphens collapsed. */
const hyphenForm = (name: string) => name.toLowerCase().replace(/[.'’:]/g, '').replace(/[\s_-]+/g, '-');

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function fetchBytes(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    // Reject HTML error pages and truncations: only real PNG data is stored,
    // otherwise a cached 404 page would silently replace a sprite.
    if (bytes.length < 8 || !bytes.subarray(0, 8).equals(PNG_MAGIC)) return null;
    return bytes;
  } catch {
    return null;
  }
}

/** og:image sprite filename listing for a Showdown folder. */
async function listFolder(folder: string): Promise<Set<string>> {
  const html = await (await fetch(`${SHOWDOWN}/${folder}/`)).text();
  const names = new Set<string>();
  for (const m of html.matchAll(/href="\.\/([^"]+\.png)"/g)) names.add(m[1]);
  if (!names.size) throw new Error(`Could not list Showdown sprites/${folder}.`);
  return names;
}

const outRoot = join(root, 'public/sprites');
const written = new Set<string>();
async function saveLocal(rel: string, bytes: Buffer): Promise<void> {
  const relPath = `sprites/${rel}`;
  if (written.has(relPath)) return;
  const file = join(root, 'public', relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  written.add(relPath);
}

async function pool<T>(items: T[], worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (cursor < items.length) await worker(items[cursor++]);
    }),
  );
}

const species = buildInitialNationalDex().map((p) => ({ id: p.id, name: p.name }));
const [dexNames, shinyNames] = await Promise.all([listFolder('dex'), listFolder('dex-shiny')]);

const results: { id: number; normal: string | null; shiny: string | null }[] = [];
const unresolved: string[] = [];
let showdownHits = 0, fallbacks = 0;

await pool(species, async (mon) => {
  const candidates = [toId(mon.name), hyphenForm(mon.name)];
  const pick = (listing: Set<string>) => {
    for (const name of candidates) if (listing.has(`${name}.png`)) return `${name}.png`;
    return null;
  };
  const normalFile = pick(dexNames);
  const shinyFile = pick(shinyNames);
  const entry = { id: mon.id, normal: null as string | null, shiny: null as string | null };
  for (const [folder, file, key] of [
    ['dex', normalFile, 'normal'],
    ['dex-shiny', shinyFile, 'shiny'],
  ] as const) {
    if (!file) continue;
    const bytes = await fetchBytes(`${SHOWDOWN}/${folder}/${file}`);
    if (!bytes) continue;
    const rel = `showdown/${folder}/${file}`;
    await saveLocal(rel, bytes);
    entry[key] = `/sprites/${rel}`;
    showdownHits++;
  }
  // PokeAPI pixel sprites always exist per species id.
  for (const [folder, key] of [['', 'normal'], ['shiny/', 'shiny']] as const) {
    if (entry[key]) continue;
    const bytes = await fetchBytes(`${POKEAPI}/${folder}${mon.id}.png`);
    if (!bytes) continue;
    const rel = `pokeapi/${folder}${mon.id}.png`;
    await saveLocal(rel, bytes);
    entry[key] = `/sprites/${rel}`;
    fallbacks++;
  }
  if (!entry.normal || !entry.shiny) unresolved.push(`${mon.id} ${mon.name}`);
  results.push(entry);
});

// Explicit Showdown form files the app references (Unown letters/punctuation).
// These are read from the Showdown listing, and the generated file itself is
// excluded so the tool never consumes its own previous output.
const formMap: Record<string, string> = {};
const unownFiles = [...dexNames].filter((name) => /^unown-.*\.png$/.test(name));
await pool(unownFiles, async (file) => {
  const bytes = await fetchBytes(`${SHOWDOWN}/dex/${file}`);
  if (!bytes) return;
  const rel = `showdown/dex/${file}`;
  await saveLocal(rel, bytes);
  formMap[`${SHOWDOWN}/dex/${file}`] = `/sprites/${rel}`;
  formMap[`/sprites/dex/${file}`] = `/sprites/${rel}`;
});
// Any other local /sprites paths referenced directly in source data.
const explicit = new Set<string>();
for (const name of readdirSync(join(root, 'src/data'))) {
  if (!name.endsWith('.ts') || name === 'spriteFiles.generated.ts') continue;
  const text = readFileSync(join(root, 'src/data', name), 'utf8');
  for (const m of text.matchAll(/(?:https:\/\/play\.pokemonshowdown\.com)?\/sprites\/(showdown\/)?(dex|dex-shiny)\/([a-z0-9.()-]+\.png)/g)) {
    explicit.add(`${m[2]}/${m[3]}`);
  }
}
await pool([...explicit], async (path) => {
  const [folder, file] = path.split('/');
  if (!(folder === 'dex' ? dexNames : shinyNames).has(file)) return;
  const bytes = await fetchBytes(`${SHOWDOWN}/${folder}/${file}`);
  if (!bytes) return;
  const rel = `showdown/${folder}/${file}`;
  await saveLocal(rel, bytes);
  formMap[`${SHOWDOWN}/${folder}/${file}`] = `/sprites/${rel}`;
});

// Female sprites: PokeAPI only.
const femaleMap: Record<number, string> = {};
await pool(species, async (mon) => {
  const bytes = await fetchBytes(`${POKEAPI}/female/${mon.id}.png`);
  if (!bytes) return;
  const rel = `pokeapi/female/${mon.id}.png`;
  await saveLocal(rel, bytes);
  femaleMap[mon.id] = `/sprites/${rel}`;
});

// Alternate-form sprites (Alolan/Galarian/Mega/Hisui…) use PokeAPI ids >1025.
const formIds = Array.from({ length: 300 }, (_, i) => 10001 + i);
const formIdMap: Record<number, { normal?: string; shiny?: string }> = {};
await pool(formIds, async (id) => {
  for (const [folder, key] of [['', 'normal'], ['shiny/', 'shiny']] as const) {
    const bytes = await fetchBytes(`${POKEAPI}/${folder}${id}.png`);
    if (!bytes) continue;
    const rel = `pokeapi/${folder}${id}.png`;
    await saveLocal(rel, bytes);
    (formIdMap[id] ??= {})[key] = `/sprites/${rel}`;
  }
});

// Prune files from previous runs that this run did not reference.
let pruned = 0;
const walk = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
};
if (existsSync(outRoot)) {
  for (const file of walk(outRoot)) {
    const rel = file.slice(join(root, 'public').length + 1);
    if (!written.has(rel)) { rmSync(file); pruned++; }
  }
}

const sortIds = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).sort((a, b) => Number(a[0]) - Number(b[0]) || a[0].localeCompare(b[0])));
const sortKeys = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).sort((a, b) => a[0].localeCompare(b[0])));

const spriteFiles = Object.fromEntries(
  results.filter((r) => r.normal && r.shiny).map((r) => [r.id, { normal: r.normal, shiny: r.shiny }]),
);
writeFileSync(
  join(root, 'src/data/spriteFiles.generated.ts'),
  [
    '// Generated by scripts/downloadSprites.ts — local sprite paths (no external hosts).',
    `export const SPRITE_FILES: Record<number, { normal: string; shiny: string }> = ${JSON.stringify(sortIds(spriteFiles))};`,
    `export const FORM_ID_SPRITE_FILES: Record<number, { normal?: string; shiny?: string }> = ${JSON.stringify(sortIds(formIdMap))};`,
    `export const FORM_SPRITE_FILES: Record<string, string> = ${JSON.stringify(sortKeys(formMap))};`,
    `export const FEMALE_SPRITE_FILES: Record<number, string> = ${JSON.stringify(sortIds(femaleMap))};`,
    '',
  ].join('\n'),
);

console.log(
  `species: ${results.length} | showdown sprites: ${showdownHits} | pokeapi fallbacks: ${fallbacks} | ` +
    `female: ${Object.keys(femaleMap).length} | form ids: ${Object.keys(formIdMap).length} | ` +
    `forms: ${Object.keys(formMap).length} | pruned: ${pruned}`,
);
if (unresolved.length) console.warn(`species without a full sprite pair: ${unresolved.length} → ${unresolved.slice(0, 8).join(', ')}`);
