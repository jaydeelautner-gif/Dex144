import { PokerusBadge } from './PokerusBadge';
import React, { useState, useMemo } from 'react';
import {
  Globe,
  ArrowLeft,
  Check,
  Sparkles,
  Box,
  ChevronLeft,
  ChevronRight,
  Search,
  Share2,
} from 'lucide-react';
import type {
  PokemonEntry,
  GameId,
  DlcId,
  GameCatchesMap,
} from '../data/pokemonData';
import {
  GAMES,
  getGameRunningTotalStats,
} from '../data/pokemonData';
import { getVariationsForPokemon } from '../data/regionalVariantsData';
import { PokemonSprite } from './PokemonSprite';
import { GameLogoBadge, PokemonHomeLogoBadge } from './GameLogoBadge';
import { GymBadgeStrip } from './GymBadgeStrip';
import { TrainerAvatar } from './TrainerAvatar';
import { gameBadgeSprites } from './GymBadgeStrip';
import {
  formatOriginSourceLabel,
  formatStorageLocationLabel,
  type PokemonInstance,
} from '../data/pokemonInventoryData';

interface PublicStatsPageViewProps {
  dex: PokemonEntry[];
  trainerName: string;
  caughtSet: Set<number>;
  shinySet: Set<number>;
  livingSet: Set<number>;
  caughtVariantsSet: Set<string>;
  boxSelectedVariantsMap: Map<number, string>;
  boxSelectedGamesMap: Map<number, GameId>;
  ownedGames: GameId[];
  ownedDlcs: DlcId[];
  gameCatches: GameCatchesMap;
  /** Completed game-progress milestone ids per group, for gym badge display. */
  gameProgress?: Record<string, string[]>;
  /** Trainer avatar config for the header. */
  avatar?: unknown;
  shareUrl?: string;
  isOwnPreview?: boolean;
  onExitPublicView?: () => void;
  inventory?: PokemonInstance[];
}

export const PublicStatsPageView: React.FC<PublicStatsPageViewProps> = ({
  dex,
  trainerName,
  caughtSet,
  shinySet,
  livingSet,
  caughtVariantsSet,
  boxSelectedVariantsMap,
  boxSelectedGamesMap,
  ownedGames,
  ownedDlcs,
  gameCatches,
  gameProgress,
  avatar,
  shareUrl,
  isOwnPreview = false,
  onExitPublicView,
  inventory = [],
}) => {
  const [activeBox, setActiveBox] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'boxes' | 'all_caught'>('boxes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Set of species IDs that have at least one registered PokePet in inventory:
  // "pokemon should not be allowed to classed as caught on any box view if the user has no PokePets registered with that species."
  const registeredSpeciesSet = useMemo(
    () => new Set(inventory.map((inv) => inv.pokemonId)),
    [inventory]
  );
  const hasRegisteredSpecies = (id: number) => registeredSpeciesSet.has(id);

  const totalCount = dex.length;
  const caughtCount = dex.filter((p) => hasRegisteredSpecies(p.id) && caughtSet.has(p.id)).length;
  const shinyCount = dex.filter((p) => hasRegisteredSpecies(p.id) && shinySet.has(p.id)).length;
  const storedInHomeCount = dex.filter((p) => hasRegisteredSpecies(p.id) && livingSet.has(p.id)).length;
  const totalBoxes = Math.ceil(dex.length / 30);

  const displayTrainerName =
    trainerName && trainerName.trim() ? trainerName.trim() : 'Guest';

  const ownedGameList = useMemo(
    () => GAMES.filter((g) => ownedGames.includes(g.id)),
    [ownedGames]
  );

  const boxPokemon = useMemo(
    () => dex.filter((p) => p.boxNumber === activeBox),
    [dex, activeBox]
  );

  const filteredDex = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dex.filter((p) => {
      const hasPet = hasRegisteredSpecies(p.id);
      if (viewMode === 'all_caught' && (!hasPet || (!livingSet.has(p.id) && !caughtSet.has(p.id)))) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        p.region.toLowerCase().includes(q)
      );
    });
  }, [dex, viewMode, searchQuery, livingSet, caughtSet, registeredSpeciesSet]);

  const handleCopyShareLink = async () => {
    const targetUrl = shareUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const renderLivingSlotCard = (p: PokemonEntry) => {
    // Strictly verify if there are registered PokePets of this species:
    // "pokemon should not be allowed to classed as caught on any box view if the user has no PokePets registered with that species."
    const specimens = inventory.filter((inv) => inv.pokemonId === p.id);
    const hasRegisteredPet = specimens.length > 0;

    const isBoxed = hasRegisteredPet && livingSet.has(p.id);
    const isCaught = hasRegisteredPet && caughtSet.has(p.id);
    const isShiny = hasRegisteredPet && shinySet.has(p.id);

    const matchingSpecimen =
      specimens.find((inv) => inv.isInLivingBox && inv.storedInHome) ||
      specimens[0];

    const gameCaughtId = matchingSpecimen?.isHomeGift
      ? undefined
      : matchingSpecimen?.gameId || (hasRegisteredPet ? boxSelectedGamesMap.get(p.id) : undefined);

    const variations = getVariationsForPokemon(p);
    const caughtVariationsForMon = hasRegisteredPet
      ? variations.filter(
          (v) =>
            caughtVariantsSet.has(v.variantId) ||
            (v.regionTag === 'Original' && (isCaught || isBoxed)) ||
            specimens.some((s) => s.variantId === v.variantId)
        )
      : [];

    const savedVariantId = hasRegisteredPet
      ? matchingSpecimen?.variantId || boxSelectedVariantsMap.get(p.id)
      : undefined;
    const activeVariant =
      (savedVariantId && variations.find((v) => v.variantId === savedVariantId)) ||
      caughtVariationsForMon[0] ||
      variations[0];

    // Origin label:
    // - "Traded from [game]"
    // - "Gifted from Home"
    // - "Regifted from HOME"
    const originLabel = matchingSpecimen
      ? formatOriginSourceLabel(
          matchingSpecimen,
          matchingSpecimen.gameId ? GAMES.find((g) => g.id === matchingSpecimen.gameId)?.shortTitle : undefined
        )
      : gameCaughtId && hasRegisteredPet
      ? GAMES.find((g) => g.id === gameCaughtId)?.shortTitle || gameCaughtId.toUpperCase()
      : 'Unregistered';

    // Storage label:
    // - "Stored in Pokémon HOME"
    // - "(stored in [console])"
    const storageLabel = matchingSpecimen
      ? formatStorageLocationLabel(matchingSpecimen)
      : isBoxed
      ? 'Stored in Pokémon HOME'
      : hasRegisteredPet
      ? '(stored in console)'
      : 'Not caught';

    return (
      <div
        key={p.id}
        className={`rounded-2xl border p-3 flex flex-col justify-between gap-2 transition-all ${
          isBoxed
            ? 'bg-sky-950/20 border-sky-500/45'
            : isCaught
            ? 'bg-emerald-950/15 border-emerald-500/35'
            : 'bg-[#0B0F17]/80 border-slate-800/60 opacity-40 grayscale select-none'
        }`}
      >
        {/* Top Row: ID, Level Badge + Game Origin Logo + Status */}
        <div className="flex items-center justify-between gap-1 text-[11px] font-mono-tabular">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">
              #{String(p.id).padStart(4, '0')}
            </span>
            {matchingSpecimen && (
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold font-mono text-[9px] border border-amber-400/40">
                Lv.{matchingSpecimen.level}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isCaught && !isBoxed ? (
              <span className="px-1.5 py-0.2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[9px] font-bold">
                Not caught yet
              </span>
            ) : null}
            {matchingSpecimen?.isHomeGift ? (
              <span
                className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold"
                title={matchingSpecimen.isTraded ? 'Regifted from HOME' : 'Gifted from Home'}
              >
                HOME
              </span>
            ) : gameCaughtId ? (
              <GameLogoBadge gameId={gameCaughtId} size="xs" />
            ) : null}
            {matchingSpecimen?.hasPokerus && <PokerusBadge />}
                    {isShiny && (
              <span title="Shiny">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </span>
            )}
            {isBoxed && (
              <span title="Stored in Pokémon HOME Living Dex">
                <Box className="w-3.5 h-3.5 text-sky-400" />
              </span>
            )}
            {!isBoxed && isCaught && (
              <span title="Caught">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </span>
            )}
          </div>
        </div>

        {/* Center Variant Illustration */}
        <div className={`my-1.5 flex flex-col items-center ${!isCaught && !isBoxed ? 'grayscale opacity-50' : ''}`}>
          <PokemonSprite
            id={activeVariant.spriteId}
            name={activeVariant.formName}
            shiny={matchingSpecimen?.isShiny || isShiny}
            size="md"
            imageUrl={activeVariant.imageUrl}
          />
        </div>

        {/* Bottom Variant, Nickname & Game Caught Details */}
        <div className="flex flex-col gap-1 text-center border-t border-slate-800/80 pt-2">
          {hasRegisteredPet && (isBoxed || isCaught) && matchingSpecimen?.pokeId && (
            <div className="text-[9px] font-mono font-bold text-amber-300/90 bg-slate-900/90 px-1 py-0.5 rounded border border-slate-800 mb-0.5 truncate">
              {matchingSpecimen.pokeId}
            </div>
          )}
          {matchingSpecimen?.nickname && (
            <div className="text-[10px] text-amber-300 font-bold truncate">
              "{matchingSpecimen.nickname}"
            </div>
          )}
          <div className="text-xs font-bold text-slate-100 truncate">
            {p.name}
          </div>
          <div className="text-[10px] font-mono-tabular truncate">
            {activeVariant.regionTag !== 'Original' ? (
              <span className="text-amber-300 font-semibold">
                {activeVariant.formName}
              </span>
            ) : (
              <span className="text-slate-400">
                {p.region} Form
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono-tabular truncate flex flex-col items-center justify-center gap-0.5">
            {hasRegisteredPet && (isCaught || isBoxed) ? (
              <>
                <span
                  className={`font-semibold truncate max-w-full ${
                    matchingSpecimen?.isHomeGift
                      ? 'text-purple-300'
                      : matchingSpecimen?.isTraded
                      ? 'text-sky-300'
                      : 'text-emerald-300'
                  }`}
                >
                  {originLabel}
                </span>
                <span className="text-[9px] text-slate-400 truncate max-w-full">
                  {storageLabel}
                </span>
              </>
            ) : (
              <span className="text-rose-400 font-bold text-[10px]">
                Not Caught Yet
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <TrainerAvatar config={avatar as never} size={64} className="shrink-0" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono-tabular font-semibold text-emerald-300">
              <Globe className="w-3.5 h-3.5" />
              PUBLIC LIVING DEX SHOWCASE
            </span>
            <PokemonHomeLogoBadge size="sm" label={`${storedInHomeCount} / ${totalCount} Stored in HOME`} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-1">
            {displayTrainerName}’s Living Pokédex & Game Origin Showcase
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Browse every Living Dex specimen with its level, selected regional variant, origin game, and console storage location.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {shareUrl && (
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-lg"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Shareable Link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Copy Public Stats Link</span>
                </>
              )}
            </button>
          )}
          {onExitPublicView && (
            <button
              type="button"
              onClick={onExitPublicView}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isOwnPreview ? 'Back to Tracker' : 'Open Your Own Tracker'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono-tabular text-slate-400">
              STORED IN POKÉMON HOME
            </div>
            <div className="text-2xl font-bold font-mono-tabular text-emerald-400 mt-1">
              {storedInHomeCount} / {totalCount}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {((storedInHomeCount / Math.max(1, totalCount)) * 100).toFixed(1)}% Living Dex Boxed
            </div>
          </div>
          <PokemonHomeLogoBadge size="md" label="HOME" />
        </div>

        <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono-tabular text-slate-400">
              NATIONAL DEX CAUGHT
            </div>
            <div className="text-2xl font-bold font-mono-tabular text-sky-400 mt-1">
              {caughtCount} / {totalCount}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {((caughtCount / Math.max(1, totalCount)) * 100).toFixed(1)}% Registered
            </div>
          </div>
          <Check className="w-8 h-8 text-sky-400/60" />
        </div>

        <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono-tabular text-slate-400">
              SHINY LIVING DEX
            </div>
            <div className="text-2xl font-bold font-mono-tabular text-amber-400 mt-1">
              {shinyCount} / {totalCount}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {((shinyCount / Math.max(1, totalCount)) * 100).toFixed(1)}% Shiny Caught
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-amber-400/60" />
        </div>
      </div>

      {/* Owned Games Catch Progress with Game Logos */}
      <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">
            Owned Games Catch Progress ({ownedGameList.length} Games Owned)
          </h2>
          <p className="text-xs text-slate-400">
            Base game Pokédex progress across {displayTrainerName}’s owned games.
          </p>
        </div>

        {ownedGameList.length === 0 ? (
          <div className="text-xs text-slate-400 py-4">
            No games marked as owned yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ownedGameList.map((game) => {
              const baseStats = getGameRunningTotalStats(
                dex,
                game.id,
                [],
                gameCatches[game.id] || []
              );
              return (
                <div
                  key={game.id}
                  className="bg-[#0B0F17] border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <GameLogoBadge gameId={game.id} size="xs" />
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {game.shortTitle}
                      </span>
                    </div>
                    <span className="text-xs font-mono-tabular text-emerald-400 font-semibold shrink-0">
                      {baseStats.caughtCount}/{baseStats.baseTotal}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (baseStats.caughtCount / Math.max(1, baseStats.baseTotal)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <GymBadgeStrip
                    gameId={game.id}
                    completedIds={gameProgress?.[gameBadgeSprites(game.id)?.prefix ?? ''] || []}
                    size={26}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Living Dex Showcase Controls */}
      <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('boxes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'boxes'
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Browse by PC Box (1–{totalBoxes})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all_caught')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'all_caught'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Caught & Boxed ({Math.max(caughtCount, storedInHomeCount)})
              </button>
            </div>

            {viewMode === 'boxes' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveBox(activeBox > 1 ? activeBox - 1 : totalBoxes)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={activeBox}
                  onChange={(e) => setActiveBox(Number(e.target.value))}
                  aria-label="Select PC Box"
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono-tabular font-semibold text-slate-100"
                >
                  {Array.from({ length: totalBoxes }).map((_, idx) => {
                    const bNum = idx + 1;
                    const sId = (bNum - 1) * 30 + 1;
                    const eId = Math.min(bNum * 30, dex.length);
                    return (
                      <option key={bNum} value={bNum}>
                        PC Box {String(bNum).padStart(2, '0')} (#{String(sId).padStart(4, '0')}–#{String(eId).padStart(4, '0')})
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={() => setActiveBox(activeBox < totalBoxes ? activeBox + 1 : 1)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {viewMode === 'all_caught' && (
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search caught Pokémon..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {(viewMode === 'boxes' ? boxPokemon : filteredDex.slice(0, 180)).map((p) =>
            renderLivingSlotCard(p)
          )}
        </div>
      </div>
    </div>
  );
};
