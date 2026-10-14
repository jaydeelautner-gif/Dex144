import React, { useMemo } from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import type { GameId, PokemonEntry } from '../data/pokemonData';
import { GAME_META, milestonesFor } from '../data/milestones';
import { getLockedDexNumbers } from '../data/milestoneGates';
import type { ProgressState } from '../hooks/useGameProgress';
import { PokemonSprite } from './PokemonSprite';

interface MilestoneUnlocksPanelProps {
  progress: ProgressState;
  trackedGames: Set<GameId>;
  dex: PokemonEntry[];
  caughtSet: Set<number>;
  onSelectPokemon: (pokemon: PokemonEntry) => void;
  onNavigateToProgress: () => void;
}

interface UnlockRow {
  gameShort: string;
  accent: string;
  lastMilestoneLabel: string;
  species: PokemonEntry[];
}

/**
 * "Fresh Unlocks" panel — for each tracked game, finds the user's most
 * recently completed milestone (highest-order checked badge / titan /
 * noble / rank / story beat) and surfaces every uncaught species that
 * becomes catchable at exactly that point, using the milestone-gate table.
 */
export const MilestoneUnlocksPanel: React.FC<MilestoneUnlocksPanelProps> = ({
  progress,
  trackedGames,
  dex,
  caughtSet,
  onSelectPokemon,
  onNavigateToProgress,
}) => {
  const rows = useMemo<UnlockRow[]>(() => {
    const dexById = new Map(dex.map((p) => [p.id, p]));
    const out: UnlockRow[] = [];

    for (const gId of trackedGames) {
      const completedIds = progress[gId] ?? [];
      if (completedIds.length === 0) continue;

      const all = milestonesFor(gId);
      const completed = all.filter((m) => completedIds.includes(m.id));
      if (completed.length === 0) continue;

      // Most recent milestone = highest order among completed
      const lastMilestone = completed.reduce((a, b) => (b.order > a.order ? b : a));

      // Species unlocked at (or before) that milestone for this game that are
      // now catchable: every gate of this game for them is satisfied.
      const stillLocked = getLockedDexNumbers(new Set(completedIds), gId);

      // Species that this milestone just opened up: catchable now (not locked,
      // not caught) but locked one milestone ago.
      const fresh: PokemonEntry[] = [];
      for (const p of dex) {
        if (caughtSet.has(p.id)) continue;
        if (stillLocked.has(p.id)) continue;
        // was this species locked one milestone ago?
        const previousCompleted = completed
          .filter((m) => m.order < lastMilestone.order)
          .map((m) => m.id);
        const lockedBefore = getLockedDexNumbers(new Set(previousCompleted), gId);
        if (lockedBefore.has(p.id)) fresh.push(p);
      }

      if (fresh.length === 0) continue;
      fresh.sort((a, b) => a.id - b.id);

      out.push({
        gameShort: GAME_META[gId]?.short ?? gId,
        accent: GAME_META[gId]?.accent ?? '#f59e0b',
        lastMilestoneLabel: lastMilestone.label,
        species: fresh,
      });
    }

    return out;
  }, [progress, trackedGames, dex, caughtSet]);

  const totalFresh = rows.reduce((acc, r) => acc + r.species.length, 0);

  return (
    <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Trophy className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Fresh Unlocks</h2>
              <p className="text-xs text-slate-400">
                Uncaught Pokémon your latest milestone just made catchable.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onNavigateToProgress}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 shrink-0 cursor-pointer"
        >
          <span>Track progress</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#0B0F17] border border-slate-800 text-center text-xs text-slate-400">
          No new unlocks yet. Mark badges and milestone battles as won in{' '}
          <button
            type="button"
            onClick={onNavigateToProgress}
            className="text-amber-300 hover:text-amber-200 font-semibold cursor-pointer underline underline-offset-2"
          >
            Progress
          </button>{' '}
          and newly reachable Pokémon will appear here.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[11px] font-mono text-slate-500">
            {totalFresh} uncaught species newly catchable across {rows.length} tracked game{rows.length === 1 ? '' : 's'}
          </p>
          {rows.map((row) => (
            <div key={row.gameShort} className="rounded-xl bg-[#0B0F17] border border-slate-800/80 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between gap-3">
                <span
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: row.accent }}
                >
                  {row.gameShort}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  Latest win: <span className="text-amber-300 font-semibold">{row.lastMilestoneLabel}</span>
                </span>
              </div>
              <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {row.species.map((p) => (
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
          ))}
        </div>
      )}
    </section>
  );
};