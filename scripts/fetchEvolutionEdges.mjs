import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
async function json(url) {
  for (let n = 0; n < 3; n++) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw Error(`${url}: ${r.status}`); return await r.json(); }
    catch (e) { if (n === 2) throw e; }
  }
}
const list = await json('https://pokeapi.co/api/v2/evolution-chain?limit=2000');
const edges = []; let cursor = 0;
const id = s => Number(s.url.match(/\/(\d+)\/$/)[1]);
function walk(node) {
  for (const child of node.evolves_to) {
    if (id(node.species) <= 1025 && id(child.species) <= 1025) {
      edges.push({ from: id(node.species), to: id(child.species), conditions: child.evolution_details.map(d => ({
        trigger: d.trigger?.name ?? 'special', gender: d.gender ?? null,
        level: d.min_level ?? null, item: d.item?.name ?? null, heldItem: d.held_item?.name ?? null,
        time: d.time_of_day || null, move: d.known_move?.name ?? null,
        happiness: d.min_happiness ?? null, location: d.location?.name ?? null,
      })) });
    }
    walk(child);
  }
}
await Promise.all(Array.from({ length: 8 }, async () => {
  while (cursor < list.results.length) { const item = list.results[cursor++]; walk((await json(item.url)).chain); }
}));
edges.sort((a,b) => a.from-b.from || a.to-b.to);
writeFileSync(new URL('src/data/evolutionEdges.generated.ts', root), `// Generated from PokéAPI evolution-chain; run node scripts/fetchEvolutionEdges.mjs.\n// Direct parent edges preserve branches (siblings are NEVER evolutions of one another).\nexport const EVOLUTION_EDGES = ${JSON.stringify(edges, null, 2)};\n`);
// Keep the server's direct-edge validation table synchronized with the client.
const next = {};
for (const e of edges) (next[e.from] ??= []).push(e.to);
const rulesUrl = new URL('firestore.rules', root);
const rules = readFileSync(rulesUrl, 'utf8');
const updatedRules = rules.replace(/(function isDirectEvolution\(fromId, toId\) \{\s*let next = )[^\n]+;/, (_, prefix) => `${prefix}${JSON.stringify(next)};`);
if (updatedRules === rules && !rules.includes(`let next = ${JSON.stringify(next)};`)) throw Error('Cannot synchronize Firestore evolution graph; update isDirectEvolution first.');
writeFileSync(rulesUrl, updatedRules);
console.log(`Wrote ${edges.length} direct evolution edges from ${list.results.length} chains.`);
