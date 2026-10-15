import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Box,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Maximize2,
  CreditCard,
  Plus,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import type {
  PokemonEntry,
  DlcId,
  GameId,
  GameCatchesMap,
} from '../data/pokemonData';
import {
  GAMES,
  DLC_PACKS,
  GAME_GENERATION_GROUPS,
  getGameRunningTotalStats,
} from '../data/pokemonData';
import {
  getVariationsForPokemon,
} from '../data/regionalVariantsData';
import {
  formatOriginSourceLabel,
  formatStorageLocationLabel,
  type PokemonInstance,
} from '../data/pokemonInventoryData';
import { getEvolutionFamilyForPokemon } from '../data/pokemonEvolutionData';
import { getItemInfoForPokemon } from '../data/pokemonItemsData';
import { PokemonSprite } from './PokemonSprite';
import { GameLogoBadge, PokemonHomeLogoBadge } from './GameLogoBadge';
import { PokemonEncountersSection } from './PokemonEncountersSection';

interface PokemonDetailDrawerProps {
  pokemon: PokemonEntry | null;
  dex: PokemonEntry[];
  onSelectPokemon: (pokemon: PokemonEntry) => void;
  onOpenFullPage: (pokemon: PokemonEntry) => void;
  onClose: () => void;
  isCaught: boolean;
  isShiny: boolean;
  isLiving: boolean;
  caughtVariantsSet: Set<string>;
  selectedBoxGameId?: GameId;
  ownedGames: GameId[];
  ownedDlcs: DlcId[];
  gameCatches: GameCatchesMap;
  inventory?: PokemonInstance[];
  onNavigateToRegister?: (pokemonId?: number) => void;
  onOpenTrainerCardForPokeId?: (instance: PokemonInstance) => void;
}

export const PokemonDetailDrawer: React.FC<PokemonDetailDrawerProps> = ({
  pokemon,
  dex,
  onSelectPokemon,
  onOpenFullPage,
  onClose,
  isCaught,
  isShiny,
  isLiving,
  caughtVariantsSet,
  selectedBoxGameId,
  ownedGames,
  ownedDlcs,
  gameCatches,
  inventory = [],
  onNavigateToRegister,
  onOpenTrainerCardForPokeId,
}) => {
  const [previewShiny, setPreviewShiny] = useState(false);
  const [revealedDrawerPokeIds, setRevealedDrawerPokeIds] = useState<Set<string>>(() => new Set());
  if (!pokemon) return null;

  const prevPokemon = pokemon.id > 1 ? dex[pokemon.id - 2] : dex[dex.length - 1];
  const nextPokemon = pokemon.id < dex.length ? dex[pokemon.id] : dex[0];

  const variations = getVariationsForPokemon(pokemon);
  const pokepets = inventory.filter((inv) => inv.pokemonId === pokemon.id);

  // User Requirement: If a user has not marked a game as owned, hide it from the user on the Pokemon’s page.
  const userOwnedEncounterGames = GAMES.filter((g) => ownedGames.includes(g.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <aside className="relative z-10 w-full max-w-2xl bg-[#0F1522] border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectPokemon(prevPokemon)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono-tabular text-slate-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                #{String(prevPokemon.id).padStart(4, '0')} {prevPokemon.name}
              </button>
              <button
                type="button"
                onClick={() => onSelectPokemon(nextPokemon)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono-tabular text-slate-300 transition-colors cursor-pointer"
              >
                #{String(nextPokemon.id).padStart(4, '0')} {nextPokemon.name}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenFullPage(pokemon)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-xs font-semibold text-amber-300 transition-colors cursor-pointer"
                title="Open Full-Screen Pokémon Page"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Open Full Page</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="text-xs font-mono-tabular text-slate-400">
                #{String(pokemon.id).padStart(4, '0')} • Generation {pokemon.generation} ({pokemon.region}) • {pokemon.category}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-1">
                {pokemon.name}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-slate-300">
              <span>
                Type: <span className="text-amber-300 font-semibold">{pokemon.types.join(' / ')}</span>
              </span>
              <span>•</span>
              <span className={pokepets.length > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {pokepets.length > 0 ? `${pokepets.length} Caught in Inventory` : 'Not Caught (0 in Inventory)'}
              </span>
            </div>
          </div>
        </div>

        {/* Artwork & Registration Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center bg-[#0B0F17] border border-slate-800/80 rounded-2xl p-5">
          <div className="flex flex-col items-center">
            <PokemonSprite
              id={pokemon.id}
              name={pokemon.name}
              shiny={previewShiny || isShiny}
              size="xl"
            />
            <div className="flex items-center gap-1 mt-3 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewShiny(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  !previewShiny
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard Sprite
              </button>
              <button
                type="button"
                onClick={() => setPreviewShiny(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  previewShiny
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Shiny Sprite
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-400">
              <span>MASTER DEX STATUS</span>
              <span className={isCaught && pokepets.length > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {isCaught && pokepets.length > 0 ? 'CAUGHT IN DEX' : 'NOT CAUGHT'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Registered Pokepets:</span>
                <strong className="text-amber-300 font-mono text-sm">{pokepets.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Stored in HOME:</span>
                <strong className={pokepets.some((s) => s.storedInHome) ? 'text-emerald-400' : 'text-slate-400'}>
                  {pokepets.filter((s) => s.storedInHome).length}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Living Dex Box:</span>
                <strong className="text-sky-300">
                  Box {pokemon.boxNumber}, Slot {pokemon.boxSlot}
                </strong>
              </div>
            </div>

            {onNavigateToRegister && (
              <button
                type="button"
                onClick={() => onNavigateToRegister(pokemon.id)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Register {pokemon.name} Pokepet</span>
              </button>
            )}
          </div>
        </div>

        {/* POKEPET INVENTORY CARDS FOR THIS POKÉMON */}
        <div className="bg-[#0F1522] border border-amber-500/40 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                REGISTERED POKEPETS ({pokepets.length})
              </span>
            </div>
            {onNavigateToRegister && (
              <button
                type="button"
                onClick={() => onNavigateToRegister(pokemon.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Pokepet</span>
              </button>
            )}
          </div>

          {pokepets.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center gap-2">
              <p className="text-xs text-slate-400">
                No instances registered for {pokemon.name} yet.
              </p>
              {onNavigateToRegister && (
                <button
                  type="button"
                  onClick={() => onNavigateToRegister(pokemon.id)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Register First Pokepet →
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {pokepets.map((inst) => {
                const isRevealed = revealedDrawerPokeIds.has(inst.pokeId);
                const gameMeta = inst.gameId ? GAMES.find((g) => g.id === inst.gameId) : undefined;
                const originLabel = formatOriginSourceLabel(inst, gameMeta?.shortTitle);
                const storageLabel = formatStorageLocationLabel(inst, gameMeta?.platform);

                return (
                  <div
                    key={inst.pokeId}
                    className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-slate-400">POKEID:</span>
                        <span className="text-amber-300 font-bold">
                          {isRevealed ? inst.pokeId : 'ID••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRevealedDrawerPokeIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(inst.pokeId)) next.delete(inst.pokeId);
                              else next.add(inst.pokeId);
                              return next;
                            });
                          }}
                          className="p-0.5 text-slate-400 hover:text-amber-300 cursor-pointer"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                          Lv.{inst.level}
                        </span>
                        {onOpenTrainerCardForPokeId && (
                          <button
                            type="button"
                            onClick={() => onOpenTrainerCardForPokeId(inst)}
                            className="p-1 rounded bg-slate-900 text-slate-300 hover:text-amber-300 border border-slate-700 cursor-pointer"
                            title="View Pokepet Trainer Card"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">
                        {inst.nickname ? `"${inst.nickname}" (${pokemon.name})` : pokemon.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {inst.variantName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono-tabular border-t border-slate-800/80 pt-1.5">
                      <span className={inst.isHomeGift ? 'text-purple-300 font-semibold' : 'text-sky-300 font-semibold'}>
                        {originLabel}
                      </span>
                      <span className={inst.storedInHome ? 'text-emerald-400' : 'text-slate-400'}>
                        {storageLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pokémon HOME Transfer Info */}
        <div
          className={`rounded-2xl border p-4 flex flex-col gap-3 ${
            pokemon.homeTransfer.pokeBankClosureRisk.isAtRiskAfterBankClosure
              ? 'bg-rose-950/20 border-rose-500/45'
              : 'bg-[#0B0F17] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <PokemonHomeLogoBadge size="sm" />
            <span className="text-xs font-mono-tabular font-semibold text-emerald-400">
              {pokemon.homeTransfer.statusLabel}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {pokemon.homeTransfer.summary}
          </p>
        </div>

        {/* EVOLUTION CHAIN & CROSS-SPECIES LINKS */}
        {(() => {
          const evoFamily = getEvolutionFamilyForPokemon(pokemon.id);
          if (!evoFamily || evoFamily.stages.length === 0) return null;
          return (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                  <span className="text-amber-400">EVOLUTION FAMILY</span>
                </h3>
                <span className="text-[10px] text-slate-400">Click species to view page</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {evoFamily.stages.map((stage) => {
                  const stageMon = dex.find((p) => p.id === stage.pokemonId);
                  const isCurrent = stage.pokemonId === pokemon.id;
                  return (
                    <div
                      key={stage.pokemonId}
                      onClick={() => {
                        if (stageMon && !isCurrent) {
                          onSelectPokemon(stageMon);
                        }
                      }}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/30'
                          : 'bg-[#0B0F17] border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          Stage {stage.stage}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 my-1">
                        <PokemonSprite
                          id={stage.pokemonId}
                          name={stage.speciesName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 truncate">
                            {stage.speciesName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            #{String(stage.pokemonId).padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-300 font-semibold border-t border-slate-800/80 pt-1.5 leading-snug">
                        {stage.detail}
                      </div>
                      {stage.itemRequired && (
                        <div className="text-[10px] text-sky-300">
                          Item: <strong>{stage.itemRequired}</strong>
                        </div>
                      )}
                      {stage.gameDifferences && (
                        <div className="text-[9px] text-slate-400 flex flex-col gap-0.5 mt-0.5">
                          {Object.entries(stage.gameDifferences).map(([gKey, gNote]) => (
                            <span key={gKey}>
                              • <strong className="uppercase">{gKey}</strong>: {gNote}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* REQUIRED EVOLUTION & FORM ITEMS */}
        {(() => {
          const items = getItemInfoForPokemon(pokemon.id);
          if (items.length === 0) return null;
          return (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                <span className="text-sky-400">REQUIRED ITEMS & LOCATIONS</span>
              </h3>
              <div className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{item.name}</span>
                      <span className="text-[10px] font-mono text-sky-300">{item.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{item.description}</p>
                    <div className="flex flex-col gap-1 border-t border-slate-800/80 pt-2 text-[10px]">
                      <span className="text-slate-300 font-semibold">Where to get by game:</span>
                      <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                        {item.locationsByGame.slice(0, 6).map((loc) => (
                          <div key={loc.gameId} className="flex items-start gap-1.5">
                            <span className="font-mono text-amber-300 shrink-0 font-bold">
                              {loc.gameShortTitle}:
                            </span>
                            <span className="text-slate-400">{loc.location}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Accurate Wild Encounter Data (PokéAPI bundle) */}
        <PokemonEncountersSection pokemonId={pokemon.id} ownedGames={userOwnedEncounterGames.map((g) => g.id)} />
      </aside>
    </div>
  );
};
