// Downloads the cosmetic colour/coat form sprites (Vivillon wing patterns,
// Alcremie creams, Furfrou trims, flower colours…) into .sprite-cache/colors.
// scripts/bundleSprites.mjs then packs them into public/sprites.bin together
// with every other sprite map — this script only refreshes the cache.
//
// PokeAPI publishes these as "<dexId>-<formSlug>.png" rather than under a numeric
// form id, so they are fetched by name.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const POKEAPI = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const cacheDir = join(root, '.sprite-cache/colors');
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

// sprite id -> form slug, from PokeAPI's form table.
const csv = await (await fetch('https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_forms.csv')).text();
const formsBySprite = new Map();
{
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift().split(',');
  const at = (name) => header.indexOf(name);
  for (const line of lines) {
    const cells = line.split(',');
    if (cells[at('is_default')] === '1') continue;
    const slug = cells[at('identifier')];
    formsBySprite.set(Number(cells[at('id')]), slug.slice(slug.split('-')[0].length + 1));
  }
}

const colorTable = readFileSync(join(root, 'src/data/colorVariants.generated.ts'), 'utf8');
const wanted = [];
for (const match of colorTable.matchAll(/"(\d+)":(\[[^\]]*\])/g)) {
  const dexId = Number(match[1]);
  for (const entry of JSON.parse(match[2])) {
    // A base form (e.g. Shellos West Sea, Unown A) uses the species sprite, which
    // is already bundled, so it needs no separate download.
    if (entry.base) continue;
    const form = formsBySprite.get(entry.spriteId);
    if (form) wanted.push({ dexId, form, spriteId: entry.spriteId });
  }
}
if (wanted.length < 150) throw Error(`Only ${wanted.length} colour forms found.`);

mkdirSync(cacheDir, { recursive: true });
let saved = 0, missing = 0;
let cursor = 0;
async function worker() {
  while (cursor < wanted.length) {
    const { dexId, form } = wanted[cursor++];
    for (const folder of ['', 'shiny/']) {
      const rel = `${dexId}-${form}.png`;
      const file = join(cacheDir, folder === '' ? rel : `shiny-${rel}`);
      if (existsSync(file) && statSync(file).size > 0) continue;
      try {
        const res = await fetch(`${POKEAPI}/${folder}${rel}`, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) { missing++; continue; }
        const bytes = Buffer.from(await res.arrayBuffer());
        if (!bytes.subarray(0, 4).equals(PNG_MAGIC)) { missing++; continue; }
        writeFileSync(file, bytes);
        saved++;
      } catch { missing++; }
    }
  }
}
await Promise.all(Array.from({ length: 10 }, worker));

console.log(`Colour sprites: ${saved} downloaded, ${missing} unavailable on PokeAPI; ${wanted.length} colour forms tracked.`);