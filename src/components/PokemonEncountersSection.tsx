import { isAreaOwned } from '../data/dlcOwnership';
import React, { useMemo, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { GAMES, type GameId, type DlcId } from '../data/pokemonData';
import {
  useEncounterDataset,
  getEncountersForGame,
  prettyEncounterMethod,
  prettyEncounterCondition,
  type EncounterArea,
} from '../data/encountersData';
import { GameLogoBadge } from './GameLogoBadge';
import { isAreaReachable, areaUnlockMilestone } from '../utils/gameAreas';
import { MILESTONES, GAME_ID_TO_TRACKABLE } from '../data/milestones';

interface PokemonEncountersSectionProps {
  pokemonId: number;
  /** Only these games are rendered; pass the user's owned games. */
  ownedGames: GameId[];
  ownedDlcs?: DlcId[];
  /** Completed milestone ids per trackable group, for the progress filter. */
  progress?: Record<string, string[]>;
  /** Milestone ids currently tracked; enables the "reachable now" toggle. */
  trackedGames?: Set<GameId>;
  /** Per game: starter lines that are trade-only once another starter was picked. */
  lockedStartersByGame?: Partial<Record<GameId, number[]>>;
}

/**
 * Accurate wild-encounter table (location area → method, chance %, level range,
 * versions) pulled from PokéAPI and bundled at build time. Shown per owned game.
 */
export const PokemonEncountersSection: React.FC<PokemonEncountersSectionProps> = ({
  pokemonId,
  ownedGames,
  ownedDlcs = [],
  progress = {},
  trackedGames,
  lockedStartersByGame,
}) => {
  const { dataset, loading } = useEncounterDataset();
  const [reachableOnly, setReachableOnly] = useState(false);

  // The filter is only meaningful for a game with milestones to check off.
  const canFilter = (trackedGames?.size ?? 0) > 0;

  const rows = useMemo(() => {
    if (!dataset) return [];
    return GAMES.filter((g) => ownedGames.includes(g.id))
      // A spent starter pick is not a wild encounter here; it belongs to the
      // "other starters — trade only" list in Trainer Hints instead.
      .filter((g) => !lockedStartersByGame?.[g.id]?.includes(pokemonId))
      .map((gameMeta) => ({ gameMeta, areas: getEncountersForGame(dataset, pokemonId, gameMeta.id)?.filter(area => isAreaOwned(gameMeta.id, area.area, ownedDlcs)) ?? null }))
      .filter((r): r is { gameMeta: (typeof GAMES)[number]; areas: EncounterArea[] } => !!r.areas?.length);
  }, [dataset, pokemonId, ownedGames, ownedDlcs, lockedStartersByGame]);

  // Areas reachable with the badges/milestones marked so far, per game.
  const applied = useMemo(() => {
    if (!reachableOnly || !canFilter) {
      return rows.map((r) => ({ ...r, hiddenAreas: 0, hiddenMilestones: [] as string[] }));
    }
    return rows
      .map(({ gameMeta, areas }) => {
        const group = (GAME_ID_TO_TRACKABLE as Record<string, string | undefined>)[gameMeta.id];
        // Only filter games the trainer is actually tracking; others stay intact.
        if (!group || !trackedGames?.has(group as GameId)) {
          return { gameMeta, areas, hiddenAreas: 0, hiddenMilestones: [] as string[] };
        }
        const completed = new Set(progress[group] ?? []);
        const kept = areas.filter((a) => isAreaReachable(gameMeta.id, a.area, completed, ownedDlcs));
        const blocked = new Set<string>();
        for (const a of areas) {
          if (kept.includes(a)) continue;
          const milestoneId = areaUnlockMilestone(gameMeta.id, a.area);
          const ms = milestoneId ? (MILESTONES[group] ?? []).find((m) => m.id === milestoneId) : undefined;
          blocked.add(ms?.short ?? milestoneId ?? 'locked');
        }
        return { gameMeta, areas: kept, hiddenAreas: areas.length - kept.length, hiddenMilestones: [...blocked] };
      })
      .filter((r) => r.areas.length > 0 || r.hiddenAreas === 0);
  }, [rows, reachableOnly, canFilter, trackedGames, progress, ownedDlcs]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
        Loading wild encounter data…
      </div>
    );
  }

  if (rows.length === 0) {
    const starterLocked = ownedGames.some((g) => lockedStartersByGame?.[g]?.includes(pokemonId));
    return (
      <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 text-center text-xs text-slate-400">
        {starterLocked
          ? 'This starter can no longer be obtained in that game — picking another starter consumes its only gift. Trade with a trainer who chose it (see “Other starters — receivable by trade only” in Trainer Hints).'
          : 'No recorded wild encounters for this Pokémon in your owned games — it may be obtained via evolution, special events, or transfer only.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-100">Wild Encounters (Exact Data)</h3>
        <span className="text-[10px] font-mono text-slate-400">PokéAPI · location, method, %, levels</span>
      </div>

      {canFilter && (
        <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={reachableOnly}
            onChange={(e) => setReachableOnly(e.target.checked)}
            className="accent-amber-400"
          />
          <span>Only show locations I can reach with my current game progress</span>
        </label>
      )}

      {applied.map(({ gameMeta, areas, hiddenAreas, hiddenMilestones }) => (
        <div
          key={gameMeta.id}
          className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col gap-2 text-xs"
        >
          <div className="flex items-center gap-2 border-b border-slate-800/70 pb-2">
            <GameLogoBadge gameId={gameMeta.id} size="xs" />
            <span className="font-bold text-slate-100">{gameMeta.shortTitle}</span>
            <span className="ml-auto font-mono text-[10px] text-slate-400">
              {areas.length} location{areas.length === 1 ? '' : 's'}
              {hiddenAreas > 0 && (
                <span className="text-amber-300">
                  {' '}· {hiddenAreas} locked
                  {hiddenMilestones.length > 0 ? ` (${hiddenMilestones.join(', ')})` : ''}
                </span>
              )}
            </span>
          </div>

          {areas.map((area) => (
            <div key={area.area} className="flex flex-col gap-1">
              <div className="flex items-start gap-1.5 text-slate-200 leading-snug">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <strong className="capitalize">{area.area.replace(/-area$/, '').replace(/-/g, ' ')}</strong>
              </div>
              <div className="flex flex-col gap-0.5 pl-5">
                {area.details.map((d, i) => {
                  const chips = d.conditions
                    .map(prettyEncounterCondition)
                    .filter((c): c is string => !!c);
                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-0.5"
                    >
                      <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono-tabular">
                        <span className="text-slate-100 min-w-24">{prettyEncounterMethod(d.method)}</span>
                        <span className="text-emerald-300 font-bold w-12">{d.chance}%</span>
                        <span className="text-slate-400">
                          Lv. {d.minLevel}
                          {d.maxLevel !== d.minLevel ? `–${d.maxLevel}` : ''}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {d.versions
                            .map((v) => v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                            .join(' / ')}
                        </span>
                      </div>
                      {chips.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1 pl-0.5">
                          {chips.map((chip) => (
                            <span
                              key={chip}
                              className="px-1.5 py-0.5 rounded bg-sky-400/10 border border-sky-400/30 text-sky-300 text-[9px] font-bold"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
