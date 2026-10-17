import { POKEMON_LANGUAGES, type PokemonLanguage } from '../data/pokemonLanguages';
import { PokeballIcon } from './PokeballIcon';
import { RegistrationToggle } from './RegistrationToggle';
import { PokerusBadge } from './PokerusBadge';
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
import { GAMES, USER_SELECTABLE_GAMES } from '../data/pokemonData';
import {
  getVariationsForPokemon,
  type RegionalVariation,
} from '../data/regionalVariantsData';
import {
  getPokemonGenderInfo,
} from '../data/pokemonGenderData';
import { canBeHomeGift } from '../data/homeGiftsData';
import {
  isTransferToHomePermanentlyBlocked,
  POKEBALLS,
  type PokemonInstance,
  type PokemonGender,
  type PokeballId,
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

function getVariantShortLabel(
  formName: string,
  speciesName: string,
  regionTag: string
): string {
  let result = formName;

  if (speciesName) {
    const escaped = speciesName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'gi'), '');
  }

  result = result.replace(/\s+/g, ' ').trim();

  const parenMatch = result.match(/^\((.+)\)$/);
  if (parenMatch) result = parenMatch[1].trim();

  result = result.replace(/^[\s\-–—:,]+|[\s\-–—:,]+$/g, '').trim();

  if (!result || /original form/i.test(result) || /standard form/i.test(result)) {
    return regionTag === 'Original' ? 'Base' : regionTag;
  }

  return result;
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
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonEntry | null>(() => {
    if (initialPokemonId) {
      const initMon = dex.find((p) => p.id === initialPokemonId);
      if (initMon) return initMon;
    }
    return dex[0] || null;
  });

  useEffect(() => {
    if (initialPokemonId) {
      const initMon = dex.find((p) => p.id === initialPokemonId);
      if (initMon) {
        setSelectedPokemon(initMon);
      }
    }
  }, [initialPokemonId, dex]);

  const [level, setLevel] = useState<number | ''>(50);
  const [targetGame, setTargetGame] = useState<GameId | ''>(() => {
    return ownedGames.length > 0 ? ownedGames[0] : 'sv';
  });
  const [selectedVariantId, setSelectedVariantId] = useState<string>('1:base');
  const [gender, setGender] = useState<PokemonGender>('male');
  const [nickname, setNickname] = useState('');
  const [isShiny, setIsShiny] = useState(false);
  const [hasPokerus, setHasPokerus] = useState(false);
  const [originLanguage,setOriginLanguage] = useState<PokemonLanguage>('en');
  const [ballType, setBallType] = useState<PokeballId | ''>('');
  const [isTraded, setIsTraded] = useState(false);
  const [isHomeGift, setIsHomeGift] = useState(false);
  const [storedInHome, setStoredInHome] = useState(true);
  const [isInLivingBox, setIsInLivingBox] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [registeredSuccess, setRegisteredSuccess] = useState<PokemonInstance | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const variations = useMemo(() => {
    if (!selectedPokemon) return [];
    return getVariationsForPokemon(selectedPokemon);
  }, [selectedPokemon]);

  const currentVariantIndex = useMemo(() => {
    const idx = variations.findIndex((v) => v.variantId === selectedVariantId);
    return idx >= 0 ? idx : 0;
  }, [variations, selectedVariantId]);

  const currentVariant = useMemo(() => {
    return variations[currentVariantIndex] || variations[0] || null;
  }, [variations, currentVariantIndex]);

  const currentVariantShortLabel = useMemo(() => {
    if (!currentVariant) return '';
    return getVariantShortLabel(
      currentVariant.formName,
      selectedPokemon?.name || '',
      currentVariant.regionTag
    );
  }, [currentVariant, selectedPokemon]);

  const currentVariantTag = useMemo(() => {
    if (!currentVariant) return null;
    return currentVariant.regionTag === 'Original' ? null : currentVariant.regionTag;
  }, [currentVariant]);

  const goToPrevVariant = () => {
    if (variations.length <= 1) return;
    const nextIdx = (currentVariantIndex - 1 + variations.length) % variations.length;
    setSelectedVariantId(variations[nextIdx].variantId);
  };

  const goToNextVariant = () => {
    if (variations.length <= 1) return;
    const nextIdx = (currentVariantIndex + 1) % variations.length;
    setSelectedVariantId(variations[nextIdx].variantId);
  };

  const genderInfo = useMemo(() => {
    if (!selectedPokemon) return { genderRatio: 'both' as const, hasVisualDifference: false };
    return getPokemonGenderInfo(selectedPokemon.id);
  }, [selectedPokemon]);

  const isGiftEligible = useMemo(() => {
    if (!selectedPokemon) return false;
    return canBeHomeGift(selectedPokemon.id);
  }, [selectedPokemon]);

  const availableOriginGames = useMemo(
    () => GAMES.filter((game) =>
      USER_SELECTABLE_GAMES.includes(game.id) &&
      (isTraded || ownedGames.includes(game.id))
    ),
    [isTraded, ownedGames]
  );

  const transferBlockInfo = useMemo(() => {
    if (!selectedPokemon) return { isBlocked: false };
    if (isHomeGift) return { isBlocked: false };
    return isTransferToHomePermanentlyBlocked(
      selectedPokemon.id,
      targetGame ? (targetGame as GameId) : undefined,
      selectedVariantId
    );
  }, [selectedPokemon, targetGame, selectedVariantId, isHomeGift]);

  const variantGenderLock = useMemo<PokemonGender | null>(() => {
    if (!selectedPokemon) return null;
    if (genderInfo.genderRatio === 'genderless') return null;
    const cv = variations.find((v) => v.variantId === selectedVariantId);
    if (!cv) return null;

    const n = cv.formName.toLowerCase();
    const hasMale = /\bmale\b/.test(n) || n.includes('(male)');
    const hasFemale = /\bfemale\b/.test(n) || n.includes('(female)');

    if (hasMale && !hasFemale) return 'male';
    if (hasFemale && !hasMale) return 'female';
    return null;
  }, [selectedPokemon, selectedVariantId, variations, genderInfo]);

  useEffect(() => {
    if (transferBlockInfo.isBlocked) {
      setStoredInHome(false);
      setIsInLivingBox(false);
    }
  }, [transferBlockInfo]);

  useEffect(() => {
    if (isTraded) return;
    if (!targetGame) return;
    if (ownedGames.length === 0) return;
    if (!ownedGames.includes(targetGame as GameId)) {
      setTargetGame(ownedGames[0]);
    }
  }, [isTraded, targetGame, ownedGames]);

  useEffect(() => {
    if (!selectedPokemon) return;
    const p = selectedPokemon;
    const currentVars = getVariationsForPokemon(p);
    setSelectedVariantId(currentVars[0]?.variantId || `${p.id}:base`);

    if (!canBeHomeGift(p.id)) {
      setIsHomeGift(false);
    }

    if (ownedGames.length > 0 && (!targetGame || !ownedGames.includes(targetGame as GameId))) {
      setTargetGame(ownedGames[0]);
    }

    setErrors([]);
  }, [selectedPokemon]);

  useEffect(() => {
    if (!selectedPokemon) return;

    if (genderInfo.genderRatio === 'genderless') {
      setGender('genderless');
      return;
    }

    if (variantGenderLock) {
      setGender(variantGenderLock);
      return;
    }

    if (genderInfo.genderRatio === 'female_only') {
      setGender('female');
    } else if (genderInfo.genderRatio === 'male_only') {
      setGender('male');
    } else {
      setGender((prev) => (prev === 'female' ? 'female' : 'male'));
    }
  }, [selectedPokemon, selectedVariantId, variantGenderLock, genderInfo]);

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
    setHasPokerus(false);
    setOriginLanguage('en');
    setBallType('');
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

    if (level === '' || isNaN(Number(level)) || Number(level) < 1 || Number(level) > 100) {
      validationErrors.push('Level is mandatory and must be a whole number between 1 and 100.');
    }

    if (!isHomeGift && (!targetGame || !GAMES.some((g) => g.id === targetGame))) {
      validationErrors.push('Origin Game must be selected (unless tagged as Gifted from Pokémon HOME).');
    }

    if (
      !isHomeGift &&
      !isTraded &&
      targetGame &&
      !ownedGames.includes(targetGame as GameId)
    ) {
      validationErrors.push(
        'You can only register a Poképet from a game you own. Tick "Received via Trade" if this Pokémon came from a trade.'
      );
    }

    if (!selectedVariantId) {
      validationErrors.push('A valid Variant/Form must be selected.');
    }

    if (genderInfo.genderRatio === 'both' && !gender) {
      validationErrors.push('Gender (Male or Female) must be specified for this species.');
    }

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
        hasPokerus,
        originLanguage,
        ballType: ballType || undefined,
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
    <div className="flex flex-col gap-4 sm:gap-6 w-full pb-40 lg:pb-6">
      {/* Main Registration Panel */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:gap-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-3 items-start">
          {/* Left Column: Live preview, placement and level keypad */}
          <div data-testid="register-preview" className="lg:col-span-5 flex flex-col gap-2.5 lg:gap-3 bg-[#0F1522] border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
            {selectedPokemon && (
              <div className="p-2.5 lg:p-3 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col gap-2.5">
                <div className="flex flex-row items-center gap-3">
                  <div className="w-20 h-20 lg:w-28 lg:h-28 bg-slate-900/90 rounded-xl flex items-center justify-center border border-slate-800 relative shadow-inner shrink-0">
                    <PokemonSprite
                      id={activeVariantObj.spriteId}
                      name={activeVariantObj.formName}
                      shiny={isShiny}
                      size="lg"
                      imageUrl={activeVariantObj.imageUrl}
                    />
                    {isShiny && (
                      <div className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 p-1 rounded bg-amber-500/20 border border-amber-500/50">
                        <Sparkles className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-amber-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-mono-tabular text-amber-400 font-bold">
                      #{String(selectedPokemon.id).padStart(4, '0')} — {selectedPokemon.region}
                    </div>
                    <div className="text-base lg:text-lg font-extrabold text-slate-100 truncate">
                      {selectedPokemon.name}
                    </div>
                    <div className="text-[11px] lg:text-xs text-slate-400 mt-0.5 truncate">
                      {activeVariantObj.formName} — {activeVariantObj.types.join('/')}
                    </div>
                  </div>
                </div>

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
                      slots={dex.filter(p=>p.boxNumber===selectedPokemon.boxNumber).map(p=>({slot:p.boxSlot,pokemonId:p.id,name:p.name,occupied:inventory.some(pet=>pet.pokemonId===p.id && pet.isInLivingBox && pet.storedInHome)}))}
                      onSelectSlot={slot=>{const mon=dex.find(p=>p.boxNumber===selectedPokemon.boxNumber && p.boxSlot===slot);if(mon)handleSelectCandidate(mon);}}
                      canPreviousBox={selectedPokemon.boxNumber>1}
                      canNextBox={selectedPokemon.boxNumber<Math.max(...dex.map(p=>p.boxNumber))}
                      onNavigateBox={direction=>{const nextBox=selectedPokemon.boxNumber+direction;const mon=dex.find(p=>p.boxNumber===nextBox && p.boxSlot===selectedPokemon.boxSlot) || dex.find(p=>p.boxNumber===nextBox);if(mon)handleSelectCandidate(mon);}}
                    />
                    <span className="text-[10px] text-slate-400 mt-1">Tap a slot to select that Pokémon.</span>
                  </div>
                )}
              </div>
            )}

            {/* Level + Number Pad */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Level (Mandatory) *</span>
                <span className="text-[10px] text-amber-400 font-mono">1 – 100</span>
              </label>

              <div className="flex items-stretch gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  inputMode="numeric"
                  value={level}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLevel(val === '' ? '' : Math.max(1, Math.min(100, Number(val))));
                  }}
                  className="w-20 sm:w-24 shrink-0 px-2 rounded-xl bg-slate-900 border border-slate-700 text-2xl sm:text-3xl font-bold font-mono text-slate-100 text-center focus:outline-none focus:border-amber-400"
                  placeholder="50"
                />

                <div className="flex-1 min-w-0 p-1 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col gap-1">
                  <div className="grid grid-cols-3 lg:grid-cols-5 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => {
                          const current = String(level === '' ? '' : level);
                          const next = `${current}${digit}`;
                          const num = Number(next);
                          if (Number.isNaN(num)) return;
                          setLevel(num > 100 ? Number(digit) : num);
                        }}
                        className={`min-h-10 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm lg:text-base font-bold font-mono text-slate-100 cursor-pointer transition-colors active:bg-amber-500 active:text-slate-950 ${digit === '0' ? 'col-start-2 lg:col-start-auto' : ''}`}
                      >
                        {digit}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setLevel('')}
                      className="min-h-9 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-300 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = String(level === '' ? '' : level);
                        const next = current.slice(0, -1);
                        setLevel(next === '' ? '' : Number(next));
                      }}
                      className="min-h-9 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer transition-colors"
                    >
                      ⌫ Back
                    </button>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">
                Required for each instance. Displayed on public living dex and box views.
              </span>
            </div>

            {/* Desktop Save & Reset — sits directly under the level entry */}
            <div className="hidden lg:flex items-center gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold cursor-pointer transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors shadow-lg shadow-amber-500/25"
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

          {/* Right Column: Pokepet Input Attributes */}
          <div data-testid="register-attributes" className="lg:col-span-7 flex flex-col gap-3 lg:gap-2.5 bg-[#0F1522] border border-slate-800 rounded-2xl p-3 sm:p-5 lg:p-4 shadow-xl">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Select Species (Dex # or Name) *</span>
              <span className="text-[10px] text-amber-400 font-mono">1 to 1025</span>
            </label>

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
                  className="w-full pl-10 pr-4 py-3 lg:py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 text-base lg:text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                />
              </div>

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
                      className="w-full px-3.5 py-3 lg:py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer"
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

            {selectedPokemon && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const prevId = selectedPokemon.id > 1 ? selectedPokemon.id - 1 : 1025;
                    const mon = dex.find((item) => item.id === prevId);
                    if (mon) handleSelectCandidate(mon);
                  }}
                  className="px-3 py-2.5 lg:px-2.5 lg:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextId = selectedPokemon.id < 1025 ? selectedPokemon.id + 1 : 1;
                    const mon = dex.find((item) => item.id === nextId);
                    if (mon) handleSelectCandidate(mon);
                  }}
                  className="px-3 py-2.5 lg:px-2.5 lg:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPokemonPage(selectedPokemon)}
                  className="ml-auto text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer py-2"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            <h2 className="text-sm sm:text-base font-bold text-slate-100 border-b border-slate-800/80 pb-2">
              Pokepet Attributes & Acquisition Details
            </h2>

            {errors.length > 0 && (
              <div className="p-3 sm:p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 flex flex-col gap-1.5 animate-shake">
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

            {/* Nickname */}
            <div className="flex flex-col gap-1">
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
                  className="flex-1 px-3 py-2.5 lg:py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-base lg:text-sm font-semibold text-slate-100 focus:outline-none focus:border-amber-400"
                />
                {nickname && selectedPokemon && (
                  <button
                    type="button"
                    onClick={() => setNickname('')}
                    className="px-3 py-3 lg:px-2.5 lg:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-sky-400 font-semibold cursor-pointer whitespace-nowrap"
                    title="Use species name"
                  >
                    Revert
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400">
                Up to 10 chars. Reverting restores the in-game species name.
              </span>
            </div>

            {/* Row: Form / Variant & Gender Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Form / Regional Variant *</span>
                  <span className="text-[10px] text-amber-400 font-mono">{variations.length} available</span>
                </label>

                {variations.length === 0 ? (
                  <div className="px-3 py-3 lg:py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                    No variants available
                  </div>
                ) : (
                  <>
                    <div className="flex items-stretch gap-1.5">
                      <button
                        type="button"
                        onClick={goToPrevVariant}
                        disabled={variations.length <= 1}
                        className="px-3 lg:px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0 flex items-center justify-center"
                        aria-label="Previous variant"
                      >
                        <ChevronLeft className="w-5 h-5 lg:w-4 lg:h-4" />
                      </button>

                      <div className="flex-1 min-w-0 px-2 py-2 lg:py-1 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                          {currentVariant && (
                            <PokemonSprite
                              id={currentVariant.spriteId}
                              name={currentVariant.formName}
                              size="sm"
                              imageUrl={currentVariant.imageUrl}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                          <div className="flex items-center gap-1.5 max-w-full">
                            <span className="text-sm font-bold text-amber-300 truncate">
                              {currentVariantShortLabel}
                            </span>
                            {currentVariantTag && !currentVariantShortLabel.toLowerCase().includes(currentVariantTag.toLowerCase()) && (
                              <span className="text-[9px] font-mono uppercase tracking-wide px-1 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                                {currentVariantTag}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">
                            {currentVariantIndex + 1} / {variations.length}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={goToNextVariant}
                        disabled={variations.length <= 1}
                        className="px-3 lg:px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0 flex items-center justify-center"
                        aria-label="Next variant"
                      >
                        <ChevronRight className="w-5 h-5 lg:w-4 lg:h-4" />
                      </button>
                    </div>

                    {variations.length > 1 && variations.length <= 12 && (
                      <div className="flex items-center justify-center gap-1.5 mt-1.5">
                        {variations.map((v, i) => (
                          <button
                            key={v.variantId}
                            type="button"
                            onClick={() => setSelectedVariantId(v.variantId)}
                            className={`w-2.5 h-2.5 lg:w-1.5 lg:h-1.5 rounded-full transition-colors cursor-pointer ${
                              i === currentVariantIndex
                                ? 'bg-amber-400'
                                : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                            aria-label={`Go to variant ${i + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Gender</span>
                  <span className="text-[10px] text-slate-400 font-mono capitalize">
                    {variantGenderLock
                      ? 'Set by variant'
                      : genderInfo.genderRatio === 'both'
                      ? 'Both Genders'
                      : genderInfo.genderRatio}
                  </span>
                </label>

                {variantGenderLock ? (
                  <div className="px-3 py-3 lg:py-2.5 rounded-xl bg-slate-900/60 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-1.5 font-semibold">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {variantGenderLock === 'male' ? '♂ Male' : '♀ Female'}
                      <span className="text-slate-500 font-normal ml-1">(set by variant)</span>
                    </span>
                  </div>
                ) : genderInfo.genderRatio === 'genderless' ? (
                  <div className="px-3 py-3 lg:py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                    Genderless Species
                  </div>
                ) : (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as PokemonGender)}
                    className="w-full px-3 py-3 lg:py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm lg:text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {genderInfo.genderRatio !== 'female_only' && <option value="male">♂ Male</option>}
                    {genderInfo.genderRatio !== 'male_only' && <option value="female">♀ Female</option>}
                  </select>
                )}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-xs font-bold text-slate-300">Origin region / language
              <select aria-label="Origin region / language" value={originLanguage} onChange={e=>setOriginLanguage(e.target.value as PokemonLanguage)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100">
                {POKEMON_LANGUAGES.map(language=><option key={language.id} value={language.id}>{language.tag} · {language.label}</option>)}
              </select>
            </label>
            {/* Compact flags: keep all acquisition/storage constraints intact. */}
            <fieldset aria-label="PokéPet status and storage" className="grid grid-cols-3 gap-1.5">
              <RegistrationToggle label="Pokérus" title="Pokérus" checked={hasPokerus} onChange={setHasPokerus}><PokerusBadge />Pokérus</RegistrationToggle>
              <RegistrationToggle label="Shiny Pokepet" title="Shiny form" checked={isShiny} onChange={setIsShiny}><Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />Shiny</RegistrationToggle>
              <RegistrationToggle label="Received via Trade" title="Received via trade" checked={isTraded} disabled={isHomeGift} onChange={checked=>{setIsTraded(checked);if(checked)setIsHomeGift(false);}}><ArrowLeftRight className="w-3.5 h-3.5 text-sky-300 shrink-0" />Received via trade</RegistrationToggle>
              {isGiftEligible && <RegistrationToggle label="Gifted from Pokémon HOME" title="Gifted from Pokémon HOME" checked={isHomeGift} onChange={checked=>{setIsHomeGift(checked);if(checked){setIsTraded(false);setStoredInHome(true);}}}><Gift className="w-3.5 h-3.5 text-purple-300 shrink-0" />HOME gift</RegistrationToggle>}
              <RegistrationToggle label="Stored in Pokémon HOME" title="Stored in Pokémon HOME" checked={isHomeGift || storedInHome} disabled={isHomeGift || transferBlockInfo.isBlocked} onChange={checked=>{setStoredInHome(checked);if(!checked)setIsInLivingBox(false);}}><Box className="w-3.5 h-3.5 text-emerald-300 shrink-0" />Stored in HOME</RegistrationToggle>
              <RegistrationToggle label="Place in Living Dex Slot" title="Place in Living Dex" checked={isInLivingBox} disabled={!storedInHome || transferBlockInfo.isBlocked} onChange={setIsInLivingBox}><Box className="w-3.5 h-3.5 text-sky-300 shrink-0" />Living Box</RegistrationToggle>
            </fieldset>
            {transferBlockInfo.isBlocked ? <p className="text-[11px] text-rose-300" role="status"><Lock className="inline w-3 h-3 mr-1" />{transferBlockInfo.reason} · HOME and Living Box unavailable.</p>
              : !storedInHome ? <p className="text-[10px] text-slate-400">Stored in console; enable HOME storage to use a Living Dex slot.</p> : null}

            {/* Game Origin Selection */}
            {!isHomeGift && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Origin Game Caught In *</span>
                </label>
                {availableOriginGames.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {availableOriginGames.map((game) => {
                      const selected = targetGame === game.id;
                      return (
                        <button
                          key={game.id}
                          type="button"
                          aria-pressed={selected}
                          aria-label={`Origin game: ${game.title}`}
                          onClick={() => setTargetGame(game.id)}
                          className={`px-2.5 py-1.5 lg:py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                            selected
                              ? 'bg-amber-400/15 border-amber-400/60 text-amber-200'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-400/40 hover:text-slate-100'
                          }`}
                        >
                          {game.shortTitle}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    No owned games selected. Mark a game as owned in Settings or enable Received via Trade.
                  </p>
                )}
              </div>
            )}

            <fieldset className="pt-2 border-t border-slate-800 flex flex-col gap-2" aria-label="Poké Ball selection">
              <legend className="text-xs font-semibold text-slate-300">Poké Ball (Optional) · {POKEBALLS.find(ball=>ball.id===ballType)?.name || 'Not specified'}</legend>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" aria-label="No Poké Ball specified" aria-pressed={ballType===''} onClick={()=>setBallType('')} className={`h-8 px-2 rounded-lg border text-[10px] ${ballType===''?'border-amber-300 text-amber-200 bg-amber-400/10':'border-slate-700 text-slate-400 bg-slate-900'}`}>None</button>
                {POKEBALLS.map(ball=><button key={ball.id} type="button" aria-label={`Poké Ball: ${ball.name}`} title={ball.name} aria-pressed={ballType===ball.id} onClick={()=>setBallType(ball.id)} className={`w-8 h-8 rounded-lg border flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 ${ballType===ball.id?'border-amber-300 bg-amber-400/15 ring-1 ring-amber-300':'border-slate-700 bg-slate-900 hover:border-sky-300'}`}><PokeballIcon ballType={ball.id} /></button>)}
              </div>
            </fieldset>

          </div>
        </div>

        {/* Mobile Floating Save Bar */}
        <div className="lg:hidden fixed bottom-20 inset-x-3 z-30 flex items-center gap-2 p-2 rounded-2xl bg-[#0F1522]/95 backdrop-blur-md border border-slate-800 shadow-2xl">
          <button
            type="button"
            onClick={handleResetForm}
            disabled={isSubmitting}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 cursor-pointer transition-colors shrink-0"
            aria-label="Reset form"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-sm font-extrabold cursor-pointer transition-colors shadow-lg shadow-amber-500/25"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Poképet</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {registeredSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0F1522] border border-amber-500/70 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setRegisteredSuccess(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRegisteredSuccess(null)}
                className="flex-1 py-3 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
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
                  className="flex-1 py-3 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
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