import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Minimize2,
  Check,
  Sparkles,
  Box,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
  CreditCard,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Gamepad2,
  ShieldCheck,
  X,
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

interface PokemonFullPageViewProps {
  pokemon: PokemonEntry;
  dex: PokemonEntry[];
  onSelectPokemon: (pokemon: PokemonEntry) => void;
  onCloseFullPage: () => void;
  onSwitchToSidebar: () => void;
  isCaught: boolean;
  isShiny: boolean;
  isLiving: boolean;
  caughtVariantsSet: Set<string>;
  selectedBoxVariantId?: string;
  selectedBoxGameId?: GameId;
  ownedGames: GameId[];
  ownedDlcs: DlcId[];
  gameCatches: GameCatchesMap;
  onJumpToBox: (boxNumber: number) => void;
  inventory?: PokemonInstance[];
  onDeleteInstance?: (pokeId: string) => void;
  onOpenTrainerCardForPokeId?: (instance: PokemonInstance) => void;
  onNavigateToRegister?: (pokemonId?: number) => void;
  /** Completed milestones per trackable group + tracked games, for the reachability filter. */
  gameProgress?: Record<string, string[]>;
  trackedGames?: Set<GameId>;
}

export const PokemonFullPageView: React.FC<PokemonFullPageViewProps> = ({
  pokemon,
  dex,
  onSelectPokemon,
  onCloseFullPage,
  onSwitchToSidebar,
  isCaught,
  isShiny,
  isLiving,
  caughtVariantsSet,
  selectedBoxVariantId,
  selectedBoxGameId,
  ownedGames,
  ownedDlcs,
  gameCatches,
  onJumpToBox,
  inventory = [],
  onDeleteInstance,
  onOpenTrainerCardForPokeId,
  onNavigateToRegister,
  gameProgress = {},
  trackedGames,
}) => {
  const [previewShiny, setPreviewShiny] = useState(false);
  const [revealedFullPagePokeIds, setRevealedFullPagePokeIds] = useState<Set<string>>(() => new Set());
  const [consentModalInstance, setConsentModalInstance] = useState<PokemonInstance | null>(null);
  const [hasPositiveConsent, setHasPositiveConsent] = useState(false);

  const prevPokemon = pokemon.id > 1 ? dex[pokemon.id - 2] : dex[dex.length - 1];
  const nextPokemon = pokemon.id < dex.length ? dex[pokemon.id] : dex[0];

  const pokemonInstances = useMemo(() => {
    return inventory.filter((inv) => inv.pokemonId === pokemon.id);
  }, [inventory, pokemon.id]);

  const variations = getVariationsForPokemon(pokemon);
  const activeBoxVariant =
    variations.find((v) => v.variantId === selectedBoxVariantId) || variations[0];

  // User requirement: If a user has not marked a game as owned, hide it from the user on the Pokemon's page.
  const userOwnedEncounterGames = useMemo(() => {
    return GAMES.filter((g) => ownedGames.includes(g.id));
  }, [ownedGames]);

  const isExclusiveLabel = (exclusiveText: string) =>
    exclusiveText &&
    exclusiveText !== 'None' &&
    (exclusiveText.toLowerCase().includes('exclusive') ||
      exclusiveText.toLowerCase().includes('only'));

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action & Navigation Bar */}
      <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onCloseFullPage}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Pokédex</span>
          </button>
          <button
            type="button"
            onClick={onSwitchToSidebar}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
            title="Switch to Side Bar View"
          >
            <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Dock to Side Bar</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectPokemon(prevPokemon)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono-tabular text-slate-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              #{String(prevPokemon.id).padStart(4, '0')} {prevPokemon.name}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPokemon(nextPokemon)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono-tabular text-slate-200 transition-colors cursor-pointer"
          >
            <span>
              #{String(nextPokemon.id).padStart(4, '0')} {nextPokemon.name}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Pokémon Overview & Living Box Slot Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Artwork, Species Identity & Master Status */}
        <div className="lg:col-span-7 bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
          <div className="flex flex-col items-center shrink-0 bg-[#0B0F17] border border-slate-800/80 rounded-2xl p-5 shadow-inner">
            <PokemonSprite
              id={activeBoxVariant.spriteId}
              name={activeBoxVariant.formName}
              shiny={previewShiny || isShiny}
              size="xl"
            />
            <div className="flex items-center gap-1 mt-3 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewShiny(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  !previewShiny
                    ? 'bg-slate-800 text-slate-100 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setPreviewShiny(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  previewShiny
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Shiny
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 w-full">
            <div>
              <div className="text-xs font-mono-tabular text-amber-400 font-bold">
                NATIONAL POKÉDEX #{String(pokemon.id).padStart(4, '0')} • GENERATION {pokemon.generation} ({pokemon.region.toUpperCase()})
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 mt-1">
                {pokemon.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
                <span>
                  Type: <strong className="text-amber-300">{pokemon.types.join(' / ')}</strong>
                </span>
                <span aria-hidden="true">•</span>
                <span>
                  Classification: <strong className="text-slate-100">{pokemon.category}</strong>
                </span>
                <span aria-hidden="true">•</span>
                <span>
                  Inventory Count: <strong className="text-emerald-400">{pokemonInstances.length}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
              <div className="text-xs font-mono-tabular text-slate-400">
                Status:{' '}
                <strong className={isCaught && pokemonInstances.length > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                  {isCaught && pokemonInstances.length > 0 ? 'CAUGHT' : 'UNCAUGHT'}
                </strong>{' '}
                ({pokemonInstances.length} registered pokepets)
              </div>
              {onNavigateToRegister && (
                <button
                  type="button"
                  onClick={() => onNavigateToRegister(pokemon.id)}
                  className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shadow-lg"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Register Pokepet</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Living Dex Box Placement */}
        <div className="lg:col-span-5 bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-mono-tabular text-sky-400 font-bold">
                LIVING DEX PC BOX COORDINATES
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                PC Box {pokemon.boxNumber} • Slot {pokemon.boxSlot} (Row {pokemon.boxRow}, Col {pokemon.boxCol})
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Pokepets marked as "Stored in Pokémon HOME" are eligible for placement in this Living Dex slot.
              </p>
            </div>

            <div className="grid grid-cols-6 gap-1 p-2 bg-[#0B0F17] border border-slate-800 rounded-xl shrink-0 shadow-inner">
              {Array.from({ length: 30 }).map((_, idx) => {
                const slotNum = idx + 1;
                const isTarget = slotNum === pokemon.boxSlot;
                return (
                  <div
                    key={slotNum}
                    className={`w-3 h-3 rounded-xs ${
                      isTarget
                        ? 'bg-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="bg-[#0B0F17] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 font-mono">
                Assigned Pokepet:
              </div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">
                {pokemonInstances.find((s) => s.isInLivingBox && s.storedInHome)
                  ? `${pokemonInstances.find((s) => s.isInLivingBox && s.storedInHome)?.nickname || pokemon.name} (Lv.${pokemonInstances.find((s) => s.isInLivingBox && s.storedInHome)?.level})`
                  : isLiving && pokemonInstances.length > 0
                  ? `${pokemon.name} (Boxed)`
                  : 'No HOME pokepet assigned to slot yet'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onJumpToBox(pokemon.boxNumber)}
              className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-xs font-semibold text-sky-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Box {pokemon.boxNumber}
            </button>
          </div>
        </div>
      </div>

      {/* USER'S LOGGED POKEPET INVENTORY FOR THIS POKÉMON */}
      <section className="bg-[#0F1522] border border-amber-500/40 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                POKEPET INVENTORY ({pokemonInstances.length} REGISTERED)
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Your Registered Pet Pokémon & 12-Digit POKEIDs
            </h2>
            <p className="text-xs text-slate-400">
              Every registered instance of {pokemon.name} with its permanent POKEID, level, origin game, and storage status.
            </p>
          </div>

          {onNavigateToRegister && (
            <button
              type="button"
              onClick={() => onNavigateToRegister(pokemon.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shrink-0 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Register New {pokemon.name}</span>
            </button>
          )}
        </div>

        {pokemonInstances.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0B0F17] border border-slate-800/80 text-center flex flex-col items-center gap-3">
            <p className="text-xs text-slate-400">
              No individual pokepets recorded yet for {pokemon.name}. Use the Register Pokémon page to record your first pet with its exact Level, POKEID, and origin.
            </p>
            {onNavigateToRegister && (
              <button
                type="button"
                onClick={() => onNavigateToRegister(pokemon.id)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-lg"
              >
                + Register First {pokemon.name} Pokepet
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pokemonInstances.map((inst) => {
              const gameMeta = inst.gameId ? GAMES.find((g) => g.id === inst.gameId) : undefined;
              const originLabel = formatOriginSourceLabel(inst, gameMeta?.shortTitle);
              const storageLabel = formatStorageLocationLabel(inst, gameMeta?.platform);
              const isRevealed = revealedFullPagePokeIds.has(inst.pokeId);

              return (
                <div
                  key={inst.pokeId}
                  className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">POKEID:</span>
                      <span className="text-xs font-mono font-black text-amber-300 tracking-wider">
                        {isRevealed ? inst.pokeId : 'ID••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRevealedFullPagePokeIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(inst.pokeId)) next.delete(inst.pokeId);
                            else next.add(inst.pokeId);
                            return next;
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-amber-300 cursor-pointer"
                        title={isRevealed ? 'Hide POKEID' : 'Reveal POKEID'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onOpenTrainerCardForPokeId && (
                        <button
                          type="button"
                          onClick={() => onOpenTrainerCardForPokeId(inst)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 cursor-pointer"
                          title="View Pokepet Trainer Card"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      )}
                      {onDeleteInstance && (
                        <button
                          type="button"
                          onClick={() => {
                            setHasPositiveConsent(false);
                            setConsentModalInstance(inst);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 cursor-pointer"
                          title="Delete PokéPet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-slate-100">
                        {inst.nickname ? `"${inst.nickname}" (${pokemon.name})` : pokemon.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {inst.variantName}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold">
                        Lv.{inst.level}
                      </span>
                      {inst.isShiny && (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono-tabular border-t border-slate-800 pt-2 text-slate-400">
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
      </section>

      {/* EVOLUTION CHAIN & GAME-SPECIFIC EVOLUTION METHODS */}
      {(() => {
        const evoFamily = getEvolutionFamilyForPokemon(pokemon.id);
        if (!evoFamily || evoFamily.stages.length === 0) return null;
        return (
          <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
            <div className="border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                EVOLUTION INFORMATION
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-0.5">
                Evolution Family & In-Game Evolution Triggers
              </h2>
              <p className="text-xs text-slate-400">
                Click any Pokémon in the evolutionary chain to navigate directly to its page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/20'
                        : 'bg-[#0B0F17] border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">
                        STAGE {stage.stage}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          Active Pokémon
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-center my-1">
                      <PokemonSprite
                        id={stage.pokemonId}
                        name={stage.speciesName}
                        size="md"
                      />
                      <span className="text-sm font-bold text-slate-100 mt-2">
                        {stage.speciesName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        #{String(stage.pokemonId).padStart(4, '0')}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-xs flex flex-col gap-1">
                      <div className="font-semibold text-amber-300">
                        {stage.detail}
                      </div>
                      {stage.itemRequired && (
                        <div className="text-[11px] text-sky-300">
                          Item: <strong>{stage.itemRequired}</strong>
                        </div>
                      )}
                      {stage.gameDifferences && (
                        <div className="text-[10px] text-slate-400 flex flex-col gap-0.5 mt-0.5">
                          {Object.entries(stage.gameDifferences).map(([gKey, gNote]) => (
                            <span key={gKey} className="text-slate-300">
                              • <strong className="uppercase">{gKey}</strong>: {String(gNote)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ITEM INFORMATION ACROSS ALL GAMES */}
      {(() => {
        const items = getItemInfoForPokemon(pokemon.id);
        if (items.length === 0) return null;
        return (
          <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
            <div className="border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                ITEM INFORMATION ACROSS ALL GAMES
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-0.5">
                Required Evolution & Form Items
              </h2>
              <p className="text-xs text-slate-400">
                Locations and methods to obtain required items for {pokemon.name} in each game.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-100">{item.name}</h3>
                    </div>
                    <span className="text-xs text-slate-400 italic">
                      {item.description}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {item.locationsByGame.map((loc) => (
                      <div
                        key={loc.gameId}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-0.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <GameLogoBadge gameId={loc.gameId} size="xs" />
                          <span>{loc.gameShortTitle}</span>
                        </div>
                        <span className="text-slate-400 text-[11px] leading-relaxed">
                          {loc.location}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}
      <div
        className={`rounded-2xl border p-5 flex flex-col gap-3.5 shadow-xl ${
          pokemon.homeTransfer.pokeBankClosureRisk.isAtRiskAfterBankClosure
            ? 'bg-rose-950/20 border-rose-500/45'
            : 'bg-[#0F1522] border-slate-800/80'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <PokemonHomeLogoBadge size="md" />
            <h2 className="text-base font-bold text-slate-100">
              Pokémon HOME Transfer Eligibility & Post-Poké Bank Closure Check
            </h2>
          </div>
          <span className="text-xs font-mono-tabular font-semibold text-emerald-400">
            {pokemon.homeTransfer.statusLabel}
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          {pokemon.homeTransfer.summary}
        </p>

        {pokemon.homeTransfer.pokeBankClosureRisk.isAtRiskAfterBankClosure && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/60 text-xs text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong>{pokemon.homeTransfer.pokeBankClosureRisk.badgeLabel}:</strong>{' '}
              {pokemon.homeTransfer.pokeBankClosureRisk.description}
            </div>
          </div>
        )}
      </div>

      {/* Accurate Wild Encounter Data (PokéAPI bundle) */}
      <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <PokemonEncountersSection
          pokemonId={pokemon.id}
          ownedDlcs={ownedDlcs}
          ownedGames={userOwnedEncounterGames.map((g) => g.id)}
          progress={gameProgress}
          trackedGames={trackedGames}
        />
      </section>

      {/* POSITIVE CONSENT MODAL FOR DELETING FROM FULL PAGE VIEW */}
      {consentModalInstance && onDeleteInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0F1522] border border-rose-500/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            <button
              type="button"
              onClick={() => setConsentModalInstance(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-rose-400">
              <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-slate-100">
                  PokéPet Protection: Positive Consent Required
                </h3>
                <p className="text-xs text-slate-400">Confirmation for companion removal</p>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col gap-2.5 text-xs text-slate-300 leading-relaxed">
              <p>
                You are about to delete <strong className="text-white">{consentModalInstance.nickname || pokemon.name}</strong> (POKEID: <span className="text-amber-300 font-mono font-bold">{consentModalInstance.pokeId}</span>).
              </p>
              <p className="text-slate-400">
                Completing this action will remove this PokéPet from your active inventory and Living Dex boxes.
              </p>
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                🛡️ <strong className="font-semibold">30-Day Rescue Safety Guarantee:</strong> All PokéPets and POKEIDs chosen for deletion are kept in your <strong className="text-white">Rescue Bin</strong> in Settings for 30 days before automatic deletion. You can rescue it at any time.
              </div>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasPositiveConsent}
                onChange={(e) => setHasPositiveConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-700 bg-slate-900 cursor-pointer"
              />
              <span className="text-xs text-rose-200 font-medium leading-snug">
                I understand this PokéPet will be deleted and moved to the 30-Day Rescue Bin, and I give positive consent to complete this action.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConsentModalInstance(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel & Keep Safe
              </button>
              <button
                type="button"
                disabled={!hasPositiveConsent}
                onClick={() => {
                  onDeleteInstance(consentModalInstance.pokeId);
                  setConsentModalInstance(null);
                }}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-lg ${
                  hasPositiveConsent
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                Confirm Delete & Move to Rescue Bin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
