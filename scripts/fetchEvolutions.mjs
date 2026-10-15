/**
 * Generate a COMPLETE evolution-family dataset for National Dex #1–1025
 * from PokéAPI's evolution-chain endpoint (the same verified source as the
 * encounter bundle), then merge with the hand-curated Gen-1 families
 * (curated entries win; generated families fill every other line).
 *
 * Run:  node scripts/fetchEvolutions.mjs
 * Out:  src/data/evolutionFamilies.generated.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOTAL_DEX = 1025;
const CONCURRENCY = 12;
const RETRIES = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const NAME_FIXES = {
  'nidoran-f': 'Nidoran ♀', 'nidoran-m': 'Nidoran ♂', 'mr-mime': 'Mr. Mime',
  'ho-oh': 'Ho-Oh', 'porygon2': 'Porygon2', 'porygon-z': 'Porygon-Z',
  'farfetchd': "Farfetch'd", 'type-null': 'Type: Null', 'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o', 'kommo-o': 'Kommo-o', 'flabebe': 'Flabébé',
  'floette': 'Floette', 'florges': 'Florges', 'mimikyu': 'Mimikyu',
};

/** PokéAPI lowercase species name → display name (used for the
 *  "Evolve <name>" label; card names come from the dex entries). */
function displayName(apiName) {
  if (NAME_FIXES[apiName]) return NAME_FIXES[apiName];
  return apiName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function fetchJson(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Dex144-evolution-sync' } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === RETRIES) { console.error(`FAILED ${url}: ${err.message}`); return null; }
      await sleep(400 * attempt * attempt);
    }
  }
}

/** Describe an evolution trigger the way the app's curated data does. */
function describeTrigger(details, prevName) {
  const bits = [];
  const d = details[0] ?? {};
  const item = d.held_item?.name || d.item?.name || d.known_move?.name || d.known_move_type?.name;
  switch (d.trigger?.name) {
    case 'level-up':
      if (d.min_level != null) return `Level ${d.min_level}`;
      if (d.time_of_day) return `Level up (${d.time_of_day})`;
      if (d.held_item) return `Level up holding ${displayName(d.held_item.name)}`;
      if (d.known_move) return `Level up knowing ${displayName(d.known_move.name)}`;
      if (d.known_move_type) return `Level up with a ${d.known_move_type.name}-type move`;
      if (d.min_happiness != null) return d.min_affection != null ? 'High affection' : 'High friendship';
      if (d.min_beauty != null) return 'High beauty';
      if (d.min_affection != null) return 'High affection';
      if (d.gender != null) return `Level up (${d.gender.name})`;
      if (d.needs_overworld_rain) return 'Level up in the rain';
      if (d.upside_down) return 'Level up (upside-down Switch)';
      if (d.location) return `Level up at ${displayName(d.location.name)}`;
      return 'Level up';
    case 'trade': {
      if (d.held_item) return `Trade holding ${displayName(d.held_item.name)}`;
      return 'Trade';
    }
    case 'use-item':
      return d.item ? `Use ${displayName(d.item.name)}` : 'Use an item';
    case 'shed':
      return `Empty slot + Poké Ball (${prevName})`;
    case 'spin':
      return 'Spin (Tower of Darkness/Waters)';
    case 'tower-of-darkness': return 'Train at the Tower of Darkness';
    case 'tower-of-waters': return 'Train at the Tower of Waters';
    case 'three-critical-hits': return 'Land 3 critical hits in one battle';
    case 'damage-location': return 'Take damage, then walk under the arch';
    case 'agile-style-move': return 'Use an Agile Style move 20 times';
    case 'strong-style-move': return 'Use a Strong Style move 20 times';
    case 'recoil-damage': return 'Lose HP from recoil';
    case 'other': return d.item ? `Use ${displayName(d.item.name)}` : 'Special method';
    default:
      if (d.item) return `Use ${displayName(d.item.name)}`;
      return 'Special method';
  }
}

/** Collect (speciesId, name, details) ordered by depth from a chain root. */
function walk(node, depth, prevName, acc) {
  const url = node.species.url;
  const sid = Number(url.match(/\/(\d+)\/?$/)[1]);
  // Only canonical species ids 1–1025 (regional forms are 10000+; skip them)
  if (sid <= TOTAL_DEX && !acc.has(sid)) {
    acc.set(sid, { id: sid, name: displayName(node.species.name), depth, trigger: node.evolution_details?.[0] ? describeTrigger(node.evolution_details, prevName) : 'Base Form' });
  }
  for (const child of node.evolves_to) {
    walk(child, depth + 1, node.species.name, acc);
  }
}

async function worker(cursor, max, families) {
  while (true) {
    const id = cursor.i++;
    if (id > max) return;
    const chain = await fetchJson(`https://pokeapi.co/api/v2/evolution-chain/${id}`);
    if (!chain?.chain) continue;
    const map = new Map();
    walk(chain.chain, 1, null, map);
    if (map.size < 2) continue; // single-stage chain — nothing to evolve
    const species = [...map.entries()].sort((a, b) => a[0] - b[0]);
    const minDepth = Math.min(...species.map(([, s]) => s.depth));
    const stages = species.map(([sid, s]) => ({
      pokemonId: sid,
      speciesName: s.name,
      stage: Math.min(3, (s.depth - minDepth) + 1),
      trigger: s.depth === minDepth ? 'level' : inferTrigger(s.trigger),
      detail: s.depth === minDepth ? 'Base Form' : s.trigger,
    }));
    families.set(id, { familyId: species[0][0], stages });
  }
}

function inferTrigger(detail) {
  const d = detail.toLowerCase();
  if (d.startsWith('trade')) return 'trade';
  if (d.startsWith('use ') || d.includes('holding ')) return 'item';
  if (d.includes('friendship') || d.includes('affection')) return 'friendship';
  if (d.includes('level')) return 'level';
  return 'special';
}

console.log('Fetching evolution chains from PokéAPI…');
const cursor = { i: 1 };
const families = new Map();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(cursor, 550, families)));

// Only keep families whose species are in the national dex range we track.
const lines = [];
let kept = 0;
const sorted = [...families.values()].sort((a, b) => a.familyId - b.familyId);
for (const fam of sorted) {
  const inRange = fam.stages.filter((s) => s.pokemonId >= 1 && s.pokemonId <= TOTAL_DEX);
  if (inRange.length < 2) continue;
  kept++;
  lines.push(`  { familyId: ${fam.familyId}, stages: [\n${inRange.map((s) => `    { pokemonId: ${s.pokemonId}, speciesName: ${JSON.stringify(s.speciesName)}, stage: ${s.stage}, trigger: ${JSON.stringify(s.trigger)}, detail: ${JSON.stringify(s.detail)} },`).join('\n')}\n  ] },`);
}

const out = `/**
 * AUTO-GENERATED by scripts/fetchEvolutions.mjs — do not edit by hand.
 *
 * Complete evolution families for National Dex #1–${TOTAL_DEX} from PokéAPI's
 * evolution-chain endpoint. Merged behind the curated families in
 * pokemonEvolutionData.ts (curated entries win per species id).
 */
export const GENERATED_EVOLUTION_FAMILIES = [
${lines.join('\n')}
];
`;

const dest = join(ROOT, 'src', 'data', 'evolutionFamilies.generated.ts');
writeFileSync(dest, out);
console.log(`Wrote ${dest}: ${kept} families covering ${new Set(sorted.flatMap((f) => f.stages.map((s) => s.pokemonId))).size} species`);
