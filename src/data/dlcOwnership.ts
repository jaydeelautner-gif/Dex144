import type { DlcId, GameId } from './pokemonData';
import { AREA_UNLOCKS } from './areaUnlocks.generated';

/** One ownership rule shared by checklists, completion counts and access checks. */
export const DLC_MILESTONE_PACK: Record<string, DlcId> = {
  'swsh-ioa': 'swsh-isle-of-armor',
  'swsh-ct': 'swsh-crown-tundra',
  'sv-dlc-teal': 'sv-teal-mask',
  'sv-dlc-indigo': 'sv-indigo-disk',
};
export function isMilestoneOwned(id: string, ownedDlcs: readonly DlcId[]): boolean {
  const pack = DLC_MILESTONE_PACK[id];
  return !pack || ownedDlcs.includes(pack);
}
const AREA_PACKS: Array<[DlcId, RegExp]> = [
  ['swsh-isle-of-armor', /isle-?of-?armor|fields-?of-?honor|soothing-?wetlands|forest-?of-?focus|challenge-?(beach|road)|brawlers-?cave|courageous-?cavern|loop-?lagoon|training-?lowlands|warm-?up-?tunnel|potbottom|workout-?sea|stepping-?stone-?sea|honeycalm|insular-?sea|master-?dojo|tower-?of-?(darkness|waters)/],
  ['swsh-crown-tundra', /crown-?tundra|freezington|frostpoint|giants-?bed|old-?cemetery|snowslide|tunnel-?to-?the-?top|path-?to-?the-?peak|crown-?shrine|giants-?foot|roaring-?sea|frigid-?sea|three-?point-?pass|ballimere|dyna-?tree|max-?lair/],
  ['sv-teal-mask', /kitakami|mossui|oni-?mountain|apple-?hills|loyalty-?plaza|timeless-?woods|wistful-?fields|fellhorn|oni-?maw|infernal-?pass|crystal-?pool|revelers-?road/],
  ['sv-indigo-disk', /blueberry|terarium|savanna-?biome|coastal-?biome|canyon-?biome|polar-?biome|chargestone-?cavern|torchlit-?labyrinth/],
];
export function dlcForArea(gameId: GameId, area: string): DlcId | null {
  const group = ['sword','shield','swsh'].includes(gameId) ? 'swsh' : ['scarlet','violet','sv'].includes(gameId) ? 'sv' : null;
  if (!group) return null;
  const milestone = AREA_UNLOCKS[group]?.[area];
  if (milestone && DLC_MILESTONE_PACK[milestone]) return DLC_MILESTONE_PACK[milestone];
  return AREA_PACKS.find(([pack, pattern]) => pack.startsWith(group+'-') && pattern.test(area))?.[0] ?? null;
}
export function isAreaOwned(gameId: GameId, area: string, ownedDlcs: readonly DlcId[] = []): boolean {
  const pack = dlcForArea(gameId, area);
  return !pack || ownedDlcs.includes(pack);
}
