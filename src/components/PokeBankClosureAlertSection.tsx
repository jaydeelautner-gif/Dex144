import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  Maximize2,
} from 'lucide-react';
import type { PokemonEntry, GameCatchesMap, GameId } from '../data/pokemonData';
import { PokemonSprite } from './PokemonSprite';
import { PokemonHomeLogoBadge } from './GameLogoBadge';

interface PokeBankClosureAlertSectionProps {
  dex: PokemonEntry[];
  caughtSet: Set<number>;
  shinySet: Set<number>;
  gameCatches: GameCatchesMap;
  onSelectPokemon: (pokemon: PokemonEntry) => void;
  onOpenFullPage: (pokemon: PokemonEntry) => void;
}

const NON_BANK_MODERN_GAMES: GameId[] = ['lgpe', 'pogo', 'swsh', 'bdsp', 'pla', 'sv'];

export const PokeBankClosureAlertSection: React.FC<PokeBankClosureAlertSectionProps> = ({
  dex,
  caughtSet,
  shinySet,
  gameCatches,
  onSelectPokemon,
  onOpenFullPage,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const uncaughtAtRiskPokemon = useMemo(() => {
    return dex.filter((p) => {
      if (!p.homeTransfer.pokeBankClosureRisk.isAtRiskAfterBankClosure) {
        return false;
      }
      if (caughtSet.has(p.id)) {
        return false;
      }
      const caughtInModernElsewhere = NON_BANK_MODERN_GAMES.some((gId) =>
        (gameCatches[gId] || []).includes(p.id)
      );
      return !caughtInModernElsewhere;
    });
  }, [dex, caughtSet, gameCatches]);

  const totalAtRiskCount = useMemo(
    () =>
      dex.filter((p) => p.homeTransfer.pokeBankClosureRisk.isAtRiskAfterBankClosure)
        .length,
    [dex]
  );

  return (
    <section className="bg-[#0F1522] border border-rose-500/40 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="px-5 py-4 bg-gradient-to-r from-rose-950/35 via-[#0F1522] to-amber-950/25 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-rose-400">
                POST-POKÉ BANK CLOSURE WATCHLIST
              </span>
              <PokemonHomeLogoBadge size="xs" label="HOME Transfer Priority" />
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-0.5">
              Pokémon Unavailable or Restricted After Poké Bank Closes ({uncaughtAtRiskPokemon.length} Uncaught of {totalAtRiskCount})
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Lists Pokémon that will become unobtainable in Pokémon HOME (such as Spinda) or locked out of console transfers once 3DS Pokémon Bank closes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
        >
          <span>
            {isExpanded
              ? 'Hide Watchlist'
              : `Show ${uncaughtAtRiskPokemon.length} Priority Pokémon`}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5">
          {uncaughtAtRiskPokemon.length === 0 ? (
            <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/40 p-4 flex items-center gap-3 text-emerald-300 text-xs">
              <Check className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>
                All {totalAtRiskCount} Poké Bank closure priority Pokémon are caught! Your collection is safe from the 3DS Pokémon Bank shutdown.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {uncaughtAtRiskPokemon.map((p) => {
                const risk = p.homeTransfer.pokeBankClosureRisk;
                const isCritical = risk.riskLevel === 'unobtainable_in_home';
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPokemon(p)}
                    className={`group rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      isCritical
                        ? 'bg-rose-950/25 border-rose-500/50 hover:border-rose-400'
                        : 'bg-[#0B0F17] border-amber-500/35 hover:border-amber-400/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PokemonSprite
                          id={p.id}
                          name={p.name}
                          shiny={shinySet.has(p.id)}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono-tabular text-slate-400">
                            #{String(p.id).padStart(4, '0')} • {p.region}
                          </div>
                          <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                            {p.name}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFullPage(p);
                        }}
                        title={`Open ${p.name} Full Page`}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                      <span
                        className={`text-[10px] font-mono-tabular font-bold uppercase ${
                          isCritical ? 'text-rose-400' : 'text-amber-300'
                        }`}
                      >
                        {risk.badgeLabel}
                      </span>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {risk.description}
                      </p>
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
