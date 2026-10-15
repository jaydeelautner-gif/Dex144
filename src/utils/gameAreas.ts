import { useMemo } from 'react';
import { AREA_UNLOCKS } from '../data/areaUnlocks.generated';
import { GAME_ID_TO_TRACKABLE, GROUP_MEMBER_GAMES, milestonesFor } from '../data/milestones';
import type { GameId } from '../data/pokemonData';
import {
  useEncounterDataset,
  getEncountersForGame,
  prettifyAreaName,
  prettyEncounterMethod,
  type EncounterDataset,
} from '../data/encountersData';

export interface GameArea {
  /** Raw location-area name from the verified bundle. */
  area: string;
  /** Unlock milestone id, or null when reachable from the game's start. */
  milestoneId: string | null;
  /** Human-readable unlock text, e.g. "Gym 3 — Goldenrod". */
  unlockLabel: string;
  /** Concise chip text, e.g. "Badge 3" (falls back to unlockLabel). */
  unlockShort: string;
  unlocked: boolean;
}

export interface AreaSpeciesRow {
  pokemonId: number;
  methods: string[];
  minLevel: number;
  maxLevel: number;
  maxChance: number;
}

/**
 * Areas of a game that have recorded encounters, each mapped to the milestone
 * that unlocks it. Ordered by unlock progression (start first, then badge
 * order) so the Progress tab reads like a route guide.
 */
export function getGameAreas(
  dataset: EncounterDataset | null,
  gameId: GameId,
  completedMilestones: Set<string>
): GameArea[] {
  if (!dataset) return [];
  const group = (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[gameId];
  if (!group) return [];
  const unlocks = AREA_UNLOCKS[group] ?? {};
  const members = GROUP_MEMBER_GAMES[group] ?? [];
  const order = new Map(milestonesFor(group).map((m, i) => [m.id, i]));
  const labels = new Map(milestonesFor(group).map((m) => [m.id, m.label]));
  const shorts = new Map(milestonesFor(group).map((m) => [m.id, m.short]));

  // Only areas that actually have encounters in the selected game.
  const areasWithRows = new Set<string>();
  for (const species of Object.values(dataset)) {
    for (const member of members) {
      const rows = species[member];
      if (!rows) continue;
      for (const area of Object.keys(rows)) areasWithRows.add(area);
    }
  }

  return [...areasWithRows]
    .map((area) => {
      const milestoneId = unlocks[area] ?? null;
      return {
        area,
        milestoneId,
        unlockLabel: milestoneId ? labels.get(milestoneId) ?? milestoneId : 'Available from the start',
        unlockShort: milestoneId ? shorts.get(milestoneId) ?? labels.get(milestoneId) ?? milestoneId : 'From the start',
        unlocked: milestoneId === null || completedMilestones.has(milestoneId),
      };
    })
    .sort((a, b) => {
      const ai = a.milestoneId ? order.get(a.milestoneId) ?? 999 : -1;
      const bi = b.milestoneId ? order.get(b.milestoneId) ?? 999 : -1;
      if (ai !== bi) return ai - bi;
      return prettifyAreaName(a.area).localeCompare(prettifyAreaName(b.area));
    });
}

/** Species catchable in one area of one game, summarised from verified rows. */
export function getAreaSpecies(
  dataset: EncounterDataset | null,
  gameId: GameId,
  area: string
): AreaSpeciesRow[] {
  if (!dataset) return [];
  const group = (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[gameId];
  const members = group ? GROUP_MEMBER_GAMES[group] ?? [] : [];
  const rows: AreaSpeciesRow[] = [];
  for (const [idStr, byGame] of Object.entries(dataset)) {
    const pokemonId = Number(idStr);
    let minLevel = Infinity;
    let maxLevel = 0;
    let maxChance = 0;
    const methods = new Set<string>();
    for (const member of members) {
      const details = byGame[member]?.[area];
      if (!details) continue;
      for (const d of details) {
        methods.add(prettyEncounterMethod(d.m));
        minLevel = Math.min(minLevel, d.l[0]);
        maxLevel = Math.max(maxLevel, d.l[1]);
        maxChance = Math.max(maxChance, d.c);
      }
    }
    if (methods.size > 0) {
      rows.push({ pokemonId, methods: [...methods], minLevel, maxLevel, maxChance });
    }
  }
  return rows.sort((a, b) => b.maxChance - a.maxChance || a.pokemonId - b.pokemonId);
}

/** Hook wrapper: loads the verified bundle once per session. */
export function useGameAreas(gameId: GameId, completedMilestones: Set<string>) {
  const { dataset, loading } = useEncounterDataset();
  const areas = useMemo(
    () => getGameAreas(dataset, gameId, completedMilestones),
    [dataset, gameId, completedMilestones]
  );
  return { areas, dataset, loading };
}
