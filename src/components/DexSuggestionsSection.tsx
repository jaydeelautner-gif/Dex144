import { evolvedAwaySpecies } from '../utils/pokepetEvolution';
import { reacquisitionHint, hasRecordedWildEncounter } from '../utils/reacquisition';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Compass,
  Box,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Plus,
  Flame,
  Gamepad2,
  SlidersHorizontal,
  Lock,
  ArrowLeftRight,
} from 'lucide-react';
import type { PokemonEntry, GameId, DlcId } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import { MILESTONE_INDEX, GAME_ID_TO_TRACKABLE } from '../data/milestones';
import { useEncounterDataset, summarizeEncountersForGame } from '../data/encountersData';
import {
  getUnchosenStarterLineIds,
  findAlternateAcquisitionLabel,
  normalizeStarterChoiceId,
} from '../utils/starterAlternates';
import { GameLogoBadge } from './GameLogoBadge';
import { PokemonSprite } from './PokemonSprite';
import type { PokemonInstance } from '../data/pokemonInventoryData';
import { getEvolutionFamilyForPokemon } from '../data/pokemonEvolutionData';

export type SuggestionType = 'living_upgrade_pogo' | 'uncaught_owned' | 'missing_living';

export interface PokemonSuggestion {
  pokemon: PokemonEntry;
  suggestionType: SuggestionType;
  title: string;
  badgeLabel: string;
  badgeColor: 'amber' | 'emerald' | 'sky';
  primaryGameId: GameId;
  primaryGameTitle: string;
  whereToFind: string;
  versionExclusive: string;
  requiresDlc: boolean;
  dlcName?: string;
  alternativeGamesCount: number;
  boxNumber: number;
  boxSlot: number;
  evolutionTip?: string;
  /** Milestone IDs still blocking this species in the tracked games (when progress tracking is on). */
  lockedMilestoneIds?: string[];
  /** Species is in an unchosen starter line with no alternate way in this game → trade only. */
  starterTradeOnly?: boolean;
  reacquisitionNote?: string;
  reacquisitionWild?: boolean;
  /** The alternate way this game offers to get an unchosen starter line species. */
  starterAlternateHow?: string;
}

interface DexSuggestionsSectionProps {
  dex: PokemonEntry[];
  caughtSet: Set<number>;
  livingSet: Set<number>;
  ownedGames: GameId[];
  ownedDlcs: DlcId[];
  inventory: PokemonInstance[];
  boxSelectedGames: Map<number, GameId>;
  includePokemonGoInSuggestions: boolean;
  onSelectPokemon: (pokemon: PokemonEntry) => void;
  onOpenFullPage: (pokemon: PokemonEntry) => void;
  onNavigateToRegister: (pokemonId?: number) => void;
  onNavigateToSettings: () => void;
  isGuest: boolean;
  onRequestAuth: (prompt: string) => void;
  /** Dex numbers locked by unfinished story milestones in tracked games. */
  lockedByProgressSet?: Set<number>;
  /** Uncompleted milestone IDs blocking each locked dex number — shown as a
   *  "Locked until …" chip so locked species stay visible, not hidden. */
  lockedMilestonesByDex?: Map<number, string[]>;
  /** Restrict suggestions to a single owned game (Catch Hub game tabs). */
  gameFilter?: GameId;
  /** Saved starter choices per trackable group — used to tag unchosen
   *  starter-line species as trade-only (or with the game's alternate way). */
  starterChoices?: Record<string, number>;
  /** Skip the outer panel chrome (title header) when embedded in the Catch Hub. */
  embedded?: boolean;
}

export const DexSuggestionsSection: React.FC<DexSuggestionsSectionProps> = ({
  dex,
  caughtSet,
  livingSet,
  ownedGames,
  ownedDlcs,
  inventory,
  boxSelectedGames,
  includePokemonGoInSuggestions,
  onSelectPokemon,
  onOpenFullPage,
  onNavigateToRegister,
  onNavigateToSettings,
  isGuest,
  onRequestAuth,
  lockedByProgressSet,
  lockedMilestonesByDex,
  gameFilter,
  starterChoices,
  embedded,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'upgrades' | 'uncaught'>('all');
  const [showAll, setShowAll] = useState<boolean>(false);
  const INITIAL_VISIBLE = 24;

  // Wild-encounter bundle — used to detect alternate ways to get unchosen
  // starter lines in the active game tab.
  const { dataset: encounters } = useEncounterDataset();

  // Compute all potential candidates across the dex
  const allEligibleCandidates = useMemo(() => {
    // Look up GO living specimens in inventory
    const pogoLivingPokemonIds = new Set<number>();
    for (const inv of inventory) {
      if (inv.isInLivingBox && (inv.gameId === 'pogo' || inv.variantName?.toLowerCase().includes('go'))) {
        pogoLivingPokemonIds.add(inv.pokemonId);
      }
    }
    // Also check boxSelectedGames map
    boxSelectedGames.forEach((gId, pId) => {
      if (gId === 'pogo' && livingSet.has(pId)) {
        pogoLivingPokemonIds.add(pId);
      }
    });

    const list: PokemonSuggestion[] = [];

    // Catch Hub game tabs restrict suggestions to a single owned game.
    const sourceGames = gameFilter ? [gameFilter] : ownedGames;

    // Unchosen starter lines for the active game tab (after a starter is
    // chosen): those species get a "Trade only" tag (or the game's
    // alternate way) instead of implying they can be caught normally.
    const dexById = new Map(dex.map((p) => [p.id, p]));
    const hubGroup = gameFilter
      ? (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[gameFilter]
      : undefined;
    const hubChosenId = normalizeStarterChoiceId(hubGroup, starterChoices?.[hubGroup ?? '']);
    const evolvedAway = new Set(gameFilter ? evolvedAwaySpecies(inventory, gameFilter) : []);
    const unchosenStarterLineIds = new Set(
      getUnchosenStarterLineIds(hubGroup, hubChosenId)
    );

    for (const p of dex) {
      // Find obtainable owned games
      const obtainableOwned = sourceGames.filter((gId) => {
        if (!includePokemonGoInSuggestions && gId === 'pogo') return false;
        const av = p.availability[gId];
        if (!av) return false;
        if (av.status === 'base') return true;
        if (av.status === 'dlc') {
          return !av.dlcId || ownedDlcs.includes(av.dlcId);
        }
        return false;
      });

      if (obtainableOwned.length === 0) continue;

      // Progress-locked species STAY in the list (users must see every
      // uncaught Pokémon, including ones that just unlocked) — they are
      // flagged with a "Locked until …" chip instead of being dropped.

      const reacquisitionNote = gameFilter && evolvedAway.has(p.id) ? reacquisitionHint(encounters, p.id, gameFilter) : undefined;

      // Tag unchosen starter lines for this game tab.
      let starterTradeOnly: boolean | undefined;
      let starterAlternateHow: string | undefined;
      if (hubGroup && unchosenStarterLineIds.has(p.id)) {
        const how = findAlternateAcquisitionLabel(
          p.id,
          hubGroup,
          encounters,
          ownedDlcs,
          (id) => dexById.get(id)?.availability
        );
        if (how) starterAlternateHow = how;
        else starterTradeOnly = true;
      }

      // Filter console-only games (excluding pogo)
      const consoleObtainable = obtainableOwned.filter((gId) => gId !== 'pogo');

      const isPogoLivingDex = pogoLivingPokemonIds.has(p.id);
      const isUncaught = !caughtSet.has(p.id) || evolvedAway.has(p.id);
      const isMissingLiving = !livingSet.has(p.id);

      // Category 1: Living Dex Quality Upgrade (GO Replacement)
      if (isPogoLivingDex && consoleObtainable.length > 0) {
        const primaryGId = consoleObtainable[0];
        const primaryMeta = GAMES.find((g) => g.id === primaryGId);
        const primaryAvail = p.availability[primaryGId];
        const primaryTitle = primaryMeta?.shortTitle || primaryAvail?.gameShortTitle || primaryGId.toUpperCase();
        const evoFamily = getEvolutionFamilyForPokemon(p.id);
        const stage = evoFamily.stages.find((s) => s.pokemonId === p.id);
        // Correct, verified location from the encounter bundle when covered.
        const realWhereToFind = summarizeEncountersForGame(encounters, p.id, primaryGId);

        list.push({
          pokemon: p,
          suggestionType: 'living_upgrade_pogo',
          title: `Living Dex Upgrade: Replace Pokémon GO Pokepet`,
          badgeLabel: `GO Replacement Opportunity`,
          badgeColor: 'amber',
          primaryGameId: primaryGId,
          primaryGameTitle: primaryTitle,
          whereToFind: reacquisitionNote || realWhereToFind || primaryAvail?.whereToFind || 'In-game catchable',
          versionExclusive: primaryAvail?.versionExclusive || 'Both Versions',
          requiresDlc: Boolean(primaryAvail?.requiresDlc),
          dlcName: primaryAvail?.dlcName,
          alternativeGamesCount: consoleObtainable.length - 1,
          boxNumber: p.boxNumber,
          boxSlot: p.boxSlot,
          evolutionTip: stage?.detail,
          lockedMilestoneIds: lockedMilestonesByDex?.get(p.id),
          starterTradeOnly,
          reacquisitionNote,
          reacquisitionWild: gameFilter ? hasRecordedWildEncounter(encounters, p.id, gameFilter) : undefined,
          starterAlternateHow,
        });
        continue; // Already assigned high-priority upgrade
      }

      // Category 2: Uncaught in Owned Games
      if (isUncaught) {
        const primaryGId = obtainableOwned[0];
        const primaryMeta = GAMES.find((g) => g.id === primaryGId);
        const primaryAvail = p.availability[primaryGId];
        const primaryTitle = primaryMeta?.shortTitle || primaryAvail?.gameShortTitle || primaryGId.toUpperCase();
        const evoFamily = getEvolutionFamilyForPokemon(p.id);
        const stage = evoFamily.stages.find((s) => s.pokemonId === p.id);
        // Correct, verified location from the encounter bundle when covered.
        const realWhereToFind = summarizeEncountersForGame(encounters, p.id, primaryGId);

        list.push({
          pokemon: p,
          suggestionType: 'uncaught_owned',
          title: `Uncaught Pokepet (${primaryTitle})`,
          badgeLabel: `Uncaught in Owned Games`,
          badgeColor: 'emerald',
          primaryGameId: primaryGId,
          primaryGameTitle: primaryTitle,
          whereToFind: reacquisitionNote || realWhereToFind || primaryAvail?.whereToFind || 'In-game catchable',
          versionExclusive: primaryAvail?.versionExclusive || 'Both Versions',
          requiresDlc: Boolean(primaryAvail?.requiresDlc),
          dlcName: primaryAvail?.dlcName,
          alternativeGamesCount: obtainableOwned.length - 1,
          boxNumber: p.boxNumber,
          boxSlot: p.boxSlot,
          evolutionTip: stage?.detail,
          lockedMilestoneIds: lockedMilestonesByDex?.get(p.id),
          starterTradeOnly,
          reacquisitionNote,
          reacquisitionWild: gameFilter ? hasRecordedWildEncounter(encounters, p.id, gameFilter) : undefined,
          starterAlternateHow,
        });
        continue;
      }

      // Category 3: Caught but Missing from Living Dex Box
      if (isMissingLiving && consoleObtainable.length > 0) {
        const primaryGId = consoleObtainable[0];
        const primaryMeta = GAMES.find((g) => g.id === primaryGId);
        const primaryAvail = p.availability[primaryGId];
        const primaryTitle = primaryMeta?.shortTitle || primaryAvail?.gameShortTitle || primaryGId.toUpperCase();
        // Correct, verified location from the encounter bundle when covered.
        const realWhereToFind = summarizeEncountersForGame(encounters, p.id, primaryGId);

        list.push({
          pokemon: p,
          suggestionType: 'missing_living',
          title: `Missing from Living Dex Box ${p.boxNumber}`,
          badgeLabel: `Catchable for Living Dex`,
          badgeColor: 'sky',
          primaryGameId: primaryGId,
          primaryGameTitle: primaryTitle,
          whereToFind: reacquisitionNote || realWhereToFind || primaryAvail?.whereToFind || 'In-game catchable',
          versionExclusive: primaryAvail?.versionExclusive || 'Both Versions',
          requiresDlc: Boolean(primaryAvail?.requiresDlc),
          dlcName: primaryAvail?.dlcName,
          alternativeGamesCount: consoleObtainable.length - 1,
          boxNumber: p.boxNumber,
          boxSlot: p.boxSlot,
          lockedMilestoneIds: lockedMilestonesByDex?.get(p.id),
          starterTradeOnly,
          reacquisitionNote,
          reacquisitionWild: gameFilter ? hasRecordedWildEncounter(encounters, p.id, gameFilter) : undefined,
          starterAlternateHow,
        });
      }
    }

    return list;
  }, [
    dex,
    caughtSet,
    livingSet,
    ownedGames,
    ownedDlcs,
    inventory,
    boxSelectedGames,
    includePokemonGoInSuggestions,
    gameFilter,
    starterChoices,
    encounters,
    lockedMilestonesByDex,
  ]);

  // Filter pool based on active subtab
  const filteredPool = useMemo(() => {
    if (activeFilter === 'upgrades') {
      return allEligibleCandidates.filter((c) => c.suggestionType === 'living_upgrade_pogo');
    }
    if (activeFilter === 'uncaught') {
      return allEligibleCandidates.filter((c) => c.suggestionType === 'uncaught_owned');
    }
    return allEligibleCandidates;
  }, [allEligibleCandidates, activeFilter]);

  // Stable, dex-ordered visible list — NO random reshuffle. Previously-shown
  // uncaught suggestions never disappear when the pool grows (e.g. a milestone
  // unlock adds species); new entries simply slot into dex order.
  const visibleSuggestions = useMemo(
    () => (showAll ? filteredPool : filteredPool.slice(0, INITIAL_VISIBLE)),
    [filteredPool, showAll]
  );

  const upgradeCount = useMemo(() => {
    return allEligibleCandidates.filter((c) => c.suggestionType === 'living_upgrade_pogo').length;
  }, [allEligibleCandidates]);

  const uncaughtCount = useMemo(() => {
    return allEligibleCandidates.filter((c) => c.suggestionType === 'uncaught_owned').length;
  }, [allEligibleCandidates]);

  const handleRegisterClick = (pokemonId: number) => {
    if (isGuest) {
      onRequestAuth('Sign up or log in to register Pokémon to your living dex.');
      return;
    }
    onNavigateToRegister(pokemonId);
  };

  const showChrome = !embedded;

  return (
    <section className={showChrome ? 'bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-5' : 'flex flex-col gap-5'}>
     {showChrome && (
      <>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              DEX ASSISTANT & QUALITY ADVISOR
            </span>
            {!includePokemonGoInSuggestions && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
                Pokémon GO Excluded
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Encounter & Living Dex Suggestions</span>
            <span className="text-xs font-mono font-medium text-slate-400">
              (All Uncaught — Stable Order)
            </span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Every Pokémon you haven't registered yet in your owned games — including newly unlocked ones after completing a milestone. Progress-locked species stay visible with a "Locked until …" note instead of disappearing.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onNavigateToSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Configure owned games & Pokémon GO toggle in Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      </>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Suggestions ({allEligibleCandidates.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('upgrades')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'upgrades'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>GO Replacements ({upgradeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('uncaught')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeFilter === 'uncaught'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Uncaught in Owned Games ({uncaughtCount})
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Showing {visibleSuggestions.length} of {filteredPool.length} eligible
        </div>
      </div>

      {/* Expand toggle */}
      {filteredPool.length > INITIAL_VISIBLE && (
        <div className="flex items-center justify-center">
          {showAll ? (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Collapse to first {INITIAL_VISIBLE}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 text-xs font-bold cursor-pointer"
            >
              Show all {filteredPool.length} suggestions
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Suggestion Cards */}
      {visibleSuggestions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">
            {activeFilter === 'upgrades'
              ? 'No Pokémon GO Replacements Needed!'
              : activeFilter === 'uncaught'
              ? 'No Uncaught Pokémon in Your Owned Games!'
              : 'All Owned Game Catches Complete!'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md">
            {activeFilter === 'upgrades'
              ? 'None of your Living Dex slots are occupied by Pokémon GO pokepets that can be replaced by your owned games.'
              : 'You have caught every Pokémon currently available across all your owned games and DLC packs. Add more games in Settings to explore new encounters!'}
          </p>
          <button
            type="button"
            onClick={onNavigateToSettings}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs cursor-pointer"
          >
            Configure Owned Games & Settings →
          </button>
        </div>
      ) : (
        <div className="max-h-[720px] overflow-y-auto pr-1 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleSuggestions.map((item) => {
            const p = item.pokemon;
            const isUpgrade = item.suggestionType === 'living_upgrade_pogo';
            const isUncaught = item.suggestionType === 'uncaught_owned';

            return (
              <div
                key={p.id}
                className={`group rounded-2xl border p-4.5 flex flex-col justify-between gap-3.5 transition-all shadow-lg ${
                  isUpgrade
                    ? 'bg-gradient-to-br from-[#171624] to-[#0F1424] border-amber-500/40 hover:border-amber-400'
                    : isUncaught
                    ? 'bg-gradient-to-br from-[#0F1C1B] to-[#0D1420] border-emerald-500/40 hover:border-emerald-400'
                    : 'bg-[#0E1422] border-slate-800 hover:border-sky-500/50'
                }`}
              >
                {/* Header row: Dex Number, Name, Reason Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => onSelectPokemon(p)}
                      className="cursor-pointer hover:scale-105 transition-transform shrink-0"
                      title="Inspect Pokémon"
                    >
                      <PokemonSprite id={p.id} name={p.name} size="sm" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono-tabular font-bold text-amber-400">
                          #{String(p.id).padStart(4, '0')}
                        </span>
                        <h4
                          onClick={() => onSelectPokemon(p)}
                          className="text-base font-extrabold text-slate-100 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          {p.name}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono-tabular">
                        {p.types.join(' / ')} • Box {p.boxNumber} (Slot {p.boxSlot})
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 text-right flex flex-col items-end gap-1">
                    {item.reacquisitionNote ? (
                      <span className="px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-300 text-[10px] font-bold">{item.reacquisitionWild ? 'Wild reacquisition' : 'Trade / other acquisition'}</span>
                    ) : item.starterTradeOnly ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <ArrowLeftRight className="w-2.5 h-2.5" />
                        <span>Trade Only</span>
                      </span>
                    ) : item.starterAlternateHow ? (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/50 text-sky-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Alt. Way</span>
                      </span>
                    ) : isUpgrade ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>GO Upgrade</span>
                      </span>
                    ) : isUncaught ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold">
                        Uncaught Catch
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/50 text-sky-300 text-[10px] font-mono font-bold">
                        Missing Box Pokepet
                      </span>
                    )}
                    {item.starterTradeOnly && (
                      <span className="text-[9px] text-rose-300/80 font-mono max-w-[130px] leading-tight">
                        Other starters of this game are receivable by trade
                      </span>
                    )}
                    {item.starterAlternateHow && (
                      <span className="text-[9px] text-sky-300/80 font-mono max-w-[130px] leading-tight">
                        {item.starterAlternateHow}
                      </span>
                    )}
                  </div>
                </div>

                {/* Encounter / How To Get It Panel */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <GameLogoBadge gameId={item.primaryGameId} size="xs" />
                      <span className="font-bold text-slate-200">
                        {item.primaryGameTitle}
                      </span>
                      {item.requiresDlc && item.dlcName && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/40">
                          {item.dlcName}
                        </span>
                      )}
                    </div>
                    {item.alternativeGamesCount > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        +{item.alternativeGamesCount} other owned games
                      </span>
                    )}
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    <strong className="text-slate-400">Location:</strong> {item.whereToFind}
                  </p>

                  {item.versionExclusive && (
                    <div className="text-[10px] font-mono text-amber-300/90">
                      ★ {item.versionExclusive}
                    </div>
                  )}

                  {isUpgrade && (
                    <div className="text-[10px] text-amber-400/90 font-mono mt-0.5 pt-1 border-t border-slate-800/60">
                      💡 Living Box {item.boxNumber} currently has a Pokémon GO pokepet. Replace it with an authentic {item.primaryGameTitle} capture to upgrade Living Dex legitimacy!
                    </div>
                  )}

                  {item.evolutionTip && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      🧬 {item.evolutionTip}
                    </div>
                  )}

                  {item.lockedMilestoneIds && item.lockedMilestoneIds.length > 0 && (
                    <div className="flex items-start gap-1.5 text-[10px] font-mono text-rose-300/90 pt-1 border-t border-slate-800/60">
                      <Lock className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>
                        Locked until:{' '}
                        {item.lockedMilestoneIds
                          .map((id) => MILESTONE_INDEX.get(id)?.label ?? id)
                          .join(' · ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectPokemon(p)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <span>View Encounter Info</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRegisterClick(p.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/15"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Register {p.name}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}
    </section>
  );
};
