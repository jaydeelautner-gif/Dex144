// Downloads PokeAPI item sprites for every item in the generated table into
// .sprite-cache/items. Sprites are named by the item's PokeAPI identifier
// ("poke-ball", "tm-normal"). scripts/appendItemSprites.mjs then appends them
// to public/sprites.bin, so item artwork ships inside the app like Pokémon art.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const source = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
const ITEMS = JSON.parse(readFileSync(new URL('src/data/items.generated.ts', root), 'utf8').match(/ITEMS:Record<number,ItemEntry> = (\{.*?\});/s)[1]);
const slugs = [...new Set(Object.values(ITEMS).map(item => item.slug))].sort();
if (slugs.length < 800) throw Error('Item table looks incomplete.');
const outDir = new URL('.sprite-cache/items/', root);
mkdirSync(outDir, { recursive: true });
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
let cursor = 0, saved = 0, missing = 0;
async function worker() {
  while (cursor < slugs.length) {
    const slug = slugs[cursor++];
    if (existsSync(new URL(slug + '.png', outDir))) { saved++; continue; }
    try {
      const response = await fetch(source + slug + '.png', { signal: AbortSignal.timeout(20000) });
      if (!response.ok) { missing++; continue; }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.subarray(0, 4).equals(PNG)) { missing++; continue; }
      writeFileSync(new URL(slug + '.png', outDir), bytes);
      saved++;
    } catch { missing++; }
  }
}
await Promise.all(Array.from({ length: 14 }, worker));
console.log(`Item sprites: ${saved} saved, ${missing} unavailable, from ${slugs.length} items.`);
