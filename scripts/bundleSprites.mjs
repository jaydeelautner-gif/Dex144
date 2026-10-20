// Packs every sprite into ONE binary file plus an offset index, so the
// repository (and hosts with a file-count limit, like Google AI Studio) sees
// two sprite files instead of thousands.
//
//   public/sprites.bin          concatenated PNG bytes
//   src/data/spriteFiles.generated.ts   id/form -> { o: offset, l: length }
//
// The app slices sprites.bin into blob URLs at runtime (see src/utils/spriteArchive.ts).
//
// Run: npm run bundle:sprites
//
// This is the single authoritative bundling pass. It always emits ALL maps:
//   SPRITE_FILES        species 1-1025, normal + shiny   (downloadSprites.ts)
//   FORM_ID_SPRITE_FILES numeric PokeAPI form ids 10001+ (downloadSprites.ts)
//   FORM_SPRITE_FILES   explicit Showdown form paths (Unown…) (downloadSprites.ts)
//   FEMALE_SPRITE_FILES female-only species sprites   (downloadSprites.ts)
//   COLOR_SPRITE_FILES  cosmetic colour/coat forms    (downloadColorSprites.mjs)
//   ITEM_SPRITE_SLICES  item artwork                  (downloadItemSprites.mjs)
//
// Sources are read from .sprite-cache/spritePaths.json (written by
// downloadSprites.ts) plus the colours/ and items/ caches, so re-running the
// bundle never depends on the generated file being in any particular state and
// never drops a map — the failure mode that previously blanked colour variants.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const cacheRoot = join(root, '.sprite-cache');
const generatedPath = join(root, 'src/data/spriteFiles.generated.ts');

const pathsSnapshot = JSON.parse(readFileSync(join(cacheRoot, 'spritePaths.json'), 'utf8'));
const { spriteFiles, formIdMap, formMap, femaleMap, formBase = {} } = pathsSnapshot;

// ---- Colour/coat forms: derive from the generated colour table + form slugs.
// PokeAPI publishes these as "<dexId>-<formSlug>.png" rather than under a numeric
// form id, so they are matched by name; base forms (base:true) reuse the species
// sprite and need no separate slice.
const colorTable = readFileSync(join(root, 'src/data/colorVariants.generated.ts'), 'utf8');
const colorVariants = JSON.parse(colorTable.match(/export const COLOR_VARIANTS:Record<number,ColorVariant\[\]> = (\{[\s\S]*?\});/)[1]);
const colorVariantsPath = join(cacheRoot, 'colors');
const colorMap = {};
if (existsSync(colorVariantsPath)) {
  const have = new Set(readdirSync(colorVariantsPath));
  for (const [dexIdStr, entries] of Object.entries(colorVariants)) {
    const dexId = Number(dexIdStr);
    for (const entry of entries) {
      if (entry.base) continue;
      const slug = entry.suffix;
      const normal = `${dexId}-${slug}.png`;
      const shiny = `shiny-${normal}`;
      if (have.has(normal) || have.has(shiny)) {
        colorMap[entry.spriteId] = {
          ...(have.has(normal) ? { normal: `/sprites/colors/${normal}` } : {}),
          ...(have.has(shiny) ? { shiny: `/sprites/colors/${shiny}` } : {}),
        };
      }
    }
  }
}
if (!Object.keys(colorMap).length) throw Error('No colour form sprites in .sprite-cache/colors. Run npm run generate:color-variants first.');

// ---- Item sprites: keyed by the item's PokeAPI identifier (slug).
const itemDir = join(cacheRoot, 'items');
if (!existsSync(itemDir)) throw Error('No item sprite cache (.sprite-cache/items). Run npm run generate:item-sprites first.');
const itemFiles = readdirSync(itemDir).filter((f) => f.endsWith('.png')).sort();

// ---- Collect every local path referenced by the path-form maps, de-duplicated.
const paths = new Set();
const collect = (value) => {
  if (typeof value === 'string') { if (value.startsWith('/sprites/')) paths.add(value); return; }
  if (value && typeof value === 'object') for (const v of Object.values(value)) collect(v);
};
[Object.values(spriteFiles), Object.values(formIdMap), Object.values(formMap), Object.values(femaleMap),
  Object.values(colorMap)].forEach(collect);
for (const f of itemFiles) paths.add(`/sprites/items/${f}`);

const chunks = [];
const index = new Map();
let offset = 0;
for (const url of [...paths].sort()) {
  const file = join(cacheRoot, url.replace('/sprites/', ''));
  if (!existsSync(file)) continue;
  const bytes = readFileSync(file);
  chunks.push(bytes);
  index.set(url, { o: offset, l: bytes.length });
  offset += bytes.length;
}

writeFileSync(join(root, 'public/sprites.bin'), Buffer.concat(chunks));

/** Rewrites every path in a map to its { o, l } slice. */
const toSlices = (value) => {
  if (typeof value === 'string') return index.get(value) ?? null;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, toSlices(v)]).filter(([, v]) => v !== null),
  );
};
const slicesOf = (map) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [k, toSlices(v)]).filter(([, v]) => v !== null));

// The data files reference Unown-style form sprites by local path, so key the
// form map by the resolved path as well as the original URL it was collected under.
const formSlices = {};
for (const [key, path] of Object.entries(formMap)) {
  const slice = index.get(path);
  if (!slice) continue;
  formSlices[key] = slice;
  formSlices[path] = slice;
}

const itemSlices = Object.fromEntries(itemFiles.map((f) => [f.replace(/\.png$/, ''), index.get(`/sprites/items/${f}`)]));

// form id -> base species sprite pair, so GO-era pseudo-forms without published
// art ("Mega Pyroar"…) render their base species instead of a placeholder.
const speciesSlices = slicesOf(spriteFiles);
const formIdBaseSlices = Object.fromEntries(
  Object.entries(formBase)
    .map(([formId, dexId]) => [formId, speciesSlices[Number(dexId)]])
    .filter(([, slice]) => slice !== undefined)
    .map(([formId, slice]) => [Number(formId), slice]),
);

writeFileSync(
  generatedPath,
  [
    '// Generated by scripts/downloadSprites.ts + scripts/bundleSprites.mjs.',
    '// Sprites live in one binary file; each entry is a byte slice of /sprites.bin.',
    '// Rebuild with `npm run bundle:sprites` — it always emits every map below.',
    'export interface SpriteSlice { o: number; l: number }',
    `export const SPRITE_BLOB = '/sprites.bin';`,
    `export const SPRITE_FILES: Record<number, { normal: SpriteSlice; shiny: SpriteSlice }> = ${JSON.stringify(slicesOf(spriteFiles))};`,
    `export const FORM_ID_SPRITE_FILES: Record<number, { normal?: SpriteSlice; shiny?: SpriteSlice }> = ${JSON.stringify(slicesOf(formIdMap))};`,
    `export const FORM_ID_BASE_SPRITE_FILES: Record<number, { normal: SpriteSlice; shiny: SpriteSlice }> = ${JSON.stringify(formIdBaseSlices)};`,
    `export const FORM_SPRITE_FILES: Record<string, SpriteSlice> = ${JSON.stringify(formSlices)};`,
    `export const FEMALE_SPRITE_FILES: Record<number, SpriteSlice> = ${JSON.stringify(slicesOf(femaleMap))};`,
    `export const ITEM_SPRITE_SLICES: Record<string, SpriteSlice> = ${JSON.stringify(itemSlices)};`,
    `export const COLOR_SPRITE_FILES: Record<number, { normal?: SpriteSlice; shiny?: SpriteSlice }> = ${JSON.stringify(slicesOf(colorMap))};`,
    '',
  ].join('\n'),
);

// Remove the loose files; the binary is now the only sprite asset.
if (existsSync(join(root, 'public/sprites'))) rmSync(join(root, 'public/sprites'), { recursive: true, force: true });

const binBytes = statSync(join(root, 'public/sprites.bin')).size;
console.log(
  `Bundled ${index.size} sprites into public/sprites.bin (${(binBytes / 1024 / 1024).toFixed(1)} MB): ` +
  `${Object.keys(slicesOf(spriteFiles)).length} species, ${Object.keys(slicesOf(formIdMap)).length} form ids, ` +
  `${Object.keys(formSlices).length} explicit forms, ${Object.keys(slicesOf(femaleMap)).length} female, ` +
  `${Object.keys(colorMap).length} colour forms, ${Object.keys(itemSlices).length} items.`,
);