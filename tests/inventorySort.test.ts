import assert from 'node:assert/strict';
import { sortInventory, type InventorySort } from '../src/utils/inventorySort';
import type { PokemonInstance } from '../src/data/pokemonInventoryData';

const items = [
  { pokeId: 'c', pokemonId: 25, level: 30, createdAt: 100, nickname: 'A nickname' },
  { pokeId: 'a', pokemonId: 1, level: 10, createdAt: 300 },
  { pokeId: 'b', pokemonId: 4, level: 20, createdAt: 200 },
] as PokemonInstance[];
const names = new Map([[25,'Pikachu'],[1,'Bulbasaur'],[4,'Charmander']]);
const expected: Record<InventorySort,string[]> = {
  name: ['a','b','c'], dex: ['a','b','c'],
  'registered-oldest': ['c','b','a'], 'registered-newest': ['a','b','c'],
  'level-low': ['a','b','c'], 'level-high': ['c','b','a'],
};
for (const [order, ids] of Object.entries(expected)) {
  assert.deepEqual(sortInventory(items,order as InventorySort,names).map(item=>item.pokeId),ids);
}
assert.deepEqual(items.map(item=>item.pokeId),['c','a','b'], 'stored order is unchanged');
assert.deepEqual(sortInventory([], 'name', names), []);
const duplicates = [{...items[0],pokeId:'z'},{...items[0],pokeId:'y'}];
assert.deepEqual(sortInventory(duplicates,'level-low',names).map(item=>item.pokeId),['y','z']);
console.log('Inventory sort tests passed: all six modes, species names, empty list, stable ties and no mutation.');
