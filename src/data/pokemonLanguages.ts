/** Pokémon language-of-origin tags (not the game's geographic region). */
export const POKEMON_LANGUAGES = [
  {id:'en',label:'English',tag:'ENG'},
  {id:'ja',label:'Japanese',tag:'JPN'},
  {id:'fr',label:'French',tag:'FRE'},
  {id:'de',label:'German',tag:'GER'},
  {id:'it',label:'Italian',tag:'ITA'},
  {id:'es',label:'Spanish',tag:'SPA'},
  {id:'ko',label:'Korean',tag:'KOR'},
  {id:'zh-Hans',label:'Chinese (Simplified)',tag:'CHS'},
  {id:'zh-Hant',label:'Chinese (Traditional)',tag:'CHT'},
] as const;
export type PokemonLanguage = typeof POKEMON_LANGUAGES[number]['id'];
export function normalizePokemonLanguage(value:unknown):PokemonLanguage {
  return POKEMON_LANGUAGES.some(language=>language.id===value)?value as PokemonLanguage:'en';
}
