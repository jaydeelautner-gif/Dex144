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

/**
 * Whether a single named area is reachable given the milestones completed for
 * a game. Areas with no unlock milestone (reachable from the start) are always
 * available; a game with no progression data is treated as fully accessible so
 * we never hide real locations we cannot classify.
 */
export function isAreaReachable(
  gameId: GameId,
  area: string,
  completedMilestones: Set<string>
): boolean {
  const group = (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[gameId];
  if (!group) return true;
  const unlocks = AREA_UNLOCKS[group];
  if (!unlocks) return true;
  if (!(area in unlocks)) return true; // unknown area: do not hide it
  const milestone = unlocks[area];
  if (milestone === null) return true;
  return completedMilestones.has(milestone);
}

/** The milestone that unlocks an area, or null when reachable from the start. */
export function areaUnlockMilestone(gameId: GameId, area: string): string | null {
  const group = (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[gameId];
  if (!group) return null;
  return AREA_UNLOCKS[group]?.[area] ?? null;
}

/** Weather conditions recorded for wild spawns, with player-facing labels. */
export const WEATHER_CONDITIONS: { id: string; label: string }[] = [
  { id: 'weather-normal', label: 'Any weather' },
  { id: 'weather-intense-sun', label: 'Intense sun' },
  { id: 'weather-overcast', label: 'Overcast' },
  { id: 'weather-raining', label: 'Rain' },
  { id: 'weather-thunderstorm', label: 'Thunderstorm' },
  { id: 'weather-rainstorm', label: 'Rainstorm' },
  { id: 'weather-drought', label: 'Drought' },
  { id: 'weather-snowing', label: 'Snowing' },
  { id: 'weather-snowstorm', label: 'Snowstorm' },
  { id: 'weather-sandstorm', label: 'Sandstorm' },
  { id: 'weather-fog', label: 'Fog' },
];

const WEATHER_IDS = new Set(WEATHER_CONDITIONS.map((w) => w.id));

/** Weather options actually present in a game's data, in display order. */
export function weatherForGame(dataset: EncounterDataset | null, gameId: GameId): string[] {
  if (!dataset) return [];
  const group = (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[gameId];
  const members = group ? GROUP_MEMBER_GAMES[group] ?? [] : [];
  const found = new Set<string>();
  for (const byGame of Object.values(dataset)) {
    for (const member of members) {
      const rows = byGame[member];
      if (!rows) continue;
      for (const list of Object.values(rows)) {
        for (const row of list) {
          for (const cond of row.cd ?? []) if (WEATHER_IDS.has(cond)) found.add(cond);
        }
      }
    }
  }
  return WEATHER_CONDITIONS.map((w) => w.id).filter((id) => found.has(id));
}

/**
 * Areas in a game that spawn at least one species under the given weather.
 * Used to populate the area picker for the weather filter.
 */
export function areasForWeather(
  dataset: EncounterDataset | null,
  gameId: GameId,
  weatherId: string
): string[] {
  if (!dataset) return [];
  const group = (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[gameId];
  const members = group ? GROUP_MEMBER_GAMES[group] ?? [] : [];
  const areas = new Set<string>();
  for (const byGame of Object.values(dataset)) {
    for (const member of members) {
      const rows = byGame[member];
      if (!rows) continue;
      for (const [area, list] of Object.entries(rows)) {
        if (list.some((row) => (row.cd ?? []).includes(weatherId))) areas.add(area);
      }
    }
  }
  return [...areas].sort((a, b) => prettifyAreaName(a).localeCompare(prettifyAreaName(b)));
}

export interface WeatherSpawnRow {
  pokemonId: number;
  methods: string[];
  minLevel: number;
  maxLevel: number;
  maxChance: number;
}

/**
 * Uncaught species obtainable in one area under one weather condition.
 * The weather must apply to the specific encounter row, so a species that only
 * spawns in other weather is correctly excluded.
 */
export function speciesForWeather(
  dataset: EncounterDataset | null,
  gameId: GameId,
  area: string,
  weatherId: string,
  isUncaught: (pokemonId: number) => boolean
): WeatherSpawnRow[] {
  if (!dataset) return [];
  const group = (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[gameId];
  const members = group ? GROUP_MEMBER_GAMES[group] ?? [] : [];
  const rows: WeatherSpawnRow[] = [];
  for (const [idStr, byGame] of Object.entries(dataset)) {
    const pokemonId = Number(idStr);
    if (!isUncaught(pokemonId)) continue;
    let minLevel = Infinity;
    let maxLevel = 0;
    let maxChance = 0;
    const methods = new Set<string>();
    for (const member of members) {
      const list = byGame[member]?.[area];
      if (!list) continue;
      for (const row of list) {
        if (!(row.cd ?? []).includes(weatherId)) continue;
        methods.add(prettyEncounterMethod(row.m));
        minLevel = Math.min(minLevel, row.l[0]);
        maxLevel = Math.max(maxLevel, row.l[1]);
        maxChance = Math.max(maxChance, row.c);
      }
    }
    if (methods.size > 0) rows.push({ pokemonId, methods: [...methods], minLevel, maxLevel, maxChance });
  }
  return rows.sort((a, b) => b.maxChance - a.maxChance || a.pokemonId - b.pokemonId);
}
