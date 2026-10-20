import type { GameId, DlcId, PokemonEntry } from './pokemonData';
import { GAMES } from './pokemonData';
import { getPokemonGenderInfo } from './pokemonGenderData';
import { COLOR_VARIANTS } from './colorVariants.generated';

export interface VariantGameSource {
  gameId: GameId;
  gameShortTitle: string;
  requiresDlc: boolean;
  dlcId?: DlcId;
  dlcName?: string;
  method: string;
}

export interface RegionalVariation {
  variantId: string; // e.g. "37:base", "37:alola", "25:female", "6:gmax", "201:unown-b"
  pokemonId: number;
  formName: string;
  regionTag:
    | 'Original'
    | 'Alolan'
    | 'Galarian'
    | 'Hisuian'
    | 'Paldean'
    | 'Kitakami'
    | 'Mega Evolution'
    | 'Gigantamax'
    | 'Unown Form'
    | 'Colour Variant';
  types: string[];
  spriteId: number;
  imageUrl?: string;
  findInGames: VariantGameSource[];
}

export interface ExtraVariantSpec {
  suffix: string;
  formName: string;
  regionTag: RegionalVariation['regionTag'];
  types: string[];
  spriteId: number;
  imageUrl?: string;
  findInGames: VariantGameSource[];
}

const MEGA_GAMES_XY_ORAS_LGPE_POGO: VariantGameSource[] = [
  { gameId: 'xy', gameShortTitle: 'X / Y', requiresDlc: false, method: 'Mega Stone in Battle' },
  { gameId: 'oras', gameShortTitle: 'Omega Ruby / Alpha Sapphire', requiresDlc: false, method: 'Mega Bracelet & Mega Stone Encounter' },
  { gameId: 'lgpe', gameShortTitle: "Let's Go Pikachu / Eevee", requiresDlc: false, method: 'Key Stone & Mega Stone in Battle' },
  { gameId: 'pogo', gameShortTitle: 'Pokémon GO', requiresDlc: false, method: 'Mega Raids & Mega Energy Evolution' },
];

const MEGA_GAMES_ORAS_POGO: VariantGameSource[] = [
  { gameId: 'oras', gameShortTitle: 'Omega Ruby / Alpha Sapphire', requiresDlc: false, method: 'Mega Bracelet & Mega Stone in Hoenn' },
  { gameId: 'pogo', gameShortTitle: 'Pokémon GO', requiresDlc: false, method: 'Mega Raids & Mega Energy Evolution' },
];

const MEGA_GAMES_XY_ORAS_POGO: VariantGameSource[] = [
  { gameId: 'xy', gameShortTitle: 'X / Y', requiresDlc: false, method: 'Mega Stone in Battle' },
  { gameId: 'oras', gameShortTitle: 'Omega Ruby / Alpha Sapphire', requiresDlc: false, method: 'Mega Stone in Hoenn' },
  { gameId: 'pogo', gameShortTitle: 'Pokémon GO', requiresDlc: false, method: 'Mega Raids & Mega Energy Evolution' },
];

const GMAX_GAMES_SWSH_POGO: VariantGameSource[] = [
  { gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Max Raid Dens in Wild Area or Max Soup (Isle of Armor)' },
  { gameId: 'pogo', gameShortTitle: 'Pokémon GO', requiresDlc: false, method: 'Max Battles at Power Spots' },
];

const GMAX_GAMES_SWSH_ONLY: VariantGameSource[] = [
  { gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Wild Area Max Raid Battles or Max Soup (Isle of Armor)' },
];

function generateUnownForms(): ExtraVariantSpec[] {
  const letters = 'bcdefghijklmnopqrstuvwxyz'.split('');
  const unownGames: VariantGameSource[] = [
    { gameId: 'frlg', gameShortTitle: 'FireRed / LeafGreen', requiresDlc: false, method: 'Tanoby Chambers (Sevii Islands)' },
    { gameId: 'dppt', gameShortTitle: 'Diamond / Pearl / Platinum', requiresDlc: false, method: 'Solaceon Ruins Chambers' },
    { gameId: 'hgss', gameShortTitle: 'HeartGold / SoulSilver', requiresDlc: false, method: 'Ruins of Alph Chambers' },
    { gameId: 'oras', gameShortTitle: 'Omega Ruby / Alpha Sapphire', requiresDlc: false, method: 'Mirage Cave' },
    { gameId: 'bdsp', gameShortTitle: 'Brilliant Diamond / Shining Pearl', requiresDlc: false, method: 'Solaceon Ruins' },
    { gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Hisui 28 Unown Survey Hunt across Hisui' },
    { gameId: 'pogo', gameShortTitle: 'Pokémon GO', requiresDlc: false, method: 'Global Events & Special Raids' },
  ];

  const specs: ExtraVariantSpec[] = letters.map((letter) => ({
    suffix: `unown-${letter}`,
    formName: `Unown [${letter.toUpperCase()}]`,
    regionTag: 'Unown Form',
    types: ['Psychic'],
    spriteId: 201,
    imageUrl: `/sprites/showdown/dex/unown-${letter}.png`,
    findInGames: unownGames,
  }));

  specs.push({
    suffix: 'unown-exclamation',
    formName: 'Unown [!]',
    regionTag: 'Unown Form',
    types: ['Psychic'],
    spriteId: 201,
    imageUrl: '/sprites/showdown/dex/unown-exclamation.png',
    findInGames: unownGames,
  });

  specs.push({
    suffix: 'unown-question',
    formName: 'Unown [?]',
    regionTag: 'Unown Form',
    types: ['Psychic'],
    spriteId: 201,
    imageUrl: '/sprites/showdown/dex/unown-question.png',
    findInGames: unownGames,
  });

  return specs;
}

export const REGIONAL_FORM_SPECS: Record<number, ExtraVariantSpec[]> = {
  // Megas & G-Max
  3: [
    { suffix: 'mega', formName: 'Mega Venusaur', regionTag: 'Mega Evolution', types: ['Grass', 'Poison'], spriteId: 10133, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
    { suffix: 'gmax', formName: 'Gigantamax Venusaur', regionTag: 'Gigantamax', types: ['Grass', 'Poison'], spriteId: 10364, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  6: [
    { suffix: 'mega-x', formName: 'Mega Charizard X', regionTag: 'Mega Evolution', types: ['Fire', 'Dragon'], spriteId: 10134, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
    { suffix: 'mega-y', formName: 'Mega Charizard Y', regionTag: 'Mega Evolution', types: ['Fire', 'Flying'], spriteId: 10135, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
    { suffix: 'gmax', formName: 'Gigantamax Charizard', regionTag: 'Gigantamax', types: ['Fire', 'Flying'], spriteId: 10365, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  9: [
    { suffix: 'mega', formName: 'Mega Blastoise', regionTag: 'Mega Evolution', types: ['Water'], spriteId: 10136, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
    { suffix: 'gmax', formName: 'Gigantamax Blastoise', regionTag: 'Gigantamax', types: ['Water'], spriteId: 10366, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  12: [
    { suffix: 'gmax', formName: 'Gigantamax Butterfree', regionTag: 'Gigantamax', types: ['Bug', 'Flying'], spriteId: 10367, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  15: [
    { suffix: 'mega', formName: 'Mega Beedrill', regionTag: 'Mega Evolution', types: ['Bug', 'Poison'], spriteId: 10192, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
  ],
  18: [
    { suffix: 'mega', formName: 'Mega Pidgeot', regionTag: 'Mega Evolution', types: ['Normal', 'Flying'], spriteId: 10175, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
  ],
  19: [
    {
      suffix: 'alola',
      formName: 'Alolan Rattata',
      regionTag: 'Alolan',
      types: ['Dark', 'Normal'],
      spriteId: 10193,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Nighttime Wild Catch across Alola' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Nighttime Wild Catch across Alola' },
        { gameId: 'lgpe', gameShortTitle: "Let's Go Pikachu / Eevee", requiresDlc: false, method: 'In-game NPC Trade in Cerulean City' },
      ],
    },
  ],
  20: [
    {
      suffix: 'alola',
      formName: 'Alolan Raticate',
      regionTag: 'Alolan',
      types: ['Dark', 'Normal'],
      spriteId: 10194,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Evolve Alolan Rattata (Lv. 20 at Night)' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Evolve Alolan Rattata (Lv. 20 at Night)' },
        { gameId: 'lgpe', gameShortTitle: "Let's Go Pikachu / Eevee", requiresDlc: false, method: 'Evolve Alolan Rattata' },
      ],
    },
  ],
  25: [
    { suffix: 'gmax', formName: 'Gigantamax Pikachu', regionTag: 'Gigantamax', types: ['Electric'], spriteId: 10368, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  26: [
    {
      suffix: 'alola',
      formName: 'Alolan Raichu',
      regionTag: 'Alolan',
      types: ['Electric', 'Psychic'],
      spriteId: 10202,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Use Thunder Stone on Pikachu in Alola' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Use Thunder Stone on Pikachu in Alola' },
        { gameId: 'lgpe', gameShortTitle: "Let's Go Pikachu / Eevee", requiresDlc: false, method: 'In-game NPC Trade in Saffron City' },
        { gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: true, dlcId: 'swsh-isle-of-armor', dlcName: 'Isle of Armor DLC', method: 'Alolan Diglett Hiker Reward' },
        { gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: false, method: 'Special Event Outbreak / HOME Transfer' },
      ],
    },
  ],
  27: [
    {
      suffix: 'alola',
      formName: 'Alolan Sandshrew',
      regionTag: 'Alolan',
      types: ['Ice', 'Steel'],
      spriteId: 10203,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Mount Lanakila (Moon Exclusive)' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Mount Lanakila (Ultra Moon Exclusive)' },
        { gameId: 'lgpe', gameShortTitle: "Let's Go Pikachu / Eevee", requiresDlc: false, method: 'In-game NPC Trade in Celadon City' },
        { gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: true, dlcId: 'sv-indigo-disk', dlcName: 'The Indigo Disk DLC', method: 'Polar Biome Wild Spawn (Violet Exclusive)' },
      ],
    },
  ],
  28: [
    {
      suffix: 'alola',
      formName: 'Alolan Sandslash',
      regionTag: 'Alolan',
      types: ['Ice', 'Steel'],
      spriteId: 10204,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Use Ice Stone on Alolan Sandshrew' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Use Ice Stone on Alolan Sandshrew' },
        { gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: true, dlcId: 'sv-indigo-disk', dlcName: 'The Indigo Disk DLC', method: 'Use Ice Stone on Alolan Sandshrew' },
      ],
    },
  ],
  37: [
    {
      suffix: 'alola',
      formName: 'Alolan Vulpix',
      regionTag: 'Alolan',
      types: ['Ice'],
      spriteId: 10205,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Mount Lanakila (Sun Exclusive)' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Mount Lanakila (Ultra Sun Exclusive)' },
        { gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Request 83: Snow-White Vulpix in Alabaster Icelands' },
        { gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: true, dlcId: 'sv-indigo-disk', dlcName: 'The Indigo Disk DLC', method: 'Polar Biome Wild Spawn (Scarlet Exclusive)' },
      ],
    },
  ],
  38: [
    {
      suffix: 'alola',
      formName: 'Alolan Ninetales',
      regionTag: 'Alolan',
      types: ['Ice', 'Fairy'],
      spriteId: 10206,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Use Ice Stone on Alolan Vulpix' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Use Ice Stone on Alolan Vulpix' },
        { gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: true, dlcId: 'sv-indigo-disk', dlcName: 'The Indigo Disk DLC', method: 'Use Ice Stone on Alolan Vulpix' },
      ],
    },
  ],
  50: [
    { suffix: 'alola', formName: 'Alolan Diglett', regionTag: 'Alolan', types: ['Ground', 'Steel'], spriteId: 10207, findInGames: [{ gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Verdant Cavern & Diglett Tunnel' }] },
  ],
  51: [
    { suffix: 'alola', formName: 'Alolan Dugtrio', regionTag: 'Alolan', types: ['Ground', 'Steel'], spriteId: 10208, findInGames: [{ gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Vast Poni Canyon & Haina Desert' }] },
  ],
  52: [
    { suffix: 'alola', formName: 'Alolan Meowth', regionTag: 'Alolan', types: ['Dark'], spriteId: 10209, findInGames: [{ gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Trainer School & Hau oli City' }] },
    { suffix: 'galar', formName: 'Galarian Meowth', regionTag: 'Galarian', types: ['Steel'], spriteId: 10320, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Route 4 Wild Catch' }] },
    { suffix: 'gmax', formName: 'Gigantamax Meowth', regionTag: 'Gigantamax', types: ['Normal'], spriteId: 10369, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  53: [
    { suffix: 'alola', formName: 'Alolan Persian', regionTag: 'Alolan', types: ['Dark'], spriteId: 10210, findInGames: [{ gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'High Friendship Evolution' }] },
  ],
  58: [
    { suffix: 'hisui', formName: 'Hisuian Growlithe', regionTag: 'Hisuian', types: ['Fire', 'Rock'], spriteId: 10398, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Windbreak Stand & Veilstone Cape' }] },
  ],
  59: [
    { suffix: 'hisui', formName: 'Hisuian Arcanine', regionTag: 'Hisuian', types: ['Fire', 'Rock'], spriteId: 10399, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Use Fire Stone on Hisuian Growlithe' }] },
  ],
  65: [
    { suffix: 'mega', formName: 'Mega Alakazam', regionTag: 'Mega Evolution', types: ['Psychic'], spriteId: 10137, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
  ],
  68: [
    { suffix: 'gmax', formName: 'Gigantamax Machamp', regionTag: 'Gigantamax', types: ['Fighting'], spriteId: 10370, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  74: [
    { suffix: 'alola', formName: 'Alolan Geodude', regionTag: 'Alolan', types: ['Rock', 'Electric'], spriteId: 10211, findInGames: [{ gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Route 12 & Blush Mountain' }] },
  ],
  75: [
    { suffix: 'alola', formName: 'Alolan Graveler', regionTag: 'Alolan', types: ['Rock', 'Electric'], spriteId: 10212, findInGames: [{ gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Blush Mountain' }] },
  ],
  76: [
    { suffix: 'alola', formName: 'Alolan Golem', regionTag: 'Alolan', types: ['Rock', 'Electric'], spriteId: 10213, findInGames: [{ gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Trade Alolan Graveler' }] },
  ],
  77: [
    { suffix: 'galar', formName: 'Galarian Ponyta', regionTag: 'Galarian', types: ['Psychic'], spriteId: 10321, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Shield Exclusive: Glimwood Tangle' }] },
  ],
  78: [
    { suffix: 'galar', formName: 'Galarian Rapidash', regionTag: 'Galarian', types: ['Psychic', 'Fairy'], spriteId: 10322, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Shield Exclusive: Evolve Galarian Ponyta' }] },
  ],
  79: [
    { suffix: 'galar', formName: 'Galarian Slowpoke', regionTag: 'Galarian', types: ['Psychic'], spriteId: 10323, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Wedgehurst Station & Isle of Armor' }] },
  ],
  80: [
    { suffix: 'mega', formName: 'Mega Slowbro', regionTag: 'Mega Evolution', types: ['Water', 'Psychic'], spriteId: 10173, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
    { suffix: 'galar', formName: 'Galarian Slowbro', regionTag: 'Galarian', types: ['Poison', 'Psychic'], spriteId: 10324, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: true, dlcId: 'swsh-isle-of-armor', dlcName: 'Isle of Armor DLC', method: 'Use Galarica Cuff on Galarian Slowpoke' }] },
  ],
  83: [
    { suffix: 'galar', formName: "Galarian Farfetch'd", regionTag: 'Galarian', types: ['Fighting'], spriteId: 10325, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Sword Exclusive: Route 5' }] },
  ],
  88: [
    {
      suffix: 'alola',
      formName: 'Alolan Grimer',
      regionTag: 'Alolan',
      types: ['Poison', 'Dark'],
      spriteId: 10214,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Hau oli City, Route 1 & Malie City' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Hau oli City & Malie City' },
        { gameId: 'lgpe', gameShortTitle: "Let's Go Pikachu / Eevee", requiresDlc: false, method: 'In-game NPC Trade in Cinnabar Island' },
        { gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: true, dlcId: 'sv-indigo-disk', dlcName: 'The Indigo Disk DLC', method: 'Coastal Biome Terarium (Indigo Disk)' },
      ],
    },
  ],
  89: [
    {
      suffix: 'alola',
      formName: 'Alolan Muk',
      regionTag: 'Alolan',
      types: ['Poison', 'Dark'],
      spriteId: 10215,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Evolve Alolan Grimer (Lv. 38)' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Evolve Alolan Grimer (Lv. 38)' },
        { gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: true, dlcId: 'sv-indigo-disk', dlcName: 'The Indigo Disk DLC', method: 'Evolve Alolan Grimer (Indigo Disk)' },
      ],
    },
  ],
  94: [
    { suffix: 'mega', formName: 'Mega Gengar', regionTag: 'Mega Evolution', types: ['Ghost', 'Poison'], spriteId: 10138, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
    { suffix: 'gmax', formName: 'Gigantamax Gengar', regionTag: 'Gigantamax', types: ['Ghost', 'Poison'], spriteId: 10371, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  99: [
    { suffix: 'gmax', formName: 'Gigantamax Kingler', regionTag: 'Gigantamax', types: ['Water'], spriteId: 10372, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  100: [
    { suffix: 'hisui', formName: 'Hisuian Voltorb', regionTag: 'Hisuian', types: ['Electric', 'Grass'], spriteId: 10400, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Coronet Highlands Sacred Plaza' }] },
  ],
  101: [
    { suffix: 'hisui', formName: 'Hisuian Electrode', regionTag: 'Hisuian', types: ['Electric', 'Grass'], spriteId: 10401, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Use Leaf Stone on Hisuian Voltorb' }] },
  ],
  103: [
    {
      suffix: 'alola',
      formName: 'Alolan Exeggutor',
      regionTag: 'Alolan',
      types: ['Grass', 'Dragon'],
      spriteId: 10216,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Exeggutor Island & Use Leaf Stone in Alola' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Exeggutor Island & Use Leaf Stone in Alola' },
        { gameId: 'lgpe', gameShortTitle: "Let's Go Pikachu / Eevee", requiresDlc: false, method: 'In-game NPC Trade in Cinnabar Island' },
        { gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: true, dlcId: 'swsh-isle-of-armor', dlcName: 'Isle of Armor DLC', method: 'Isle of Armor Beaches & Diglett Reward' },
        { gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: true, dlcId: 'sv-indigo-disk', dlcName: 'The Indigo Disk DLC', method: 'Coastal Biome Wild Catch (Indigo Disk)' },
      ],
    },
  ],
  105: [
    {
      suffix: 'alola',
      formName: 'Alolan Marowak',
      regionTag: 'Alolan',
      types: ['Fire', 'Ghost'],
      spriteId: 10217,
      findInGames: [
        { gameId: 'sm', gameShortTitle: 'Sun / Moon', requiresDlc: false, method: 'Evolve Cubone (Lv. 28 at Night in Alola)' },
        { gameId: 'usum', gameShortTitle: 'Ultra Sun / Ultra Moon', requiresDlc: false, method: 'Wela Volcano Park / Evolve Cubone at Night' },
        { gameId: 'lgpe', gameShortTitle: "Let's Go Pikachu / Eevee", requiresDlc: false, method: 'In-game NPC Trade in Fuchsia City' },
        { gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: true, dlcId: 'swsh-isle-of-armor', dlcName: 'Isle of Armor DLC', method: 'Alolan Diglett Reward (50 Diglett)' },
      ],
    },
  ],
  110: [
    { suffix: 'galar', formName: 'Galarian Weezing', regionTag: 'Galarian', types: ['Poison', 'Fairy'], spriteId: 10326, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Slumbering Weald & Evolve Koffing' }] },
  ],
  115: [
    { suffix: 'mega', formName: 'Mega Kangaskhan', regionTag: 'Mega Evolution', types: ['Normal'], spriteId: 10139, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
  ],
  122: [
    { suffix: 'galar', formName: 'Galarian Mr. Mime', regionTag: 'Galarian', types: ['Ice', 'Psychic'], spriteId: 10327, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Route 10 & Lake of Outrage' }] },
  ],
  127: [
    { suffix: 'mega', formName: 'Mega Pinsir', regionTag: 'Mega Evolution', types: ['Bug', 'Flying'], spriteId: 10140, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
  ],
  128: [
    { suffix: 'paldea-combat', formName: 'Paldean Tauros (Combat Breed)', regionTag: 'Paldean', types: ['Fighting'], spriteId: 10250, findInGames: [{ gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: false, method: 'East & West Provinces Wild Herds' }] },
    { suffix: 'paldea-blaze', formName: 'Paldean Tauros (Blaze Breed)', regionTag: 'Paldean', types: ['Fighting', 'Fire'], spriteId: 10251, findInGames: [{ gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: false, method: 'Scarlet Exclusive: Rare Herd Leader' }] },
    { suffix: 'paldea-aqua', formName: 'Paldean Tauros (Aqua Breed)', regionTag: 'Paldean', types: ['Fighting', 'Water'], spriteId: 10252, findInGames: [{ gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: false, method: 'Violet Exclusive: Rare Herd Leader' }] },
  ],
  130: [
    { suffix: 'mega', formName: 'Mega Gyarados', regionTag: 'Mega Evolution', types: ['Water', 'Dark'], spriteId: 10141, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
  ],
  131: [
    { suffix: 'gmax', formName: 'Gigantamax Lapras', regionTag: 'Gigantamax', types: ['Water', 'Ice'], spriteId: 10373, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  133: [
    { suffix: 'gmax', formName: 'Gigantamax Eevee', regionTag: 'Gigantamax', types: ['Normal'], spriteId: 10374, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  142: [
    { suffix: 'mega', formName: 'Mega Aerodactyl', regionTag: 'Mega Evolution', types: ['Rock', 'Flying'], spriteId: 10142, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
  ],
  143: [
    { suffix: 'gmax', formName: 'Gigantamax Snorlax', regionTag: 'Gigantamax', types: ['Normal'], spriteId: 10375, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  144: [
    { suffix: 'galar', formName: 'Galarian Articuno', regionTag: 'Galarian', types: ['Psychic', 'Flying'], spriteId: 10328, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: true, dlcId: 'swsh-crown-tundra', dlcName: 'Crown Tundra DLC', method: 'Crown Tundra Dyna Tree & Roaming' }] },
  ],
  145: [
    { suffix: 'galar', formName: 'Galarian Zapdos', regionTag: 'Galarian', types: ['Fighting', 'Flying'], spriteId: 10329, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: true, dlcId: 'swsh-crown-tundra', dlcName: 'Crown Tundra DLC', method: 'Wild Area Roaming Encounter' }] },
  ],
  146: [
    { suffix: 'galar', formName: 'Galarian Moltres', regionTag: 'Galarian', types: ['Dark', 'Flying'], spriteId: 10330, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: true, dlcId: 'swsh-crown-tundra', dlcName: 'Crown Tundra DLC', method: 'Isle of Armor Roaming Encounter' }] },
  ],
  150: [
    { suffix: 'mega-x', formName: 'Mega Mewtwo X', regionTag: 'Mega Evolution', types: ['Psychic', 'Fighting'], spriteId: 10143, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
    { suffix: 'mega-y', formName: 'Mega Mewtwo Y', regionTag: 'Mega Evolution', types: ['Psychic'], spriteId: 10144, findInGames: MEGA_GAMES_XY_ORAS_LGPE_POGO },
  ],
  157: [
    { suffix: 'hisui', formName: 'Hisuian Typhlosion', regionTag: 'Hisuian', types: ['Fire', 'Ghost'], spriteId: 10402, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Evolve Quilava (Lv. 36 in Hisui)' }] },
  ],
  181: [
    { suffix: 'mega', formName: 'Mega Ampharos', regionTag: 'Mega Evolution', types: ['Electric', 'Dragon'], spriteId: 10145, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  194: [
    { suffix: 'paldea', formName: 'Paldean Wooper', regionTag: 'Paldean', types: ['Poison', 'Ground'], spriteId: 10422, findInGames: [{ gameId: 'sv', gameShortTitle: 'Scarlet / Violet', requiresDlc: false, method: 'South Province Area One' }] },
  ],
  199: [
    { suffix: 'galar', formName: 'Galarian Slowking', regionTag: 'Galarian', types: ['Poison', 'Psychic'], spriteId: 10331, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: true, dlcId: 'swsh-crown-tundra', dlcName: 'Crown Tundra DLC', method: 'Use Galarica Wreath in Crown Tundra' }] },
  ],
  201: generateUnownForms(),
  208: [
    { suffix: 'mega', formName: 'Mega Steelix', regionTag: 'Mega Evolution', types: ['Steel', 'Ground'], spriteId: 10174, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  211: [
    { suffix: 'hisui', formName: 'Hisuian Qwilfish', regionTag: 'Hisuian', types: ['Dark', 'Poison'], spriteId: 10403, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Cobalt Coastlands Waters' }] },
  ],
  212: [
    { suffix: 'mega', formName: 'Mega Scizor', regionTag: 'Mega Evolution', types: ['Bug', 'Steel'], spriteId: 10146, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  214: [
    { suffix: 'mega', formName: 'Mega Heracross', regionTag: 'Mega Evolution', types: ['Bug', 'Fighting'], spriteId: 10147, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  215: [
    { suffix: 'hisui', formName: 'Hisuian Sneasel', regionTag: 'Hisuian', types: ['Fighting', 'Poison'], spriteId: 10404, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Celestica Trail (Coronet Highlands)' }] },
  ],
  222: [
    { suffix: 'galar', formName: 'Galarian Corsola', regionTag: 'Galarian', types: ['Ghost'], spriteId: 10332, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Shield Exclusive: Giant s Mirror' }] },
  ],
  229: [
    { suffix: 'mega', formName: 'Mega Houndoom', regionTag: 'Mega Evolution', types: ['Dark', 'Fire'], spriteId: 10148, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  248: [
    { suffix: 'mega', formName: 'Mega Tyranitar', regionTag: 'Mega Evolution', types: ['Rock', 'Dark'], spriteId: 10149, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  254: [
    { suffix: 'mega', formName: 'Mega Sceptile', regionTag: 'Mega Evolution', types: ['Grass', 'Dragon'], spriteId: 10167, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  257: [
    { suffix: 'mega', formName: 'Mega Blaziken', regionTag: 'Mega Evolution', types: ['Fire', 'Fighting'], spriteId: 10150, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  260: [
    { suffix: 'mega', formName: 'Mega Swampert', regionTag: 'Mega Evolution', types: ['Water', 'Ground'], spriteId: 10166, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  263: [
    { suffix: 'galar', formName: 'Galarian Zigzagoon', regionTag: 'Galarian', types: ['Dark', 'Normal'], spriteId: 10333, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Route 2 & Route 3' }] },
  ],
  264: [
    { suffix: 'galar', formName: 'Galarian Linoone', regionTag: 'Galarian', types: ['Dark', 'Normal'], spriteId: 10334, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Bridge Field & Giant s Cap' }] },
  ],
  282: [
    { suffix: 'mega', formName: 'Mega Gardevoir', regionTag: 'Mega Evolution', types: ['Psychic', 'Fairy'], spriteId: 10151, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  302: [
    { suffix: 'mega', formName: 'Mega Sableye', regionTag: 'Mega Evolution', types: ['Dark', 'Ghost'], spriteId: 10168, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  303: [
    { suffix: 'mega', formName: 'Mega Mawile', regionTag: 'Mega Evolution', types: ['Steel', 'Fairy'], spriteId: 10152, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  306: [
    { suffix: 'mega', formName: 'Mega Aggron', regionTag: 'Mega Evolution', types: ['Steel'], spriteId: 10153, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  308: [
    { suffix: 'mega', formName: 'Mega Medicham', regionTag: 'Mega Evolution', types: ['Fighting', 'Psychic'], spriteId: 10154, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  310: [
    { suffix: 'mega', formName: 'Mega Manectric', regionTag: 'Mega Evolution', types: ['Electric'], spriteId: 10155, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  319: [
    { suffix: 'mega', formName: 'Mega Sharpedo', regionTag: 'Mega Evolution', types: ['Water', 'Dark'], spriteId: 10172, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  323: [
    { suffix: 'mega', formName: 'Mega Camerupt', regionTag: 'Mega Evolution', types: ['Fire', 'Ground'], spriteId: 10189, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  334: [
    { suffix: 'mega', formName: 'Mega Altaria', regionTag: 'Mega Evolution', types: ['Dragon', 'Fairy'], spriteId: 10169, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  354: [
    { suffix: 'mega', formName: 'Mega Banette', regionTag: 'Mega Evolution', types: ['Ghost'], spriteId: 10156, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  359: [
    { suffix: 'mega', formName: 'Mega Absol', regionTag: 'Mega Evolution', types: ['Dark'], spriteId: 10157, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  362: [
    { suffix: 'mega', formName: 'Mega Glalie', regionTag: 'Mega Evolution', types: ['Ice'], spriteId: 10176, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  373: [
    { suffix: 'mega', formName: 'Mega Salamence', regionTag: 'Mega Evolution', types: ['Dragon', 'Flying'], spriteId: 10191, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  376: [
    { suffix: 'mega', formName: 'Mega Metagross', regionTag: 'Mega Evolution', types: ['Steel', 'Psychic'], spriteId: 10178, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  380: [
    { suffix: 'mega', formName: 'Mega Latias', regionTag: 'Mega Evolution', types: ['Dragon', 'Psychic'], spriteId: 10164, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  381: [
    { suffix: 'mega', formName: 'Mega Latios', regionTag: 'Mega Evolution', types: ['Dragon', 'Psychic'], spriteId: 10165, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  382: [
    { suffix: 'primal', formName: 'Primal Kyogre', regionTag: 'Mega Evolution', types: ['Water'], spriteId: 10179, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  383: [
    { suffix: 'primal', formName: 'Primal Groudon', regionTag: 'Mega Evolution', types: ['Ground', 'Fire'], spriteId: 10180, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  384: [
    { suffix: 'mega', formName: 'Mega Rayquaza', regionTag: 'Mega Evolution', types: ['Dragon', 'Flying'], spriteId: 10181, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  428: [
    { suffix: 'mega', formName: 'Mega Lopunny', regionTag: 'Mega Evolution', types: ['Normal', 'Fighting'], spriteId: 10190, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  445: [
    { suffix: 'mega', formName: 'Mega Garchomp', regionTag: 'Mega Evolution', types: ['Dragon', 'Ground'], spriteId: 10158, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  448: [
    { suffix: 'mega', formName: 'Mega Lucario', regionTag: 'Mega Evolution', types: ['Fighting', 'Steel'], spriteId: 10159, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  460: [
    { suffix: 'mega', formName: 'Mega Abomasnow', regionTag: 'Mega Evolution', types: ['Grass', 'Ice'], spriteId: 10160, findInGames: MEGA_GAMES_XY_ORAS_POGO },
  ],
  475: [
    { suffix: 'mega', formName: 'Mega Gallade', regionTag: 'Mega Evolution', types: ['Psychic', 'Fighting'], spriteId: 10170, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  503: [
    { suffix: 'hisui', formName: 'Hisuian Samurott', regionTag: 'Hisuian', types: ['Water', 'Dark'], spriteId: 10405, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Evolve Dewott in Hisui' }] },
  ],
  531: [
    { suffix: 'mega', formName: 'Mega Audino', regionTag: 'Mega Evolution', types: ['Normal', 'Fairy'], spriteId: 10171, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  549: [
    { suffix: 'hisui', formName: 'Hisuian Lilligant', regionTag: 'Hisuian', types: ['Grass', 'Fighting'], spriteId: 10406, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Use Sun Stone on Petilil in Hisui' }] },
  ],
  550: [
    { suffix: 'white-striped', formName: 'White-Striped Basculin', regionTag: 'Hisuian', types: ['Water'], spriteId: 10416, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Cobalt Coastlands & Coronet Highlands' }] },
  ],
  554: [
    { suffix: 'galar', formName: 'Galarian Darumaka', regionTag: 'Galarian', types: ['Ice'], spriteId: 10335, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Sword Exclusive: Route 8 & 10' }] },
  ],
  555: [
    { suffix: 'galar', formName: 'Galarian Darmanitan', regionTag: 'Galarian', types: ['Ice'], spriteId: 10178, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Sword Exclusive: Use Ice Stone' }] },
  ],
  562: [
    { suffix: 'galar', formName: 'Galarian Yamask', regionTag: 'Galarian', types: ['Ground', 'Ghost'], spriteId: 10338, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Route 6 Wild Catch' }] },
  ],
  569: [
    { suffix: 'gmax', formName: 'Gigantamax Garbodor', regionTag: 'Gigantamax', types: ['Poison'], spriteId: 10376, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  570: [
    { suffix: 'hisui', formName: 'Hisuian Zorua', regionTag: 'Hisuian', types: ['Normal', 'Ghost'], spriteId: 10407, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Bonechill Wastes Ice Cavern' }] },
  ],
  571: [
    { suffix: 'hisui', formName: 'Hisuian Zoroark', regionTag: 'Hisuian', types: ['Normal', 'Ghost'], spriteId: 10408, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Evolve Hisuian Zorua (Lv. 30 in Hisui)' }] },
  ],
  618: [
    { suffix: 'galar', formName: 'Galarian Stunfisk', regionTag: 'Galarian', types: ['Ground', 'Steel'], spriteId: 10339, findInGames: [{ gameId: 'swsh', gameShortTitle: 'Sword / Shield', requiresDlc: false, method: 'Galar Mine No. 2 & Route 8' }] },
  ],
  628: [
    { suffix: 'hisui', formName: 'Hisuian Braviary', regionTag: 'Hisuian', types: ['Psychic', 'Flying'], spriteId: 10409, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Evolve Rufflet (Lv. 54 in Hisui)' }] },
  ],
  705: [
    { suffix: 'hisui', formName: 'Hisuian Sliggoo', regionTag: 'Hisuian', types: ['Steel', 'Dragon'], spriteId: 10410, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Evolve Goomy in Hisui' }] },
  ],
  706: [
    { suffix: 'hisui', formName: 'Hisuian Goodra', regionTag: 'Hisuian', types: ['Steel', 'Dragon'], spriteId: 10411, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Evolve Hisuian Sliggoo in Rain' }] },
  ],
  713: [
    { suffix: 'hisui', formName: 'Hisuian Avalugg', regionTag: 'Hisuian', types: ['Ice', 'Rock'], spriteId: 10412, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Evolve Bergmite in Hisui' }] },
  ],
  719: [
    { suffix: 'mega', formName: 'Mega Diancie', regionTag: 'Mega Evolution', types: ['Rock', 'Fairy'], spriteId: 10177, findInGames: MEGA_GAMES_ORAS_POGO },
  ],
  724: [
    { suffix: 'hisui', formName: 'Hisuian Decidueye', regionTag: 'Hisuian', types: ['Grass', 'Fighting'], spriteId: 10413, findInGames: [{ gameId: 'pla', gameShortTitle: 'Legends: Arceus', requiresDlc: false, method: 'Evolve Dartrix in Hisui' }] },
  ],
  809: [
    { suffix: 'gmax', formName: 'Gigantamax Melmetal', regionTag: 'Gigantamax', types: ['Steel'], spriteId: 10377, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  812: [
    { suffix: 'gmax', formName: 'Gigantamax Rillaboom', regionTag: 'Gigantamax', types: ['Grass'], spriteId: 10378, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  815: [
    { suffix: 'gmax', formName: 'Gigantamax Cinderace', regionTag: 'Gigantamax', types: ['Fire'], spriteId: 10379, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  818: [
    { suffix: 'gmax', formName: 'Gigantamax Inteleon', regionTag: 'Gigantamax', types: ['Water'], spriteId: 10380, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  823: [
    { suffix: 'gmax', formName: 'Gigantamax Corviknight', regionTag: 'Gigantamax', types: ['Flying', 'Steel'], spriteId: 10381, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  826: [
    { suffix: 'gmax', formName: 'Gigantamax Orbeetle', regionTag: 'Gigantamax', types: ['Bug', 'Psychic'], spriteId: 10382, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  834: [
    { suffix: 'gmax', formName: 'Gigantamax Drednaw', regionTag: 'Gigantamax', types: ['Water', 'Rock'], spriteId: 10383, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  839: [
    { suffix: 'gmax', formName: 'Gigantamax Coalossal', regionTag: 'Gigantamax', types: ['Rock', 'Fire'], spriteId: 10384, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  841: [
    { suffix: 'gmax', formName: 'Gigantamax Flapple', regionTag: 'Gigantamax', types: ['Grass', 'Dragon'], spriteId: 10385, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  842: [
    { suffix: 'gmax', formName: 'Gigantamax Appletun', regionTag: 'Gigantamax', types: ['Grass', 'Dragon'], spriteId: 10386, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  844: [
    { suffix: 'gmax', formName: 'Gigantamax Sandaconda', regionTag: 'Gigantamax', types: ['Ground'], spriteId: 10387, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  849: [
    { suffix: 'gmax', formName: 'Gigantamax Toxtricity', regionTag: 'Gigantamax', types: ['Electric', 'Poison'], spriteId: 10388, findInGames: GMAX_GAMES_SWSH_POGO },
  ],
  851: [
    { suffix: 'gmax', formName: 'Gigantamax Centiskorch', regionTag: 'Gigantamax', types: ['Fire', 'Bug'], spriteId: 10389, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  858: [
    { suffix: 'gmax', formName: 'Gigantamax Hatterene', regionTag: 'Gigantamax', types: ['Psychic', 'Fairy'], spriteId: 10390, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  861: [
    { suffix: 'gmax', formName: 'Gigantamax Grimmsnarl', regionTag: 'Gigantamax', types: ['Dark', 'Fairy'], spriteId: 10391, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  869: [
    { suffix: 'gmax', formName: 'Gigantamax Alcremie', regionTag: 'Gigantamax', types: ['Fairy'], spriteId: 10392, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  879: [
    { suffix: 'gmax', formName: 'Gigantamax Copperajah', regionTag: 'Gigantamax', types: ['Steel'], spriteId: 10393, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  884: [
    { suffix: 'gmax', formName: 'Gigantamax Duraludon', regionTag: 'Gigantamax', types: ['Steel', 'Dragon'], spriteId: 10394, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  892: [
    { suffix: 'gmax-single', formName: 'Gigantamax Urshifu (Single Strike)', regionTag: 'Gigantamax', types: ['Fighting', 'Dark'], spriteId: 10395, findInGames: GMAX_GAMES_SWSH_ONLY },
    { suffix: 'gmax-rapid', formName: 'Gigantamax Urshifu (Rapid Strike)', regionTag: 'Gigantamax', types: ['Fighting', 'Water'], spriteId: 10396, findInGames: GMAX_GAMES_SWSH_ONLY },
  ],
  901: [
    {
      suffix: 'bloodmoon',
      formName: 'Bloodmoon Ursaluna',
      regionTag: 'Kitakami',
      types: ['Ground', 'Normal'],
      spriteId: 10441,
      findInGames: [
        {
          gameId: 'sv',
          gameShortTitle: 'Scarlet / Violet',
          requiresDlc: true,
          dlcId: 'sv-teal-mask',
          dlcName: 'The Teal Mask DLC',
          method: 'Perrin Photography Quest in Timeless Woods after 150 Kitakami Dex Entries',
        },
      ],
    },
  ],
};

export function hasRegionalVariations(pokemonId: number): boolean {
  return Boolean(REGIONAL_FORM_SPECS[pokemonId]);
}

export function getVariationsForPokemon(pokemon: PokemonEntry): RegionalVariation[] {
  const baseGames: VariantGameSource[] = [];
  for (const game of GAMES) {
    const avail = pokemon.availability[game.id];
    if (avail && (avail.status === 'base' || avail.status === 'dlc')) {
      baseGames.push({
        gameId: game.id,
        gameShortTitle: game.shortTitle,
        requiresDlc: avail.requiresDlc,
        dlcId: avail.dlcId,
        dlcName: avail.dlcName,
        method: `${avail.whereToFind} (${avail.versionExclusive})`,
      });
    }
  }

  const isUnown = pokemon.id === 201;
  const genderInfo = getPokemonGenderInfo(pokemon.id);
  const isBothGenders = genderInfo.genderRatio === 'both';

  const baseVariation: RegionalVariation = {
    variantId: `${pokemon.id}:base`,
    pokemonId: pokemon.id,
    formName: isUnown
      ? 'Unown [A]'
      : isBothGenders
      ? `${pokemon.name} (Male)`
      : `${pokemon.name} (${pokemon.region} Original Form)`,
    regionTag: isUnown ? 'Unown Form' : 'Original',
    types: pokemon.types,
    spriteId: pokemon.id,
    imageUrl: isUnown
      ? '/sprites/showdown/dex/unown-a.png'
      : undefined,
    findInGames: baseGames,
  };

  const extraSpecs = REGIONAL_FORM_SPECS[pokemon.id];
  const regionalVariants: RegionalVariation[] = (extraSpecs || []).map((spec) => {
    return {
      variantId: `${pokemon.id}:${spec.suffix}`,
      pokemonId: pokemon.id,
      formName: spec.formName,
      regionTag: spec.regionTag,
      types: spec.types,
      spriteId: spec.spriteId,
      imageUrl: spec.imageUrl,
      findInGames: spec.findInGames,
    };
  });

  // Cosmetic colour/coat variations (wing patterns, flower colours, trims…).
  const colorVariants = COLOR_VARIANTS[pokemon.id] ?? [];
  const hasSpeciesFormVariant = colorVariants.some((variant) => variant.base);
  const colorVariantList: RegionalVariation[] = colorVariants.map((variant) => ({
    variantId: `${pokemon.id}:${variant.suffix}`,
    pokemonId: pokemon.id,
    formName: `${pokemon.name} — ${variant.name}`,
    regionTag: 'Original',
    types: pokemon.types,
    spriteId: variant.spriteId,
    findInGames: baseGames,
  }));

  const femaleVariantList: RegionalVariation[] = [];
  if (isBothGenders) {
    femaleVariantList.push({
      variantId: `${pokemon.id}:female`,
      pokemonId: pokemon.id,
      formName: `${pokemon.name} (Female)`,
      regionTag: 'Original',
      types: pokemon.types,
      spriteId: genderInfo.femaleSpriteId || pokemon.id,
      imageUrl: genderInfo.femaleImageUrl,
      findInGames: baseGames,
    });
  }

  // A species whose own form is a named variant (Shellos West Sea) would
  // otherwise be listed twice, once as the plain species and once as the form.
  const baseList = hasSpeciesFormVariant ? [] : [baseVariation];
  return [...baseList, ...femaleVariantList, ...colorVariantList, ...regionalVariants];
}

export function getVariantsForPokemonInGame(
  pokemon: PokemonEntry,
  gameId: GameId
): RegionalVariation[] {
  const allVariants = getVariationsForPokemon(pokemon);
  return allVariants.filter((v) =>
    v.findInGames.some((src) => src.gameId === gameId)
  );
}