import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLockedStarterLineIds } from '../src/utils/starterAlternates';
import { buildInitialNationalDex } from '../src/data/pokemonData';
import type { EncounterDataset } from '../src/data/encountersData';
const ds = JSON.parse(readFileSync('public/data/encounters.json', 'utf8')) as EncounterDataset;
const dex = buildInitialNationalDex();
const av = (id: number) => dex.find(p => p.id === id)!.availability;
// Locked groups: gift-only starters → the other lines are trade-only.
for (const [game, chosen] of [['red',4],['gold',155],['emerald',252],['diamond',390],['black',498],['black2',498],['x',653],['sun',725],['ultrasun',725],['scarlet',909]] as any[][]) {
  const locked = getLockedStarterLineIds(game as any, chosen as number, ds, [], av as any);
  assert.ok(locked.length > 0, `${game}: expected locked starter lines`);
}
// Sword/Shield: locked without the expansion, unlocked once Isle of Armor is owned.
const so = { gameId: 'sword' as const };
assert.ok(getLockedStarterLineIds('sword' as any, 810, ds, [], av as any).length > 0, 'SwSh starters are trade-only without the DLC');
assert.equal(getLockedStarterLineIds('sword' as any, 810, ds, ['swsh-isle-of-armor'] as any, av as any).length, 0, 'IoA raid dens unlock them');
// Not locked: LGPE overworld spawns, PLA distortion rows.
assert.ok(getLockedStarterLineIds('lge' as any, 1, ds, [], av as any).length === 0, 'LGPE starters are wild-catchable');
assert.ok(getLockedStarterLineIds('pla' as any, 155, ds, [], av as any).length === 0, 'PLA starters return via distortions');
// No choice yet → nothing is locked.
assert.deepEqual(getLockedStarterLineIds('red' as any, undefined, ds, [], av as any), []);
console.log('Starter-lock tests passed: 11 groups lock the unchosen starters; LGPE/PLA do not; no choice locks nothing.');
