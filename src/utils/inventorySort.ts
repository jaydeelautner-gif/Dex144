import type { PokemonInstance } from '../data/pokemonInventoryData';

export const INVENTORY_SORT_OPTIONS = [
  { value: 'registered-newest', label: 'Registered: newest first' },
  { value: 'registered-oldest', label: 'Registered: first to last' },
  { value: 'name', label: 'Pokémon name: A–Z' },
  { value: 'dex', label: 'Pokédex number' },
  { value: 'level-low', label: 'Level: low to high' },
  { value: 'level-high', label: 'Level: high to low' },
] as const;
export type InventorySort = typeof INVENTORY_SORT_OPTIONS[number]['value'];

/** Sort a copy; never reorder stored inventory. Ties are deterministic. */
export function sortInventory(items: readonly PokemonInstance[], order: InventorySort, names: ReadonlyMap<number, string>): PokemonInstance[] {
  return [...items].sort((a, b) => {
    let comparison = 0;
    switch (order) {
      case 'name': comparison = (names.get(a.pokemonId) ?? '').localeCompare(names.get(b.pokemonId) ?? '', 'en', { sensitivity: 'base' }); break;
      case 'dex': comparison = a.pokemonId - b.pokemonId; break;
      case 'registered-oldest': comparison = a.createdAt - b.createdAt; break;
      case 'registered-newest': comparison = b.createdAt - a.createdAt; break;
      case 'level-low': comparison = a.level - b.level; break;
      case 'level-high': comparison = b.level - a.level; break;
    }
    return comparison || a.pokemonId - b.pokemonId || a.createdAt - b.createdAt || a.pokeId.localeCompare(b.pokeId);
  });
}
