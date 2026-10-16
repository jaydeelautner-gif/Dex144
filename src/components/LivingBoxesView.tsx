import { PokerusBadge } from './PokerusBadge';
import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Box,
  Eye,
  FastForward,
  Plus,
} from 'lucide-react';
import type { PokemonEntry, GameId } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import { getVariationsForPokemon } from '../data/regionalVariantsData';
import { PokemonSprite } from './PokemonSprite';
import { PokeballIcon } from './PokeballIcon';
import { GameLogoBadge } from './GameLogoBadge';
import {
  formatOriginSourceLabel,
  formatStorageLocationLabel,
  type PokemonInstance,
} from '../data/pokemonInventoryData';

interface LivingBoxesViewProps {
  dex: PokemonEntry[];
  activeBox: number;
  onChangeBox: (boxNum: number) => void;
  selectedGame: GameId | 'all';
  caughtSet: Set<number>;
  shinySet: Set<number>;
  livingSet: Set<number>;
  caughtVariantsSet: Set<string>;
  boxSelectedVariantsMap: Map<number, string>;
  boxSelectedGamesMap: Map<number, GameId>;
  onSelectBoxVariant: (pokemonId: number, variantId: string) => void;
  onSelectPokemon: (pokemon: PokemonEntry) => void;
  inventory?: PokemonInstance[];
  onNavigateToRegister?: (pokemonId?: number) => void;
}

export const LivingBoxesView: React.FC<LivingBoxesViewProps> = ({
  dex,
  activeBox,
  onChangeBox,
  selectedGame,
  caughtSet,
  shinySet,
  livingSet,
  caughtVariantsSet,
  boxSelectedVariantsMap,
  boxSelectedGamesMap,
  onSelectBoxVariant,
  onSelectPokemon,
  inventory = [],
  onNavigateToRegister,
}) => {
  // Set of species IDs that have at least one registered PokePet in inventory:
  // "pokemon should not be allowed to classed as caught on any box view if the user has no PokePets registered with that species."
  const registeredSpeciesSet = React.useMemo(() => {
    return new Set(inventory.map((inv) => inv.pokemonId));
  }, [inventory]);

  const hasRegisteredPokePet = (pokemonId: number) => registeredSpeciesSet.has(pokemonId);

  const totalBoxes = Math.ceil(dex.length / 30);
  const startId = (activeBox - 1) * 30 + 1;
  const endId = Math.min(activeBox * 30, dex.length);
  const boxPokemon = dex.filter((p) => p.boxNumber === activeBox);
  const boxedInCurrent = boxPokemon.filter((p) => hasRegisteredPokePet(p.id) && livingSet.has(p.id)).length;
  const caughtInCurrent = boxPokemon.filter((p) => hasRegisteredPokePet(p.id) && caughtSet.has(p.id)).length;
  const shinyInCurrent = boxPokemon.filter((p) => hasRegisteredPokePet(p.id) && shinySet.has(p.id)).length;

  const gameContext: GameId = selectedGame === 'all' ? 'sv' : selectedGame;
  const gameTitle = GAMES.find((g) => g.id === gameContext)?.shortTitle || 'Scarlet / Violet';

  const jumpToFirstIncompleteBox = () => {
    for (let b = 1; b <= totalBoxes; b++) {
      const slice = dex.filter((p) => p.boxNumber === b);
      const allBoxed = slice.every((p) => hasRegisteredPokePet(p.id) && livingSet.has(p.id));
      if (!allBoxed) {
        onChangeBox(b);
        return;
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Box Navigation & Mode Bar */}
      <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onChangeBox(activeBox > 1 ? activeBox - 1 : totalBoxes)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors cursor-pointer"
            aria-label="Previous Box"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <select
            value={activeBox}
            onChange={(e) => onChangeBox(Number(e.target.value))}
            aria-label="Select PC Box"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-100 font-mono-tabular focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {Array.from({ length: totalBoxes }).map((_, idx) => {
              const bNum = idx + 1;
              const sId = (bNum - 1) * 30 + 1;
              const eId = Math.min(bNum * 30, dex.length);
              const bSlice = dex.filter((p) => p.boxNumber === bNum);
              const bDone = bSlice.filter((p) => hasRegisteredPokePet(p.id) && livingSet.has(p.id)).length;
              return (
                <option key={bNum} value={bNum}>
                  Box {String(bNum).padStart(2, '0')} (#{String(sId).padStart(4, '0')}–#{String(eId).padStart(4, '0')}) — {bDone}/{bSlice.length} Boxed
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={() => onChangeBox(activeBox < totalBoxes ? activeBox + 1 : 1)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors cursor-pointer"
            aria-label="Next Box"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={jumpToFirstIncompleteBox}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            Next Incomplete Box
          </button>
        </div>

        {/* Action: Link to Register Pokémon */}
        {onNavigateToRegister && (
          <button
            type="button"
            onClick={() => onNavigateToRegister()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Pokémon</span>
          </button>
        )}
      </div>

      {/* Box Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-2 font-mono-tabular">
          <span className="text-slate-200 font-semibold">
            PC Box {activeBox} (#{String(startId).padStart(4, '0')}–#{String(endId).padStart(4, '0')})
          </span>
          <span aria-hidden="true">•</span>
          <span className="text-sky-400">
            {boxedInCurrent}/{boxPokemon.length} Living Boxed
          </span>
          <span aria-hidden="true">•</span>
          <span className="text-emerald-400">
            {caughtInCurrent}/{boxPokemon.length} Caught
          </span>
          <span aria-hidden="true">•</span>
          <span className="text-amber-400">
            {shinyInCurrent}/{boxPokemon.length} Shiny
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono-tabular">
          Level, origin game, trade history & storage location shown per pokepet. Register pet Pokémon on the <strong className="text-amber-300">Register Pokémon</strong> page.
        </div>
      </div>

      {/* 6x5 Authentic PC Box Grid */}
      <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {boxPokemon.map((p) => {
            // Strictly check if the user has registered PokePets of this species:
            // "pokemon should not be allowed to classed as caught on any box view if the user has no PokePets registered with that species."
            const specimensForMon = inventory.filter((inv) => inv.pokemonId === p.id);
            const hasRegisteredSpecies = specimensForMon.length > 0;

            const isBoxed = hasRegisteredSpecies && livingSet.has(p.id);
            const isCaught = hasRegisteredSpecies && caughtSet.has(p.id);
            const isShiny = hasRegisteredSpecies && shinySet.has(p.id);

            const matchingSpecimen =
              specimensForMon.find((inv) => inv.isInLivingBox && inv.storedInHome) ||
              specimensForMon[0];

            const selectedBoxGameId = matchingSpecimen?.isHomeGift
              ? undefined
              : matchingSpecimen?.gameId || (hasRegisteredSpecies ? boxSelectedGamesMap.get(p.id) : undefined);

            const variations = getVariationsForPokemon(p);
            const caughtVariationsForMon = hasRegisteredSpecies
              ? variations.filter(
                  (v) =>
                    caughtVariantsSet.has(v.variantId) ||
                    (v.regionTag === 'Original' && (isCaught || isBoxed)) ||
                    specimensForMon.some((s) => s.variantId === v.variantId)
                )
              : [];
            const uncaughtVariationsForMon = variations.filter(
              (v) => !caughtVariationsForMon.some((cv) => cv.variantId === v.variantId)
            );

            // Determine active selected variant for this Living Box slot
            const savedVariantId = hasRegisteredSpecies
              ? matchingSpecimen?.variantId || boxSelectedVariantsMap.get(p.id)
              : undefined;
            const activeVariant =
              (savedVariantId && variations.find((v) => v.variantId === savedVariantId)) ||
              caughtVariationsForMon[0] ||
              variations[0];

            // Origin Label according to strict rules:
            // - Traded from [game]
            // - Gifted from Home
            // - Regifted from HOME
            const originText = matchingSpecimen
              ? formatOriginSourceLabel(
                  matchingSpecimen,
                  matchingSpecimen.gameId ? GAMES.find((g) => g.id === matchingSpecimen.gameId)?.shortTitle : undefined
                )
              : selectedBoxGameId && hasRegisteredSpecies
              ? GAMES.find((g) => g.id === selectedBoxGameId)?.shortTitle || selectedBoxGameId.toUpperCase()
              : 'Unregistered';

            // Storage Location text:
            // - Stored in Pokémon HOME
            // - (stored in [console])
            const storageText = matchingSpecimen
              ? formatStorageLocationLabel(matchingSpecimen)
              : isBoxed
              ? 'Stored in Pokémon HOME'
              : hasRegisteredSpecies
              ? '(stored in console)'
              : 'Not caught';

            return (
              <div
                key={p.id}
                onClick={() => onSelectPokemon(p)}
                className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  isBoxed
                    ? 'bg-sky-950/20 border-sky-500/40 hover:border-sky-400'
                    : isCaught
                    ? 'bg-emerald-950/15 border-emerald-500/35 hover:border-emerald-400'
                    : 'bg-[#0B0F17] border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Top Slot Coordinate, Level Badge & Status Indicators */}
                <div className="flex items-center justify-between gap-1 text-[11px] font-mono-tabular">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">
                      #{String(p.id).padStart(4, '0')} • S{p.boxSlot}
                    </span>
                    {matchingSpecimen && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold font-mono text-[9px] border border-amber-400/40">
                        Lv.{matchingSpecimen.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {matchingSpecimen?.isHomeGift ? (
                      <span
                        className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold"
                        title={matchingSpecimen.isTraded ? 'Regifted from HOME' : 'Gifted from Home'}
                      >
                        HOME
                      </span>
                    ) : selectedBoxGameId ? (
                      <GameLogoBadge gameId={selectedBoxGameId} size="xs" />
                    ) : null}
                    {matchingSpecimen?.hasPokerus && <PokerusBadge />}
                    {isShiny && (
                      <span title="Shiny Registered">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      </span>
                    )}
                    {isCaught && (
                      <span title="Caught">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                    )}
                    {isBoxed && (
                      <span title="Boxed in Living Dex">
                        <Box className="w-3.5 h-3.5 text-sky-400" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Center Sprite Illustration */}
                <div
                  className={`my-2 flex flex-col items-center transition-opacity ${
                    isBoxed || isCaught ? 'opacity-100' : 'opacity-40 group-hover:opacity-85'
                  }`}
                >
                  <PokemonSprite
                    id={activeVariant.spriteId}
                    name={activeVariant.formName}
                    shiny={matchingSpecimen?.isShiny || isShiny}
                    size="md"
                    imageUrl={activeVariant.imageUrl}
                  />
                </div>

                {/* Bottom Pokepet Information */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-center">
                    {matchingSpecimen?.pokeId && (
                      <div className="text-[9px] font-mono font-bold text-amber-300/90 bg-slate-900/90 px-1 py-0.5 rounded border border-slate-800 mb-1 truncate">
                        {matchingSpecimen.pokeId}
                      </div>
                    )}
                    {matchingSpecimen?.nickname && (
                      <div className="text-[10px] text-amber-300 font-bold truncate">
                        "{matchingSpecimen.nickname}"
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-100 truncate">
                      {matchingSpecimen?.ballType && (
                        <PokeballIcon ballType={matchingSpecimen.ballType} />
                      )}
                      <span className="truncate">{p.name}</span>
                    </div>

                    {/* Origin & Storage information line */}
                    <div className="text-[10px] font-mono-tabular truncate mt-0.5 flex flex-col items-center justify-center gap-0.5">
                      {matchingSpecimen ? (
                        <>
                          <span
                            className={`font-semibold truncate max-w-full ${
                              matchingSpecimen.isHomeGift
                                ? 'text-purple-300'
                                : matchingSpecimen.isTraded
                                ? 'text-sky-300'
                                : 'text-emerald-300'
                            }`}
                          >
                            {originText}
                          </span>
                          <span
                            className={`text-[9px] truncate max-w-full ${
                              matchingSpecimen.storedInHome ? 'text-slate-400' : 'text-amber-400'
                            }`}
                          >
                            {storageText}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500 font-medium">Unregistered (Not Caught)</span>
                      )}
                    </div>
                  </div>

                  {/* Dropdown menu to pick variant */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pt-1 border-t border-slate-800/70"
                  >
                    <select
                      aria-label={`Select caught variant for ${p.name}`}
                      value={activeVariant.variantId}
                      disabled={!hasRegisteredSpecies}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (hasRegisteredSpecies) {
                          onSelectBoxVariant(p.id, e.target.value);
                        }
                      }}
                      className="w-full px-1.5 py-1 rounded bg-slate-900/95 border border-slate-700/80 text-[10px] font-medium text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed truncate"
                    >
                      {caughtVariationsForMon.length > 0 ? (
                        <optgroup label="Caught Variants (Selectable)">
                          {caughtVariationsForMon.map((v) => (
                            <option key={v.variantId} value={v.variantId}>
                              {v.regionTag === 'Original' ? `${p.name} (${p.region})` : v.formName}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        <option value={activeVariant.variantId} disabled>
                          {hasRegisteredSpecies ? 'No Caught Variants Yet' : 'Register PokePet to Select'}
                        </option>
                      )}
                      {uncaughtVariationsForMon.length > 0 && (
                        <optgroup label="Uncaught Variants (Catch First to Select)">
                          {uncaughtVariationsForMon.map((v) => (
                            <option key={v.variantId} value={v.variantId} disabled className="text-slate-500 opacity-60">
                              {v.regionTag === 'Original' ? `${p.name} (${p.region})` : v.formName} (Uncaught)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                {/* Inspect button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPokemon(p);
                  }}
                  title={`Open ${p.name} Pokémon Page`}
                  className="absolute top-8 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white transition-opacity cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
