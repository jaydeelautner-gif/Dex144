import assert from 'node:assert/strict';
import { POKEBALLS, sanitizePokeballId } from '../src/data/pokemonInventoryData';

assert.equal(new Set(POKEBALLS.map((ball) => ball.id)).size, POKEBALLS.length);
assert.equal(sanitizePokeballId('poke-ball'), 'poke-ball');
assert.equal(sanitizePokeballId('strange-ball'), 'strange-ball');
assert.equal(sanitizePokeballId(undefined), undefined);
assert.equal(sanitizePokeballId(null), undefined);
assert.equal(sanitizePokeballId('not-a-pokeball'), undefined);

console.log('Poké Ball tests passed: supported IDs are unique and invalid values are ignored.');
