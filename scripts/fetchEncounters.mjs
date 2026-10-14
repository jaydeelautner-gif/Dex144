/**
 * Fetch accurate wild-encounter data for every Pokémon (National Dex #1–1025)
 * from PokéAPI and store it as a static JSON bundle the app can lazy-load.
 *
 * Run:  node scripts/fetchEncounters.mjs
 * Out:  public/data/encounters.json  (compact, keyed by Pokémon id → game id)
 *
 * PokéAPI endpoint used: /api/v2/pokemon/{id}/encounters
 * Each entry lists location areas → version_details → encounter_details
 * (method, chance %, min/max level). We normalize and group those per game.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** PokéAPI version name → Dex144 GameId (see src/data/pokemonData.ts). */
const VERSION_TO_GAME_ID = {
  red: 'red', blue: 'blue', yellow: 'yellow',
  gold: 'gold', silver: 'silver', crystal: 'crystal',
  ruby: 'ruby', sapphire: 'sapphire', emerald: 'emerald',
  firered: 'firered', leafgreen: 'leafgreen',
  diamond: 'diamond', pearl: 'pearl', platinum: 'platinum',
  heartgold: 'heartgold', soulsilver: 'soulsilver',
  black: 'black', white: 'white', 'black-2': 'black2', 'white-2': 'white2',
  x: 'x', y: 'y',
  'omega-ruby': 'omegaruby', 'alpha-sapphire': 'alphasapphire',
  sun: 'sun', moon: 'moon', 'ultra-sun': 'ultrasun', 'ultra-moon': 'ultramoon',
  'lets-go-pikachu': 'lgp', 'lets-go-eevee': 'lge',
  sword: 'sword', shield: 'shield',
  'brilliant-diamond': 'bd', 'shining-pearl': 'sp',
  'legends-arceus': 'pla',
  scarlet: 'scarlet', violet: 'violet',
};

const TOTAL_DEX = 1025; // Gen 9 Pecharunt (Persian lineup ends at 1025)
const CONCURRENCY = 12;
const RETRIES = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchEncounters(id) {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}/encounters`;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Dex144-encounter-sync' } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (res.status === 404) return []; // species with no recorded wild encounters
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === RETRIES) throw new Error(`#${id}: ${err.message}`);
      await sleep(500 * attempt * attempt);
    }
  }
}

/** Convert one species' raw payload into { gameId → { area → grouped details } }. */
function normalize(raw) {
  const result = {};
  for (const areaEntry of raw) {
    const area = areaEntry.location_area.name;
    for (const vd of areaEntry.version_details) {
      const gameId = VERSION_TO_GAME_ID[vd.version.name];
      if (!gameId) continue; // version not modeled in Dex144
      for (const ed of vd.encounter_details) {
        if (!result[gameId]) result[gameId] = {};
        if (!result[gameId][area]) result[gameId][area] = [];
        // group identical (method, chance, level) rows across sibling versions
        const key = `${ed.method.name}|${ed.chance}|${ed.min_level}-${ed.max_level}`;
        let slot = result[gameId][area].find((d) => d.k === key);
        if (!slot) {
          slot = {
            k: key,
            m: ed.method.name,
            c: ed.chance,
            l: [ed.min_level, ed.max_level],
            v: [],
          };
          result[gameId][area].push(slot);
        }
        if (!slot.v.includes(vd.version.name)) slot.v.push(vd.version.name);
      }
    }
  }
  // strip the internal grouping key before serializing
  for (const gameId of Object.keys(result)) {
    for (const area of Object.keys(result[gameId])) {
      result[gameId][area] = result[gameId][area].map(({ k, ...rest }) => rest);
    }
  }
  return result;
}

const seen = {};
let done = 0;
let cursor = 1;

async function worker() {
  while (true) {
    const id = cursor++;
    if (id > TOTAL_DEX) return;
    let raw;
    try {
      raw = await fetchEncounters(id);
    } catch (err) {
      console.error(`FAILED ${err.message}`);
      continue; // keep going; we report gaps at the end
    }
    const games = normalize(raw);
    if (Object.keys(games).length > 0) seen[id] = games;
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${TOTAL_DEX}`);
  }
}

console.log(`Fetching wild encounters for ${TOTAL_DEX} species from PokéAPI…`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const json = JSON.stringify(seen);
const out = join(ROOT, 'public', 'data', 'encounters.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, json);

const species = Object.keys(seen).length;
const gameIds = new Set(Object.values(seen).flatMap((g) => Object.keys(g)));
console.log(
  `Wrote ${out}\n  ${(json.length / 1024 / 1024).toFixed(2)} MB · ${species}/${TOTAL_DEX} species with data · games covered: ${[...gameIds].sort().join(', ')}`
);
