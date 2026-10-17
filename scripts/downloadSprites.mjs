// Downloads every sprite the app uses into public/sprites so nothing is
// fetched from an external host at runtime.
//
// Sources: Pokemon Showdown `dex` (120x120, matches the app's max 128px
// display) for normal + shiny forms, with the PokeAPI pixel sprite (96x96) as
// a per-species fallback when Showdown has no file. Explicit Showdown form
// URLs referenced in src/data (female/unown forms) are fetched too.
//
// Run: node scripts/downloadSprites.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const species = JSON.parse(readFileSync('/tmp/species.json', 'utf8'));
const SHOWDOWN = 'https://play.pokemonshowdown.com/sprites';
const POKEAPI = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** Showdown slug rules: lowercase, gender symbols, drop punctuation. */
function slug(name) {
  return name
    .toLowerCase()
    .replace('♀', '-f')
    .replace('♂', '-m')
    .replace(/[.'’:]/g, '')
    .replace(/\s+/g, '');
}

async function get(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  return bytes.length > 200 ? bytes : null;
}

async function saveLocal(rel, bytes) {
  const file = join(root, 'public/sprites', rel);
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, bytes);
  }
}

const results = [];
let downloaded = 0, fallback = 0, failed = 0, concurrency = 12, cursor = 0;
async function worker() {
  while (cursor < species.length) {
    const mon = species[cursor++];
    const s = slug(mon.name);
    const entry = { id: mon.id, normal: null, shiny: null, source: 'showdown' };
    for (const [folder, key] of [['dex', 'normal'], ['dex-shiny', 'shiny']]) {
      const bytes = await get(`${SHOWDOWN}/${folder}/${s}.png`);
      if (bytes) {
        const rel = `showdown/${folder}/${s}.png`;
        await saveLocal(rel, bytes);
        entry[key] = `/sprites/${rel}`;
        downloaded++;
      }
    }
    if (!entry.normal || !entry.shiny) {
      // PokeAPI pixel sprites always exist per species id.
      for (const [folder, key] of [['', 'normal'], ['shiny/', 'shiny']]) {
        if (entry[key]) continue;
        const bytes = await get(`${POKEAPI}/${folder}${mon.id}.png`);
        if (bytes) {
          const rel = `pokeapi/${folder}${mon.id}.png`;
          await saveLocal(rel, bytes);
          entry[key] = `/sprites/${rel}`;
          fallback++;
        }
      }
      entry.source = 'mixed';
    }
    if (!entry.normal) failed++;
    results.push(entry);
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));

// Explicit form sprite URLs referenced in src/data (female forms, unown…).
const explicit = new Set();
for (const dir of ['src/data']) {
  for (const name of readdirSync(join(root, dir))) {
    if (!name.endsWith('.ts')) continue;
    const text = readFileSync(join(root, dir, name), 'utf8');
    for (const m of text.matchAll(/https:\/\/play\.pokemonshowdown\.com\/sprites\/([a-z-]+)\/([a-z0-9().-]+\.png)/g)) explicit.add(`${m[1]}/${m[2]}`);
  }
}
const formMap = {};
for (const path of explicit) {
  const [folder, file] = path.split('/');
  const bytes = await get(`${SHOWDOWN}/${folder}/${file}`);
  if (bytes) {
    const rel = `showdown/${folder}/${file}`;
    await saveLocal(rel, bytes);
    formMap[`${SHOWDOWN}/${folder}/${file}`] = `/sprites/${rel}`;
  }
}
// Unown letter/punctuation forms (Showdown dex naming).
for (const letter of [...'abcdefghijklmnopqrstuvwxyz', 'exclamation', 'question']) {
  const file = `unown-${letter}.png`;
  const bytes = await get(`${SHOWDOWN}/dex/${file}`);
  if (bytes) {
    const rel = `showdown/dex/${file}`;
    await saveLocal(rel, bytes);
    formMap[`${SHOWDOWN}/dex/${file}`] = `/sprites/${rel}`;
    formMap[`/sprites/dex/${file}`] = `/sprites/${rel}`;
  }
}

// Female sprites come from PokeAPI (Showdown's dex folder has no -f files).
const femaleMap = {};
let femaleCursor = 0;
async function femaleWorker() {
  while (femaleCursor < species.length) {
    const mon = species[femaleCursor++];
    const bytes = await get(`${POKEAPI}/female/${mon.id}.png`);
    if (bytes) {
      const rel = `pokeapi/female/${mon.id}.png`;
      await saveLocal(rel, bytes);
      femaleMap[mon.id] = `/sprites/${rel}`;
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, femaleWorker));

// Alternate-form sprites (Alolan/Galarian/Mega/etc.) use PokeAPI form ids >1025.
let formCursor = 10001;
const formIdMap = {};
async function formWorker() {
  while (formCursor <= 10300) {
    const id = formCursor++;
    for (const [folder, key] of [['', 'normal'], ['shiny/', 'shiny']]) {
      const bytes = await get(`${POKEAPI}/${folder}${id}.png`);
      if (!bytes) continue;
      const rel = `pokeapi/${folder}${id}.png`;
      await saveLocal(rel, bytes);
      if (!formIdMap[id]) formIdMap[id] = {};
      formIdMap[id][key] = `/sprites/${rel}`;
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, formWorker));

const lines = [
  '// Generated by scripts/downloadSprites.mjs — local sprite paths (no external hosts).',
  `export const SPRITE_FILES: Record<number, { normal: string; shiny: string }> = ${JSON.stringify(
    Object.fromEntries(results.filter((r) => r.normal && r.shiny).map((r) => [r.id, { normal: r.normal, shiny: r.shiny }])),
    null,
    0,
  )};`,
  `export const FORM_ID_SPRITE_FILES: Record<number, { normal?: string; shiny?: string }> = ${JSON.stringify(formIdMap, null, 0)};`,
  `export const FORM_SPRITE_FILES: Record<string, string> = ${JSON.stringify(formMap, null, 0)};`,
  `export const FEMALE_SPRITE_FILES: Record<number, string> = ${JSON.stringify(femaleMap, null, 0)};`,
  '',
];
writeFileSync(join(root, 'src/data/spriteFiles.generated.ts'), lines.join('\n'));
console.log(`species: ${results.length} | showdown files: ${downloaded} | pokeapi fallbacks: ${fallback} | failed: ${failed} | form files: ${Object.keys(formMap).length} | female: ${Object.keys(femaleMap).length}`);
