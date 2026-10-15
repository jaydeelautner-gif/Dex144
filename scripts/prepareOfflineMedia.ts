import { writeFileSync } from 'node:fs';
import { buildInitialNationalDex } from '../src/data/pokemonData';
import { getVariationsForPokemon } from '../src/data/regionalVariantsData';
import { spriteSources } from '../src/utils/spriteSources';
const groups = new Map<string, { id: string; speciesId: number; candidates: string[] }>();
for (const pokemon of buildInitialNationalDex()) {
  for (const variant of getVariationsForPokemon(pokemon)) {
    for (const shiny of [false,true]) {
      const candidates = spriteSources(variant.spriteId, shiny, variant.imageUrl);
      const id = candidates[0];
      if (!groups.has(id)) groups.set(id,{id,speciesId:pokemon.id,candidates});
    }
  }
}
writeFileSync(new URL('../public/offline-media.json',import.meta.url),JSON.stringify({ schema:1, groups:[...groups.values()] }));
console.log(`Offline artwork catalog: ${groups.size} normal/shiny/form/gender image groups.`);
