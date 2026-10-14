import React, { useMemo } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { GAMES, type GameId } from '../data/pokemonData';
import {
  useEncounterDataset,
  getEncountersForGame,
  prettyEncounterMethod,
  type EncounterArea,
} from '../data/encountersData';
import { GameLogoBadge } from './GameLogoBadge';

interface PokemonEncountersSectionProps {
  pokemonId: number;
  /** Only these games are rendered; pass the user's owned games. */
  ownedGames: GameId[];
}

/**
 * Accurate wild-encounter table (location area → method, chance %, level range,
 * versions) pulled from PokéAPI and bundled at build time. Shown per owned game.
 */
export const PokemonEncountersSection: React.FC<PokemonEncountersSectionProps> = ({
  pokemonId,
  ownedGames,
}) => {
  const { dataset, loading } = useEncounterDataset();

  const rows = useMemo(() => {
    if (!dataset) return [];
    return GAMES.filter((g) => ownedGames.includes(g.id))
      .map((gameMeta) => ({ gameMeta, areas: getEncountersForGame(dataset, pokemonId, gameMeta.id) }))
      .filter((r): r is { gameMeta: (typeof GAMES)[number]; areas: EncounterArea[] } => !!r.areas);
  }, [dataset, pokemonId, ownedGames]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
        Loading wild encounter data…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 text-center text-xs text-slate-400">
        No recorded wild encounters for this Pokémon in your owned games — it may be obtained via
        evolution, special events, or transfer only.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-100">Wild Encounters (Exact Data)</h3>
        <span className="text-[10px] font-mono text-slate-400">PokéAPI · location, method, %, levels</span>
      </div>

      {rows.map(({ gameMeta, areas }) => (
        <div
          key={gameMeta.id}
          className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col gap-2 text-xs"
        >
          <div className="flex items-center gap-2 border-b border-slate-800/70 pb-2">
            <GameLogoBadge gameId={gameMeta.id} size="xs" />
            <span className="font-bold text-slate-100">{gameMeta.shortTitle}</span>
            <span className="ml-auto font-mono text-[10px] text-slate-400">
              {areas.length} location{areas.length === 1 ? '' : 's'}
            </span>
          </div>

          {areas.map((area) => (
            <div key={area.area} className="flex flex-col gap-1">
              <div className="flex items-start gap-1.5 text-slate-200 leading-snug">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <strong className="capitalize">{area.area.replace(/-area$/, '').replace(/-/g, ' ')}</strong>
              </div>
              <div className="flex flex-col gap-0.5 pl-5">
                {area.details.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[11px] text-slate-300 font-mono-tabular"
                  >
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
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
