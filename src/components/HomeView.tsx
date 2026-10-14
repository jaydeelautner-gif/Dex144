import React, { useState } from 'react';
import {
  Compass,
  Box,
  Layers,
  ChevronRight,
  Plus,
  CreditCard,
  Search,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { PokemonEntry, GameCatchesMap, GameId, DlcId } from '../data/pokemonData';
import { GAMES, ALL_GAME_IDS } from '../data/pokemonData';
import { PokeBankClosureAlertSection } from './PokeBankClosureAlertSection';
import { GameLogoBadge } from './GameLogoBadge';
import { type PokemonInstance } from '../data/pokemonInventoryData';
import { DexSuggestionsSection } from './DexSuggestionsSection';

interface HomeViewProps {
  dex: PokemonEntry[];
  caughtSet: Set<number>;
  shinySet: Set<number>;
  livingSet: Set<number>;
  ownedGames: GameId[];
  ownedDlcs: DlcId[];
  gameCatches: GameCatchesMap;
  inventory?: PokemonInstance[];
  boxSelectedGames: Map<number, GameId>;
  includePokemonGoInSuggestions: boolean;
  isGuest: boolean;
  onRequestAuth: (prompt: string) => void;
  onSelectPokemon: (pokemon: PokemonEntry) => void;
  onOpenFullPage: (pokemon: PokemonEntry) => void;
  onNavigateToRegister: (pokemonId?: number) => void;
  onNavigateToTracker: () => void;
  onNavigateToLivingDex: () => void;
  onNavigateToInventory: () => void;
  onNavigateToSettings: () => void;
  onLookupPokeId?: (pokeId: string) => Promise<string | null> | void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  dex,
  caughtSet,
  shinySet,
  livingSet,
  ownedGames,
  ownedDlcs,
  gameCatches,
  inventory = [],
  boxSelectedGames,
  includePokemonGoInSuggestions,
  isGuest,
  onRequestAuth,
  onSelectPokemon,
  onOpenFullPage,
  onNavigateToRegister,
  onNavigateToTracker,
  onNavigateToLivingDex,
  onNavigateToInventory,
  onNavigateToSettings,
  onLookupPokeId,
}) => {
  const [pokeIdInput, setPokeIdInput] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  const totalSpecies = dex.length;
  const caughtCount = caughtSet.size;
  const caughtPercent = Math.round((caughtCount / totalSpecies) * 100);

  const totalOwnedGamesCatches = ownedGames.reduce(
    (acc, gId) => acc + (gameCatches[gId]?.length || 0),
    0
  );

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pokeIdInput.trim().toUpperCase();
    if (!clean.startsWith('ID') || clean.length !== 12) {
      setLookupError('POKEID must be exactly 12 characters and start with "ID" (e.g. ID8F3K9L2M4P).');
      return;
    }
    setLookupError(null);
    if (onLookupPokeId) {
      const errorMsg = await onLookupPokeId(clean);
      if (errorMsg) {
        setLookupError(errorMsg);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F1522] via-[#131B2E] to-[#0A0E18] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono-tabular font-semibold">
                NATIONAL LIVING DEX & INVENTORY HUB
              </span>
              <span className="text-xs text-slate-400">Game Boy to Switch + Pokémon HOME</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Welcome to HomeDex
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Register pet Pokémon with unique 12-digit POKEIDs, track HOME storage eligibility, and monitor 3DS Poké Bank closure risks. The only way to mark Pokémon as caught is by registering a pet Pokémon through the <strong className="text-amber-300 font-semibold">Register Pokémon</strong> page.
            </p>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToRegister()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Register Pet Pokémon</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToInventory}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-sky-400" />
              <span>Pokepets ({inventory.length})</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToLivingDex}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Box className="w-4 h-4 text-sky-400" />
              <span>Living Boxes</span>
            </button>
          </div>
        </div>
      </div>

      {/* POKEID UNIVERSAL LOOKUP CARD */}
      <section className="bg-[#0F1522] border border-amber-500/40 rounded-2xl p-6 shadow-xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
              UNIVERSAL POKEPET FINDER
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-0.5">
              Find Any Pet Pokémon by POKEID
            </h2>
            <p className="text-xs text-slate-400">
              Enter any trainer's 12-digit POKEID to look up its trainer card, level, origin game, and storage status from the database.
            </p>
          </div>
        </div>

        <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row items-stretch gap-3 mt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={pokeIdInput}
              onChange={(e) => {
                setPokeIdInput(e.target.value.toUpperCase());
                setLookupError(null);
              }}
              placeholder="Enter 12-digit POKEID (e.g. ID8F3K9L2M4P)..."
              maxLength={12}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm font-bold text-amber-300 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shrink-0 shadow-md shadow-amber-500/20"
          >
            Lookup POKEID →
          </button>
        </form>

        {lookupError && (
          <div className="flex items-center gap-2 text-rose-400 text-xs mt-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}

        {/* Quick Click Registered POKEIDs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Your Registered POKEIDs:</span>
          {inventory.length > 0 ? (
            inventory.slice(0, 4).map((item) => (
              <button
                key={item.pokeId}
                type="button"
                onClick={() => {
                  setPokeIdInput(item.pokeId);
                  if (onLookupPokeId) onLookupPokeId(item.pokeId);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold text-amber-300 hover:border-amber-400 cursor-pointer transition-all"
                title={`Inspect ${item.nickname || 'pokepet'}`}
              >
                {item.pokeId} ({dex.find((p) => p.id === item.pokemonId)?.name || 'Pokepet'})
              </button>
            ))
          ) : (
            <span className="text-slate-500 font-mono text-[11px]">
              No pet Pokémon registered yet. Register a Pokémon on the registration page to receive a unique site-wide POKEID.
            </span>
          )}
        </div>
      </section>

      {/* DEX SUGGESTIONS SECTION */}
      <DexSuggestionsSection
        dex={dex}
        caughtSet={caughtSet}
        livingSet={livingSet}
        ownedGames={ownedGames}
        ownedDlcs={ownedDlcs}
        inventory={inventory}
        boxSelectedGames={boxSelectedGames}
        includePokemonGoInSuggestions={includePokemonGoInSuggestions}
        onSelectPokemon={onSelectPokemon}
        onOpenFullPage={onOpenFullPage}
        onNavigateToRegister={onNavigateToRegister}
        onNavigateToSettings={onNavigateToSettings}
        isGuest={isGuest}
        onRequestAuth={onRequestAuth}
      />

      {/* QUICK HUB NAVIGATION CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Register Pokémon */}
        <div
          onClick={() => onNavigateToRegister()}
          className="group rounded-2xl bg-[#0F1522] border border-amber-500/40 hover:border-amber-400 p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all hover:bg-slate-900/80 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
              Register Pokémon
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Gateway to register pet Pokémon. Generates unique 12-digit POKEIDs, validates origin game or HOME gift, level, and variants.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-slate-400">Entry Mode</span>
            <span className="text-amber-300 font-bold">Strict Validation</span>
          </div>
        </div>

        {/* Card 2: Pokepet Inventory */}
        <div
          onClick={onNavigateToInventory}
          className="group rounded-2xl bg-[#0F1522] border border-slate-800/80 hover:border-sky-500/60 p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all hover:bg-slate-900/80 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
              Pokepet Inventory
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              View all registered pokepets with hidden POKEIDs, custom nicknames, level, origin game, and Trainer Cards.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-slate-400">Registered Pokepets</span>
            <span className="text-sky-300 font-bold">{inventory.length} Pokepets</span>
          </div>
        </div>

        {/* Card 3: Living Dex Boxes */}
        <div
          onClick={onNavigateToLivingDex}
          className="group rounded-2xl bg-[#0F1522] border border-slate-800/80 hover:border-emerald-500/60 p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all hover:bg-slate-900/80 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Box className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
              Living Dex Boxes
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Explore 35 PC Boxes showing pokepet levels, POKEIDs, origin labels ("Traded from...", "Gifted from Home", etc.) and slot diagrams.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-slate-400">Boxed Pokémon</span>
            <span className="text-emerald-300 font-bold">{livingSet.size} / 1025</span>
          </div>
        </div>

        {/* Card 4: Pokédex Tracker */}
        <div
          onClick={onNavigateToTracker}
          className="group rounded-2xl bg-[#0F1522] border border-slate-800/80 hover:border-purple-500/60 p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all hover:bg-slate-900/80 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
              Pokédex Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Explore all 1,025 Pokémon across 9 generations with owned game availability breakdowns, evolutions, and items.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-slate-400">National Progress</span>
            <span className="text-purple-300 font-bold">{caughtPercent}% ({caughtCount}/1025)</span>
          </div>
        </div>
      </section>

      {/* WATCHLIST SECTION: Poké Bank Closure Risks */}
      <section className="flex flex-col gap-4">
        <PokeBankClosureAlertSection
          dex={dex}
          caughtSet={caughtSet}
          shinySet={shinySet}
          gameCatches={gameCatches}
          onSelectPokemon={onSelectPokemon}
          onOpenFullPage={onOpenFullPage}
        />
      </section>

      {/* OWNED GAMES SNAPSHOT */}
      <section className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Your Owned Pokémon Library ({ownedGames.length} Games Active)
            </h3>
          </div>
          <button
            type="button"
            onClick={onNavigateToSettings}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            Manage in Settings →
          </button>
        </div>

        {ownedGames.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center flex flex-col items-center gap-2">
            <p className="text-xs text-slate-400">
              No games marked as owned yet. Select your owned games in Settings to track your catches!
            </p>
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs cursor-pointer"
            >
              Configure Owned Games
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            {ownedGames.map((gId) => (
              <div
                key={gId}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200"
              >
                <GameLogoBadge gameId={gId} size="xs" />
                <span>{GAMES.find((g) => g.id === gId)?.shortTitle || gId.toUpperCase()}</span>
                <span className="text-[11px] font-mono-tabular text-emerald-400 font-semibold">
                  ({gameCatches[gId]?.length || 0})
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
