import { readFileSync } from 'node:fs';
const enc = JSON.parse(readFileSync('public/data/encounters.json', 'utf8'));
// crude: list areas per game and flag ones containing only species that ended up ungated
// instead, simply list ALL areas per game not matching obvious route/city patterns for manual review
const g = process.argv[2];
const areas = new Set();
for (const byGame of Object.values(enc)) {
  for (const a of Object.keys(byGame[g] ?? {})) areas.add(a);
}
console.log([...areas].sort().join('\n'));
