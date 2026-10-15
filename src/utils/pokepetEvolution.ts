import { EVOLUTION_EDGES } from '../data/evolutionEdges.generated';
import { getVariationsForPokemon } from '../data/regionalVariantsData';
import { getPokemonGenderInfo } from '../data/pokemonGenderData';
import type { GameId, PokemonEntry } from '../data/pokemonData';
import type { PokemonInstance, EvolutionRecord } from '../data/pokemonInventoryData';

export type EvolutionChoice = { target: PokemonEntry; variantId: string; variantName: string; requirement: string };
export type EvolutionRequest = { pokeId: string; expectedSpeciesId: number; targetId: number; level: number; usedItem: boolean; itemName: string; gameId: GameId; returnedToHome: boolean; placement: 'inventory' | 'slot' | ''; homeMoveConfirmed: boolean };
// Regional species-specific branches. Unknown form changes are blocked, not silently reset.
const FORM_ROUTES: Record<string, number> = { '52:galar': 863, '83:galar': 865, '222:galar': 864, '264:galar': 862, '211:hisui': 904, '215:hisui': 903, '194:paldea': 980, '562:galar': 867 };
const BASE_ONLY_TARGETS = new Set(Object.values(FORM_ROUTES));
const words = (s: string) => s.replace(/-/g, ' ');
export function getPokepetEvolutionChoices(pet: PokemonInstance, dex: PokemonEntry[], gameId?: GameId): EvolutionChoice[] {
  if (pet.pokemonId === 808 && gameId && gameId !== 'pogo') return []; // Meltan evolves only in GO
  const suffix = pet.variantId.split(':').slice(1).join(':') || 'base';
  // Temporary battle transformations cannot be evolved as permanent forms.
  if (/mega|gmax|primal/.test(suffix)) return [];
  const route = FORM_ROUTES[`${pet.pokemonId}:${suffix}`];
  const genderId = pet.gender === 'female' ? 1 : pet.gender === 'male' ? 2 : null;
  return EVOLUTION_EDGES.filter(e => e.from === pet.pokemonId).flatMap(edge => {
    if (route && route !== edge.to) return [];
    if (!route && BASE_ONLY_TARGETS.has(edge.to)) return [];
    const conditions = edge.conditions.filter(c => c.gender == null || c.gender === genderId);
    if (edge.conditions.length && !conditions.length) return [];
    const target = dex.find(p => p.id === edge.to);
    if (!target) return [];
    const ratio = getPokemonGenderInfo(target.id).genderRatio;
    if ((ratio === 'male_only' && pet.gender !== 'male') || (ratio === 'female_only' && pet.gender !== 'female') || (ratio === 'genderless' && pet.gender !== 'genderless')) return [];
    const variants = getVariationsForPokemon(target);
    let targetSuffix = route ? 'base' : suffix === 'female' && !variants.some(v => v.variantId === `${target.id}:female`) ? 'base' : suffix;
    // Evolutions whose resulting form is determined by the game, not the source form.
    if (suffix === 'base' && gameId && ['sun','moon','ultrasun','ultramoon'].includes(gameId) && [26,103,105].includes(target.id)) targetSuffix = 'alola';
    if (suffix === 'base' && gameId === 'pla' && [157,503,724,549,628,705,706,713].includes(target.id)) targetSuffix = 'hisui';
    const variant = variants.find(v => v.variantId === `${target.id}:${targetSuffix}`);
    if (!variant) return []; // no applicable retained form: user must not lose it silently
    const detail = conditions.map(c => [words(c.trigger), c.level ? `level ${c.level}` : '', c.item ? `use ${words(c.item)}` : '', c.heldItem ? `hold ${words(c.heldItem)}` : '', c.time ?? '', c.move ? `know ${words(c.move)}` : '', c.happiness != null ? 'friendship' : '', c.location ? words(c.location) : ''].filter(Boolean).join(' · ')).join(' OR ');
    return [{ target, variantId: variant.variantId, variantName: variant.formName, requirement: detail || 'Special evolution; confirm the in-game requirements.' }];
  });
}

export function evolvePokepet(pet: PokemonInstance, request: EvolutionRequest, dex: PokemonEntry[], inventory: PokemonInstance[], now = Date.now()): PokemonInstance {
  if (pet.pokeId !== request.pokeId || pet.pokemonId !== request.expectedSpeciesId) throw Error('This PokéPet changed. Reopen evolution and try again.');
  const choice = getPokepetEvolutionChoices(pet, dex, request.gameId).find(c => c.target.id === request.targetId);
  if (!choice) throw Error('That is not an applicable next evolution for this PokéPet.');
  if (!Number.isInteger(request.level) || request.level < 1 || request.level > 100) throw Error('Enter a whole level from 1 to 100.');
  if (request.usedItem && !request.itemName.trim()) throw Error('Enter the item used.');
  if (pet.storedInHome && !request.homeMoveConfirmed) throw Error('Confirm that this PokéPet was moved out of HOME to evolve.');
  if (request.gameId === 'pogo' && (pet.storedInHome || (pet.currentGameId ?? pet.gameId) !== 'pogo')) throw Error('Pokémon cannot be moved from HOME or a console game into Pokémon GO.');
  const supported = choice.target.availability[request.gameId];
  if (!supported || supported.status === 'unavailable') throw Error('Select a game that supports the evolved species.');
  if (pet.isInLivingBox && !request.placement) throw Error('Choose what to do with the Living Dex placement.');
  const boxed = request.returnedToHome && request.placement === 'slot';
  if (boxed && inventory.some(p => p.pokeId !== pet.pokeId && p.pokemonId === choice.target.id && p.storedInHome && p.isInLivingBox)) throw Error('That species slot is occupied. Choose inventory instead; the occupant will not be replaced.');
  const event: EvolutionRecord = { previousGameId: pet.currentGameId ?? pet.gameId ?? request.gameId, fromSpeciesId: pet.pokemonId, toSpeciesId: choice.target.id, fromLevel: pet.level, toLevel: request.level, fromVariantId: pet.variantId, toVariantId: choice.variantId, gameId: request.gameId, usedItem: request.usedItem, itemName: request.usedItem ? request.itemName.trim().slice(0, 100) : '', evolvedAt: now };
  return { ...pet, pokemonId: choice.target.id, level: request.level, variantId: choice.variantId, variantName: choice.variantName, currentGameId: request.gameId, storedInHome: request.returnedToHome, isInLivingBox: boxed, livingBoxNumber: boxed ? choice.target.boxNumber : undefined, livingBoxSlot: boxed ? choice.target.boxSlot : undefined, evolutionHistory: [...(pet.evolutionHistory ?? []), event], updatedAt: now };
}

/** Reacquisition hint; no absence of rows is misrepresented as proof of absence. */
export function evolvedAwaySpecies(inventory: PokemonInstance[], gameId: string): number[] {
  const held = new Set(inventory.filter(p => (p.currentGameId ?? p.gameId) === gameId).map(p => p.pokemonId));
  return [...new Set(inventory.flatMap(p => (p.evolutionHistory ?? []).filter(e => e.gameId === gameId || e.previousGameId === gameId).map(e => e.fromSpeciesId)))].filter(id => !held.has(id));
}
