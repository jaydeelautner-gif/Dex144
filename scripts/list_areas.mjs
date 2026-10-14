import { readFileSync } from 'node:fs';
const enc = JSON.parse(readFileSync('public/data/encounters.json', 'utf8'));
const areasByGame = {};
for (const [pid, byGame] of Object.entries(enc)) {
  for (const [g, areas] of Object.entries(byGame)) {
    areasByGame[g] ??= new Set();
    for (const a of Object.keys(areas)) areasByGame[g].add(a);
  }
}
const rep = process.argv[2];
const areas = [...(areasByGame[rep] ?? [])].sort();
console.log(areas.join('\n'));
