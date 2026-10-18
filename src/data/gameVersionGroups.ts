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

/**
 * The Dynamax Crystal items are named after real stars using IAU constellation
 * abbreviations ("★And458" = star 458 in Andromeda). Those names are accurate but
 * unreadable, so each abbreviation is expanded to its constellation's name.
 * Source: IAU constellation abbreviations (88 constellations).
 */
export const CONSTELLATION_NAMES: Record<string, string> = {
  And: 'Andromeda', Ant: 'Antlia', Aps: 'Apus', Aqr: 'Aquarius', Aql: 'Aquila', Ara: 'Ara',
  Ari: 'Aries', Aur: 'Auriga', Boo: 'Boötes', Cae: 'Caelum', Cam: 'Camelopardalis', Cnc: 'Cancer',
  CVn: 'Canes Venatici', CMa: 'Canis Major', CMi: 'Canis Minor', Cap: 'Capricornus', Car: 'Carina',
  Cas: 'Cassiopeia', Cen: 'Centaurus', Cep: 'Cepheus', Cet: 'Cetus', Cha: 'Chamaeleon',
  Cir: 'Circinus', Col: 'Columba', Com: 'Coma Berenices', CrA: 'Corona Australis',
  CrB: 'Corona Borealis', Crv: 'Corvus', Crt: 'Crater', Cru: 'Crux', Cyg: 'Cygnus', Del: 'Delphinus',
  Dor: 'Dorado', Dra: 'Draco', Equ: 'Equuleus', Eri: 'Eridanus', For: 'Fornax', Gem: 'Gemini',
  Gru: 'Grus', Her: 'Hercules', Hor: 'Horologium', Hya: 'Hydra', Hyi: 'Hydrus', Ind: 'Indus',
  Lac: 'Lacerta', Leo: 'Leo', LMi: 'Leo Minor', Lep: 'Lepus', Lib: 'Libra', Lup: 'Lupus',
  Lyn: 'Lynx', Lyr: 'Lyra', Men: 'Mensa', Mic: 'Microscopium', Mon: 'Monoceros', Mus: 'Musca',
  Nor: 'Norma', Oct: 'Octans', Oph: 'Ophiuchus', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus',
  Per: 'Perseus', Phe: 'Phoenix', Pic: 'Pictor', Psc: 'Pisces', PsA: 'Piscis Austrinus',
  Pup: 'Puppis', Pyx: 'Pyxis', Ret: 'Reticulum', Sge: 'Sagitta', Sgr: 'Sagittarius',
  Sco: 'Scorpius', Scl: 'Sculptor', Sct: 'Scutum', Ser: 'Serpens', Sex: 'Sextans', Tau: 'Taurus',
  Tel: 'Telescopium', Tri: 'Triangulum', TrA: 'Triangulum Australe', Tuc: 'Tucana', UMa: 'Ursa Major',
  UMi: 'Ursa Minor', Vel: 'Vela', Vir: 'Virgo', Vol: 'Volans', Vul: 'Vulpecula',
};

/** "★And458" -> "Dynamax Crystal — Andromeda 458". Unknown names are returned unchanged. */
export function humanItemName(name: string, category: string): string {
  if (category !== 'dynamax-crystals') return name;
  const match = name.match(/^\u2605([A-Za-z]{2,3})\s*(\d*)$/);
  if (!match) return name;
  const constellation = CONSTELLATION_NAMES[match[1]];
  if (!constellation) return name;
  return `Dynamax Crystal — ${constellation}${match[2] ? ` ${match[2]}` : ''}`;
}
