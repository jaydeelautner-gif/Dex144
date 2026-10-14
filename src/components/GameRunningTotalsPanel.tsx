import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Settings,
  Layers,
} from 'lucide-react';
import {
  GAMES,
  GAME_GENERATION_GROUPS,
  DLC_PACKS,
  getGameRunningTotalStats,
  type PokemonEntry,
  type GameId,
  type DlcId,
  type GameCatchesMap,
} from '../data/pokemonData';
import { GameLogoBadge } from './GameLogoBadge';

interface GameRunningTotalsPanelProps {
  dex: PokemonEntry[];
  ownedGames: GameId[];
  ownedDlcs: DlcId[];
  gameCatches: GameCatchesMap;
  selectedGame: GameId | 'all';
  onSelectGameFilter: (gameId: GameId | 'all') => void;
  onNavigateToSettings: () => void;
}

export const GameRunningTotalsPanel: React.FC<GameRunningTotalsPanelProps> = ({
  dex,
  ownedGames,
  ownedDlcs,
  gameCatches,
  selectedGame,
  onSelectGameFilter,
  onNavigateToSettings,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Filter to ONLY owned games
  const ownedGameIds = GAME_GENERATION_GROUPS.flatMap((group) =>
    group.games.filter((gameId) => ownedGames.includes(gameId))
  );

  const totalOwnedCatchesLogged = ownedGameIds.reduce(
    (acc, gId) => acc + (gameCatches[gId]?.length || 0),
    0
  );

  return (
    <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Strip */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80">
        <div>
          <div className="text-xs font-mono-tabular text-amber-400 flex items-center gap-1.5 font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>RUNNING TOTAL CAUGHT PER OWNED GAME</span>
          </div>
          <h2 className="text-base font-bold text-slate-100 mt-0.5">
            Running Total Caught Per Game • {ownedGames.length} Owned Games Active • {totalOwnedCatchesLogged} Catches Logged
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing progress only from your owned games. Click any game card to filter the Pokédex to that title.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onNavigateToSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Configure your owned games and DLC expansions in Settings"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>
              {isExpanded ? 'Hide Game Totals' : `Show (${ownedGames.length} Games)`}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 flex flex-col gap-4">
          {ownedGames.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Settings className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-bold text-slate-100">
                  No Owned Games Selected
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Only owned games are displayed in the Running Totals. Visit Settings to select the games and DLC you own.
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToSettings}
                className="mt-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                Go to Settings & Select Games
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {ownedGameIds.map((gameId) => {
                const game = GAMES.find((g) => g.id === gameId)!;
                const isFiltered = selectedGame === gameId;
                const stats = getGameRunningTotalStats(
                  dex,
                  gameId,
                  ownedDlcs,
                  gameCatches[gameId] || []
                );
                const gameDlcPacks = DLC_PACKS.filter((p) => p.gameId === gameId);
                const ownedPacksForGame = gameDlcPacks.filter((p) =>
                  ownedDlcs.includes(p.id)
                );

                return (
                  <div
                    key={gameId}
                    onClick={() =>
                      onSelectGameFilter(isFiltered ? 'all' : gameId)
                    }
                    className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all cursor-pointer select-none ${
                      isFiltered
                        ? 'bg-[#131C30] border-amber-400/70 ring-1 ring-amber-400/30 shadow-md'
                        : 'bg-[#0B0F17] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono-tabular text-slate-400">
                          {game.generationLabel}
                        </span>
                        {isFiltered && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-tabular font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Active Filter
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <GameLogoBadge gameId={gameId} size="xs" />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-100 truncate">
                            {game.shortTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {game.hasPaidDlc ? (
                              ownedPacksForGame.length > 0 ? (
                                <span className="text-amber-300">
                                  {stats.baseTotal} Base + {stats.ownedDlcAddedTotal} DLC
                                </span>
                              ) : (
                                <span>{stats.baseTotal} Base (DLC Unowned)</span>
                              )
                            ) : (
                              <span>
                                {game.region} • {stats.baseTotal} Total
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {ownedPacksForGame.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1">
                          {ownedPacksForGame.map((pack) => (
                            <span
                              key={pack.id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono-tabular bg-amber-500/10 border border-amber-500/30 text-amber-300"
                            >
                              + {pack.shortName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-mono-tabular mb-1">
                        <span className="text-emerald-400 font-semibold">
                          {stats.caughtCount} / {stats.effectiveTotal} Caught
                        </span>
                        <span className="text-slate-400">{stats.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-transform duration-150 origin-left"
                          style={{
                            transform: `scaleX(${Math.min(
                              1,
                              stats.caughtCount / Math.max(1, stats.effectiveTotal)
                            )})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
