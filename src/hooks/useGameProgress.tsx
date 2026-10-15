import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameId, DlcId } from '../data/pokemonData';
import { TRACKABLE_GAMES, applicableCompletedMilestones, milestonesFor } from '../data/milestones';
import { isMilestoneOwned } from '../data/dlcOwnership';

const LS_PROGRESS_KEY = 'homedex_v4_game_progress';
const LS_TRACKED_GAMES_KEY = 'homedex_v4_tracked_games';
const LS_STARTER_CHOICES_KEY = 'homedex_v4_starter_choices';

export type ProgressState = Record<string, string[]>;

const EMPTY: ProgressState = TRACKABLE_GAMES.reduce((acc, id) => {
  acc[id] = [];
  return acc;
}, {} as ProgressState);

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(LS_PROGRESS_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return TRACKABLE_GAMES.reduce((acc, id) => {
      acc[id] = Array.isArray(parsed[id]) ? parsed[id]! : [];
      return acc;
    }, {} as ProgressState);
  } catch {
    return EMPTY;
  }
}

function loadTrackedGames(): GameId[] {
  try {
    const raw = localStorage.getItem(LS_TRACKED_GAMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((g): g is GameId => TRACKABLE_GAMES.includes(g));
  } catch {
    return [];
  }
}

function loadStarterChoices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_STARTER_CHOICES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === 'number')
    ) as Record<string, number>;
  } catch {
    return {};
  }
}

export function useGameProgress(ownedDlcs: readonly DlcId[] = []) {
  const [savedProgress, setProgress] = useState<ProgressState>(() => loadProgress());
  const progress = useMemo(() => Object.fromEntries(TRACKABLE_GAMES.map(id => [id, applicableCompletedMilestones(id, savedProgress[id] ?? [], ownedDlcs)])), [savedProgress, ownedDlcs]);
  const [starterChoices, setStarterChoices] = useState<Record<string, number>>(
    () => loadStarterChoices()
  );
  const [trackedGames, setTrackedGames] = useState<Set<GameId>>(
    () => new Set(loadTrackedGames())
  );

  useEffect(() => {
    try {
      localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(savedProgress));
    } catch { /* ignore */ }
  }, [savedProgress]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TRACKED_GAMES_KEY, JSON.stringify([...trackedGames]));
    } catch { /* ignore */ }
  }, [trackedGames]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_STARTER_CHOICES_KEY, JSON.stringify(starterChoices));
    } catch { /* ignore */ }
  }, [starterChoices]);

  const toggleMilestone = useCallback((gameId: GameId, milestoneId: string) => {
    if (!milestonesFor(gameId, ownedDlcs).some(m => m.id === milestoneId)) return;
    setProgress((prev) => {
      const current = prev[gameId] ?? [];
      const next = current.includes(milestoneId)
        ? current.filter((id) => id !== milestoneId)
        : [...current, milestoneId];
      return { ...prev, [gameId]: next };
    });
  }, [ownedDlcs]);

  const resetGame = useCallback((gameId: GameId) => {
    setProgress((prev) => ({ ...prev, [gameId]: [] }));
  }, []);

  /**
   * Restart a game: clears milestones AND the starter choice so the starter
   * selection can be made again. Registered PokéPets, catches and inventory are
   * deliberately untouched — only progression is reset.
   */
  const restartGame = useCallback((gameId: GameId) => {
    setProgress((prev) => ({ ...prev, [gameId]: [] }));
    setStarterChoices((prev) => {
      if (!(gameId in prev)) return prev;
      const next = { ...prev };
      delete next[gameId];
      return next;
    });
  }, []);

  const completeAll = useCallback((gameId: GameId, milestoneIds: string[]) => {
    setProgress((prev) => ({ ...prev, [gameId]: [
      ...(prev[gameId] ?? []).filter(id => !isMilestoneOwned(id, ownedDlcs)),
      ...applicableCompletedMilestones(gameId, milestoneIds, ownedDlcs),
    ] }));
  }, [ownedDlcs]);

  const chooseStarter = useCallback((gameGroup: string, dexId: number) => {
    setStarterChoices((prev) => ({ ...prev, [gameGroup]: dexId }));
  }, []);

  const clearStarterChoice = useCallback((gameGroup: string) => {
    setStarterChoices((prev) => {
      const next = { ...prev };
      delete next[gameGroup];
      return next;
    });
  }, []);

  const toggleTracking = useCallback((gameId: GameId) => {
    setTrackedGames((prev) => {
      const next = new Set(prev);
      next.has(gameId) ? next.delete(gameId) : next.add(gameId);
      return next;
    });
  }, []);

  /** Merge all tracked games' completed milestone IDs into one Set for O(1) lookup. */
  const mergedCompletedSet = useMemo(() => {
    const s = new Set<string>();
    for (const gId of trackedGames) {
      for (const mId of progress[gId] ?? []) s.add(mId);
    }
    return s;
  }, [progress, trackedGames]);

  return {
    progress,
    trackedGames,
    starterChoices,
    mergedCompletedSet,
    toggleMilestone,
    toggleTracking,
    resetGame,
    restartGame,
    completeAll,
    chooseStarter,
    clearStarterChoice,
  };
}