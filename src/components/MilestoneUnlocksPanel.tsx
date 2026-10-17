import { isAreaOwned } from '../data/dlcOwnership';
import { isRowCatchableNow, countBadges, isStoryComplete, type CatchabilityContext } from '../utils/catchability';
import { isAreaReachable } from '../utils/gameAreas';
import type { PokemonInstance } from '../data/pokemonInventoryData';
import { evolvedAwaySpecies } from '../utils/pokepetEvolution';
import { reacquisitionHint } from '../utils/reacquisition';
import React, { useMemo, useState } from 'react';
import { Trophy, Sparkles, Check, X, ArrowLeftRight } from 'lucide-react';
import type { GameId, PokemonEntry, DlcId, GameCatchesMap } from '../data/pokemonData';
import {
  GAME_META,
  GROUP_MEMBER_GAMES,
  GAME_ID_TO_TRACKABLE,
  STARTER_TRIOS,
  getOwnedTrackableGames,
  milestonesFor,
} from '../data/milestones';
import { getLockedDexNumbers } from '../data/milestoneGates';
import { useEncounterDataset, type EncounterDataset } from '../data/encountersData';
import { getEvolutionFamilyForPokemon } from '../data/pokemonEvolutionData';
import type { ProgressState } from '../hooks/useGameProgress';
import { PokemonSprite } from './PokemonSprite';
import {
  getUnchosenStarterLineIds,
  findAlternateAcquisitionLabel,
  normalizeStarterChoiceId,
} from '../utils/starterAlternates';
import { weatherForGame, timeForGame, areasForConditions, speciesForConditions, WEATHER_CONDITIONS, TIME_CONDITIONS } from '../utils/gameAreas';
import { prettifyAreaName } from '../data/encountersData';

interface MilestoneUnlocksPanelProps {
  progress: ProgressState;
  trackedGames: Set<GameId>;
  ownedGames: GameId[];
  dex: PokemonEntry[];
  caughtSet: Set<number>;
  starterChoices: Record<string, number>;
  onChooseStarter: (gameGroup: string, dexId: number) => void;
  onClearStarter: (gameGroup: string) => void;
  onSelectPokemon: (pokemon: PokemonEntry) => void;
  onNavigateToProgress: () => void;
  /** Restart this game (clears milestones + starter choice; keeps PokéPets). */
  onRestartGame?: (gameId: GameId) => void;
  /** Owned DLC ids — used to detect DLC alternate ways to get unchosen starters. */
  ownedDlcs: DlcId[];
  /** Per-game registered catches — drives per-game evolution suggestions. */
  gameCatches?: GameCatchesMap;
  inventory?: PokemonInstance[];
  /** The active Catch Hub game (canonical id). Evolution suggestions are
   *  computed for this game: species uncaught here whose lower stage IS
   *  caught here. */
  activeGameId?: GameId;
  /** Restrict the panel to a single trackable group (Catch Hub game tabs). */
  groupFilter?: string;
}

interface PanelRow {
  group: string;
  gameShort: string;
  accent: string;
  /** null → "available from the start" mode (no milestones yet). */
  lastMilestoneLabel: string | null;
  starterOptions: PokemonEntry[];
  chosenStarter: PokemonEntry | null;
  /** Unchosen starter-line species with NO alternate way in this game → trade only. */
  starterTradeOnly: PokemonEntry[];
  /** Unchosen starter-line species the game itself offers another way to get. */
  starterAlternates: { p: PokemonEntry; how: string }[];
  /** Species uncaught in the active game whose lower stage IS caught there
   *  — evolve the caught pre-evolution to obtain them. */
  evolutionSuggestions: { p: PokemonEntry; fromName: string; detail: string }[];
  startingSpecies: PokemonEntry[];
  startingSpeciesOverflow: number;
  startingEvolutionSpecies: PokemonEntry[];
  startingEvolutionOverflow: number;
  freshSpecies: PokemonEntry[];
  freshEvolutionSpecies: PokemonEntry[];
  freshEvolutionOverflow: number;
  /** True when wild-encounter filtering is active for this group. */
  wildFiltered: boolean;
}

const MAX_STARTING_GRID = 48;
const EMPTY_MILESTONES = new Set<string>();

/** Encounter methods that are direct wild captures (vs gifts, trades, events). */
const NON_WILD_METHODS = new Set([
  'gift', 'gift-egg', 'npc-trade',
  'colosseum-bonus-disc-jpn', 'colosseum-bonus-disc-us', 'pokemon-channel-pal',
]);

/**
 * "Trainer Hints" panel.
 *  • No badges yet in a tracked game → shows its three starters as a
 *    pick-one choice (the other two disappear once chosen) plus every
 *    uncaught species obtainable from the very start of that game.
 *  • Badges/milestones marked → shows uncaught species that the latest
 *    milestone just made catchable.
 */
export const MilestoneUnlocksPanel: React.FC<MilestoneUnlocksPanelProps> = ({
  progress,
  trackedGames,
  ownedGames,
  dex,
  caughtSet,
  starterChoices,
  onChooseStarter,
  onClearStarter,
  onSelectPokemon,
  onNavigateToProgress,
  onRestartGame,
  ownedDlcs,
  gameCatches,
  inventory = [],
  activeGameId,
  groupFilter,
}) => {
  // Wild-encounter bundle (PokéAPI) — used to hide evolution-only species.
  const { dataset: encounters } = useEncounterDataset();

  // Game ids that actually have encounter coverage in the bundle.
  const coveredGames = useMemo(() => {
    const covered = new Set<string>();
    if (encounters) {
      for (const byGame of Object.values(encounters)) {
        for (const g of Object.keys(byGame)) covered.add(g);
      }
    }
    return covered;
  }, [encounters]);

  /** A species is catchable in the wild if any member game has recorded
   *  encounters for it. Species with none are only obtainable by evolving
   *  something (or trading/events) and are excluded from Fresh Catches.
   *  Groups whose games lack encounter coverage (SV, BDSP, PLA, Colo, XD)
   *  can't be checked, so they are not filtered. */
  const isCatchableInWild = (p: PokemonEntry, members: GameId[]): boolean => {
    if (!encounters) return true;
    const anyCovered = members.some((g) => coveredGames.has(g));
    if (!anyCovered) return true;
    return members.some((g) => {
      const byArea = encounters[String(p.id)]?.[g];
      return !!byArea && Object.keys(byArea).some(area => isAreaOwned(g, area, ownedDlcs));
    });
  };

  /** True when the species has a recorded direct wild capture (walk, rods,
   *  surf, headbutt, dens, ambushes…) in one of the group's games. */
  const hasDirectWildCapture = (p: PokemonEntry, members: GameId[]): boolean => {
    if (!encounters) return true;
    return members.some((g) => {
      const byArea = encounters[String(p.id)]?.[g];
      if (!byArea) return false;
      return Object.entries(byArea).some(([area, rows]) =>
        isAreaOwned(g, area, ownedDlcs) && rows.some((r) => !NON_WILD_METHODS.has(r.m))
      );
    });
  };

  /** True when the species is a later-stage evolution (has pre-evolutions). */
  const hasPreEvolution = (p: PokemonEntry): boolean => {
    const family = getEvolutionFamilyForPokemon(p.id);
    const idx = family.stages.findIndex((s) => s.pokemonId === p.id);
    return idx > 0;
  };

  /** Split candidates into direct wild captures vs later-stage evolutions.
   *  Covered groups use the encounter-method data; groups without wild-encounter
   *  coverage (SV, BDSP, PLA…) fall back to the evolution-family heuristic. */
  const splitWildVsEvolution = (candidates: PokemonEntry[], members: GameId[]) => {
    const wild: PokemonEntry[] = [];
    const evolution: PokemonEntry[] = [];
    const covered = members.some((g) => coveredGames.has(g));
    for (const p of candidates) {
      const directWild = covered ? hasDirectWildCapture(p, members) : !hasPreEvolution(p);
      if (directWild || !hasPreEvolution(p)) wild.push(p);
      else evolution.push(p);
    }
    return { wild, evolution };
  };

  /**
   * Evolution suggestions for one game: species the trainer does NOT have
   * registered in that game, but whose lower stage IS registered there —
   * evolve the caught pre-evolution to obtain them. `excludeIds` filters
   * species already shown in the wild-catch grids of the same row.
   */
  const computeEvolutionSuggestions = (
    gameId: GameId,
    excludeIds: Set<number>
  ): { p: PokemonEntry; fromName: string; detail: string }[] => {
    // Registered PokéPets in this game (origin or current) plus explicit
    // per-game catch records — either source means the trainer has it there.
    const caughtInGame = new Set<number>(gameCatches?.[gameId] ?? []);
    for (const pet of inventory) {
      if ((pet.currentGameId ?? pet.gameId) === gameId) caughtInGame.add(pet.pokemonId);
    }
    if (caughtInGame.size === 0) return [];
    const out: { p: PokemonEntry; fromName: string; detail: string }[] = [];
    for (const p of dex) {
      if (caughtInGame.has(p.id)) continue; // already registered in this game
      if (excludeIds.has(p.id)) continue; // already suggested as a wild catch
      const family = getEvolutionFamilyForPokemon(p.id);
      const idx = family.stages.findIndex((s) => s.pokemonId === p.id);
      if (idx <= 0) continue; // no lower tier in this line
      let from: (typeof family.stages)[number] | null = null;
      for (let s = idx - 1; s >= 0; s--) {
        if (caughtInGame.has(family.stages[s].pokemonId)) {
          from = family.stages[s];
          break;
        }
      }
      if (!from) continue;
      const target = family.stages[idx];
      out.push({ p, fromName: from.speciesName, detail: target.detail || target.trigger });
    }
    out.sort((a, b) => a.p.id - b.p.id);
    return out.slice(0, MAX_STARTING_GRID);
  };

  const dexById = useMemo(() => new Map(dex.map((p) => [p.id, p])), [dex]);

  // Condition filter: weather and/or time of day (only where they matter).
  const [weather, setWeather] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const [conditionArea, setConditionArea] = useState<string>('');

  const weatherOptions = useMemo(
    () => (activeGameId ? weatherForGame(encounters, activeGameId, ownedDlcs) : []),
    [encounters, activeGameId, ownedDlcs]
  );
  const timeOptions = useMemo(
    () => (activeGameId ? timeForGame(encounters, activeGameId, ownedDlcs) : []),
    [encounters, activeGameId, ownedDlcs]
  );
  const conditionAreas = useMemo(
    () => (activeGameId && (weather || timeOfDay)
      ? areasForConditions(encounters, activeGameId, weather, timeOfDay, ownedDlcs)
      : []),
    [encounters, activeGameId, weather, timeOfDay, ownedDlcs]
  );
  const conditionSpawns = useMemo(
    () => (activeGameId && conditionArea
      ? speciesForConditions(encounters, activeGameId, conditionArea, weather, timeOfDay, (pid) => !caughtSet.has(pid), ownedDlcs)
      : []),
    [encounters, activeGameId, conditionArea, weather, timeOfDay, caughtSet, ownedDlcs]
  );

  const rows = useMemo<PanelRow[]>(() => {
    const dexById = new Map(dex.map((p) => [p.id, p]));
    const ownedGroups = getOwnedTrackableGames(ownedGames)
      .filter((g) => !groupFilter || g === groupFilter);
    const out: PanelRow[] = [];

    for (const group of ownedGroups) {
      const completedIds = progress[group] ?? [];
      const meta = GAME_META[group];
      const members = (GROUP_MEMBER_GAMES[group] ?? []).filter(id => ownedGames.includes(id));

      // Catchability right now: the bundle's own story-progress flags plus the
      // documented catch-level cap for the badges earned so far.
      const groupMilestones = milestonesFor(group, ownedDlcs);
      const completedSet = new Set(completedIds);
      const catchCtx: CatchabilityContext = {
        group,
        badges: countBadges(groupMilestones, completedSet),
        storyComplete: isStoryComplete(groupMilestones, completedSet),
        ownedDlcs,
      };
      const catchableNow = (p: PokemonEntry): boolean => {
        if (!encounters) return true; // no bundle yet — never hide on missing data
        return members.some((g) =>
          Object.entries(encounters[String(p.id)]?.[g] ?? {}).some(([area, list]) =>
            // The area itself must be unlocked (badge tier), not merely listed,
            // then the individual row must pass story + catch-level checks.
            isAreaReachable(g, area, completedSet, ownedDlcs) &&
            list.some((row) => isRowCatchableNow(row, { ...catchCtx, gameId: g }, area))
          )
        );
      };

      const startingCandidates: PokemonEntry[] = [];
      const freshCandidates: PokemonEntry[] = [];
      let lastMilestoneLabel: string | null = null;
      const wildFiltered = members.some((g) => coveredGames.has(g));

      if (completedIds.length === 0) {
        // ── STARTING MODE: no milestones completed yet ──
        const lockedAtStart = getLockedDexNumbers(EMPTY_MILESTONES, group, ownedDlcs);
        const chosenId = starterChoices[group];
        const starters = (STARTER_TRIOS[group] ?? [])
          .map((id) => dexById.get(id))
          .filter((p): p is PokemonEntry => Boolean(p));

        // ── UNCHOSEN STARTER LINES (after a starter is chosen+registered): ──
        // The game's own starter gift no longer applies to the other lines.
        // Unless this game offers another way (raid dens, overworld spawns,
        // island scans, DLC returns…), they are receivable only by trade.
        const chosenIdForLines = normalizeStarterChoiceId(group, starterChoices[group]);
        const unchosenLineIds = new Set(
          getUnchosenStarterLineIds(group, chosenIdForLines)
        );
        const starterTradeOnly: PokemonEntry[] = [];
        const starterAlternates: { p: PokemonEntry; how: string }[] = [];
        for (const sid of unchosenLineIds) {
          const sp = dexById.get(sid);
          if (!sp || caughtSet.has(sid)) continue;
          const how = findAlternateAcquisitionLabel(
            sid,
            group,
            encounters,
            ownedDlcs,
            (id) => dexById.get(id)?.availability
          );
          if (how) starterAlternates.push({ p: sp, how });
          else starterTradeOnly.push(sp);
        }
        starterTradeOnly.sort((a, b) => a.id - b.id);
        starterAlternates.sort((a, b) => a.p.id - b.p.id);

        for (const p of dex) {
          if (caughtSet.has(p.id)) continue;
          if (!members.some(game => { const av = p.availability[game]; return av?.status === 'base' || (av?.status === 'dlc' && (!av.dlcId || ownedDlcs.includes(av.dlcId))); })) continue;
          if (activeGameId && p.availability[activeGameId]?.reacquisitionMode === 'trade_or_other') continue;
          if (lockedAtStart.has(p.id)) continue;
          const isStarter = starters.some((s) => s.id === p.id);
          if (isStarter) continue; // starters live in the dedicated choice row
          if (unchosenLineIds.has(p.id)) continue; // unchosen starter lines get their own grids below
          if (!isCatchableInWild(p, members)) continue; // evolution-only
          if (!catchableNow(p)) continue; // story-gated or above the current catch-level cap
          const obtainableFromStart = members.some(
            (gId) => p.availability[gId]?.status === 'base'
          );
          if (!obtainableFromStart) continue;
          startingCandidates.push(p);
        }
        const split = splitWildVsEvolution(startingCandidates, members);
        const startingSpecies = split.wild.sort((a, b) => a.id - b.id);
        const startingEvolutionSpecies = split.evolution.sort((a, b) => a.id - b.id);
        const startingSpeciesOverflow = Math.max(0, startingSpecies.length - MAX_STARTING_GRID);
        startingSpecies.length = Math.min(startingSpecies.length, MAX_STARTING_GRID);
        const startingEvolutionOverflow = Math.max(0, startingEvolutionSpecies.length - MAX_STARTING_GRID);
        startingEvolutionSpecies.length = Math.min(startingEvolutionSpecies.length, MAX_STARTING_GRID);

        // Per-game evolution suggestions (active tab only), excluding species
        // already surfaced as wild catches above.
        const wildGridIds = new Set<number>([
          ...startingSpecies.map((p) => p.id),
          ...startingEvolutionSpecies.map((p) => p.id),
        ]);
        const evolutionSuggestions =
          activeGameId && (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[activeGameId] === group
            ? computeEvolutionSuggestions(activeGameId, wildGridIds)
            : [];

        const chosen = chosenId != null ? dexById.get(normalizeStarterChoiceId(group, chosenId) ?? chosenId) ?? null : null;
        // Always offer all three starters until a choice is made, even if
        // some are already caught/registered in the dex.
        const starterOptions = chosenId == null ? starters : [];

        out.push({
          group,
          gameShort: meta?.short ?? group,
          accent: meta?.accent ?? '#f59e0b',
          lastMilestoneLabel: null,
          starterOptions,
          // Keep the chosen card visible even if the species is already
          // caught — otherwise the whole row would vanish after choosing
          // an already-registered starter (looks like the pick failed).
          chosenStarter: chosen,
          starterTradeOnly,
          starterAlternates,
          startingSpecies,
          startingSpeciesOverflow,
          startingEvolutionSpecies,
          startingEvolutionOverflow,
          evolutionSuggestions,
          freshSpecies: [],
          freshEvolutionSpecies: [],
          freshEvolutionOverflow: 0,
          wildFiltered,
        });
      } else {
        // ── FRESH UNLOCK MODE: diff gates between last two milestones ──
        const all = milestonesFor(group, ownedDlcs);
        const completed = all.filter((m) => completedIds.includes(m.id));
        if (completed.length === 0) continue;

        const lastMilestone = completed.reduce((a, b) => (b.order > a.order ? b : a));
        lastMilestoneLabel = lastMilestone.label;
        const stillLocked = getLockedDexNumbers(new Set(completedIds), group, ownedDlcs);

        // Cumulative: keep suggesting everything unlocked so far (not just the
        // latest badge), so earlier suggestions never disappear as you progress.
        for (const p of dex) {
          if (caughtSet.has(p.id)) continue;
          if (!members.some(game => { const av = p.availability[game]; return av?.status === 'base' || (av?.status === 'dlc' && (!av.dlcId || ownedDlcs.includes(av.dlcId))); })) continue;
          if (activeGameId && p.availability[activeGameId]?.reacquisitionMode === 'trade_or_other') continue;
          if (stillLocked.has(p.id)) continue;
          if (!isCatchableInWild(p, members)) continue; // evolution-only
          if (!catchableNow(p)) continue; // story-gated or above the current catch-level cap
          freshCandidates.push(p);
        }
        const split = splitWildVsEvolution(freshCandidates, members);
        const freshSpecies = split.wild.sort((a, b) => a.id - b.id);
        const freshEvolutionSpecies = split.evolution.sort((a, b) => a.id - b.id);
        const freshEvolutionOverflow = Math.max(0, freshEvolutionSpecies.length - MAX_STARTING_GRID);
        freshEvolutionSpecies.length = Math.min(freshEvolutionSpecies.length, MAX_STARTING_GRID);

        const freshGridIds = new Set<number>([
          ...freshSpecies.map((p) => p.id),
          ...freshEvolutionSpecies.map((p) => p.id),
        ]);
        const evolutionSuggestions =
          activeGameId && (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[activeGameId] === group
            ? computeEvolutionSuggestions(activeGameId, freshGridIds)
            : [];

        // The starter choice stays available in this mode too: it must not
        // vanish just because a badge has been earned.
        const starters = (STARTER_TRIOS[group] ?? [])
          .map((sid) => dexById.get(sid))
          .filter((p): p is PokemonEntry => Boolean(p));
        const chosenIdFresh = starterChoices[group];
        const chosenFresh = chosenIdFresh != null
          ? dexById.get(normalizeStarterChoiceId(group, chosenIdFresh) ?? chosenIdFresh) ?? null
          : null;
        const starterOptions = chosenIdFresh == null ? starters : [];
        const unchosenLineIdsFresh = new Set(
          getUnchosenStarterLineIds(group, chosenIdFresh)
        );
        const starterTradeOnly: PokemonEntry[] = [];
        const starterAlternates: { p: PokemonEntry; how: string }[] = [];
        for (const sid of unchosenLineIdsFresh) {
          const sp = dexById.get(sid);
          if (!sp || caughtSet.has(sid)) continue;
          const how = findAlternateAcquisitionLabel(
            sid, group, encounters, ownedDlcs, (id) => dexById.get(id)?.availability
          );
          if (how) starterAlternates.push({ p: sp, how });
          else starterTradeOnly.push(sp);
        }
        starterTradeOnly.sort((a, b) => a.id - b.id);
        starterAlternates.sort((a, b) => a.p.id - b.p.id);

        out.push({
          group,
          gameShort: meta?.short ?? group,
          accent: meta?.accent ?? '#f59e0b',
          lastMilestoneLabel,
          starterOptions,
          chosenStarter: chosenFresh,
          starterTradeOnly,
          starterAlternates,
          evolutionSuggestions,
          startingSpecies: [],
          startingSpeciesOverflow: 0,
          startingEvolutionSpecies: [],
          startingEvolutionOverflow: 0,
          freshSpecies,
          freshEvolutionSpecies,
          freshEvolutionOverflow,
          wildFiltered,
        });
      }
    }

    return out;
  }, [progress, ownedGames, ownedDlcs, dex, caughtSet, starterChoices, encounters, groupFilter, gameCatches, activeGameId, inventory]);

  const reacquireIds = activeGameId ? evolvedAwaySpecies(inventory, activeGameId) : [];

  const hasContent = rows.some(
    (r) =>
      r.freshSpecies.length > 0 ||
      r.freshEvolutionSpecies.length > 0 ||
      r.startingSpecies.length > 0 ||
      r.startingEvolutionSpecies.length > 0 ||
      r.starterTradeOnly.length > 0 ||
      r.starterAlternates.length > 0 ||
      r.evolutionSuggestions.length > 0 ||
      r.chosenStarter ||
      r.starterOptions.length > 0
  );

  return (
    <section className={groupFilter ? 'flex flex-col gap-4' : 'bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 shadow-xl'}>
      <div className={groupFilter ? 'flex items-center gap-2.5' : 'flex items-start justify-between gap-4'}>
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Trophy className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Trainer Hints</h2>
            <p className="text-xs text-slate-400">
              Uncaught Pokémon you can catch right now in your owned games — plus evolution and starter hints.
            </p>
          </div>
        </div>
      </div>

      {/* Condition filter: weather and/or time of day, where they change spawns */}
      {!!(weatherOptions.length || timeOptions.length) && activeGameId && (
        <section className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 flex flex-col gap-2.5">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Condition filter</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              In this game the weather{weatherOptions.length && timeOptions.length ? ' and time of day' : ''} changes which Pokémon appear. Pick a condition and an area to see the uncaught Pokémon you can find.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {!!weatherOptions.length && (
              <label className="flex flex-col gap-1 text-[11px] text-slate-300">
                Weather
                <select
                  value={weather}
                  onChange={(e) => { setWeather(e.target.value); setConditionArea(''); }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 cursor-pointer min-w-40"
                >
                  <option value="">Any weather</option>
                  {weatherOptions.map((id) => (
                    <option key={id} value={id}>
                      {WEATHER_CONDITIONS.find((w) => w.id === id)?.label ?? id}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!!timeOptions.length && (
              <label className="flex flex-col gap-1 text-[11px] text-slate-300">
                Time of day
                <select
                  value={timeOfDay}
                  onChange={(e) => { setTimeOfDay(e.target.value); setConditionArea(''); }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 cursor-pointer min-w-36"
                >
                  <option value="">Any time</option>
                  {timeOptions.map((id) => (
                    <option key={id} value={id}>
                      {TIME_CONDITIONS.find((t) => t.id === id)?.label ?? id}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1 text-[11px] text-slate-300">
              Area
              <select
                value={conditionArea}
                onChange={(e) => setConditionArea(e.target.value)}
                disabled={!weather && !timeOfDay}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 cursor-pointer min-w-56 disabled:opacity-50"
              >
                <option value="">{weather || timeOfDay ? 'Choose an area…' : 'Pick a condition first'}</option>
                {conditionAreas.map((area) => (
                  <option key={area} value={area}>{prettifyAreaName(area)}</option>
                ))}
              </select>
            </label>
            {(weather || timeOfDay) && (
              <button
                type="button"
                onClick={() => { setWeather(''); setTimeOfDay(''); setConditionArea(''); }}
                className="text-[11px] text-slate-400 hover:text-slate-200 pb-1.5 cursor-pointer underline underline-offset-2"
              >
                Clear
              </button>
            )}
            {!!conditionArea && conditionSpawns.length > 0 && (
              <span className="text-[11px] font-mono text-sky-300 pb-1.5">
                {conditionSpawns.length} uncaught species
              </span>
            )}
          </div>

          {conditionArea && (
            conditionSpawns.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                No uncaught Pokémon spawn here under these conditions (you may already have them all).
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {conditionSpawns.map((row) => {
                  const mon = dexById.get(row.pokemonId);
                  if (!mon) return null;
                  return (
                    <button
                      key={row.pokemonId}
                      type="button"
                      onClick={() => onSelectPokemon(mon)}
                      title={`${mon.name} — ${row.methods.join(', ')} · Lv ${row.minLevel}-${row.maxLevel}${row.maxChance > 0 ? ` · up to ${row.maxChance}%` : ''}`}
                      className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-sky-400/60 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                    >
                      <PokemonSprite id={row.pokemonId} name={mon.name} size="sm" />
                      <span className="text-[10px] text-slate-300 truncate w-full text-center">{mon.name}</span>
                      <span className="text-[9px] font-mono text-slate-500">Lv {row.minLevel}-{row.maxLevel}</span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </section>
      )}

      {!!reacquireIds.length && activeGameId && (
        <section className="rounded-xl border border-amber-500/30 p-3 flex flex-col gap-2">
          <h3 className="text-sm font-bold text-amber-300">Uncaught after evolution — acquisition hints</h3>
          {reacquireIds.map(id => <button key={id} onClick={() => { const p = dex.find(p => p.id === id); if (p) onSelectPokemon(p); }} className="text-left text-xs text-slate-300 p-2 bg-slate-900 rounded-lg">
            <strong>{dex.find(p => p.id === id)?.name ?? `#${id}`}: </strong>{reacquisitionHint(encounters, id, activeGameId)}
          </button>)}
        </section>
      )}

      {!hasContent ? (
        <div className="p-6 rounded-xl bg-[#0B0F17] border border-slate-800 text-center text-xs text-slate-400">
          Nothing available yet. Mark games as owned in{' '}
          <span className="text-amber-300 font-semibold">Settings → Games &amp; DLC</span> — or
          mark badges in{' '}
          <button
            type="button"
            onClick={onNavigateToProgress}
            className="text-amber-300 hover:text-amber-200 font-semibold cursor-pointer underline underline-offset-2"
          >
            Progress
          </button>{' '}
          to unlock more species.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => {
            const showStarters = row.starterOptions.length > 0 || row.chosenStarter;
            const hasStarting = row.lastMilestoneLabel === null;
            if (!showStarters && row.startingSpecies.length === 0 && row.freshSpecies.length === 0) {
              return null;
            }

            return (
              <div key={row.group} className="rounded-xl bg-[#0B0F17] border border-slate-800/80 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: row.accent }}>
                    {row.gameShort}
                  </span>
                  {hasStarting ? (
                    <span className="text-[10px] text-slate-400">
                      Available from the start{row.wildFiltered ? ' · wild-catchable only' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 truncate">
                      Latest win: <span className="text-amber-300 font-semibold">{row.lastMilestoneLabel}</span>
                    </span>
                  )}
                </div>

                {/* Starter pick-one row */}
                {showStarters && (
                  <div className="px-4 pt-3 pb-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      {row.chosenStarter
                        ? caughtSet.has(row.chosenStarter.id)
                          ? 'Your starter — already caught ✓'
                          : inventory.some(p => p.evolutionHistory?.some(e => e.fromSpeciesId === row.chosenStarter!.id))
                            ? 'Your starter has evolved — see acquisition hints for another specimen'
                            : 'Your starter — catch it to complete the choice!'
                        : 'Choose your starter (pick one of three)'}
                      {row.chosenStarter && (
                        <button
                          type="button"
                          onClick={() => onClearStarter(row.group)}
                          title="Change starter choice"
                          className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[9px] font-bold transition-colors cursor-pointer"
                        >
                          Unselect
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {row.chosenStarter ? (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectPokemon(row.chosenStarter!)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') onSelectPokemon(row.chosenStarter!);
                          }}
                          className="relative p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/40 hover:border-emerald-400 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                        >
                          <button
                            type="button"
                            aria-label="Unselect starter"
                            title="Change starter choice"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearStarter(row.group);
                            }}
                            className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-slate-900 border border-slate-600 text-slate-300 hover:text-rose-300 hover:border-rose-500/60 shadow-md transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <PokemonSprite id={row.chosenStarter.id} name={row.chosenStarter.name} size="sm" />
                          <span className="text-[10px] text-emerald-200 truncate w-full text-center">
                            #{String(row.chosenStarter.id).padStart(3, '0')} {row.chosenStarter.name}
                          </span>
                          {caughtSet.has(row.chosenStarter.id) && (
                            <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Caught
                            </span>
                          )}
                        </div>
                      ) : (
                        row.starterOptions.map((s) => {
                          const alreadyCaught = caughtSet.has(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => onChooseStarter(row.group, s.id)}
                              title={`Choose ${s.name} as your starter`}
                              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-900 flex flex-col items-center gap-1 transition-colors cursor-pointer group"
                            >
                              <PokemonSprite id={s.id} name={s.name} size="sm" />
                              <span className="text-[10px] text-slate-300 group-hover:text-amber-300 truncate w-full text-center">
                                #{String(s.id).padStart(3, '0')} {s.name}
                              </span>
                              {alreadyCaught ? (
                                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Caught
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-400/80 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Choose
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Unchosen starter lines: trade-only unless the game offers another way */}
                {row.starterTradeOnly.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-300 uppercase tracking-wide mb-1.5">
                      <ArrowLeftRight className="w-3 h-3" />
                      Other starters — receivable by trade only
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {row.starterTradeOnly.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectPokemon(p)}
                          title={`#${String(p.id).padStart(4, '0')} ${p.name} — this game only offers its starter gift; trade with a player who chose ${p.name}'s line`}
                          className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:border-rose-400/60 hover:bg-slate-900 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PokemonSprite id={p.id} name={p.name} size="sm" />
                          <span className="text-[10px] text-rose-200/80 truncate w-full text-center">
                            #{String(p.id).padStart(3, '0')} {p.name}
                          </span>
                          <span className="text-[9px] font-bold text-rose-300/80 flex items-center gap-1">
                            <ArrowLeftRight className="w-2.5 h-2.5" /> Trade only
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unchosen starter lines with an alternate way in this game */}
                {row.starterAlternates.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-300 uppercase tracking-wide mb-1.5">
                      <Sparkles className="w-3 h-3" />
                      Other starters — another way in this game
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {row.starterAlternates.map(({ p, how }) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectPokemon(p)}
                          title={`#${String(p.id).padStart(4, '0')} ${p.name} — ${how}`}
                          className="p-2 rounded-xl bg-sky-500/5 border border-sky-500/20 hover:border-sky-400/60 hover:bg-slate-900 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PokemonSprite id={p.id} name={p.name} size="sm" />
                          <span className="text-[10px] text-sky-200/80 truncate w-full text-center">
                            #{String(p.id).padStart(3, '0')} {p.name}
                          </span>
                          <span className="text-[9px] font-semibold text-sky-300/80 text-center leading-tight line-clamp-2">
                            {how}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Starting species grid (no badges yet) */}
                {hasStarting && row.startingSpecies.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Wild encounters — catch them directly
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {row.startingSpecies.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectPokemon(p)}
                          title={`#${String(p.id).padStart(4, '0')} ${p.name} — view encounter info`}
                          className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-900 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PokemonSprite id={p.id} name={p.name} size="sm" />
                          <span className="text-[10px] text-slate-300 truncate w-full text-center">
                            #{String(p.id).padStart(3, '0')} {p.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    {row.startingSpeciesOverflow > 0 && (
                      <p className="mt-2 text-[10px] text-slate-500 text-center">
                        +{row.startingSpeciesOverflow} more uncaught species available from the start
                      </p>
                    )}
                  </div>
                )}

                {/* Later-stage evolutions (not found in the wild at this point) */}
                {hasStarting && row.startingEvolutionSpecies.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wide mb-1.5">
                      Evolution stages — obtain by evolving your catches
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {row.startingEvolutionSpecies.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectPokemon(p)}
                          title={`#${String(p.id).padStart(4, '0')} ${p.name} — not found in the wild here; register via evolution`}
                          className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-400/60 hover:bg-slate-900 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PokemonSprite id={p.id} name={p.name} size="sm" />
                          <span className="text-[10px] text-purple-200/80 truncate w-full text-center">
                            #{String(p.id).padStart(3, '0')} {p.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    {row.startingEvolutionOverflow > 0 && (
                      <p className="mt-2 text-[10px] text-slate-500 text-center">
                        +{row.startingEvolutionOverflow} more evolution-stage species
                      </p>
                    )}
                  </div>
                )}

                {/* Fresh unlock grid (after milestones) */}
                {!hasStarting && row.freshSpecies.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                      Wild encounters — newly catchable
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {row.freshSpecies.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectPokemon(p)}
                          title={`#${String(p.id).padStart(4, '0')} ${p.name} — view encounter info`}
                          className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-400/60 hover:bg-slate-900 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PokemonSprite id={p.id} name={p.name} size="sm" />
                          <span className="text-[10px] text-slate-300 truncate w-full text-center">
                            #{String(p.id).padStart(3, '0')} {p.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fresh unlock evolutions (after milestones) */}
                {!hasStarting && row.freshEvolutionSpecies.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wide mb-1.5">
                      Evolution stages — obtain by evolving your catches
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {row.freshEvolutionSpecies.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectPokemon(p)}
                          title={`#${String(p.id).padStart(4, '0')} ${p.name} — not found in the wild here; register via evolution`}
                          className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-400/60 hover:bg-slate-900 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PokemonSprite id={p.id} name={p.name} size="sm" />
                          <span className="text-[10px] text-purple-200/80 truncate w-full text-center">
                            #{String(p.id).padStart(3, '0')} {p.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    {row.freshEvolutionOverflow > 0 && (
                      <p className="mt-2 text-[10px] text-slate-500 text-center">
                        +{row.freshEvolutionOverflow} more evolution-stage species
                      </p>
                    )}
                  </div>
                )}

                {/* Evolution suggestions: pre-evolution caught in this game,
                    target species not yet registered in this game */}
                {row.evolutionSuggestions.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-300 uppercase tracking-wide mb-1.5">
                      <Sparkles className="w-3 h-3" />
                      Evolution suggestions — evolve your registered catches
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {row.evolutionSuggestions.map(({ p, fromName, detail }) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectPokemon(p)}
                          title={`#${String(p.id).padStart(4, '0')} ${p.name} — evolve your registered ${fromName} (${detail})`}
                          className="p-2 rounded-xl bg-teal-500/5 border border-teal-500/20 hover:border-teal-400/60 hover:bg-slate-900 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PokemonSprite id={p.id} name={p.name} size="sm" />
                          <span className="text-[10px] text-teal-200/80 truncate w-full text-center">
                            #{String(p.id).padStart(3, '0')} {p.name}
                          </span>
                          <span className="text-[9px] font-semibold text-teal-300/80 text-center leading-tight line-clamp-2">
                            Evolve {fromName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};