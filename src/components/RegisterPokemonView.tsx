import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Check,
  Sparkles,
  Box,
  Gift,
  ArrowLeftRight,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  FileCheck2,
  Gamepad2,
  Lock,
} from 'lucide-react';
import type { PokemonEntry, GameId } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';
import {
  getVariationsForPokemon,
  type RegionalVariation,
} from '../data/regionalVariantsData';
import {
  getPokemonGenderInfo,
} from '../data/pokemonGenderData';
import { canBeHomeGift, getHomeGiftInfo } from '../data/homeGiftsData';
import {
  isTransferToHomePermanentlyBlocked,
  type PokemonInstance,
  type PokemonGender,
} from '../data/pokemonInventoryData';
import { generateUniqueSiteWidePokeId } from '../firebase';
import { PokemonSprite } from './PokemonSprite';
import { BoxSlotMiniMap } from './BoxSlotMiniMap';

interface RegisterPokemonViewProps {
  dex: PokemonEntry[];
  ownedGames: GameId[];
  inventory: PokemonInstance[];
  initialPokemonId?: number;
  onSaveNewInstance: (instance: PokemonInstance) => void;
  onOpenPokemonPage: (pokemon: PokemonEntry) => void;
  onNavigateToInventory?: () => void;
}

export const RegisterPokemonView: React.FC<RegisterPokemonViewProps> = ({
  dex,
  ownedGames,
  inventory,
  initialPokemonId,
  onSaveNewInstance,
  onOpenPokemonPage,
  onNavigateToInventory,
}) => {
  // Search query (number or name)
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonEntry | null>(() => {
    if (initialPokemonId) {
      const initMon = dex.find((p) => p.id === initialPokemonId);
      if (initMon) return initMon;
    }
    return dex[0] || null;
  });

  // Track initialPokemonId updates
  useEffect(() => {
    if (initialPokemonId) {
      const initMon = dex.find((p) => p.id === initialPokemonId);
      if (initMon) {
        setSelectedPokemon(initMon);
      }
    }
  }, [initialPokemonId, dex]);

  // Form Fields
  const [level, setLevel] = useState<number | ''>(50);
  const [targetGame, setTargetGame] = useState<GameId | ''>(() => {
    return ownedGames.length > 0 ? ownedGames[0] : 'sv';
  });
  const [selectedVariantId, setSelectedVariantId] = useState<string>('1:base');
  const [gender, setGender] = useState<PokemonGender>('male');
  const [nickname, setNickname] = useState('');
  const [isShiny, setIsShiny] = useState(false);
  const [isTraded, setIsTraded] = useState(false);
  const [isHomeGift, setIsHomeGift] = useState(false);
  const [storedInHome, setStoredInHome] = useState(true);
  const [isInLivingBox, setIsInLivingBox] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field validation and errors
  const [errors, setErrors] = useState<string[]>([]);

  // Success Modal Dialog
  const [registeredSuccess, setRegisteredSuccess] = useState<PokemonInstance | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Variations for current selected Pokémon
  const variations = useMemo(() => {
    if (!selectedPokemon) return [];
    return getVariationsForPokemon(selectedPokemon);
  }, [selectedPokemon]);

  // Gender information
  const genderInfo = useMemo(() => {
    if (!selectedPokemon) return { genderRatio: 'both' as const, hasVisualDifference: false };
    return getPokemonGenderInfo(selectedPokemon.id);
  }, [selectedPokemon]);

  // Can this Pokémon be received as a gift in Pokémon HOME?
  const isGiftEligible = useMemo(() => {
    if (!selectedPokemon) return false;
    return canBeHomeGift(selectedPokemon.id);
  }, [selectedPokemon]);

  // Check if HOME transfer is permanently blocked for this Pokémon from this game
  const transferBlockInfo = useMemo(() => {
    if (!selectedPokemon) return { isBlocked: false };
    if (isHomeGift) return { isBlocked: false }; // HOME gifts are inherently in HOME!
    return isTransferToHomePermanentlyBlocked(
      selectedPokemon.id,
      targetGame ? (targetGame as GameId) : undefined,
      selectedVariantId
    );
  }, [selectedPokemon, targetGame, selectedVariantId, isHomeGift]);

  // If transfer is blocked, automatically disallow storedInHome and living box
  useEffect(() => {
    if (transferBlockInfo.isBlocked) {
      setStoredInHome(false);
      setIsInLivingBox(false);
    }
  }, [transferBlockInfo]);

  // When selectedPokemon changes, reset defaults sensibly
  useEffect(() => {
    if (!selectedPokemon) return;
    const p = selectedPokemon;
    const currentVars = getVariationsForPokemon(p);
    setSelectedVariantId(currentVars[0]?.variantId || `${p.id}:base`);

    // Reset gender according to species ratio
    const gInfo = getPokemonGenderInfo(p.id);
    if (gInfo.genderRatio === 'genderless') {
      setGender('genderless');
    } else if (gInfo.genderRatio === 'female_only') {
      setGender('female');
    } else {
      setGender('male');
    }

    // Reset HOME Gift eligibility
    if (!canBeHomeGift(p.id)) {
      setIsHomeGift(false);
    }

    // Default game
    if (ownedGames.length > 0 && (!targetGame || !ownedGames.includes(targetGame as GameId))) {
      setTargetGame(ownedGames[0]);
    }
    setErrors([]);
  }, [selectedPokemon]);

  // Filter candidates based on query (number or name)
  const filteredMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const cleanedNumber = q.replace(/^#+/, '').replace(/^0+/, '') || '0';
    const num = parseInt(cleanedNumber, 10);
    const isNum = !isNaN(num) && num > 0 && num <= 1025;
    return dex
      .filter((p) => {
        if (isNum && p.id === num) return true;
        if (p.name.toLowerCase().includes(q)) return true;
        if (String(p.id).padStart(4, '0').includes(q)) return true;
        return false;
      })
      .slice(0, 10);
  }, [query, dex]);

  // Dismiss dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCandidate = (mon: PokemonEntry) => {
    setSelectedPokemon(mon);
    setQuery(`${String(mon.id).padStart(4, '0')} ${mon.name}`);
    setIsDropdownOpen(false);
    setErrors([]);
  };

  const handleResetForm = () => {
    if (!selectedPokemon) return;
    setLevel(50);
    setNickname('');
    setIsShiny(false);
    setIsTraded(false);
    setIsHomeGift(false);
    setStoredInHome(true);
    setIsInLivingBox(true);
    if (ownedGames.length > 0) {
      setTargetGame(ownedGames[0]);
    }
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPokemon) {
      setErrors(['Please select a valid Pokémon to register.']);
      return;
    }

    const validationErrors: string[] = [];

    // Level check: mandatory 1-100
    if (level === '' || isNaN(Number(level)) || Number(level) < 1 || Number(level) > 100) {
      validationErrors.push('Level is mandatory and must be a whole number between 1 and 100.');
    }

    // Origin game check: required ONLY IF not gifted from home
    if (!isHomeGift && (!targetGame || !GAMES.some((g) => g.id === targetGame))) {
      validationErrors.push('Origin Game must be selected (unless tagged as Gifted from Pokémon HOME).');
    }

    // Variant check
    if (!selectedVariantId) {
      validationErrors.push('A valid Variant/Form must be selected.');
    }

    // Gender check: if species has both genders, gender must be specified
    if (genderInfo.genderRatio === 'both' && !gender) {
      validationErrors.push('Gender (Male or Female) must be specified for this species.');
    }

    // Nickname character limit (max 10)
    if (nickname.trim().length > 10) {
      validationErrors.push('Nickname cannot exceed 10 characters.');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      // Generate guaranteed unique 12-char POKEID checked site-wide across all users
      const existingPokeIds = new Set(inventory.map((inv) => inv.pokeId));
      const pokeId = await generateUniqueSiteWidePokeId(existingPokeIds);

      const chosenVariant = variations.find((v) => v.variantId === selectedVariantId);
      const variantName = chosenVariant ? chosenVariant.formName : `${selectedPokemon.name} (Base)`;

      const effectiveStoredInHome = transferBlockInfo.isBlocked ? false : isHomeGift ? true : storedInHome;

      const newInstance: PokemonInstance = {
        pokeId,
        pokemonId: selectedPokemon.id,
        nickname: nickname.trim().slice(0, 10),
        level: Number(level),
        gender: genderInfo.genderRatio === 'genderless' ? 'genderless' : gender,
        variantId: selectedVariantId,
        variantName,
        isShiny,
        gameId: isHomeGift ? undefined : (targetGame as GameId),
        isHomeGift,
        isTraded,
        storedInHome: effectiveStoredInHome,
        isInLivingBox: effectiveStoredInHome && isInLivingBox,
        livingBoxNumber: selectedPokemon.boxNumber,
        livingBoxSlot: selectedPokemon.boxSlot,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onSaveNewInstance(newInstance);
      setRegisteredSuccess(newInstance);
    } catch (err) {
      console.error('Error generating POKEID:', err);
      setErrors(['Unable to generate site-wide unique POKEID. Please verify connection and retry.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVariantObj = useMemo(() => {
    return (
      variations.find((v) => v.variantId === selectedVariantId) ||
      variations[0] || {
        variantId: `${selectedPokemon?.id || 1}:base`,
        pokemonId: selectedPokemon?.id || 1,
        formName: selectedPokemon?.name || '',
        regionTag: 'Original' as const,
        types: selectedPokemon?.types || [],
        spriteId: selectedPokemon?.id || 1,
        findInGames: [],
      }
    );
  }, [variations, selectedVariantId, selectedPokemon]);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="bg-[#0F1522] border border-amber-500/40 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[11px] font-mono-tabular font-bold">
              POKEPET REGISTRATION PORTAL
            </span>
            <span className="text-xs text-slate-400">Database Entry with Unique Site-Wide POKEID</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Register Pet Pokémon
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            This is the exclusive gateway to register pet Pokémon to your database. Every entry generates a site-wide unique 12-digit POKEID checked against the central database to guarantee no duplicates, validates origin game or HOME gift status, enforces level (1–100), and records storage state.
          </p>
        </div>
      </div>

      {/* Main Registration Panel */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Species Search & Live Artwork Preview */}
          <div className="lg:col-span-5 flex flex-col gap-4 bg-[#0F1522] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Select Species (Dex # or Name) *</span>
              <span className="text-[10px] text-amber-400 font-mono">1 to 1025</span>
            </label>

            {/* Quick Search Bar */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsDropdownOpen(true);
                    const val = e.target.value.trim().replace(/^#+/, '');
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 1 && num <= 1025) {
                      const match = dex.find((p) => p.id === num);
                      if (match) setSelectedPokemon(match);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredMatches.length > 0) {
                        handleSelectCandidate(filteredMatches[0]);
                      }
                    }
                  }}
                  placeholder="e.g. 025, Charizard, Gengar..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Suggestions Popover */}
              {isDropdownOpen && filteredMatches.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-30 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl divide-y divide-slate-800/80"
                >
                  {filteredMatches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectCandidate(m)}
                      className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono-tabular text-amber-400 font-bold w-12">
                          #{String(m.id).padStart(4, '0')}
                        </span>
                        <span className="text-sm font-bold text-slate-100">
                          {m.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {m.types.join('/')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stepping controls */}
            {selectedPokemon && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const prevId = selectedPokemon.id > 1 ? selectedPokemon.id - 1 : 1025;
                    const mon = dex.find((item) => item.id === prevId);
                    if (mon) handleSelectCandidate(mon);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextId = selectedPokemon.id < 1025 ? selectedPokemon.id + 1 : 1;
                    const mon = dex.find((item) => item.id === nextId);
                    if (mon) handleSelectCandidate(mon);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPokemonPage(selectedPokemon)}
                  className="ml-auto text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Selected Pokémon Live Artwork Preview */}
            {selectedPokemon && (
              <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col items-center gap-3">
                <div className="w-28 h-28 bg-slate-900/90 rounded-xl flex items-center justify-center border border-slate-800 relative shadow-inner">
                  <PokemonSprite
                    id={activeVariantObj.spriteId}
                    name={activeVariantObj.formName}
                    shiny={isShiny}
                    size="lg"
                    imageUrl={activeVariantObj.imageUrl}
                  />
                  {isShiny && (
                    <div className="absolute top-2 right-2 p-1 rounded bg-amber-500/20 border border-amber-500/50">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono-tabular text-amber-400 font-bold">
                    #{String(selectedPokemon.id).padStart(4, '0')} — {selectedPokemon.region}
                  </div>
                  <div className="text-lg font-extrabold text-slate-100">
                    {selectedPokemon.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {activeVariantObj.formName} — {activeVariantObj.types.join('/')}
                  </div>
                </div>

                {/* Living Dex Slot Illustration mini-map */}
                {isInLivingBox && storedInHome && !transferBlockInfo.isBlocked && (
                  <div className="w-full pt-3 border-t border-slate-800/80 flex flex-col items-center">
                    <span className="text-[11px] font-bold text-sky-300 mb-1 flex items-center gap-1">
                      <Box className="w-3.5 h-3.5" />
                      <span>Living Dex Placement</span>
                    </span>
                    <BoxSlotMiniMap
                      boxNumber={selectedPokemon.boxNumber}
                      boxSlot={selectedPokemon.boxSlot}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Pokepet Input Attributes */}
          <div className="lg:col-span-7 flex flex-col gap-5 bg-[#0F1522] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-100 border-b border-slate-800/80 pb-3">
              Pokepet Attributes & Acquisition Details
            </h2>

            {/* Error notifications */}
            {errors.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 flex flex-col gap-1.5 animate-shake">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Please resolve the following required details to register:</span>
                </div>
                <ul className="list-disc list-inside text-xs text-rose-200/90 pl-1">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Row 1: Level (Mandatory) & Nickname (Up to 10 chars) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Level Input (Mandatory 1-100) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Level (Mandatory) *</span>
                  <span className="text-[10px] text-amber-400 font-mono">1 – 100</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={level}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLevel(val === '' ? '' : Math.max(1, Math.min(100, Number(val))));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. 50"
                />
                <span className="text-[10px] text-slate-400">
                  Required for each instance. Displayed on public living dex and box views.
                </span>
              </div>

              {/* Nickname Input (Up to 10 chars, can revert back to species name) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Nickname (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{nickname.length}/10 chars</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={10}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.slice(0, 10))}
                    placeholder={selectedPokemon?.name || 'In-game Name'}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  {nickname && selectedPokemon && (
                    <button
                      type="button"
                      onClick={() => setNickname('')}
                      className="px-2.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-sky-400 font-semibold cursor-pointer whitespace-nowrap"
                      title="Revert back to the Pokémon's species name"
                    >
                      Revert
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  Up to 10 chars. Reverting restores the in-game species name.
                </span>
              </div>
            </div>

            {/* Row 2: Form / Variant & Gender Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Form / Variant Dropdown (Mandatory) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Form / Regional Variant *</span>
                  <span className="text-[10px] text-amber-400 font-mono">{variations.length} available</span>
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {variations.map((v) => (
                    <option key={v.variantId} value={v.variantId}>
                      {v.regionTag === 'Original'
                        ? `${v.formName} (Standard)`
                        : `${v.formName} [${v.regionTag}]`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Gender</span>
                  <span className="text-[10px] text-slate-400 font-mono capitalize">
                    {genderInfo.genderRatio === 'both' ? 'Both Genders' : genderInfo.genderRatio}
                  </span>
                </label>
                {genderInfo.genderRatio === 'genderless' ? (
                  <div className="px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                    Genderless Species
                  </div>
                ) : (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as PokemonGender)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {genderInfo.genderRatio !== 'female_only' && <option value="male">♂ Male</option>}
                    {genderInfo.genderRatio !== 'male_only' && <option value="female">♀ Female</option>}
                  </select>
                )}
              </div>
            </div>

            {/* Special Origin: Pokémon HOME Gift Checkbox */}
            {isGiftEligible && (
              <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-500/50 flex flex-col gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isHomeGift}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsHomeGift(checked);
                      if (checked) {
                        setStoredInHome(true);
                      }
                    }}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-purple-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-purple-400" />
                      <span>Gifted from Pokémon HOME</span>
                    </span>
                    <span className="text-[11px] text-purple-300/80">
                      {getHomeGiftInfo(selectedPokemon?.id || 0)?.description ||
                        'Pokémon HOME Mystery Gift / Event distribution'}
                    </span>
                  </div>
                </label>
                {isHomeGift && (
                  <p className="text-[11px] text-purple-300 bg-purple-900/40 p-2 rounded-lg border border-purple-500/30">
                    ★ When tagged as <strong>Gifted from Home</strong>, it cannot have a game assigned to it and the option to pick a game does not appear. HOME gifts are the only Pokémon that can be counted as caught in the dex without an origin game.
                  </p>
                )}
              </div>
            )}

            {/* Game Origin Selection (Option does NOT appear if gifted from home!) */}
            {!isHomeGift && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Origin Game Caught In *</span>
                </label>
                <select
                  value={targetGame}
                  onChange={(e) => setTargetGame(e.target.value as GameId)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {ownedGames.length > 0 && (
                    <optgroup label="Your Owned Games">
                      {ownedGames.map((gId) => {
                        const g = GAMES.find((item) => item.id === gId);
                        return (
                          <option key={gId} value={gId}>
                            {g?.shortTitle || gId.toUpperCase()} ({g?.generationLabel})
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  <optgroup label="Other Main Series Games">
                    {GAMES.filter((g) => !ownedGames.includes(g.id)).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.shortTitle} ({g.generationLabel})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Traded Status & Shiny Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              {/* Traded Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isTraded}
                  onChange={(e) => setIsTraded(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                    <span>Received via Trade</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isHomeGift
                      ? 'Displays as "Regifted from HOME"'
                      : `Displays as "Traded from ${GAMES.find((g) => g.id === targetGame)?.shortTitle || targetGame}"`}
                  </span>
                </div>
              </label>

              {/* Shiny Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isShiny}
                  onChange={(e) => setIsShiny(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Shiny Pokepet</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Registers shiny artwork in Pokédex</span>
                </div>
              </label>
            </div>

            {/* Pokémon HOME Transfer Gate & Living Dex Eligibility */}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-3">
              {/* If transfer is permanently blocked from this game, option is NOT available */}
              {transferBlockInfo.isBlocked ? (
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/50 flex flex-col gap-1 text-xs text-rose-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Stored in Pokémon HOME Option Unavailable</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    {transferBlockInfo.reason}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    This pokepet will be classified as (stored in {GAMES.find((g) => g.id === targetGame)?.platform || 'Console'}) and is ineligible for the Living Dex.
                  </p>
                </div>
              ) : (
                /* Stored in Pokémon HOME Checkbox */
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isHomeGift || storedInHome}
                    disabled={isHomeGift}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setStoredInHome(checked);
                      if (!checked) {
                        setIsInLivingBox(false);
                      }
                    }}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Stored in Pokémon HOME</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isHomeGift
                        ? 'HOME gifts are automatically stored in Pokémon HOME.'
                        : 'Unlocks pokepet to be added to the Living Dex. If untagged, marked as ineligible for living dex and classed as stored in console.'}
                    </span>
                  </div>
                </label>
              )}

              {/* Living Dex Slot Option: ONLY shows if marked as Stored in HOME */}
              {storedInHome && !transferBlockInfo.isBlocked ? (
                <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/40 flex flex-col gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInLivingBox}
                      onChange={(e) => setIsInLivingBox(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-sky-400" />
                        <span>Place in Living Dex Slot</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Assign to Box {selectedPokemon?.boxNumber}, Slot {selectedPokemon?.boxSlot}
                      </span>
                    </div>
                  </label>

                  {/* Specific Box Slot Illustration underneath the box number */}
                  {isInLivingBox && selectedPokemon && (
                    <div className="pt-2 border-t border-sky-500/30 flex flex-col items-center">
                      <span className="text-[10px] font-mono font-semibold text-sky-300 mb-1">
                        Specific Living Dex Slot Illustration: Box {selectedPokemon.boxNumber}, Slot {selectedPokemon.boxSlot}
                      </span>
                      <BoxSlotMiniMap
                        boxNumber={selectedPokemon.boxNumber}
                        boxSlot={selectedPokemon.boxSlot}
                        size="md"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-rose-300/90 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Marked as <strong>Ineligible for Living Dex</strong> because pokepet is not stored in Pokémon HOME. (Option to add to living dex will not show until changed).
                  </span>
                </div>
              )}
            </div>

            {/* Save & Reset Buttons */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors shadow-lg shadow-amber-500/25"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Assigning Unique POKEID...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save Pet Pokémon to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Success Modal Pop-up with Picture, Variant, POKEID, and Link to view */}
      {registeredSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0F1522] border border-amber-500/70 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
            {/* Quick Dismiss 'X' in the corner */}
            <button
              type="button"
              onClick={() => setRegisteredSuccess(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto">
              <FileCheck2 className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono font-bold text-amber-400">PET POKÉMON REGISTERED SUCCESSFULLY</span>
              <h3 className="text-xl font-extrabold text-slate-100">
                {registeredSuccess.nickname || selectedPokemon?.name}
              </h3>
              <p className="text-xs text-slate-400">
                Pokepet saved to inventory and universal database with unique POKEID certificate.
              </p>
            </div>

            {/* Picture of Pokémon & Variant */}
            <div className="py-2 flex flex-col items-center">
              <div className="w-28 h-28 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 relative shadow-inner">
                <PokemonSprite
                  id={activeVariantObj.spriteId}
                  name={registeredSuccess.variantName}
                  shiny={registeredSuccess.isShiny}
                  size="lg"
                  imageUrl={activeVariantObj.imageUrl}
                />
              </div>
              <div className="text-xs text-amber-300 font-bold mt-1.5">
                {registeredSuccess.variantName} — Level {registeredSuccess.level}
              </div>
            </div>

            {/* Generated POKEID Card */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/50 flex flex-col gap-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Unique 12-Digit Pokepet Identifier (POKEID)
              </span>
              <span className="text-xl font-mono font-black text-amber-300 tracking-wider select-all">
                {registeredSuccess.pokeId}
              </span>
              <span className="text-[10px] text-slate-400">
                Origin: {registeredSuccess.isHomeGift ? 'Gifted from HOME' : GAMES.find((g) => g.id === registeredSuccess.gameId)?.shortTitle || 'Game'} • {registeredSuccess.storedInHome ? 'Stored in HOME' : '(stored in console)'}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRegisteredSuccess(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
              >
                Register Another Pokepet
              </button>
              {selectedPokemon && (
                <button
                  type="button"
                  onClick={() => {
                    const mon = selectedPokemon;
                    setRegisteredSuccess(null);
                    onOpenPokemonPage(mon);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
                >
                  View Pokémon Page →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
