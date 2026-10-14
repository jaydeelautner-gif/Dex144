import React, { useMemo } from 'react';
import { Trophy, Sparkles, Check } from 'lucide-react';
import type { GameId, PokemonEntry } from '../data/pokemonData';
import {
  GAME_META,
  GROUP_MEMBER_GAMES,
  STARTER_TRIOS,
  getOwnedTrackableGames,
  milestonesFor,
} from '../data/milestones';
import { getLockedDexNumbers } from '../data/milestoneGates';
import type { ProgressState } from '../hooks/useGameProgress';
import { PokemonSprite } from './PokemonSprite';

interface MilestoneUnlocksPanelProps {
  progress: ProgressState;
  trackedGames: Set<GameId>;
  ownedGames: GameId[];
  dex: PokemonEntry[];
  caughtSet: Set<number>;
  starterChoices: Record<string, number>;
  onChooseStarter: (gameGroup: string, dexId: number) => void;
  onSelectPokemon: (pokemon: PokemonEntry) => void;
  onNavigateToProgress: () => void;
}

interface PanelRow {
  group: string;
  gameShort: string;
  accent: string;
  /** null → "available from the start" mode (no milestones yet). */
  lastMilestoneLabel: string | null;
  starterOptions: PokemonEntry[];
  chosenStarter: PokemonEntry | null;
  startingSpecies: PokemonEntry[];
  startingSpeciesOverflow: number;
  freshSpecies: PokemonEntry[];
}

const MAX_STARTING_GRID = 48;
const EMPTY_MILESTONES = new Set<string>();

/**
 * "Fresh Catches" panel.
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
  onSelectPokemon,
  onNavigateToProgress,
}) => {
  const rows = useMemo<PanelRow[]>(() => {
    const dexById = new Map(dex.map((p) => [p.id, p]));
    const ownedGroups = getOwnedTrackableGames(ownedGames);
    const out: PanelRow[] = [];

    for (const group of ownedGroups) {
      const completedIds = progress[group] ?? [];
      const meta = GAME_META[group];
      const members = GROUP_MEMBER_GAMES[group] ?? [];

      const startingSpecies: PokemonEntry[] = [];
      const freshSpecies: PokemonEntry[] = [];
      let lastMilestoneLabel: string | null = null;
      let startingSpeciesOverflow = 0;

      if (completedIds.length === 0) {
        // ── STARTING MODE: no milestones completed yet ──
        const lockedAtStart = getLockedDexNumbers(EMPTY_MILESTONES, group);
        const chosenId = starterChoices[group];
        const starters = (STARTER_TRIOS[group] ?? [])
          .map((id) => dexById.get(id))
          .filter((p): p is PokemonEntry => Boolean(p));

        for (const p of dex) {
          if (caughtSet.has(p.id)) continue;
          if (lockedAtStart.has(p.id)) continue;
          const isStarter = starters.some((s) => s.id === p.id);
          if (isStarter) continue; // starters live in the dedicated choice row
          const obtainableFromStart = members.some(
            (gId) => p.availability[gId]?.status === 'base'
          );
          if (!obtainableFromStart) continue;
          startingSpecies.push(p);
        }
        startingSpecies.sort((a, b) => a.id - b.id);
        startingSpeciesOverflow = Math.max(0, startingSpecies.length - MAX_STARTING_GRID);
        startingSpecies.length = Math.min(startingSpecies.length, MAX_STARTING_GRID);

        const chosen = chosenId != null ? dexById.get(chosenId) ?? null : null;
        const unchosenStarters = starters.filter(
          (s) => s.id !== chosenId && !caughtSet.has(s.id)
        );

        out.push({
          group,
          gameShort: meta?.short ?? group,
          accent: meta?.accent ?? '#f59e0b',
          lastMilestoneLabel: null,
          starterOptions: chosenId == null ? unchosenStarters : [],
          chosenStarter: chosen && !caughtSet.has(chosen.id) ? chosen : null,
          startingSpecies,
          startingSpeciesOverflow,
          freshSpecies,
        });
      } else {
        // ── FRESH UNLOCK MODE: diff gates between last two milestones ──
        const all = milestonesFor(group);
        const completed = all.filter((m) => completedIds.includes(m.id));
        if (completed.length === 0) continue;

        const lastMilestone = completed.reduce((a, b) => (b.order > a.order ? b : a));
        lastMilestoneLabel = lastMilestone.label;
        const stillLocked = getLockedDexNumbers(new Set(completedIds), group);

        for (const p of dex) {
          if (caughtSet.has(p.id)) continue;
          if (stillLocked.has(p.id)) continue;
          const previousCompleted = completed
            .filter((m) => m.order < lastMilestone.order)
            .map((m) => m.id);
          const lockedBefore = getLockedDexNumbers(new Set(previousCompleted), group);
          if (lockedBefore.has(p.id)) freshSpecies.push(p);
        }
        freshSpecies.sort((a, b) => a.id - b.id);

        out.push({
          group,
          gameShort: meta?.short ?? group,
          accent: meta?.accent ?? '#f59e0b',
          lastMilestoneLabel,
          starterOptions: [],
          chosenStarter: null,
          startingSpecies: [],
          startingSpeciesOverflow: 0,
          freshSpecies,
        });
      }
    }

    return out;
  }, [progress, ownedGames, dex, caughtSet, starterChoices]);

  const hasContent = rows.some(
    (r) => r.freshSpecies.length > 0 || r.startingSpecies.length > 0 || r.chosenStarter || r.starterOptions.length > 0
  );

  return (
    <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Trophy className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Fresh Catches</h2>
            <p className="text-xs text-slate-400">
              Uncaught Pokémon you can catch right now in your owned games.
            </p>
          </div>
        </div>
      </div>

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
                    <span className="text-[10px] text-slate-400">Available from the start</span>
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
                        ? 'Your starter — catch it to complete the choice!'
                        : 'Choose your starter (pick one of three)'}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {row.chosenStarter ? (
                        <button
                          type="button"
                          onClick={() => onSelectPokemon(row.chosenStarter!)}
                          className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/40 hover:border-emerald-400 flex flex-col items-center gap-1 transition-colors cursor-pointer"
                        >
                          <PokemonSprite id={row.chosenStarter.id} name={row.chosenStarter.name} size="sm" />
                          <span className="text-[10px] text-emerald-200 truncate w-full text-center">
                            #{String(row.chosenStarter.id).padStart(3, '0')} {row.chosenStarter.name}
                          </span>
                        </button>
                      ) : (
                        row.starterOptions.map((s) => (
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
                            <span className="text-[9px] font-bold text-amber-400/80 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Choose
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Starting species grid (no badges yet) */}
                {hasStarting && row.startingSpecies.length > 0 && (
                  <div className="px-4 py-3">
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

                {/* Fresh unlock grid (after milestones) */}
                {!hasStarting && row.freshSpecies.length > 0 && (
                  <div className="px-4 py-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};