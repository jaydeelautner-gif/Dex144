import type { GameId } from './pokemonData';

/** PokéAPI version-group id for each canonical game (null when the game has no TMs/HMs). */
export const GAME_VERSION_GROUP: Record<string, string | null> = {
  red: 'red-blue', blue: 'red-blue', yellow: 'yellow',
  gold: 'gold-silver', silver: 'gold-silver', crystal: 'crystal',
  ruby: 'ruby-sapphire', sapphire: 'ruby-sapphire', emerald: 'emerald',
  firered: 'firered-leafgreen', leafgreen: 'firered-leafgreen',
  colo: 'colosseum', xd: 'xd',
  diamond: 'diamond-pearl', pearl: 'diamond-pearl', platinum: 'platinum',
  heartgold: 'heartgold-soulsilver', soulsilver: 'heartgold-soulsilver',
  black: 'black-white', white: 'black-white', black2: 'black-2-white-2', white2: 'black-2-white-2',
  x: 'x-y', y: 'x-y', omegaruby: 'omega-ruby-alpha-sapphire', alphasapphire: 'omega-ruby-alpha-sapphire',
  sun: 'sun-moon', moon: 'sun-moon', ultrasun: 'ultra-sun-ultra-moon', ultramoon: 'ultra-sun-ultra-moon',
  lgp: 'lets-go-pikachu-lets-go-eevee', lge: 'lets-go-pikachu-lets-go-eevee',
  sword: 'sword-shield', shield: 'sword-shield',
  bd: 'brilliant-diamond-shining-pearl', sp: 'brilliant-diamond-shining-pearl',
  scarlet: 'scarlet-violet', violet: 'scarlet-violet',
  // Legends: Arceus and Pokémon GO have no TM/HM machines.
  pla: null, pogo: null,
};
export function versionGroupFor(gameId: GameId): string | null {
  return GAME_VERSION_GROUP[gameId] ?? null;
}
export const VERSION_GROUP_LABEL: Record<string, string> = {
  'red-blue': 'Red / Blue', yellow: 'Yellow', 'gold-silver': 'Gold / Silver', crystal: 'Crystal',
  'ruby-sapphire': 'Ruby / Sapphire', emerald: 'Emerald', 'firered-leafgreen': 'FireRed / LeafGreen',
  colosseum: 'Colosseum', xd: 'XD: Gale of Darkness', 'diamond-pearl': 'Diamond / Pearl', platinum: 'Platinum',
  'heartgold-soulsilver': 'HeartGold / SoulSilver', 'black-white': 'Black / White', 'black-2-white-2': 'Black 2 / White 2',
  'x-y': 'X / Y', 'omega-ruby-alpha-sapphire': 'Omega Ruby / Alpha Sapphire', 'sun-moon': 'Sun / Moon',
  'ultra-sun-ultra-moon': 'Ultra Sun / Ultra Moon', 'lets-go-pikachu-lets-go-eevee': "Let's Go Pikachu / Eevee",
  'sword-shield': 'Sword / Shield', 'brilliant-diamond-shining-pearl': 'Brilliant Diamond / Shining Pearl',
  'scarlet-violet': 'Scarlet / Violet',
  // Extra version groups present in the machine data.
  'red-green-japan': 'Red / Green (Japan)', 'blue-japan': 'Blue (Japan)',
  'legends-za': 'Legends: Z-A', 'mega-dimension': 'Mega Dimension',
  'the-teal-mask': 'The Teal Mask', 'the-indigo-disk': 'The Indigo Disk',
};
