import type { DlcId, GameId } from '../data/pokemonData';
import { isAreaOwned } from '../data/dlcOwnership';

/**
 * Whether a wild encounter is realistically available to the player right now.
 *
 * Two things are checked, both taken from the verified bundle rather than from
 * badge heuristics:
 *
 *  1. Story gate — PokéAPI records `story-progress-*` condition values on the
 *     encounter row itself. Rows flagged `story-progress-hall-of-fame` (and the
 *     National Dex equivalents) only appear after the main story is finished,
 *     so they must not count as "available now" for an early-game player.
 *
 *  2. Catch-level cap — Sword/Shield (and the Wild Area specifically) refuse to
 *     let you throw a ball at a Pokémon above a level that rises with badges:
 *     no badges = 20, then 25/30/35/40/45/50/55/100. A row is reachable when
 *     its *lowest* spawn is at or below the cap. Other games let you catch any
 *     level, so they have no cap here.
 */

/** Maximum catchable level by number of badges earned, per trackable group. */
export const CATCH_LEVEL_CAPS: Record<string, number[]> = {
  // Sword/Shield: documented cap per badge (index = badges earned, 0..8).
  swsh: [20, 25, 30, 35, 40, 45, 50, 55, 100],
};

/** Condition values that mark an encounter as post-main-story only. */
export const POST_GAME_CONDITIONS = new Set([
  'story-progress-hall-of-fame',
  'story-progress-national-dex',
  'story-progress-beat-red',
  'story-progress-beat-elite-four-round-two',
  'story-progress-awakened-beasts',
]);

export interface CatchabilityContext {
  /** Trackable group id, e.g. 'swsh'. */
  group: string;
  /** Badges/trials marked complete for that group. */
  badges: number;
  /** True once the group's main story is complete (champion defeated). */
  storyComplete: boolean;
  /** Owned DLC, so expansion-only rows are excluded until owned. */
  ownedDlcs?: readonly DlcId[];
  /** Game being checked (canonical id), for DLC area ownership. */
  gameId?: GameId;
}

interface EncounterRow {
  l: [number, number] | number[];
  cd?: string[];
  m?: string;
}

/** Highest level catchable with this many badges (Infinity when uncapped). */
export function catchLevelCap(group: string, badges: number): number {
  const caps = CATCH_LEVEL_CAPS[group];
  if (!caps) return Infinity;
  return caps[Math.min(Math.max(badges, 0), caps.length - 1)];
}

/** True when the row is not restricted to after the main story. */
export function isMainStoryRow(row: EncounterRow): boolean {
  return !(row.cd ?? []).some((c) => POST_GAME_CONDITIONS.has(c));
}

/** True when this individual encounter row is obtainable right now. */
export function isRowCatchableNow(
  row: EncounterRow,
  ctx: CatchabilityContext,
  area?: string
): boolean {
  if (ctx.gameId && area && !isAreaOwned(ctx.gameId, area, ctx.ownedDlcs ?? [])) return false;
  // A finished story lifts both the story gates and the level restriction.
  if (ctx.storyComplete) return true;
  if (!isMainStoryRow(row)) return false;
  return row.l[0] <= catchLevelCap(ctx.group, ctx.badges);
}

/** How many badges are marked complete for a group. */
export function countBadges(
  milestones: { id: string; type: string }[],
  completed: ReadonlySet<string>
): number {
  return milestones.filter((m) => m.type === 'badge' && completed.has(m.id)).length;
}

/** True once the group's champion/story milestone is done. */
export function isStoryComplete(
  milestones: { id: string; type: string }[],
  completed: ReadonlySet<string>
): boolean {
  return milestones.some((m) => m.type === 'story' && m.id.endsWith('-champion') && completed.has(m.id));
}
