import React, { useRef } from 'react';
import {
  X,
  Sparkles,
  Box,
  CreditCard,
} from 'lucide-react';
import type { PokemonEntry } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import {
  formatOriginSourceLabel,
  formatStorageLocationLabel,
  type PokemonInstance,
} from '../data/pokemonInventoryData';
import { getVariationsForPokemon } from '../data/regionalVariantsData';
import { PokemonSprite } from './PokemonSprite';
import { BoxSlotMiniMap } from './BoxSlotMiniMap';

interface PokepetTrainerCardModalProps {
  instance: PokemonInstance | null;
  pokemon: PokemonEntry | null;
  trainerName: string;
  onClose: () => void;
}

export const PokepetTrainerCardModal: React.FC<PokepetTrainerCardModalProps> = ({
  instance,
  pokemon,
  trainerName,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!instance || !pokemon) return null;

  const variations = getVariationsForPokemon(pokemon);
  const activeVariant =
    variations.find((v) => v.variantId === instance.variantId) ||
    variations[0];
  const gameInfo = instance.gameId ? GAMES.find((g) => g.id === instance.gameId) : undefined;
  const originLabel = formatOriginSourceLabel(instance, gameInfo?.shortTitle);
  const storageLabel = formatStorageLocationLabel(instance, gameInfo?.platform);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0F1522] border border-amber-500/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Top Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-slate-100">Pokepet Trainer Card</h2>
        </div>

        {/* Collectible Pokepet Passport / Trainer Card */}
        <div
          ref={cardRef}
          className="rounded-2xl border border-amber-400/40 p-5 bg-gradient-to-br from-[#121A2D] via-[#0E1524] to-[#0A0D15] shadow-2xl flex flex-col gap-4 relative overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/50">
                PASSPORT CERTIFICATE
              </span>
              <span className="text-xs font-mono font-semibold text-slate-300">
                Trainer: <strong className="text-white">{trainerName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs font-black text-amber-300">
              <span>{instance.pokeId}</span>
            </div>
          </div>

          {/* Card Body */}
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Artwork Frame */}
            <div className="col-span-5 bg-slate-900/90 rounded-xl border border-slate-700/80 p-3 flex flex-col items-center justify-center relative shadow-inner">
              <PokemonSprite
                id={activeVariant?.spriteId || pokemon.id}
                name={instance.variantName}
                shiny={instance.isShiny}
                size="lg"
                imageUrl={activeVariant?.imageUrl}
              />
              {instance.isShiny && (
                <div className="absolute top-2 right-2 p-1 rounded bg-amber-500/20 border border-amber-500/50">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
              )}
              <span className="mt-1 text-[10px] font-mono text-amber-400">
                #{String(pokemon.id).padStart(4, '0')}
              </span>
            </div>

            {/* Pokepet Info */}
            <div className="col-span-7 flex flex-col gap-2">
              <div>
                <div className="text-xs font-mono text-slate-400">
                  {activeVariant.formName}
                </div>
                <h3 className="text-xl font-black text-slate-100 truncate">
                  {instance.nickname || pokemon.name}
                </h3>
                {instance.nickname && (
                  <div className="text-xs text-slate-400">
                    Species: {pokemon.name}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono-tabular bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">LEVEL</span>
                  <span className="text-sm font-bold text-amber-300">{instance.level}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">GENDER</span>
                  <span className="text-sm font-bold text-slate-200">
                    {instance.gender === 'female' ? '♀ Female' : instance.gender === 'male' ? '♂ Male' : '⚲ Genderless'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-mono-tabular flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-slate-500">ORIGIN:</span>
                  <strong className={instance.isHomeGift ? 'text-purple-300' : 'text-sky-300'}>
                    {originLabel}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-slate-500">STORAGE:</span>
                  <strong className={instance.storedInHome ? 'text-emerald-400' : 'text-slate-300'}>
                    {storageLabel}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Living Dex Mini-Map Slot (if in living dex) */}
          {instance.isInLivingBox && instance.storedInHome && (
            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1">
                  <Box className="w-3.5 h-3.5" />
                  <span>Living Dex Coordinates</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  PC Box {instance.livingBoxNumber || pokemon.boxNumber} — Slot {instance.livingBoxSlot || pokemon.boxSlot}
                </span>
              </div>
              <BoxSlotMiniMap
                boxNumber={instance.livingBoxNumber || pokemon.boxNumber}
                boxSlot={instance.livingBoxSlot || pokemon.boxSlot}
                size="sm"
              />
            </div>
          )}

          {/* Watermark Footer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>HomeDex Living Dex Passport</span>
            <span>Recorded {new Date(instance.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
