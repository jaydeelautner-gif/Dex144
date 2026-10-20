import { POKEMON_LANGUAGES, normalizePokemonLanguage, type PokemonLanguage } from '../data/pokemonLanguages';
import { PokerusBadge } from './PokerusBadge';
import React, { useState, useMemo } from 'react';
import {
  Search,
  Box,
  Gift,
  ArrowLeftRight,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  X,
  CreditCard,
  Eye,
  EyeOff,
  RotateCcw,
  Gamepad2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Heart,
  ShieldAlert,
} from 'lucide-react';
import type { PokemonEntry, GameId } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import {
  formatOriginSourceLabel,
  formatStorageLocationLabel,
  POKEBALLS,
  type PokemonInstance,
  type PokemonGender,
  type PokeballId,
} from '../data/pokemonInventoryData';
import { getVariationsForPokemon } from '../data/regionalVariantsData';
import { PokemonSprite } from './PokemonSprite';
import { GameLogoBadge } from './GameLogoBadge';

import { INVENTORY_SORT_OPTIONS, sortInventory, type InventorySort } from '../utils/inventorySort';

import { DisplayLimitSelect, PageControls, useDisplayLimit } from './DisplayControls';

interface InventoryViewProps {
  dex: PokemonEntry[];
  inventory: PokemonInstance[];
  rescueBinCount?: number;
  onUpdateInstance: (instance: PokemonInstance) => void;
  onRequestEvolve: (instance: PokemonInstance) => void;
  onDeleteInstance: (pokeId: string) => void;
  onOpenPokemonPage: (pokemon: PokemonEntry, variantId?: string) => void;
  onOpenTrainerCardForPokeId: (instance: PokemonInstance) => void;
  onNavigateToRegister: () => void;
  onNavigateToSettings?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  dex,
  inventory,
  rescueBinCount = 0,
  onUpdateInstance,
  onRequestEvolve,
  onDeleteInstance,
  onOpenPokemonPage,
  onOpenTrainerCardForPokeId,
  onNavigateToRegister,
  onNavigateToSettings,
}) => {
  const [displayLimit, setDisplayLimit] = useDisplayLimit('homedex_inventory_display_count', 'all');
  const [displayPage, setDisplayPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGame, setFilterGame] = useState<string>('all');
  const [filterHomeStatus, setFilterHomeStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<InventorySort>('registered-newest');

  // Editing state for a pokepet
  const [editingPokeId, setEditingPokeId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState<number>(50);
  const [editNickname, setEditNickname] = useState<string>('');
  const [editGender, setEditGender] = useState<PokemonGender>('male');
  const [editGameId, setEditGameId] = useState<GameId | undefined>(undefined);
  const [editVariantId, setEditVariantId] = useState<string>('');
  const [editIsShiny, setEditIsShiny] = useState<boolean>(false);
  const [editHasPokerus, setEditHasPokerus] = useState(false);
  const [editOriginLanguage,setEditOriginLanguage] = useState<PokemonLanguage>('en');
  const [editBallType, setEditBallType] = useState<PokeballId | ''>('');
  const [editIsTraded, setEditIsTraded] = useState<boolean>(false);
  const [editIsHomeGift, setEditIsHomeGift] = useState<boolean>(false);
  const [editStoredInHome, setEditStoredInHome] = useState<boolean>(true);
  const [editIsInLivingBox, setEditIsInLivingBox] = useState<boolean>(true);
  const [editNotes, setEditNotes] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Set of revealed POKEIDs (initially hidden by default as requested)
  const [revealedPokeIds, setRevealedPokeIds] = useState<Set<string>>(() => new Set());
  const [revealAllIds, setRevealAllIds] = useState<boolean>(false);

  const toggleRevealPokeId = (pokeId: string) => {
    setRevealedPokeIds((prev) => {
      const next = new Set(prev);
      if (next.has(pokeId)) {
        next.delete(pokeId);
      } else {
        next.add(pokeId);
      }
      return next;
    });
  };

  const filteredInstances = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = inventory.filter((item) => {
      const mon = dex.find((p) => p.id === item.pokemonId);
      const name = mon?.name || '';
      const nickname = item.nickname || '';
      const matchQuery =
        !q ||
        item.pokeId.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        nickname.toLowerCase().includes(q) ||
        String(item.pokemonId).includes(q);

      if (!matchQuery) return false;

      if (filterGame !== 'all') {
        if (filterGame === 'home_gift' && !item.isHomeGift) return false;
        if (filterGame !== 'home_gift' && item.gameId !== filterGame) return false;
      }

      if (filterHomeStatus === 'in_home' && !item.storedInHome) return false;
      if (filterHomeStatus === 'not_in_home' && item.storedInHome) return false;

      return true;
    });
    return sortInventory(filtered, sortOrder, new Map(dex.map(mon => [mon.id, mon.name])));
  }, [inventory, dex, searchQuery, filterGame, filterHomeStatus, sortOrder]);

  const pages = displayLimit === 'all' ? 1 : Math.max(1, Math.ceil(filteredInstances.length / displayLimit));
  const currentDisplayPage = Math.min(displayPage, pages);
  const visibleInstances = displayLimit === 'all' ? filteredInstances : filteredInstances.slice((currentDisplayPage - 1) * displayLimit, currentDisplayPage * displayLimit);

  const handleStartEdit = (item: PokemonInstance) => {
    setEditingPokeId(item.pokeId);
    setEditLevel(item.level);
    setEditNickname(item.nickname || '');
    setEditGender(item.gender || 'male');
    setEditGameId(item.gameId);
    setEditVariantId(item.variantId);
    setEditIsShiny(Boolean(item.isShiny));
    setEditHasPokerus(Boolean(item.hasPokerus));
    setEditOriginLanguage(normalizePokemonLanguage(item.originLanguage));
    setEditBallType(item.ballType || '');
    setEditIsTraded(Boolean(item.isTraded));
    setEditIsHomeGift(Boolean(item.isHomeGift));
    setEditStoredInHome(item.storedInHome);
    setEditIsInLivingBox(item.isInLivingBox);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = (original: PokemonInstance) => {
    const mon = dex.find((p) => p.id === original.pokemonId);
    const variations = mon ? getVariationsForPokemon(mon) : [];
    const chosenVariant = variations.find((v) => v.variantId === editVariantId);
    const variantName = chosenVariant ? chosenVariant.formName : original.variantName;

    // All attributes of a pokepet can be edited APART from its unique POKEID and Species!
    const updated: PokemonInstance = {
      ...original,
      // pokeId and pokemonId (Species) remain strictly preserved and unchangeable
      level: Math.max(1, Math.min(100, editLevel)),
      nickname: editNickname.trim().slice(0, 10),
      gender: editGender,
      isShiny: editIsShiny,
      hasPokerus: editHasPokerus,
      originLanguage: editOriginLanguage,
      ballType: editBallType || undefined,
      isTraded: editIsTraded,
      isHomeGift: editIsHomeGift,
      gameId: editIsHomeGift ? undefined : editGameId,
      variantId: editVariantId || original.variantId,
      variantName,
      storedInHome: editStoredInHome,
      isInLivingBox: editStoredInHome && editIsInLivingBox,
      notes: editNotes.trim().slice(0, 120),
      updatedAt: Date.now(),
    };
    onUpdateInstance(updated);
    setEditingPokeId(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[11px] font-mono-tabular font-bold">
              POKEPET INVENTORY
            </span>
            <span className="text-xs text-slate-400">Total Registered Pokepets: {inventory.length}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Pokepet Collection & POKEID Inventory
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Every registered pokepet has a permanent, site-wide unique 12-digit POKEID. All attributes can be edited apart from its unique POKEID and Species (Pokédex number).
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToRegister}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shrink-0 shadow-lg shadow-amber-500/20"
        >
          <span>+ Register Pet Pokémon</span>
        </button>
      </div>

      {/* Rescue Shelter Banner if items in 30-day bin */}
      {rescueBinCount > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold text-amber-200">
                {rescueBinCount} PokéPet{rescueBinCount === 1 ? '' : 's'} Safeguarded in 30-Day Rescue Shelter
              </span>
              <span className="text-[11px] text-slate-300">
                Deleted companions and their unique POKEIDs are preserved for 30 days before automatic deletion. You can restore them anytime.
              </span>
            </div>
          </div>
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer shrink-0 shadow-md shadow-amber-500/20"
            >
              <Heart className="w-3.5 h-3.5 fill-slate-950" />
              <span>Open Rescue Shelter</span>
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0F1522] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by POKEID (e.g. ID...), name, nickname, or Dex #..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            Sort by
            <select aria-label="Sort inventory" value={sortOrder} onChange={e => setSortOrder(e.target.value as InventorySort)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer">
              {INVENTORY_SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <DisplayLimitSelect label="PokéPets per page" value={displayLimit} onChange={value => { setDisplayLimit(value); setDisplayPage(1); }} />
          {/* Game filter */}
          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            <option value="all">All Origins</option>
            <option value="home_gift">Gifted from HOME</option>
            {GAMES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.shortTitle}
              </option>
            ))}
          </select>

          {/* HOME Storage status filter */}
          <select
            value={filterHomeStatus}
            onChange={(e) => setFilterHomeStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            <option value="all">All Storage Locations</option>
            <option value="in_home">Stored in Pokémon HOME</option>
            <option value="not_in_home">Stored in Console Game</option>
          </select>

          {/* Reveal All POKEIDs toggle */}
          <button
            type="button"
            onClick={() => setRevealAllIds((v) => !v)}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
          >
            {revealAllIds ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{revealAllIds ? 'Hide POKEIDs' : 'Reveal POKEIDs'}</span>
          </button>
        </div>
      </div>

      <PageControls page={currentDisplayPage} pages={pages} total={filteredInstances.length} onChange={setDisplayPage} />
      {/* Inventory Cards Grid */}
      {filteredInstances.length === 0 ? (
        <div className="bg-[#0F1522] border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center gap-3">
          <Box className="w-12 h-12 text-slate-600" />
          <h3 className="text-base font-bold text-slate-200">No Pokémon Specimens Found</h3>
          <p className="text-xs text-slate-400 max-w-md">
            {inventory.length === 0
              ? 'Your inventory is currently empty. Use the Register Pokémon page to record your first specimen.'
              : 'No specimens matched your search filters. Try clearing your search query.'}
          </p>
          {inventory.length === 0 && (
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Go to Register Pokémon →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleInstances.map((item) => {
            const mon = dex.find((p) => p.id === item.pokemonId);
            const isEditing = editingPokeId === item.pokeId;
            const variations = mon ? getVariationsForPokemon(mon) : [];
            const activeVariant =
              variations.find((v) => v.variantId === item.variantId) ||
              variations[0];
            const gameInfo = item.gameId ? GAMES.find((g) => g.id === item.gameId) : undefined;
            const originLabel = formatOriginSourceLabel(item, gameInfo?.shortTitle);
            const storageLabel = formatStorageLocationLabel(item, gameInfo?.platform);
            const isRevealed = revealAllIds || revealedPokeIds.has(item.pokeId);

            return (
              <div
                key={item.pokeId}
                data-testid="inventory-item"
                className="bg-[#0F1522] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all hover:border-slate-700 relative overflow-hidden shadow-lg"
              >
                {/* Header: POKEID & Action buttons */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-slate-400">POKEID:</span>
                      <span className="text-xs font-mono font-black text-amber-300 tracking-wider">
                        {isRevealed ? item.pokeId : 'ID••••••••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRevealPokeId(item.pokeId)}
                      title={isRevealed ? 'Hide POKEID' : 'Reveal 12-digit POKEID'}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {false && item.isRescued && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Rescued Companion</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { setEditingPokeId(null); onRequestEvolve(item); }}
                      className="px-2 py-1.5 rounded-lg bg-teal-900 text-teal-200 text-xs border border-teal-700" title="Evolve">Evolve</button>
                    {/* View Specimen Trainer Card */}
                    <button
                      type="button"
                      onClick={() => onOpenTrainerCardForPokeId(item)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                      title="View Pokepet Trainer Card"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
                        title="Edit PokéPet"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.pokeId)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Pokepet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Edit Form OR Standard Display */}
                {isEditing ? (
                  <div className="flex flex-col gap-3 py-1">
                    {/* Locked Permanent Attributes: POKEID & Species */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>POKEID: <strong className="text-amber-300 font-mono">{item.pokeId}</strong></span>
                        <span className="text-[10px] text-slate-500">(Locked)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Species: <strong className="text-slate-200">#{item.pokemonId} {mon?.name}</strong></span>
                        <span className="text-[10px] text-slate-500">(Locked)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400">Level (1-100)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editLevel}
                          onChange={(e) => setEditLevel(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400">Nickname (max 10)</label>
                          {editNickname && mon && (
                            <button
                              type="button"
                              onClick={() => setEditNickname('')}
                              className="text-[9px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5 cursor-pointer"
                              title="Use species name"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              Revert ({mon.name})
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          maxLength={10}
                          value={editNickname}
                          onChange={(e) => setEditNickname(e.target.value)}
                          placeholder={mon?.name}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
                        />
                      </div>
                    </div>

                    {/* Gender & Shiny row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400">Gender</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value as PokemonGender)}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                        >
                          <option value="male">Male (♂)</option>
                          <option value="female">Female (♀)</option>
                          <option value="genderless">Genderless (⚲)</option>
                        </select>
                      </div>
                      <div className="flex items-center pt-4">
                        <label className="flex items-center gap-2 text-xs text-amber-300 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsShiny}
                            onChange={(e) => setEditIsShiny(e.target.checked)}
                            className="rounded text-amber-500"
                          />
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Shiny Pokémon</span>
                        </label>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-fuchsia-200 cursor-pointer">
                      <input type="checkbox" checked={editHasPokerus} onChange={e => setEditHasPokerus(e.target.checked)} className="accent-fuchsia-400" />
                      <PokerusBadge /> Pokérus
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-slate-300">Origin region / language
                      <select aria-label="Edit origin region / language" value={editOriginLanguage} onChange={e=>setEditOriginLanguage(e.target.value as PokemonLanguage)} className="px-2 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100">
                        {POKEMON_LANGUAGES.map(language=><option key={language.id} value={language.id}>{language.tag} · {language.label}</option>)}
                      </select>
                    </label>
                    {/* Variant dropdown */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400">Variant / Form</label>
                      <select
                        value={editVariantId}
                        onChange={(e) => setEditVariantId(e.target.value)}
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                      >
                        {variations.map((v) => (
                          <option key={v.variantId} value={v.variantId}>
                            {v.formName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400">Poké Ball (optional)</label>
                      <select
                        value={editBallType}
                        onChange={(e) => setEditBallType(e.target.value as PokeballId | '')}
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 mt-0.5"
                      >
                        <option value="">Not specified</option>
                        {POKEBALLS.map((ball) => (
                          <option key={ball.id} value={ball.id}>{ball.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Origin Game (or HOME Gift) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400">Origin Game</label>
                        <label className="flex items-center gap-1.5 text-[10px] text-purple-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsHomeGift}
                            onChange={(e) => setEditIsHomeGift(e.target.checked)}
                            className="rounded text-purple-500"
                          />
                          <span>Gifted from Pokémon HOME</span>
                        </label>
                      </div>
                      {!editIsHomeGift && (
                        <select
                          value={editGameId || 'sv'}
                          onChange={(e) => setEditGameId(e.target.value as GameId)}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 mt-1"
                        >
                          {GAMES.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.title} ({g.platform})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Traded toggle */}
                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsTraded}
                          onChange={(e) => setEditIsTraded(e.target.checked)}
                          className="rounded text-sky-500"
                        />
                        <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                        <span>Received via Trade (Original Trainer not self)</span>
                      </label>
                    </div>

                    {/* Notes field */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400">Notes / Remarks (max 120 chars)</label>
                      <input
                        type="text"
                        maxLength={120}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="e.g. Bred for Competitive, Caught in Safari Ball..."
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 mt-0.5"
                      />
                    </div>

                    {/* Storage Toggles */}
                    <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editStoredInHome}
                          onChange={(e) => {
                            setEditStoredInHome(e.target.checked);
                            if (!e.target.checked) setEditIsInLivingBox(false);
                          }}
                          className="rounded text-emerald-500"
                        />
                        <span>Stored in Pokémon HOME</span>
                      </label>
                      {editStoredInHome && (
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsInLivingBox}
                            onChange={(e) => setEditIsInLivingBox(e.target.checked)}
                            className="rounded text-sky-500"
                          />
                          <span>Place in Living Dex Slot</span>
                        </label>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingPokeId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(item)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Display Mode */
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-16 h-16 shrink-0 bg-slate-900/90 rounded-xl flex items-center justify-center border border-slate-800 hover:border-amber-400/60 cursor-pointer transition-colors"
                      title={mon ? `View ${item.variantName || mon.name} Page` : undefined}
                      onClick={() => mon && onOpenPokemonPage(mon, item.variantId)}
                    >
                      <PokemonSprite
                        id={activeVariant?.spriteId || item.pokemonId}
                        name={item.variantName}
                        shiny={item.isShiny}
                        size="md"
                        imageUrl={activeVariant?.imageUrl}
                      />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-base font-extrabold text-slate-100 truncate hover:text-amber-300 cursor-pointer transition-colors"
                          onClick={() => mon && onOpenPokemonPage(mon, item.variantId)}
                        >
                          {item.nickname || mon?.name || `Pokemon #${item.pokemonId}`}
                        </span>
                        {item.nickname && (
                          <span className="text-[10px] text-slate-500">({mon?.name})</span>
                        )}
                        <span className="text-[10px] text-slate-400" title="Origin language">{POKEMON_LANGUAGES.find(language=>language.id===normalizePokemonLanguage(item.originLanguage))?.tag}</span>
                        {item.hasPokerus && <PokerusBadge />}
                        {item.isShiny && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                      <div className="text-xs font-mono font-semibold text-amber-400">
                        Level {item.level} • {item.gender === 'female' ? '♀' : item.gender === 'male' ? '♂' : '⚲'} • {item.variantName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                        {item.isHomeGift ? (
                          <span className="text-purple-300 font-semibold">{originLabel}</span>
                        ) : item.gameId ? (
                          <span className="text-sky-300 font-medium">{originLabel}</span>
                        ) : (
                          <span>{originLabel}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer status badges */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-tabular">
                  <span className={item.storedInHome ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {storageLabel}
                  </span>
                  {item.isInLivingBox && item.storedInHome && (
                    <span className="text-sky-300 font-semibold flex items-center gap-1">
                      <Box className="w-3 h-3" />
                      <span>Box {item.livingBoxNumber || mon?.boxNumber} (S{item.livingBoxSlot || mon?.boxSlot})</span>
                    </span>
                  )}
                </div>

                {/* Confirm Delete Dialog */}
                {confirmDeleteId === item.pokeId && (
                  <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-md p-4 flex flex-col justify-center items-center gap-2.5 z-30 text-center animate-fade-in border border-rose-500/50 rounded-2xl">
                    <div className="p-2 rounded-full bg-rose-500/20 text-rose-400">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="text-xs font-black text-rose-300">
                      Delete PokéPet {item.pokeId}?
                    </div>
                    <div className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                      <span className="text-amber-300 font-bold block mb-1">
                        ⚠️ Warning: Deleting cannot be undone directly!
                      </span>
                      <span>
                        Your PokéPet will be moved to the <strong className="text-emerald-400">30-Day Rescue Bin</strong> in Settings &gt; Rescue Pokémon. You have 30 days to rescue and restore it with its full battle data before permanent deletion.
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        If this is the last registered pokepet of this species, {mon?.name} will be marked as uncaught.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer font-medium"
                      >
                        Cancel & Keep Safe
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteInstance(item.pokeId);
                          setConfirmDeleteId(null);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-rose-600/30"
                      >
                        Delete to Rescue Bin
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
