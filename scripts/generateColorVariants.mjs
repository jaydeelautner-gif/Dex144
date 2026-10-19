// Generates the cosmetic colour/form variants from PokéAPI's canonical form data:
// Vivillon wing patterns, Flabébé/Floette/Florges flower colours, Alcremie creams
// and sweets, Furfrou trims, Deerling/Sawsbuck seasons, Burmy/Wormadam cloaks,
// Unown letters, Arceus/Silvally types and Genesect drives.
//
// Run: node scripts/generateColorVariants.mjs
import { writeFileSync, renameSync } from 'node:fs';

const source = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const ENGLISH_LANGUAGE_ID = '9';

function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (char !== '\r') field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}
async function table(name) {
  const res = await fetch(source + name + '.csv', { signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw Error(`${name}: HTTP ${res.status}`);
  return parseCsv(await res.text());
}

const [forms, formNames, species, pokemon] = await Promise.all([
  table('pokemon_forms'), table('pokemon_form_names'), table('pokemon_species'), table('pokemon'),
]);
const englishName = new Map(formNames.filter((r) => r.local_language_id === ENGLISH_LANGUAGE_ID).map((r) => [r.pokemon_form_id, r.form_name]));
// pokemon id -> species id (forms are keyed by pokemon id).
const speciesOfPokemon = new Map(pokemon.map((r) => [Number(r.id), Number(r.species_id)]));
const dexOfSpecies = new Map(species.map((r) => [Number(r.id), Number(r.id)]));

/** Base species whose alternate forms are colour/coat variations, with how to label them. */
const COSMETIC = {
  vivillon: { kind: 'Pattern', note: 'Wing pattern depends on the real-world region where the Scatterbug was collected.' },
  flabebe: { kind: 'Flower', note: 'Flower colour is fixed per individual and carries through evolution.' },
  floette: { kind: 'Flower', note: 'Flower colour is fixed per individual and carries through evolution.' },
  florges: { kind: 'Flower', note: 'Flower colour is fixed per individual.' },
  alcremie: { kind: 'Cream & Sweet', note: 'Cream and sweet are chosen when Milcery evolves; both are cosmetic.' },
  furfrou: { kind: 'Trim', note: 'Trims are applied at a salon and last until the trim is changed.' },
  deerling: { kind: 'Season', note: 'Coat follows the in-game season in Gen V; fixed forms later.' },
  sawsbuck: { kind: 'Season', note: 'Coat follows the in-game season in Gen V; fixed forms later.' },
  burmy: { kind: 'Cloak', note: 'Cloak depends on the last terrain Burmy battled in.' },
  wormadam: { kind: 'Cloak', note: 'Cloak is fixed by the Burmy it evolved from.' },
  unown: { kind: 'Letter', note: 'Letter form is fixed per individual.' },
  arceus: { kind: 'Type', note: 'Type changes with the held plate.' },
  silvally: { kind: 'Type', note: 'Type changes with the held memory.' },
  genesect: { kind: 'Drive', note: 'Drive changes the held item and Techno Blast type.' },
  pumpkaboo: { kind: 'Size', note: 'Size is fixed per individual.' },
  gourgeist: { kind: 'Size', note: 'Size is inherited from the Pumpkaboo it evolved from.' },
  minior: { kind: 'Core', note: 'Core colour shows after the shell breaks.' },
  basculin: { kind: 'Stripe', note: 'Stripe colour is the form caught.' },
  polteageist: { kind: 'Antique', note: 'Antique form is the rarer collectible.' },
  sinistea: { kind: 'Antique', note: 'Antique form is the rarer collectible.' },
  magearna: { kind: 'Colour', note: 'Original Colour is the event distribution form.' },
  zarude: { kind: 'Form', note: 'Dada form is the event distribution form.' },
  shellos: { kind: 'Sea', note: 'West Sea and East Sea forms are region-locked on Sinnoh routes.' },
  gastrodon: { kind: 'Sea', note: 'West Sea and East Sea forms are region-locked on Sinnoh routes.' },
  cherrim: { kind: 'Form', note: 'Cherrim changes between Overcast and Sunshine Form by weather.' },
  xerneas: { kind: 'Mode', note: 'Neutral Mode is the inactive form; Active Mode shows in battle.' },
  frillish: { kind: 'Gender', note: 'Male and female forms differ in colour.' },
  jellicent: { kind: 'Gender', note: 'Male and female forms differ in colour.' },
  pyroar: { kind: 'Gender', note: 'The male has a mane; the female does not.' },
  mothim: { kind: 'Cloak', note: 'Burmy cloak determines Mothim colouring.' },
};

const out = {};
/** Species/dex id for a form's pokemon row. */
function dexIdFor(form) {
  return speciesOfPokemon.get(Number(form.pokemon_id)) ?? Number(form.pokemon_id);
}

for (const form of forms) {
  const slug = form.identifier;
  const base = slug.split('-')[0];
  const meta = COSMETIC[base];
  if (!meta) continue;
  // The default form counts when the species' base form is itself a named
  // variant (Shellos West Sea, Vivillon Meadow, Flabébé Red). Mega forms are
  // also flagged default but have their own artwork, so they are not "base".
  // "base" means the form shares the species' own sprite. PokeAPI flags each
  // cosmetic form as its own default "pokemon", so the reliable test is whether
  // the form id is the species' own sprite id (e.g. Shellos West Sea = 422),
  // rather than trusting is_default.
  const isNamedDefault = Number(form.id) === dexIdFor(form);
  const name = englishName.get(form.id);
  if (!name || name === 'None') continue;
  const pokemonId = Number(form.pokemon_id);
  const dexId = speciesOfPokemon.get(pokemonId) ?? pokemonId;
  const suffix = form.form_identifier || slug.slice(base.length + 1);
  // National dex numbers are 1..1025; forms above that are cosmetic-only rows.
  if (!Number.isInteger(dexId) || dexId < 1 || dexId > 1025 || !dexOfSpecies.has(dexId)) continue;
  (out[dexId] ??= []).push({ spriteId: Number(form.id), suffix, name, kind: meta.kind, base: isNamedDefault });
}
const notes = Object.fromEntries(Object.entries(COSMETIC).map(([base, meta]) => [base, meta.note]));
// Drop entries with no artwork anywhere: a form the picker cannot draw would
// render a placeholder, so it is better omitted than shown blank.
const { COLOR_SPRITE_FILES, SPRITE_FILES } = await (async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../src/data/spriteFiles.generated.ts', import.meta.url), 'utf8');
  // Tolerate a fresh pipeline where bundleSprites.mjs has not run yet: missing
  // maps mean "nothing bundled to compare against yet", not a crash. The prune
  // below is skipped and the downloader fetches every form.
  const read = (name) => {
    const m = src.match(new RegExp(`export const ${name}[^=]*= (\\{[\\s\\S]*?\\});\\n`));
    try { return m ? JSON.parse(m[1]) : {}; } catch { return {}; }
  };
  return { COLOR_SPRITE_FILES: read('COLOR_SPRITE_FILES'), SPRITE_FILES: read('SPRITE_FILES') };
})();
let dropped = 0;
// Only prune once the colour sprites exist; on a first run there is nothing to
// compare against yet, so entries are kept and the downloader fetches them.
const spritesAreBundled = Object.keys(COLOR_SPRITE_FILES).length > 0;
if (spritesAreBundled) {
  for (const dexId of Object.keys(out)) {
    out[dexId] = out[dexId].filter((entry) => {
      const drawable = entry.base ? Boolean(SPRITE_FILES[dexId]) : Boolean(COLOR_SPRITE_FILES[entry.spriteId]);
      if (!drawable) dropped++;
      return drawable;
    });
    if (!out[dexId].length) delete out[dexId];
  }
}

const rows = Object.keys(out).length;
const formCount = Object.values(out).reduce((n, list) => n + list.length, 0);
if (rows < 10 || formCount < 150) {
  throw Error(`Only ${rows} species / ${formCount} forms; the previous file was kept.`);
}
const text = `// Generated by scripts/generateColorVariants.mjs from PokéAPI form data.
export interface ColorVariant { spriteId:number; suffix:string; name:string; kind:string; base:boolean }
export const COLOR_VARIANTS:Record<number,ColorVariant[]> = ${JSON.stringify(out)};
export const COLOR_VARIANT_NOTES:Record<string,string> = ${JSON.stringify(notes)};
`;
const target = new URL('../src/data/colorVariants.generated.ts', import.meta.url);
writeFileSync(new URL(target.href + '.tmp'), text);
renameSync(new URL(target.href + '.tmp'), target);
console.log(`Colour variants: ${rows} species, ${formCount} forms (${dropped} without artwork omitted).`);
