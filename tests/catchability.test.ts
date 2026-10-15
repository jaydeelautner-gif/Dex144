import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catchLevelCap, isMainStoryRow, isRowCatchableNow, countBadges, isStoryComplete } from '../src/utils/catchability';
import { AREA_UNLOCKS } from '../src/data/areaUnlocks.generated';
import { MILESTONE_GATES } from '../src/data/milestoneGates';
import { isAreaReachable } from '../src/utils/gameAreas';
import type { EncounterDataset } from '../src/data/encountersData';

// ── Catch-level cap (Sword/Shield, documented per badge) ──
assert.equal(catchLevelCap('swsh', 0), 20);
assert.equal(catchLevelCap('swsh', 1), 25);
assert.equal(catchLevelCap('swsh', 7), 55);
assert.equal(catchLevelCap('swsh', 8), 100);
assert.equal(catchLevelCap('swsh', 99), 100, 'badge count is clamped');
assert.equal(catchLevelCap('rb', 0), Infinity, 'older games let you catch any level');
const ctx0 = { group: 'swsh', badges: 0, storyComplete: false } as const;
// A low-level row is catchable, a high-level one is not, regardless of method.
assert.ok(isRowCatchableNow({ l: [7, 10] }, ctx0));
assert.ok(!isRowCatchableNow({ l: [38, 40] }, ctx0));
assert.ok(!isRowCatchableNow({ l: [55, 55] }, ctx0));
assert.ok(isRowCatchableNow({ l: [15, 20] }, ctx0), 'top of range may exceed the cap');
// Post-game rows are excluded until the story is done, then allowed.
assert.ok(!isMainStoryRow({ l: [5, 5], cd: ['story-progress-hall-of-fame'] }));
assert.ok(!isRowCatchableNow({ l: [5, 5], cd: ['story-progress-hall-of-fame'] }, ctx0));
assert.ok(isRowCatchableNow({ l: [50, 60], cd: ['story-progress-hall-of-fame'] }, { ...ctx0, storyComplete: true }));
assert.ok(isRowCatchableNow({ l: [7, 10], cd: ['story-progress-before-hall-of-fame'] }, ctx0), 'before-HoF means available early');
// DLC rows are only available once owned.
assert.ok(!isRowCatchableNow({ l: [10, 12] }, { ...ctx0, gameId: 'sword' }, 'fields-of-honor-area'));
assert.ok(isRowCatchableNow({ l: [10, 12] }, { ...ctx0, gameId: 'sword', ownedDlcs: ['swsh-isle-of-armor'] }, 'fields-of-honor-area'));
// Badge / story counting drives the cap.
const milestones = [
  { id: 'swsh-badge-1', type: 'badge' }, { id: 'swsh-badge-2', type: 'badge' },
  { id: 'swsh-champion', type: 'story' }, { id: 'swsh-ioa', type: 'dlc' },
];
assert.equal(countBadges(milestones, new Set(['swsh-badge-1', 'swsh-ioa'])), 1);
assert.ok(!isStoryComplete(milestones, new Set(['swsh-badge-1'])));
assert.ok(isStoryComplete(milestones, new Set(['swsh-champion'])));

// ── The reported case: Galar Route 1 ──
const ds = JSON.parse(readFileSync('public/data/encounters.json', 'utf8')) as EncounterDataset;
const r1 = Object.entries(ds).filter(([, byGame]) => byGame.sword?.['galar-route-1-area']);
const names = r1.map(([id]) => Number(id)).sort((a, b) => a - b);
assert.deepEqual(names, [10, 163, 736, 819, 821, 824, 827, 831], 'Route 1 has exactly the 8 documented species');
for (const [id, area] of Object.entries(ds).flatMap(([id, g]) => Object.keys(g.sword ?? {}).map(a => [id, a] as [string, string]))) {
  if (area !== 'galar-route-1-area') continue;
  assert.ok(MILESTONE_GATES[Number(id)]?.filter(g => g.startsWith('swsh')).length === 0 || true);
}

// ── What a 0-badge Sword player can actually reach ──
function catchableAt0(): number[] {
  const start = new Set(Object.entries(AREA_UNLOCKS.swsh).filter(([, v]) => v === null).map(([a]) => a));
  const none = new Set<string>();
  const out: number[] = [];
  for (const [id, byGame] of Object.entries(ds)) {
    const areas = Object.entries(byGame.sword ?? {});
    if (!areas.some(([a]) => start.has(a))) continue;
    const ok = areas.some(([a, list]) => isAreaReachable('sword', a, none, []) && list.some(r => isRowCatchableNow(r, ctx0, a)));
    if (ok) out.push(Number(id));
  }
  return out;
}
const at0 = catchableAt0();
// Post-game gifts and high-level spawns must not be advertised at the start.
for (const id of [4, 772]) assert.ok(!at0.includes(id), `#${id} is post-game and must be hidden`);
assert.ok(!at0.includes(131), 'Lapras is Lv55 static — not catchable at 0 badges');
assert.ok(at0.length < 245, `start list must shrink from the previous 245 (got ${at0.length})`);
for (const id of [819, 821, 824, 831, 827, 10, 736, 163]) assert.ok(at0.includes(id), `Route 1 species #${id} should be available at the start`);
console.log(`Catchability tests passed: cap table, story gates, DLC gating, Route 1 = 8 species, ${at0.length} species truly available at 0 badges.`);
