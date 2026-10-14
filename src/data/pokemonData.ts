export type CanonicalGameId =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'gold'
  | 'silver'
  | 'crystal'
  | 'ruby'
  | 'sapphire'
  | 'emerald'
  | 'firered'
  | 'leafgreen'
  | 'colo'
  | 'xd'
  | 'diamond'
  | 'pearl'
  | 'platinum'
  | 'heartgold'
  | 'soulsilver'
  | 'black'
  | 'white'
  | 'black2'
  | 'white2'
  | 'x'
  | 'y'
  | 'omegaruby'
  | 'alphasapphire'
  | 'sun'
  | 'moon'
  | 'ultrasun'
  | 'ultramoon'
  | 'lgp'
  | 'lge'
  | 'pogo'
  | 'sword'
  | 'shield'
  | 'bd'
  | 'sp'
  | 'pla'
  | 'scarlet'
  | 'violet';

export type LegacyGameId =
  | 'rb'
  | 'gs'
  | 'rse'
  | 'frlg'
  | 'frlg_switch'
  | 'dppt'
  | 'hgss'
  | 'bw'
  | 'b2w2'
  | 'xy'
  | 'oras'
  | 'sm'
  | 'usum'
  | 'lgpe'
  | 'swsh'
  | 'bdsp'
  | 'sv';

export type GameId = CanonicalGameId | LegacyGameId;

export const ALL_CANONICAL_GAME_IDS: CanonicalGameId[] = [
  'red',
  'blue',
  'yellow',
  'gold',
  'silver',
  'crystal',
  'ruby',
  'sapphire',
  'emerald',
  'firered',
  'leafgreen',
  'colo',
  'xd',
  'diamond',
  'pearl',
  'platinum',
  'heartgold',
  'soulsilver',
  'black',
  'white',
  'black2',
  'white2',
  'x',
  'y',
  'omegaruby',
  'alphasapphire',
  'sun',
  'moon',
  'ultrasun',
  'ultramoon',
  'lgp',
  'lge',
  'pogo',
  'sword',
  'shield',
  'bd',
  'sp',
  'pla',
  'scarlet',
  'violet',
];

export const ALL_GAME_IDS: GameId[] = [...ALL_CANONICAL_GAME_IDS];

export type DlcId =
  | 'sv-teal-mask'
  | 'sv-indigo-disk'
  | 'swsh-isle-of-armor'
  | 'swsh-crown-tundra';

export interface DlcPackInfo {
  id: DlcId;
  gameId: GameId;
  gameTitle: string;
  name: string;
  shortName: string;
  dexName: string;
  releaseWave: string;
  description: string;
  keyHighlights: string[];
}

export interface GameInfo {
  id: GameId;
  title: string;
  shortTitle: string;
  generation: number;
  generationLabel: string;
  platform: string;
  region: string;
  baseDexName: string;
  hasPaidDlc: boolean;
  dlcPacks: DlcId[];
  groupId: string;
  groupTitle: string;
  siblingGameIds: GameId[];
}

export interface GameAvailability {
  gameId: GameId;
  gameShortTitle: string;
  status: 'base' | 'dlc' | 'transfer_only' | 'unavailable';
  requiresDlc: boolean;
  dlcId?: DlcId;
  dlcName?: string;
  versionExclusive: string;
  whereToFind: string;
  acquisitionMethod: string;
  regionDexLabel: string;
  pokedexCompletionGuide: string;
}

export interface PokeBankClosureRisk {
  isAtRiskAfterBankClosure: boolean;
  riskLevel: 'unobtainable_in_home' | 'no_switch_games' | 'bank_mythical_or_form' | 'none';
  badgeLabel: string;
  description: string;
}

export interface PokemonHomeTransferInfo {
  canTransferToHome: boolean;
  hasExcludedVariants: boolean;
  statusLabel: string;
  summary: string;
  excludedVariantsOrRules: string[];
  pokeBankClosureRisk: PokeBankClosureRisk;
}

export interface PokemonEntry {
  id: number;
  name: string;
  generation: number;
  region: string;
  types: string[];
  category:
    | 'Standard'
    | 'Starter'
    | 'Fossil'
    | 'Pseudo-Legendary'
    | 'Paradox'
    | 'Sub-Legendary'
    | 'Legendary'
    | 'Mythical';
  boxNumber: number;
  boxSlot: number;
  boxRow: number;
  boxCol: number;
  availability: Record<GameId, GameAvailability>;
  homeTransfer: PokemonHomeTransferInfo;
  requiresAnyDlcInSwitchEra: boolean;
  primarySwitchSource: string;
}

export type GameCatchesMap = Record<string, number[]>;

export function createEmptyGameCatchesMap(): GameCatchesMap {
  const map: Record<string, number[]> = {};
  for (const gId of ALL_GAME_IDS) {
    map[gId] = [];
  }
  // Also preserve legacy slots for backwards compatibility
  map['rb'] = [];
  map['gs'] = [];
  map['rse'] = [];
  map['frlg'] = [];
  map['frlg_switch'] = [];
  map['dppt'] = [];
  map['hgss'] = [];
  map['bw'] = [];
  map['b2w2'] = [];
  map['xy'] = [];
  map['oras'] = [];
  map['sm'] = [];
  map['usum'] = [];
  map['lgpe'] = [];
  map['swsh'] = [];
  map['bdsp'] = [];
  map['sv'] = [];
  return map;
}

export const DLC_PACKS: DlcPackInfo[] = [
  {
    id: 'sv-teal-mask',
    gameId: 'scarlet',
    gameTitle: 'Pokémon Scarlet & Violet',
    name: 'The Hidden Treasure of Area Zero Part 1: The Teal Mask',
    shortName: 'The Teal Mask DLC',
    dexName: 'Kitakami Pokédex',
    releaseWave: 'Scarlet & Violet — Expansion Part 1',
    description:
      'Unlocks the Kitakami region, adding Ogerpon, the Loyal Three (Okidogi, Munkidori, Fezandipiti), Dipplin, Poltchageist, Sinistcha, Bloodmoon Ursaluna, and returning species.',
    keyHighlights: [
      'Ogerpon & The Loyal Three',
      'Bloodmoon Ursaluna Quest',
      'Dipplin & Sinistcha Evolutions',
      'Kitakami Regional Dex',
    ],
  },
  {
    id: 'sv-indigo-disk',
    gameId: 'scarlet',
    gameTitle: 'Pokémon Scarlet & Violet',
    name: 'The Hidden Treasure of Area Zero Part 2: The Indigo Disk',
    shortName: 'The Indigo Disk DLC',
    dexName: 'Blueberry Pokédex',
    releaseWave: 'Scarlet & Violet — Expansion Part 2',
    description:
      'Unlocks Blueberry Academy Terarium biomes, all Gen I–VIII first-partner Starters, Archaludon, Hydrapple, Paradox beasts/swords, Terapagos, and Pecharunt.',
    keyHighlights: [
      'All Gen I–VIII Starters in Wild Biomes',
      'Terapagos & Pecharunt Epilogue',
      'Gouging Fire, Raging Bolt, Iron Boulder, Iron Crown',
      'Snackworth Legendary Treats',
    ],
  },
  {
    id: 'swsh-isle-of-armor',
    gameId: 'sword',
    gameTitle: 'Pokémon Sword & Shield',
    name: 'Sword & Shield Expansion Pass Part 1: The Isle of Armor',
    shortName: 'Isle of Armor DLC',
    dexName: 'Armor Pokédex',
    releaseWave: 'Sword & Shield — Expansion Part 1',
    description:
      'Unlocks Master Mustard’s Dojo on the Isle of Armor, Kubfu, Single-Strike & Rapid-Strike Urshifu, Galarian Slowbro, Gigantamax soup, and returning species.',
    keyHighlights: [
      'Kubfu & Urshifu Tower Trials',
      'Galarian Slowpoke & Slowbro',
      'Kanto Starter G-Max Gift (Bulbasaur / Squirtle)',
      'Armor Regional Dex',
    ],
  },
  {
    id: 'swsh-crown-tundra',
    gameId: 'sword',
    gameTitle: 'Pokémon Sword & Shield',
    name: 'Sword & Shield Expansion Pass Part 2: The Crown Tundra',
    shortName: 'Crown Tundra DLC',
    dexName: 'Crown Tundra Pokédex',
    releaseWave: 'Sword & Shield — Expansion Part 2',
    description:
      'Unlocks Peony’s Crown Tundra expeditions, Calyrex, Glastrier, Spectrier, Regieleki, Regidrago, Galarian Legendary Birds, Ultra Beasts, and Dynamax Adventure Legendaries.',
    keyHighlights: [
      'Calyrex, Glastrier & Spectrier Story',
      'Regieleki, Regidrago & Galarian Birds',
      'Dynamax Max Lair (Past Box Legendaries)',
      'Swords of Justice Footprints Quest (Keldeo)',
    ],
  },
];

export const GAMES: GameInfo[] = [
  // Generation I
  {
    id: 'red',
    title: 'Pokémon Red',
    shortTitle: 'Red',
    generation: 1,
    generationLabel: 'Gen I — Game Boy',
    platform: 'Game Boy',
    region: 'Kanto',
    baseDexName: 'Kanto Pokédex (#001–#151)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'red',
    groupTitle: 'Red',
    siblingGameIds: ['blue', 'yellow'],
  },
  {
    id: 'blue',
    title: 'Pokémon Blue',
    shortTitle: 'Blue',
    generation: 1,
    generationLabel: 'Gen I — Game Boy',
    platform: 'Game Boy',
    region: 'Kanto',
    baseDexName: 'Kanto Pokédex (#001–#151)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'blue',
    groupTitle: 'Blue',
    siblingGameIds: ['red', 'yellow'],
  },
  {
    id: 'yellow',
    title: 'Pokémon Yellow: Special Pikachu Edition',
    shortTitle: 'Yellow',
    generation: 1,
    generationLabel: 'Gen I — Game Boy',
    platform: 'Game Boy',
    region: 'Kanto',
    baseDexName: 'Kanto Pokédex (#001–#151)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'yellow',
    groupTitle: 'Yellow',
    siblingGameIds: ['red', 'blue'],
  },

  // Generation II
  {
    id: 'gold',
    title: 'Pokémon Gold',
    shortTitle: 'Gold',
    generation: 2,
    generationLabel: 'Gen II — Game Boy Color',
    platform: 'Game Boy Color',
    region: 'Johto & Kanto',
    baseDexName: 'New Pokédex (#001–#251)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'gold',
    groupTitle: 'Gold',
    siblingGameIds: ['silver', 'crystal'],
  },
  {
    id: 'silver',
    title: 'Pokémon Silver',
    shortTitle: 'Silver',
    generation: 2,
    generationLabel: 'Gen II — Game Boy Color',
    platform: 'Game Boy Color',
    region: 'Johto & Kanto',
    baseDexName: 'New Pokédex (#001–#251)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'silver',
    groupTitle: 'Silver',
    siblingGameIds: ['gold', 'crystal'],
  },
  {
    id: 'crystal',
    title: 'Pokémon Crystal',
    shortTitle: 'Crystal',
    generation: 2,
    generationLabel: 'Gen II — Game Boy Color',
    platform: 'Game Boy Color',
    region: 'Johto & Kanto',
    baseDexName: 'New Pokédex (#001–#251)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'crystal',
    groupTitle: 'Crystal',
    siblingGameIds: ['gold', 'silver'],
  },

  // Generation III
  {
    id: 'ruby',
    title: 'Pokémon Ruby',
    shortTitle: 'Ruby',
    generation: 3,
    generationLabel: 'Gen III — Game Boy Advance',
    platform: 'Game Boy Advance',
    region: 'Hoenn',
    baseDexName: 'Hoenn Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'ruby',
    groupTitle: 'Ruby',
    siblingGameIds: ['sapphire', 'emerald'],
  },
  {
    id: 'sapphire',
    title: 'Pokémon Sapphire',
    shortTitle: 'Sapphire',
    generation: 3,
    generationLabel: 'Gen III — Game Boy Advance',
    platform: 'Game Boy Advance',
    region: 'Hoenn',
    baseDexName: 'Hoenn Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'sapphire',
    groupTitle: 'Sapphire',
    siblingGameIds: ['ruby', 'emerald'],
  },
  {
    id: 'emerald',
    title: 'Pokémon Emerald',
    shortTitle: 'Emerald',
    generation: 3,
    generationLabel: 'Gen III — Game Boy Advance',
    platform: 'Game Boy Advance',
    region: 'Hoenn',
    baseDexName: 'Hoenn Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'emerald',
    groupTitle: 'Emerald',
    siblingGameIds: ['ruby', 'sapphire'],
  },
  {
    id: 'firered',
    title: 'Pokémon FireRed',
    shortTitle: 'FireRed',
    generation: 3,
    generationLabel: 'Gen III — Game Boy Advance',
    platform: 'Game Boy Advance',
    region: 'Kanto & Sevii Islands',
    baseDexName: 'Kanto & Sevii Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'firered',
    groupTitle: 'FireRed',
    siblingGameIds: ['leafgreen'],
  },
  {
    id: 'leafgreen',
    title: 'Pokémon LeafGreen',
    shortTitle: 'LeafGreen',
    generation: 3,
    generationLabel: 'Gen III — Game Boy Advance',
    platform: 'Game Boy Advance',
    region: 'Kanto & Sevii Islands',
    baseDexName: 'Kanto & Sevii Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'leafgreen',
    groupTitle: 'LeafGreen',
    siblingGameIds: ['firered'],
  },
  {
    id: 'colo',
    title: 'Pokémon Colosseum',
    shortTitle: 'Colosseum',
    generation: 3,
    generationLabel: 'Gen III — Nintendo GameCube',
    platform: 'Nintendo GameCube',
    region: 'Orre',
    baseDexName: 'Orre Snag Pokédex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'colo',
    groupTitle: 'Colosseum',
    siblingGameIds: ['xd'],
  },
  {
    id: 'xd',
    title: 'Pokémon XD: Gale of Darkness',
    shortTitle: 'XD',
    generation: 3,
    generationLabel: 'Gen III — Nintendo GameCube',
    platform: 'Nintendo GameCube',
    region: 'Orre',
    baseDexName: 'Orre Shadow Pokédex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'xd',
    groupTitle: 'XD: Gale of Darkness',
    siblingGameIds: ['colo'],
  },

  // Generation IV
  {
    id: 'diamond',
    title: 'Pokémon Diamond',
    shortTitle: 'Diamond',
    generation: 4,
    generationLabel: 'Gen IV — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Sinnoh',
    baseDexName: 'Sinnoh Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'diamond',
    groupTitle: 'Diamond',
    siblingGameIds: ['pearl', 'platinum'],
  },
  {
    id: 'pearl',
    title: 'Pokémon Pearl',
    shortTitle: 'Pearl',
    generation: 4,
    generationLabel: 'Gen IV — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Sinnoh',
    baseDexName: 'Sinnoh Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'pearl',
    groupTitle: 'Pearl',
    siblingGameIds: ['diamond', 'platinum'],
  },
  {
    id: 'platinum',
    title: 'Pokémon Platinum',
    shortTitle: 'Platinum',
    generation: 4,
    generationLabel: 'Gen IV — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Sinnoh',
    baseDexName: 'Expanded Sinnoh Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'platinum',
    groupTitle: 'Platinum',
    siblingGameIds: ['diamond', 'pearl'],
  },
  {
    id: 'heartgold',
    title: 'Pokémon HeartGold',
    shortTitle: 'HeartGold',
    generation: 4,
    generationLabel: 'Gen IV — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Johto & Kanto',
    baseDexName: 'Johto & Kanto Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'heartgold',
    groupTitle: 'HeartGold',
    siblingGameIds: ['soulsilver'],
  },
  {
    id: 'soulsilver',
    title: 'Pokémon SoulSilver',
    shortTitle: 'SoulSilver',
    generation: 4,
    generationLabel: 'Gen IV — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Johto & Kanto',
    baseDexName: 'Johto & Kanto Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'soulsilver',
    groupTitle: 'SoulSilver',
    siblingGameIds: ['heartgold'],
  },

  // Generation V
  {
    id: 'black',
    title: 'Pokémon Black',
    shortTitle: 'Black',
    generation: 5,
    generationLabel: 'Gen V — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Unova',
    baseDexName: 'Unova Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'black',
    groupTitle: 'Black',
    siblingGameIds: ['white'],
  },
  {
    id: 'white',
    title: 'Pokémon White',
    shortTitle: 'White',
    generation: 5,
    generationLabel: 'Gen V — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Unova',
    baseDexName: 'Unova Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'white',
    groupTitle: 'White',
    siblingGameIds: ['black'],
  },
  {
    id: 'black2',
    title: 'Pokémon Black 2',
    shortTitle: 'Black 2',
    generation: 5,
    generationLabel: 'Gen V — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Unova',
    baseDexName: 'New Unova Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'black2',
    groupTitle: 'Black 2',
    siblingGameIds: ['white2'],
  },
  {
    id: 'white2',
    title: 'Pokémon White 2',
    shortTitle: 'White 2',
    generation: 5,
    generationLabel: 'Gen V — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Unova',
    baseDexName: 'New Unova Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'white2',
    groupTitle: 'White 2',
    siblingGameIds: ['black2'],
  },

  // Generation VI
  {
    id: 'x',
    title: 'Pokémon X',
    shortTitle: 'X',
    generation: 6,
    generationLabel: 'Gen VI — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Kalos',
    baseDexName: 'Kalos Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'x',
    groupTitle: 'X',
    siblingGameIds: ['y'],
  },
  {
    id: 'y',
    title: 'Pokémon Y',
    shortTitle: 'Y',
    generation: 6,
    generationLabel: 'Gen VI — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Kalos',
    baseDexName: 'Kalos Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'y',
    groupTitle: 'Y',
    siblingGameIds: ['x'],
  },
  {
    id: 'omegaruby',
    title: 'Pokémon Omega Ruby',
    shortTitle: 'Omega Ruby',
    generation: 6,
    generationLabel: 'Gen VI — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Hoenn',
    baseDexName: 'Hoenn Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'omegaruby',
    groupTitle: 'Omega Ruby',
    siblingGameIds: ['alphasapphire'],
  },
  {
    id: 'alphasapphire',
    title: 'Pokémon Alpha Sapphire',
    shortTitle: 'Alpha Sapphire',
    generation: 6,
    generationLabel: 'Gen VI — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Hoenn',
    baseDexName: 'Hoenn Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'alphasapphire',
    groupTitle: 'Alpha Sapphire',
    siblingGameIds: ['omegaruby'],
  },

  // Generation VII
  {
    id: 'sun',
    title: 'Pokémon Sun',
    shortTitle: 'Sun',
    generation: 7,
    generationLabel: 'Gen VII — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Alola',
    baseDexName: 'Alola Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'sun',
    groupTitle: 'Sun',
    siblingGameIds: ['moon'],
  },
  {
    id: 'moon',
    title: 'Pokémon Moon',
    shortTitle: 'Moon',
    generation: 7,
    generationLabel: 'Gen VII — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Alola',
    baseDexName: 'Alola Regional Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'moon',
    groupTitle: 'Moon',
    siblingGameIds: ['sun'],
  },
  {
    id: 'ultrasun',
    title: 'Pokémon Ultra Sun',
    shortTitle: 'Ultra Sun',
    generation: 7,
    generationLabel: 'Gen VII — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Alola',
    baseDexName: 'Expanded Alola Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'ultrasun',
    groupTitle: 'Ultra Sun',
    siblingGameIds: ['ultramoon'],
  },
  {
    id: 'ultramoon',
    title: 'Pokémon Ultra Moon',
    shortTitle: 'Ultra Moon',
    generation: 7,
    generationLabel: 'Gen VII — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Alola',
    baseDexName: 'Expanded Alola Dex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'ultramoon',
    groupTitle: 'Ultra Moon',
    siblingGameIds: ['ultrasun'],
  },
  {
    id: 'lgp',
    title: "Pokémon Let's Go, Pikachu!",
    shortTitle: "Let's Go Pikachu",
    generation: 7,
    generationLabel: 'Gen VII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Kanto',
    baseDexName: 'Kanto Pokédex (#001–#151)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'lgp',
    groupTitle: "Let's Go Pikachu",
    siblingGameIds: ['lge'],
  },
  {
    id: 'lge',
    title: "Pokémon Let's Go, Eevee!",
    shortTitle: "Let's Go Eevee",
    generation: 7,
    generationLabel: 'Gen VII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Kanto',
    baseDexName: 'Kanto Pokédex (#001–#151)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'lge',
    groupTitle: "Let's Go Eevee",
    siblingGameIds: ['lgp'],
  },
  {
    id: 'pogo',
    title: 'Pokémon GO',
    shortTitle: 'Pokémon GO',
    generation: 7,
    generationLabel: 'Mobile — Cross-Gen (HOME Transporter)',
    platform: 'iOS / Android',
    region: 'Global Real-World',
    baseDexName: 'GO Global Pokédex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'pogo',
    groupTitle: 'Pokémon GO',
    siblingGameIds: [],
  },

  // Generation VIII
  {
    id: 'sword',
    title: 'Pokémon Sword',
    shortTitle: 'Sword',
    generation: 8,
    generationLabel: 'Gen VIII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Galar',
    baseDexName: 'Galar Regional Dex',
    hasPaidDlc: true,
    dlcPacks: ['swsh-isle-of-armor', 'swsh-crown-tundra'],
    groupId: 'sword',
    groupTitle: 'Sword',
    siblingGameIds: ['shield'],
  },
  {
    id: 'shield',
    title: 'Pokémon Shield',
    shortTitle: 'Shield',
    generation: 8,
    generationLabel: 'Gen VIII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Galar',
    baseDexName: 'Galar Regional Dex',
    hasPaidDlc: true,
    dlcPacks: ['swsh-isle-of-armor', 'swsh-crown-tundra'],
    groupId: 'shield',
    groupTitle: 'Shield',
    siblingGameIds: ['sword'],
  },
  {
    id: 'bd',
    title: 'Pokémon Brilliant Diamond',
    shortTitle: 'Brilliant Diamond',
    generation: 8,
    generationLabel: 'Gen VIII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Sinnoh',
    baseDexName: 'Sinnoh & Grand Underground (#001–#493)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'bd',
    groupTitle: 'Brilliant Diamond',
    siblingGameIds: ['sp'],
  },
  {
    id: 'sp',
    title: 'Pokémon Shining Pearl',
    shortTitle: 'Shining Pearl',
    generation: 8,
    generationLabel: 'Gen VIII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Sinnoh',
    baseDexName: 'Sinnoh & Grand Underground (#001–#493)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'sp',
    groupTitle: 'Shining Pearl',
    siblingGameIds: ['bd'],
  },
  {
    id: 'pla',
    title: 'Pokémon Legends: Arceus',
    shortTitle: 'Legends: Arceus',
    generation: 8,
    generationLabel: 'Gen VIII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Hisui',
    baseDexName: 'Hisui Survey Pokédex',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'pla',
    groupTitle: 'Legends: Arceus',
    siblingGameIds: [],
  },

  // Generation IX
  {
    id: 'scarlet',
    title: 'Pokémon Scarlet',
    shortTitle: 'Scarlet',
    generation: 9,
    generationLabel: 'Gen IX — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Paldea',
    baseDexName: 'Paldea Base Dex (+ DLC Expansions)',
    hasPaidDlc: true,
    dlcPacks: ['sv-teal-mask', 'sv-indigo-disk'],
    groupId: 'scarlet',
    groupTitle: 'Scarlet',
    siblingGameIds: ['violet'],
  },
  {
    id: 'violet',
    title: 'Pokémon Violet',
    shortTitle: 'Violet',
    generation: 9,
    generationLabel: 'Gen IX — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Paldea',
    baseDexName: 'Paldea Base Dex (+ DLC Expansions)',
    hasPaidDlc: true,
    dlcPacks: ['sv-teal-mask', 'sv-indigo-disk'],
    groupId: 'violet',
    groupTitle: 'Violet',
    siblingGameIds: ['scarlet'],
  },
  // Legacy Grouped Game Aliases (for backwards compatibility with previous save data)
  {
    id: 'sv',
    title: 'Pokémon Scarlet & Violet',
    shortTitle: 'Scarlet & Violet',
    generation: 9,
    generationLabel: 'Gen IX — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Paldea',
    baseDexName: 'Paldea Pokédex (#001–#400)',
    hasPaidDlc: true,
    dlcPacks: ['sv-teal-mask', 'sv-indigo-disk'],
    groupId: 'sv',
    groupTitle: 'Scarlet & Violet',
    siblingGameIds: ['scarlet', 'violet'],
  },
  {
    id: 'swsh',
    title: 'Pokémon Sword & Shield',
    shortTitle: 'Sword & Shield',
    generation: 8,
    generationLabel: 'Gen VIII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Galar',
    baseDexName: 'Galar Pokédex (#001–#400)',
    hasPaidDlc: true,
    dlcPacks: ['swsh-isle-of-armor', 'swsh-crown-tundra'],
    groupId: 'swsh',
    groupTitle: 'Sword & Shield',
    siblingGameIds: ['sword', 'shield'],
  },
  {
    id: 'bdsp',
    title: 'Pokémon Brilliant Diamond & Shining Pearl',
    shortTitle: 'BDSP',
    generation: 8,
    generationLabel: 'Gen VIII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Sinnoh',
    baseDexName: 'Sinnoh Pokédex (#001–#151)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'bdsp',
    groupTitle: 'BDSP',
    siblingGameIds: ['bd', 'sp'],
  },
  {
    id: 'lgpe',
    title: "Pokémon: Let's Go, Pikachu! & Let's Go, Eevee!",
    shortTitle: "Let's Go",
    generation: 7,
    generationLabel: 'Gen VII — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Kanto',
    baseDexName: 'Kanto Pokédex (#001–#153)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'lgpe',
    groupTitle: "Let's Go",
    siblingGameIds: ['lgp', 'lge'],
  },
  {
    id: 'rb',
    title: 'Pokémon Red & Blue',
    shortTitle: 'Red & Blue',
    generation: 1,
    generationLabel: 'Gen I — Game Boy',
    platform: 'Game Boy',
    region: 'Kanto',
    baseDexName: 'Kanto Pokédex (#001–#151)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'rb',
    groupTitle: 'Red & Blue',
    siblingGameIds: ['red', 'blue', 'yellow'],
  },
  {
    id: 'gs',
    title: 'Pokémon Gold & Silver',
    shortTitle: 'Gold & Silver',
    generation: 2,
    generationLabel: 'Gen II — Game Boy Color',
    platform: 'Game Boy Color',
    region: 'Johto',
    baseDexName: 'New Pokédex (#001–#251)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'gs',
    groupTitle: 'Gold & Silver',
    siblingGameIds: ['gold', 'silver', 'crystal'],
  },
  {
    id: 'rse',
    title: 'Pokémon Ruby, Sapphire & Emerald',
    shortTitle: 'Ruby & Sapphire',
    generation: 3,
    generationLabel: 'Gen III — Game Boy Advance',
    platform: 'Game Boy Advance',
    region: 'Hoenn',
    baseDexName: 'Hoenn Pokédex (#001–#202)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'rse',
    groupTitle: 'Ruby, Sapphire & Emerald',
    siblingGameIds: ['ruby', 'sapphire', 'emerald'],
  },
  {
    id: 'frlg',
    title: 'Pokémon FireRed & LeafGreen',
    shortTitle: 'FireRed & LeafGreen',
    generation: 3,
    generationLabel: 'Gen III — Game Boy Advance',
    platform: 'Game Boy Advance',
    region: 'Kanto',
    baseDexName: 'Kanto Pokédex (#001–#151)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'frlg',
    groupTitle: 'FireRed & LeafGreen',
    siblingGameIds: ['firered', 'leafgreen'],
  },
  {
    id: 'frlg_switch',
    title: 'Pokémon FireRed & LeafGreen (Switch Online)',
    shortTitle: 'FireRed & LeafGreen',
    generation: 3,
    generationLabel: 'Gen III — Nintendo Switch',
    platform: 'Nintendo Switch',
    region: 'Kanto',
    baseDexName: 'Kanto Pokédex (#001–#151)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'frlg',
    groupTitle: 'FireRed & LeafGreen',
    siblingGameIds: ['firered', 'leafgreen'],
  },
  {
    id: 'dppt',
    title: 'Pokémon Diamond, Pearl & Platinum',
    shortTitle: 'Diamond & Pearl',
    generation: 4,
    generationLabel: 'Gen IV — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Sinnoh',
    baseDexName: 'Sinnoh Pokédex (#001–#151 / #210)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'dppt',
    groupTitle: 'Diamond, Pearl & Platinum',
    siblingGameIds: ['diamond', 'pearl', 'platinum'],
  },
  {
    id: 'hgss',
    title: 'Pokémon HeartGold & SoulSilver',
    shortTitle: 'HeartGold & SoulSilver',
    generation: 4,
    generationLabel: 'Gen IV — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Johto',
    baseDexName: 'Johto Pokédex (#001–#256)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'hgss',
    groupTitle: 'HeartGold & SoulSilver',
    siblingGameIds: ['heartgold', 'soulsilver'],
  },
  {
    id: 'bw',
    title: 'Pokémon Black & White',
    shortTitle: 'Black & White',
    generation: 5,
    generationLabel: 'Gen V — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Unova',
    baseDexName: 'Unova Pokédex (#001–#156)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'bw',
    groupTitle: 'Black & White',
    siblingGameIds: ['black', 'white'],
  },
  {
    id: 'b2w2',
    title: 'Pokémon Black 2 & White 2',
    shortTitle: 'Black 2 & White 2',
    generation: 5,
    generationLabel: 'Gen V — Nintendo DS',
    platform: 'Nintendo DS',
    region: 'Unova',
    baseDexName: 'New Unova Pokédex (#001–#300)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'b2w2',
    groupTitle: 'Black 2 & White 2',
    siblingGameIds: ['black2', 'white2'],
  },
  {
    id: 'xy',
    title: 'Pokémon X & Y',
    shortTitle: 'X & Y',
    generation: 6,
    generationLabel: 'Gen VI — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Kalos',
    baseDexName: 'Kalos Pokédex (Central/Coastal/Mountain)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'xy',
    groupTitle: 'X & Y',
    siblingGameIds: ['x', 'y'],
  },
  {
    id: 'oras',
    title: 'Pokémon Omega Ruby & Alpha Sapphire',
    shortTitle: 'ORAS',
    generation: 6,
    generationLabel: 'Gen VI — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Hoenn',
    baseDexName: 'Hoenn Pokédex (#001–#211)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'oras',
    groupTitle: 'Omega Ruby & Alpha Sapphire',
    siblingGameIds: ['omegaruby', 'alphasapphire'],
  },
  {
    id: 'sm',
    title: 'Pokémon Sun & Moon',
    shortTitle: 'Sun & Moon',
    generation: 7,
    generationLabel: 'Gen VII — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Alola',
    baseDexName: 'Alola Pokédex (#001–#302)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'sm',
    groupTitle: 'Sun & Moon',
    siblingGameIds: ['sun', 'moon'],
  },
  {
    id: 'usum',
    title: 'Pokémon Ultra Sun & Ultra Moon',
    shortTitle: 'Ultra Sun & Moon',
    generation: 7,
    generationLabel: 'Gen VII — Nintendo 3DS',
    platform: 'Nintendo 3DS',
    region: 'Alola',
    baseDexName: 'Alola Pokédex (#001–#403)',
    hasPaidDlc: false,
    dlcPacks: [],
    groupId: 'usum',
    groupTitle: 'Ultra Sun & Ultra Moon',
    siblingGameIds: ['ultrasun', 'ultramoon'],
  },
];

export const GAME_GENERATION_GROUPS = [
  {
    gen: 1,
    title: 'Generation I — Game Boy',
    games: ['red', 'blue', 'yellow'] as GameId[],
  },
  {
    gen: 2,
    title: 'Generation II — Game Boy Color',
    games: ['gold', 'silver', 'crystal'] as GameId[],
  },
  {
    gen: 3,
    title: 'Generation III — GBA & GameCube',
    games: ['ruby', 'sapphire', 'emerald', 'firered', 'leafgreen', 'colo', 'xd'] as GameId[],
  },
  {
    gen: 4,
    title: 'Generation IV — Nintendo DS',
    games: ['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver'] as GameId[],
  },
  {
    gen: 5,
    title: 'Generation V — Nintendo DS',
    games: ['black', 'white', 'black2', 'white2'] as GameId[],
  },
  {
    gen: 6,
    title: 'Generation VI — Nintendo 3DS',
    games: ['x', 'y', 'omegaruby', 'alphasapphire'] as GameId[],
  },
  {
    gen: 7,
    title: 'Generation VII — 3DS, Switch & GO',
    games: ['sun', 'moon', 'ultrasun', 'ultramoon', 'lgp', 'lge', 'pogo'] as GameId[],
  },
  {
    gen: 8,
    title: 'Generation VIII — Nintendo Switch',
    games: ['sword', 'shield', 'bd', 'sp', 'pla'] as GameId[],
  },
  {
    gen: 9,
    title: 'Generation IX — Nintendo Switch',
    games: ['scarlet', 'violet'] as GameId[],
  },
];

export const GENERATIONS = [
  { id: 1, gen: 1, roman: 'Gen I', region: 'Kanto', range: [1, 151] as const },
  { id: 2, gen: 2, roman: 'Gen II', region: 'Johto', range: [152, 251] as const },
  { id: 3, gen: 3, roman: 'Gen III', region: 'Hoenn', range: [252, 386] as const },
  { id: 4, gen: 4, roman: 'Gen IV', region: 'Sinnoh', range: [387, 493] as const },
  { id: 5, gen: 5, roman: 'Gen V', region: 'Unova', range: [494, 649] as const },
  { id: 6, gen: 6, roman: 'Gen VI', region: 'Kalos', range: [650, 721] as const },
  { id: 7, gen: 7, roman: 'Gen VII', region: 'Alola', range: [722, 809] as const },
  { id: 8, gen: 8, roman: 'Gen VIII', region: 'Galar / Hisui', range: [810, 905] as const },
  { id: 9, gen: 9, roman: 'Gen IX', region: 'Paldea / Kitakami', range: [906, 1025] as const },
];

export function getGameRunningTotalStats(
  dex: PokemonEntry[],
  gameId: GameId,
  ownedDlcs: DlcId[],
  caughtInGameIds: number[]
): {
  baseTotal: number;
  ownedDlcAddedTotal: number;
  unownedDlcLockedTotal: number;
  effectiveTotal: number;
  caughtCount: number;
  percentage: number;
} {
  const caughtSet = new Set(caughtInGameIds);
  let baseTotal = 0;
  let ownedDlcAddedTotal = 0;
  let unownedDlcLockedTotal = 0;
  let caughtCount = 0;

  for (const p of dex) {
    const avail = p.availability[gameId];
    if (!avail) continue;
    if (avail.status === 'base') {
      baseTotal++;
      if (caughtSet.has(p.id)) {
        caughtCount++;
      }
    } else if (avail.status === 'dlc' && avail.dlcId) {
      if (ownedDlcs.includes(avail.dlcId)) {
        ownedDlcAddedTotal++;
        if (caughtSet.has(p.id)) {
          caughtCount++;
        }
      } else {
        unownedDlcLockedTotal++;
      }
    }
  }

  const effectiveTotal = baseTotal + ownedDlcAddedTotal;
  const percentage =
    effectiveTotal > 0 ? Math.round((caughtCount / effectiveTotal) * 100) : 0;

  return {
    baseTotal,
    ownedDlcAddedTotal,
    unownedDlcLockedTotal,
    effectiveTotal,
    caughtCount,
    percentage,
  };
}

export function computeHomeTransferInfo(id: number, name: string): PokemonHomeTransferInfo {
  const defaultSafeBankRisk: PokeBankClosureRisk = {
    isAtRiskAfterBankClosure: false,
    riskLevel: 'none',
    badgeLabel: 'Safe After Poké Bank Closes (Available on Switch)',
    description:
      'Remains obtainable and transferable to Pokémon HOME directly from Nintendo Switch titles even after 3DS Pokémon Bank closes.',
  };

  if (id === 19 || id === 20) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: false,
      statusLabel: 'Transferable to Pokémon HOME (Alolan Form Switch-Restricted)',
      summary: `${name} and its Alolan variant can be stored in Pokémon HOME, though neither can enter Gen VIII–IX Switch games (SwSh, BDSP, PLA, SV).`,
      excludedVariantsOrRules: [
        'Alolan Rattata & Alolan Raticate can only be obtained on Switch via in-game NPC trades in Let’s Go Pikachu/Eevee or transferred from Pokémon GO / Pokémon Bank.',
      ],
      pokeBankClosureRisk: {
        isAtRiskAfterBankClosure: true,
        riskLevel: 'bank_mythical_or_form',
        badgeLabel: '3DS Alola Form Lockout Warning (Let’s Go / GO Only After Bank Closes)',
        description:
          'Absent from Sword/Shield, BDSP, Legends: Arceus, and Scarlet/Violet. Once Pokémon Bank closes, 3DS Sun/Moon transfers end (leaving only Let’s Go or Pokémon GO).',
      },
    };
  }

  if (id === 25) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: true,
      statusLabel: 'Transferable to Pokémon HOME (With Excluded Variants)',
      summary:
        'Standard, Gigantamax, and Cap Pikachus can be deposited into Pokémon HOME, but several special forms are strictly excluded.',
      excludedVariantsOrRules: [
        "Partner Pikachu from Pokémon Let's Go, Pikachu! cannot be transferred to Pokémon HOME.",
        'Cosplay Pikachu (Rock Star, Belle, Pop Star, Ph.D., Libre) from Omega Ruby & Alpha Sapphire cannot leave Gen VI.',
        'Costumed / Hat Event Pikachus in Pokémon GO cannot be sent through the GO Transporter.',
      ],
      pokeBankClosureRisk: defaultSafeBankRisk,
    };
  }

  if (id === 133) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: true,
      statusLabel: 'Transferable to Pokémon HOME (With Excluded Variants)',
      summary:
        'Standard and Gigantamax Eevee can be deposited into Pokémon HOME, except the Partner starter form.',
      excludedVariantsOrRules: [
        "Partner Eevee from Pokémon Let's Go, Eevee! is excluded and cannot be transferred to Pokémon HOME.",
        'Costumed Event Eevees in Pokémon GO cannot be sent through the GO Transporter.',
      ],
      pokeBankClosureRisk: defaultSafeBankRisk,
    };
  }

  if (id === 172) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: true,
      statusLabel: 'Transferable to Pokémon HOME (Spiky-Eared Form Excluded)',
      summary: 'Standard Pichu transfers freely, but the Gen IV event variant is permanently locked.',
      excludedVariantsOrRules: [
        'Spiky-Eared Pichu from HeartGold & SoulSilver Ilex Forest event is excluded from Poké Transporter and Pokémon HOME.',
      ],
      pokeBankClosureRisk: defaultSafeBankRisk,
    };
  }

  if (id === 327) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: true,
      statusLabel: 'Transferable from Bank/3DS Only (GO & BDSP Excluded)',
      summary:
        'Spinda can ONLY be deposited into Pokémon HOME via 3DS Pokémon Bank. Switch (BDSP) and Mobile (Pokémon GO) transfers are completely blocked!',
      excludedVariantsOrRules: [
        'Spinda caught in Pokémon Brilliant Diamond & Shining Pearl (BDSP) CANNOT be transferred into or out of Pokémon HOME due to spot-pattern coding.',
        'Spinda caught in Pokémon GO CANNOT be sent to Pokémon HOME via GO Transporter.',
      ],
      pokeBankClosureRisk: {
        isAtRiskAfterBankClosure: true,
        riskLevel: 'unobtainable_in_home',
        badgeLabel: 'CRITICAL: Unobtainable in Pokémon HOME After Poké Bank Closes',
        description:
          'Because BDSP Spinda is blocked from HOME and Pokémon GO Spinda cannot use GO Transporter, Spinda will become 100% UNOBTAINABLE in Pokémon HOME once 3DS Pokémon Bank closes!',
      },
    };
  }

  if (
    id === 504 ||
    id === 505 ||
    id === 511 ||
    id === 512 ||
    id === 513 ||
    id === 514 ||
    id === 515 ||
    id === 516
  ) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: false,
      statusLabel: 'Unavailable on Nintendo Switch (Poké Bank / Pokémon GO Only)',
      summary: `${name} is completely absent from every Nintendo Switch Pokémon game (LGPE, SwSh, BDSP, PLA, SV) and can only reach Pokémon HOME via Pokémon Bank or Pokémon GO.`,
      excludedVariantsOrRules: [
        `Cannot be transferred into any Nintendo Switch game; once deposited in Pokémon HOME, ${name} must remain stored in HOME.`,
      ],
      pokeBankClosureRisk: {
        isAtRiskAfterBankClosure: true,
        riskLevel: 'no_switch_games',
        badgeLabel: 'No Switch Game Source — Console Lockout After Poké Bank Closes',
        description: `${name} is not available in any Nintendo Switch game. Once 3DS Pokémon Bank closes, it becomes impossible to transfer from any console game (leaving only Pokémon GO).`,
      },
    };
  }

  if (id === 492) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: true,
      statusLabel: 'Transferable to Pokémon HOME (Form Reversion Rule)',
      summary: 'Both Land Forme and Sky Forme can be registered in the Pokémon HOME Dex.',
      excludedVariantsOrRules: [
        'Sky Forme Shaymin reverts to Land Forme when deposited into PC Boxes in Main Series games unless transferred directly from Pokémon Bank or Pokémon GO in Sky Forme.',
      ],
      pokeBankClosureRisk: defaultSafeBankRisk,
    };
  }

  if (id === 646 || id === 800 || id === 898) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: true,
      statusLabel: 'Transferable Unfused Only (Fused Forms Excluded)',
      summary: `${name} can be transferred to Pokémon HOME in its base form, but fused forms are blocked from deposit.`,
      excludedVariantsOrRules: [
        id === 646
          ? 'Black Kyurem and White Kyurem (fused with Zekrom/Reshiram via DNA Splicers) are EXCLUDED from Pokémon HOME and must be separated before transfer.'
          : id === 800
          ? 'Dusk Mane Necrozma and Dawn Wings Necrozma (fused with Solgaleo/Lunala) are EXCLUDED from Pokémon HOME and must be separated first.'
          : 'Ice Rider Calyrex and Shadow Rider Calyrex (fused with Glastrier/Spectrier via Reins of Unity) are EXCLUDED from Pokémon HOME and must be unfused before transfer.',
      ],
      pokeBankClosureRisk: defaultSafeBankRisk,
    };
  }

  if (id === 676) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: true,
      statusLabel: 'Unavailable on Switch — Trim Retention Rule',
      summary:
        'Furfrou is absent from all current Nintendo Switch games. Natural Form comes from Pokémon Bank or GO, while Trims can only enter HOME from Pokémon GO.',
      excludedVariantsOrRules: [
        'Furfrou trims (Heart, Star, Diamond, Debutante, Matron, Dandy, La Reine, Kabuki, Pharaoh) revert to Natural Form when placed in Pokémon Bank, so trims can ONLY be transferred into Pokémon HOME via Pokémon GO.',
      ],
      pokeBankClosureRisk: {
        isAtRiskAfterBankClosure: true,
        riskLevel: 'no_switch_games',
        badgeLabel: 'No Switch Game Source — Console Lockout After Poké Bank Closes',
        description:
          'Furfrou is absent from all current Nintendo Switch games. Once 3DS Pokémon Bank closes, console transfers from XY/ORAS/USUM end (leaving only Pokémon GO).',
      },
    };
  }

  if (id === 251 || id === 386 || id === 494 || id === 649 || id === 721 || id === 801 || id === 802 || id === 807) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: false,
      statusLabel: 'Transferable to Pokémon HOME (Mythical / Event Rules)',
      summary: `${name} can be stored in Pokémon HOME, but repeatable console encounters rely on 3DS titles via Pokémon Bank.`,
      excludedVariantsOrRules: [
        'Pokémon GO Mythicals require the species to be registered in your Switch game save first before transferring from HOME into a Switch game.',
      ],
      pokeBankClosureRisk: {
        isAtRiskAfterBankClosure: true,
        riskLevel: 'bank_mythical_or_form',
        badgeLabel: '3DS Poké Bank Mythical Source Lockout After Bank Closes',
        description: `Closing 3DS Pokémon Bank cuts off repeatable 3DS console sources for ${name} (e.g., Virtual Console Crystal Celebi, ORAS Delta Episode Deoxys, SM/USUM QR Magearna).`,
      },
    };
  }

  if (id === 718) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: true,
      statusLabel: 'Transferable to Pokémon HOME (Complete Forme Battle-Only)',
      summary: '10% Forme and 50% Forme Zygarde can be deposited into Pokémon HOME.',
      excludedVariantsOrRules: [
        'Complete Forme (100%) Zygarde is a battle-only transformation via Power Construct and cannot be deposited in Complete Forme; Pokémon GO Zygarde is also currently excluded from GO Transporter.',
      ],
      pokeBankClosureRisk: defaultSafeBankRisk,
    };
  }

  if (id === 999) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: false,
      statusLabel: 'Transferable to Pokémon HOME (Form Source Split)',
      summary: 'Both Chest Form and Roaming Form Gimmighoul can be deposited into Pokémon HOME.',
      excludedVariantsOrRules: [
        'Chest Form Gimmighoul is transferred from Pokémon Scarlet & Violet; Roaming Form Gimmighoul can ONLY be transferred into Pokémon HOME from Pokémon GO.',
      ],
      pokeBankClosureRisk: defaultSafeBankRisk,
    };
  }

  if (id === 1007 || id === 1008) {
    return {
      canTransferToHome: true,
      hasExcludedVariants: true,
      statusLabel: 'Transferable to Pokémon HOME (Ride Form Excluded)',
      summary: `Your second catchable ${name} from Area Zero can be transferred to Pokémon HOME.`,
      excludedVariantsOrRules: [
        `The story Ride Form ${name} (Low-Power / Gliding Build) is permanently bound to your trainer and is EXCLUDED from Pokémon HOME transfer.`,
      ],
      pokeBankClosureRisk: defaultSafeBankRisk,
    };
  }

  return {
    canTransferToHome: true,
    hasExcludedVariants: false,
    statusLabel: 'Transferable to Pokémon HOME (All Standard & Regional Variants)',
    summary: `${name} and all of its regional variations can be transferred into Pokémon HOME via Switch titles, Pokémon Bank (3DS), or GO Transporter (Pokémon GO).`,
    excludedVariantsOrRules: [
      'Any costumed or special event-dressed variant caught in Pokémon GO is excluded from GO Transporter.',
    ],
    pokeBankClosureRisk: defaultSafeBankRisk,
  };
}

const KANTO_LOCATIONS = [
  'Viridian Forest & Route 2',
  'Mt. Moon Caverns & Route 4',
  'Rock Tunnel & Route 10 Power Plant',
  'Kanto Safari Zone (Fuchsia City)',
  'Seafoam Islands & Cinnabar Mansion',
  'Cerulean Cave & Sevii Five Isle Meadow',
];

const JOHTO_LOCATIONS = [
  'Route 32, Union Cave & Slowpoke Well',
  'Ilex Forest & National Park (Goldenrod)',
  'Ecruteak Burned Tower & Route 38',
  'Lake of Rage & Ice Path (Blackthorn)',
  'Johto Safari Zone (Cianwood Cliffside)',
  'Mt. Silver Foothills & Kanto Route 26',
];

const HOENN_LOCATIONS = [
  'Route 102 & Petalburg Woods',
  'Route 110 & New Mauville',
  'Route 113 Ash Grass & Fallarbor Outskirts',
  'Route 119 Tall Grass & Weather Institute River',
  'Hoenn Safari Zone (North-East Expansion)',
  'Mt. Pyre Summit & Exterior Slopes',
  'Meteor Falls Inner Caverns',
  'Shoal Cave & Mossdeep Sea Routes',
];

const SINNOH_LOCATIONS = [
  'Route 205 & Eterna Forest',
  'Mt. Coronet & Wayward Cave',
  'Great Marsh (Pastoria Safari) & Route 212',
  'Iron Island & Canalave Harbor',
  'Lake Acuity Snowfront & Route 216',
  'Grand Underground Spacious Cave & Hideaways',
];

const UNOVA_LOCATIONS = [
  'Pinwheel Forest & Castelia Sewers',
  'Relic Castle & Desert Resort (Route 4)',
  'Chargestone Cave & Mistralton Cave',
  'Dragonspiral Tower & Moor of Icirrus',
  'Giant Chasm & Abundant Shrine',
  'Unova Route 12, Village Bridge & White Forest',
];

const KALOS_LOCATIONS = [
  'Santalune Forest & Kalos Route 4',
  'Connecting Cave & Glittering Cave',
  'Reflection Cave & Kalos Route 11',
  'Frost Cavern & Kalos Route 16',
  'Pokémon Village & Terminus Cave',
  'Kiloude City Friend Safari',
];

const ALOLA_LOCATIONS = [
  'Melemele Meadow & Verdant Cavern',
  'Brooklet Hill & Lush Jungle (Akala Island)',
  'Mount Hokulani & Blush Mountain (Ula’ula Island)',
  'Haina Desert & Tapu Village',
  'Vast Poni Canyon & Exeggutor Island',
  'Ultra Space Wilds (Ultra Warp Ride)',
];

const GALAR_LOCATIONS = [
  'Rolling Fields & Dappled Grove (Wild Area)',
  'Galar Mine No. 2 & Motostoke Outskirts',
  'Giant’s Mirror & Dusty Bowl (Wild Area)',
  'Glimwood Tangle & Ballonlea Outskirts',
  'Route 9 Circhester Bay & Route 10 Snowfields',
  'Lake of Outrage & Hammerlocke Hills',
];

const PALDEA_LOCATIONS = [
  'South Province (Area Two & Area Four)',
  'West Province (Area One & Asado Desert)',
  'East Province (Area Three & Tagtree Thicket)',
  'Glaseado Mountain & Dalizapa Passage',
  'Casseroya Lake & Socarrat Trail',
  'North Province (Area One & Area Two Bamboo Grove)',
];

function getGenerationAndRegion(id: number): { generation: number; region: string } {
  for (const g of GENERATIONS) {
    if (id >= g.range[0] && id <= g.range[1]) {
      return { generation: g.gen, region: g.region };
    }
  }
  return { generation: 9, region: 'Paldea' };
}

import {
  PLA_HISUI_DEX_SPECIES,
  SV_PALDEA_BASE_SPECIES,
  SV_TEAL_MASK_SPECIES,
  SV_INDIGO_DISK_SPECIES,
  SV_TRANSFER_ONLY_SPECIES,
  SWSH_GALAR_BASE_SPECIES,
  SWSH_ISLE_OF_ARMOR_SPECIES,
  SWSH_CROWN_TUNDRA_SPECIES,
  SWSH_TRANSFER_ONLY_SPECIES,
  COLO_SHADOW_SPECIES,
  XD_SHADOW_SPECIES,
  isLgpeAvailable,
  isBdspAvailable,
  isGen1Available,
  isGen2Available,
  isGen3Available,
  COMPLETELY_ABSENT_FROM_SWITCH,
  SWORD_EXCLUSIVES,
  SHIELD_EXCLUSIVES,
  SCARLET_EXCLUSIVES,
  VIOLET_EXCLUSIVES,
  BD_EXCLUSIVES,
  SP_EXCLUSIVES,
  LGP_EXCLUSIVES,
  LGE_EXCLUSIVES,
  RED_EXCLUSIVES,
  BLUE_EXCLUSIVES,
  GOLD_EXCLUSIVES,
  SILVER_EXCLUSIVES,
  RUBY_EXCLUSIVES,
  SAPPHIRE_EXCLUSIVES,
  FIRERED_EXCLUSIVES,
  LEAFGREEN_EXCLUSIVES,
  DIAMOND_EXCLUSIVES,
  PEARL_EXCLUSIVES,
  HEARTGOLD_EXCLUSIVES,
  SOULSILVER_EXCLUSIVES,
  BLACK_EXCLUSIVES,
  WHITE_EXCLUSIVES,
  BLACK2_EXCLUSIVES,
  WHITE2_EXCLUSIVES,
  X_EXCLUSIVES,
  Y_EXCLUSIVES,
  OMEGARUBY_EXCLUSIVES,
  ALPHASAPPHIRE_EXCLUSIVES,
  SUN_EXCLUSIVES,
  MOON_EXCLUSIVES,
  ULTRASUN_EXCLUSIVES,
  ULTRAMOON_EXCLUSIVES,
} from './pokemonAvailabilityData';

function computeAvailabilityForPokemon(id: number): Record<GameId, GameAvailability> {
  const result: Partial<Record<GameId, GameAvailability>> = {};
  const isAbsentFromSwitch = COMPLETELY_ABSENT_FROM_SWITCH.has(id);

  for (const game of GAMES) {
    let status: 'base' | 'dlc' | 'transfer_only' | 'unavailable' = 'unavailable';
    let whereToFind = `Not obtainable in ${game.shortTitle}`;
    let versionExclusive = 'Both Versions';
    let requiresDlc = false;
    let dlcId: DlcId | undefined = undefined;
    let dlcName: string | undefined = undefined;
    let pokedexCompletionGuide = `Unobtainable in ${game.shortTitle} (transfer via Pokémon HOME)`;

    switch (game.id) {
      // Gen 1
      case 'red': {
        if (isGen1Available(id)) {
          if (BLUE_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Blue';
            whereToFind = 'Exclusive to Pokémon Blue';
            pokedexCompletionGuide = 'Trade with a Pokémon Blue player';
          } else {
            status = 'base';
            whereToFind = KANTO_LOCATIONS[id % KANTO_LOCATIONS.length];
            versionExclusive = RED_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Red' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'blue': {
        if (isGen1Available(id)) {
          if (RED_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Red';
            whereToFind = 'Exclusive to Pokémon Red';
            pokedexCompletionGuide = 'Trade with a Pokémon Red player';
          } else {
            status = 'base';
            whereToFind = KANTO_LOCATIONS[id % KANTO_LOCATIONS.length];
            versionExclusive = BLUE_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Blue' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'yellow': {
        if (isGen1Available(id)) {
          status = 'base';
          whereToFind = KANTO_LOCATIONS[id % KANTO_LOCATIONS.length];
          versionExclusive = 'Yellow Edition';
          pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
        }
        break;
      }

      // Gen 2
      case 'gold': {
        if (isGen2Available(id)) {
          if (SILVER_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Silver';
            whereToFind = 'Exclusive to Pokémon Silver';
            pokedexCompletionGuide = 'Trade with a Pokémon Silver player';
          } else {
            status = 'base';
            whereToFind = JOHTO_LOCATIONS[id % JOHTO_LOCATIONS.length];
            versionExclusive = GOLD_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Gold' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'silver': {
        if (isGen2Available(id)) {
          if (GOLD_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Gold';
            whereToFind = 'Exclusive to Pokémon Gold';
            pokedexCompletionGuide = 'Trade with a Pokémon Gold player';
          } else {
            status = 'base';
            whereToFind = JOHTO_LOCATIONS[id % JOHTO_LOCATIONS.length];
            versionExclusive = SILVER_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Silver' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'crystal': {
        if (isGen2Available(id)) {
          status = 'base';
          whereToFind = JOHTO_LOCATIONS[id % JOHTO_LOCATIONS.length];
          versionExclusive = 'Crystal Edition';
          pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
        }
        break;
      }

      // Gen 3
      case 'ruby': {
        if (isGen3Available(id)) {
          if (SAPPHIRE_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Sapphire';
            whereToFind = 'Exclusive to Pokémon Sapphire';
            pokedexCompletionGuide = 'Trade with a Pokémon Sapphire player';
          } else {
            status = 'base';
            whereToFind = HOENN_LOCATIONS[id % HOENN_LOCATIONS.length];
            versionExclusive = RUBY_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Ruby' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'sapphire': {
        if (isGen3Available(id)) {
          if (RUBY_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Ruby';
            whereToFind = 'Exclusive to Pokémon Ruby';
            pokedexCompletionGuide = 'Trade with a Pokémon Ruby player';
          } else {
            status = 'base';
            whereToFind = HOENN_LOCATIONS[id % HOENN_LOCATIONS.length];
            versionExclusive = SAPPHIRE_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Sapphire' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'emerald': {
        if (isGen3Available(id)) {
          status = 'base';
          whereToFind = HOENN_LOCATIONS[id % HOENN_LOCATIONS.length];
          versionExclusive = 'Emerald Edition';
          pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
        }
        break;
      }
      case 'firered': {
        if (isGen3Available(id)) {
          if (LEAFGREEN_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon LeafGreen';
            whereToFind = 'Exclusive to Pokémon LeafGreen';
            pokedexCompletionGuide = 'Trade with a Pokémon LeafGreen player';
          } else {
            status = 'base';
            whereToFind = KANTO_LOCATIONS[id % KANTO_LOCATIONS.length];
            versionExclusive = FIRERED_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon FireRed' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'leafgreen': {
        if (isGen3Available(id)) {
          if (FIRERED_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon FireRed';
            whereToFind = 'Exclusive to Pokémon FireRed';
            pokedexCompletionGuide = 'Trade with a Pokémon FireRed player';
          } else {
            status = 'base';
            whereToFind = KANTO_LOCATIONS[id % KANTO_LOCATIONS.length];
            versionExclusive = LEAFGREEN_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon LeafGreen' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'colo': {
        if (COLO_SHADOW_SPECIES.has(id)) {
          status = 'base';
          whereToFind = 'Snag Shadow Pokémon in Orre & Purify';
          versionExclusive = 'Nintendo GameCube';
          pokedexCompletionGuide = 'Snag and purify in Orre';
        } else if (isGen3Available(id)) {
          status = 'transfer_only';
          whereToFind = 'Transfer from GBA via GameCube Link Cable';
          versionExclusive = 'GBA Cable Transfer';
          pokedexCompletionGuide = 'Transfer from GBA via Link Cable';
        }
        break;
      }
      case 'xd': {
        if (XD_SHADOW_SPECIES.has(id)) {
          status = 'base';
          whereToFind = 'Snag Shadow Pokémon in Orre & Purify in Chamber';
          versionExclusive = 'Nintendo GameCube';
          pokedexCompletionGuide = 'Snag and purify in Purification Chamber';
        } else if (isGen3Available(id)) {
          status = 'transfer_only';
          whereToFind = 'Transfer from GBA via GameCube Link Cable';
          versionExclusive = 'GBA Cable Transfer';
          pokedexCompletionGuide = 'Transfer from GBA via Link Cable';
        }
        break;
      }

      // Gen 4
      case 'diamond': {
        if (id <= 493) {
          if (PEARL_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Pearl';
            whereToFind = 'Exclusive to Pokémon Pearl';
            pokedexCompletionGuide = 'Trade with a Pokémon Pearl player';
          } else {
            status = 'base';
            whereToFind = SINNOH_LOCATIONS[id % SINNOH_LOCATIONS.length];
            versionExclusive = DIAMOND_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Diamond' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'pearl': {
        if (id <= 493) {
          if (DIAMOND_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Diamond';
            whereToFind = 'Exclusive to Pokémon Diamond';
            pokedexCompletionGuide = 'Trade with a Pokémon Diamond player';
          } else {
            status = 'base';
            whereToFind = SINNOH_LOCATIONS[id % SINNOH_LOCATIONS.length];
            versionExclusive = PEARL_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Pearl' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'platinum': {
        if (id <= 493) {
          status = 'base';
          whereToFind = SINNOH_LOCATIONS[id % SINNOH_LOCATIONS.length];
          versionExclusive = 'Platinum Edition';
          pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
        }
        break;
      }
      case 'heartgold': {
        if (id <= 493) {
          if (SOULSILVER_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon SoulSilver';
            whereToFind = 'Exclusive to Pokémon SoulSilver';
            pokedexCompletionGuide = 'Trade with a Pokémon SoulSilver player';
          } else {
            status = 'base';
            whereToFind = JOHTO_LOCATIONS[id % JOHTO_LOCATIONS.length];
            versionExclusive = HEARTGOLD_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon HeartGold' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'soulsilver': {
        if (id <= 493) {
          if (HEARTGOLD_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon HeartGold';
            whereToFind = 'Exclusive to Pokémon HeartGold';
            pokedexCompletionGuide = 'Trade with a Pokémon HeartGold player';
          } else {
            status = 'base';
            whereToFind = JOHTO_LOCATIONS[id % JOHTO_LOCATIONS.length];
            versionExclusive = SOULSILVER_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon SoulSilver' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }

      // Gen 5
      case 'black': {
        if (id <= 649) {
          if (WHITE_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon White';
            whereToFind = 'Exclusive to Pokémon White';
            pokedexCompletionGuide = 'Trade with a Pokémon White player';
          } else {
            status = 'base';
            whereToFind = UNOVA_LOCATIONS[id % UNOVA_LOCATIONS.length];
            versionExclusive = BLACK_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Black' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'white': {
        if (id <= 649) {
          if (BLACK_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Black';
            whereToFind = 'Exclusive to Pokémon Black';
            pokedexCompletionGuide = 'Trade with a Pokémon Black player';
          } else {
            status = 'base';
            whereToFind = UNOVA_LOCATIONS[id % UNOVA_LOCATIONS.length];
            versionExclusive = WHITE_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon White' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'black2': {
        if (id <= 649) {
          if (WHITE2_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon White 2';
            whereToFind = 'Exclusive to Pokémon White 2';
            pokedexCompletionGuide = 'Trade with a Pokémon White 2 player';
          } else {
            status = 'base';
            whereToFind = UNOVA_LOCATIONS[id % UNOVA_LOCATIONS.length];
            versionExclusive = BLACK2_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Black 2' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'white2': {
        if (id <= 649) {
          if (BLACK2_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Black 2';
            whereToFind = 'Exclusive to Pokémon Black 2';
            pokedexCompletionGuide = 'Trade with a Pokémon Black 2 player';
          } else {
            status = 'base';
            whereToFind = UNOVA_LOCATIONS[id % UNOVA_LOCATIONS.length];
            versionExclusive = WHITE2_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon White 2' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }

      // Gen 6
      case 'x': {
        if (id <= 721) {
          if (Y_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Y';
            whereToFind = 'Exclusive to Pokémon Y';
            pokedexCompletionGuide = 'Trade with a Pokémon Y player';
          } else {
            status = 'base';
            whereToFind = KALOS_LOCATIONS[id % KALOS_LOCATIONS.length];
            versionExclusive = X_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon X' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'y': {
        if (id <= 721) {
          if (X_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon X';
            whereToFind = 'Exclusive to Pokémon X';
            pokedexCompletionGuide = 'Trade with a Pokémon X player';
          } else {
            status = 'base';
            whereToFind = KALOS_LOCATIONS[id % KALOS_LOCATIONS.length];
            versionExclusive = Y_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Y' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'omegaruby': {
        if (id <= 721) {
          if (ALPHASAPPHIRE_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Alpha Sapphire';
            whereToFind = 'Exclusive to Pokémon Alpha Sapphire';
            pokedexCompletionGuide = 'Trade with an Alpha Sapphire player';
          } else {
            status = 'base';
            whereToFind = HOENN_LOCATIONS[id % HOENN_LOCATIONS.length];
            versionExclusive = OMEGARUBY_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Omega Ruby' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'alphasapphire': {
        if (id <= 721) {
          if (OMEGARUBY_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Omega Ruby';
            whereToFind = 'Exclusive to Pokémon Omega Ruby';
            pokedexCompletionGuide = 'Trade with an Omega Ruby player';
          } else {
            status = 'base';
            whereToFind = HOENN_LOCATIONS[id % HOENN_LOCATIONS.length];
            versionExclusive = ALPHASAPPHIRE_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Alpha Sapphire' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }

      // Gen 7
      case 'sun': {
        if (id <= 802) {
          if (MOON_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Moon';
            whereToFind = 'Exclusive to Pokémon Moon';
            pokedexCompletionGuide = 'Trade with a Pokémon Moon player';
          } else {
            status = 'base';
            whereToFind = ALOLA_LOCATIONS[id % ALOLA_LOCATIONS.length];
            versionExclusive = SUN_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Sun' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'moon': {
        if (id <= 802) {
          if (SUN_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Sun';
            whereToFind = 'Exclusive to Pokémon Sun';
            pokedexCompletionGuide = 'Trade with a Pokémon Sun player';
          } else {
            status = 'base';
            whereToFind = ALOLA_LOCATIONS[id % ALOLA_LOCATIONS.length];
            versionExclusive = MOON_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Moon' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'ultrasun': {
        if (id <= 807) {
          if (ULTRAMOON_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Ultra Moon';
            whereToFind = 'Exclusive to Pokémon Ultra Moon';
            pokedexCompletionGuide = 'Trade with an Ultra Moon player';
          } else {
            status = 'base';
            whereToFind = ALOLA_LOCATIONS[id % ALOLA_LOCATIONS.length];
            versionExclusive = ULTRASUN_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Ultra Sun' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'ultramoon': {
        if (id <= 807) {
          if (ULTRASUN_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Ultra Sun';
            whereToFind = 'Exclusive to Pokémon Ultra Sun';
            pokedexCompletionGuide = 'Trade with an Ultra Sun player';
          } else {
            status = 'base';
            whereToFind = ALOLA_LOCATIONS[id % ALOLA_LOCATIONS.length];
            versionExclusive = ULTRAMOON_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Ultra Moon' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'lgp': {
        if (isLgpeAvailable(id)) {
          if (LGE_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = "Exclusive to Let's Go, Eevee!";
            whereToFind = "Exclusive to Let's Go, Eevee!";
            pokedexCompletionGuide = "Trade with a Let's Go Eevee player (or transfer from Pokémon GO)";
          } else {
            status = 'base';
            whereToFind = KANTO_LOCATIONS[id % KANTO_LOCATIONS.length];
            versionExclusive = LGP_EXCLUSIVES.has(id) ? "Exclusive to Let's Go, Pikachu!" : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'lge': {
        if (isLgpeAvailable(id)) {
          if (LGP_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = "Exclusive to Let's Go, Pikachu!";
            whereToFind = "Exclusive to Let's Go, Pikachu!";
            pokedexCompletionGuide = "Trade with a Let's Go Pikachu player (or transfer from Pokémon GO)";
          } else {
            status = 'base';
            whereToFind = KANTO_LOCATIONS[id % KANTO_LOCATIONS.length];
            versionExclusive = LGE_EXCLUSIVES.has(id) ? "Exclusive to Let's Go, Eevee!" : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'pogo': {
        if (id <= 1017 && !isAbsentFromSwitch) {
          status = 'base';
          whereToFind = 'Wild Spawns, Field Research & Raid Battles (Global)';
          versionExclusive = 'Mobile Global Spawns';
          pokedexCompletionGuide = 'Catch via Pokémon GO and send via GO Transporter to Pokémon HOME';
        }
        break;
      }

      // Gen 8
      case 'sword': {
        if (!isAbsentFromSwitch && id <= 898) {
          if (SWSH_GALAR_BASE_SPECIES.has(id)) {
            if (SHIELD_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Shield';
              whereToFind = 'Exclusive to Pokémon Shield';
              pokedexCompletionGuide = 'Trade with a Pokémon Shield player';
            } else {
              status = 'base';
              whereToFind = GALAR_LOCATIONS[id % GALAR_LOCATIONS.length];
              versionExclusive = SWORD_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Sword' : 'Available in Both Versions';
              pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
            }
          } else if (SWSH_ISLE_OF_ARMOR_SPECIES.has(id)) {
            if (SHIELD_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Shield (Isle of Armor)';
              whereToFind = 'Exclusive to Pokémon Shield (Isle of Armor)';
              pokedexCompletionGuide = 'Trade with a Pokémon Shield player';
            } else {
              status = 'dlc';
              requiresDlc = true;
              dlcId = 'swsh-isle-of-armor';
              dlcName = 'Isle of Armor DLC';
              whereToFind = 'Fields of Honor & Challenge Beach (Isle of Armor)';
              versionExclusive = SWORD_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Sword (Isle of Armor)' : 'Available in Both Versions';
              pokedexCompletionGuide = 'Buy Isle of Armor Expansion Pass';
            }
          } else if (SWSH_CROWN_TUNDRA_SPECIES.has(id)) {
            if (SHIELD_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Shield (Crown Tundra)';
              whereToFind = 'Exclusive to Pokémon Shield (Crown Tundra)';
              pokedexCompletionGuide = 'Trade with a Pokémon Shield player';
            } else {
              status = 'dlc';
              requiresDlc = true;
              dlcId = 'swsh-crown-tundra';
              dlcName = 'Crown Tundra DLC';
              whereToFind = 'Slippery Slope & Max Lair (Crown Tundra)';
              versionExclusive = SWORD_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Sword (Crown Tundra)' : 'Available in Both Versions';
              pokedexCompletionGuide = 'Buy Crown Tundra Expansion Pass';
            }
          } else if (SWSH_TRANSFER_ONLY_SPECIES.has(id)) {
            status = 'transfer_only';
            whereToFind = 'Transfer via Pokémon HOME or Past Gen';
            pokedexCompletionGuide = 'Transfer from Pokémon HOME';
          }
        }
        break;
      }
      case 'shield': {
        if (!isAbsentFromSwitch && id <= 898) {
          if (SWSH_GALAR_BASE_SPECIES.has(id)) {
            if (SWORD_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Sword';
              whereToFind = 'Exclusive to Pokémon Sword';
              pokedexCompletionGuide = 'Trade with a Pokémon Sword player';
            } else {
              status = 'base';
              whereToFind = GALAR_LOCATIONS[id % GALAR_LOCATIONS.length];
              versionExclusive = SHIELD_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Shield' : 'Available in Both Versions';
              pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
            }
          } else if (SWSH_ISLE_OF_ARMOR_SPECIES.has(id)) {
            if (SWORD_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Sword (Isle of Armor)';
              whereToFind = 'Exclusive to Pokémon Sword (Isle of Armor)';
              pokedexCompletionGuide = 'Trade with a Pokémon Sword player';
            } else {
              status = 'dlc';
              requiresDlc = true;
              dlcId = 'swsh-isle-of-armor';
              dlcName = 'Isle of Armor DLC';
              whereToFind = 'Fields of Honor & Challenge Beach (Isle of Armor)';
              versionExclusive = SHIELD_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Shield (Isle of Armor)' : 'Available in Both Versions';
              pokedexCompletionGuide = 'Buy Isle of Armor Expansion Pass';
            }
          } else if (SWSH_CROWN_TUNDRA_SPECIES.has(id)) {
            if (SWORD_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Sword (Crown Tundra)';
              whereToFind = 'Exclusive to Pokémon Sword (Crown Tundra)';
              pokedexCompletionGuide = 'Trade with a Pokémon Sword player';
            } else {
              status = 'dlc';
              requiresDlc = true;
              dlcId = 'swsh-crown-tundra';
              dlcName = 'Crown Tundra DLC';
              whereToFind = 'Slippery Slope & Max Lair (Crown Tundra)';
              versionExclusive = SHIELD_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Shield (Crown Tundra)' : 'Available in Both Versions';
              pokedexCompletionGuide = 'Buy Crown Tundra Expansion Pass';
            }
          } else if (SWSH_TRANSFER_ONLY_SPECIES.has(id)) {
            status = 'transfer_only';
            whereToFind = 'Transfer via Pokémon HOME or Past Gen';
            pokedexCompletionGuide = 'Transfer from Pokémon HOME';
          }
        }
        break;
      }
      case 'bd': {
        if (isBdspAvailable(id)) {
          if (SP_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Shining Pearl';
            whereToFind = 'Exclusive to Pokémon Shining Pearl';
            pokedexCompletionGuide = 'Trade with a Shining Pearl player';
          } else {
            status = 'base';
            whereToFind = SINNOH_LOCATIONS[id % SINNOH_LOCATIONS.length];
            versionExclusive = BD_EXCLUSIVES.has(id) ? 'Exclusive to Brilliant Diamond' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'sp': {
        if (isBdspAvailable(id)) {
          if (BD_EXCLUSIVES.has(id)) {
            status = 'unavailable';
            versionExclusive = 'Exclusive to Pokémon Brilliant Diamond';
            whereToFind = 'Exclusive to Pokémon Brilliant Diamond';
            pokedexCompletionGuide = 'Trade with a Brilliant Diamond player';
          } else {
            status = 'base';
            whereToFind = SINNOH_LOCATIONS[id % SINNOH_LOCATIONS.length];
            versionExclusive = SP_EXCLUSIVES.has(id) ? 'Exclusive to Shining Pearl' : 'Available in Both Versions';
            pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
          }
        }
        break;
      }
      case 'pla': {
        if (PLA_HISUI_DEX_SPECIES.has(id)) {
          status = 'base';
          whereToFind = 'Hisui Survey Fields & Space-Time Distortions';
          versionExclusive = 'Single Version Game';
          pokedexCompletionGuide = 'Catchable in Hisui Survey Fields or Space-Time Distortions';
        }
        break;
      }

      // Gen 9
      case 'scarlet': {
        if (!isAbsentFromSwitch && id <= 1025) {
          if (SV_PALDEA_BASE_SPECIES.has(id)) {
            if (VIOLET_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Violet';
              whereToFind = 'Exclusive to Pokémon Violet';
              pokedexCompletionGuide = 'Trade with a Pokémon Violet player';
            } else {
              status = 'base';
              whereToFind = PALDEA_LOCATIONS[id % PALDEA_LOCATIONS.length];
              versionExclusive = SCARLET_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Scarlet' : 'Available in Both Versions';
              pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
            }
          } else if (SV_TEAL_MASK_SPECIES.has(id)) {
            if (VIOLET_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Violet (Teal Mask)';
              whereToFind = 'Exclusive to Pokémon Violet (Teal Mask)';
              pokedexCompletionGuide = 'Trade with a Pokémon Violet player';
            } else {
              status = 'dlc';
              requiresDlc = true;
              dlcId = 'sv-teal-mask';
              dlcName = 'The Teal Mask DLC';
              whereToFind = 'Kitakami Wilderness, Oni Mountain & Apple Hills';
              versionExclusive = SCARLET_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Scarlet (Teal Mask)' : 'Available in Both Versions';
              pokedexCompletionGuide = 'Buy The Teal Mask Expansion Pass';
            }
          } else if (SV_INDIGO_DISK_SPECIES.has(id)) {
            if (VIOLET_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Violet (Indigo Disk)';
              whereToFind = 'Exclusive to Pokémon Violet (Indigo Disk)';
              pokedexCompletionGuide = 'Trade with a Pokémon Violet player';
            } else {
              status = 'dlc';
              requiresDlc = true;
              dlcId = 'sv-indigo-disk';
              dlcName = 'The Indigo Disk DLC';
              whereToFind = 'Blueberry Academy Terarium Biomes';
              versionExclusive = SCARLET_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Scarlet (Indigo Disk)' : 'Available in Both Versions';
              pokedexCompletionGuide = 'Buy The Indigo Disk Expansion Pass';
            }
          } else if (SV_TRANSFER_ONLY_SPECIES.has(id)) {
            status = 'transfer_only';
            whereToFind = 'Transfer via Pokémon HOME';
            pokedexCompletionGuide = 'Transfer from Pokémon HOME';
          }
        }
        break;
      }
      case 'violet': {
        if (!isAbsentFromSwitch && id <= 1025) {
          if (SV_PALDEA_BASE_SPECIES.has(id)) {
            if (SCARLET_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Scarlet';
              whereToFind = 'Exclusive to Pokémon Scarlet';
              pokedexCompletionGuide = 'Trade with a Pokémon Scarlet player';
            } else {
              status = 'base';
              whereToFind = PALDEA_LOCATIONS[id % PALDEA_LOCATIONS.length];
              versionExclusive = VIOLET_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Violet' : 'Available in Both Versions';
              pokedexCompletionGuide = `Catchable in the wild at ${whereToFind}`;
            }
          } else if (SV_TEAL_MASK_SPECIES.has(id)) {
            if (SCARLET_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Scarlet (Teal Mask)';
              whereToFind = 'Exclusive to Pokémon Scarlet (Teal Mask)';
              pokedexCompletionGuide = 'Trade with a Pokémon Scarlet player';
            } else {
              status = 'dlc';
              requiresDlc = true;
              dlcId = 'sv-teal-mask';
              dlcName = 'The Teal Mask DLC';
              whereToFind = 'Kitakami Wilderness, Oni Mountain & Apple Hills';
              versionExclusive = VIOLET_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Violet (Teal Mask)' : 'Available in Both Versions';
              pokedexCompletionGuide = 'Buy The Teal Mask Expansion Pass';
            }
          } else if (SV_INDIGO_DISK_SPECIES.has(id)) {
            if (SCARLET_EXCLUSIVES.has(id)) {
              status = 'unavailable';
              versionExclusive = 'Exclusive to Pokémon Scarlet (Indigo Disk)';
              whereToFind = 'Exclusive to Pokémon Scarlet (Indigo Disk)';
              pokedexCompletionGuide = 'Trade with a Pokémon Scarlet player';
            } else {
              status = 'dlc';
              requiresDlc = true;
              dlcId = 'sv-indigo-disk';
              dlcName = 'The Indigo Disk DLC';
              whereToFind = 'Blueberry Academy Terarium Biomes';
              versionExclusive = VIOLET_EXCLUSIVES.has(id) ? 'Exclusive to Pokémon Violet (Indigo Disk)' : 'Available in Both Versions';
              pokedexCompletionGuide = 'Buy The Indigo Disk Expansion Pass';
            }
          } else if (SV_TRANSFER_ONLY_SPECIES.has(id)) {
            status = 'transfer_only';
            whereToFind = 'Transfer via Pokémon HOME';
            pokedexCompletionGuide = 'Transfer from Pokémon HOME';
          }
        }
        break;
      }
    }

    result[game.id] = {
      gameId: game.id,
      gameShortTitle: game.shortTitle,
      status,
      requiresDlc,
      dlcId,
      dlcName,
      versionExclusive,
      whereToFind,
      acquisitionMethod: whereToFind,
      regionDexLabel: game.baseDexName,
      pokedexCompletionGuide,
    };
  }

  // Map legacy grouped game IDs to guarantee backwards compatibility with previous save data
  const legacyPairs: Array<{ legacyId: LegacyGameId; canonicalIds: CanonicalGameId[]; title: string }> = [
    { legacyId: 'sv', canonicalIds: ['scarlet', 'violet'], title: 'Scarlet & Violet' },
    { legacyId: 'swsh', canonicalIds: ['sword', 'shield'], title: 'Sword & Shield' },
    { legacyId: 'bdsp', canonicalIds: ['bd', 'sp'], title: 'Brilliant Diamond & Shining Pearl' },
    { legacyId: 'lgpe', canonicalIds: ['lgp', 'lge'], title: "Let's Go, Pikachu! & Eevee!" },
    { legacyId: 'rb', canonicalIds: ['red', 'blue'], title: 'Red & Blue' },
    { legacyId: 'gs', canonicalIds: ['gold', 'silver'], title: 'Gold & Silver' },
    { legacyId: 'rse', canonicalIds: ['ruby', 'sapphire', 'emerald'], title: 'Ruby, Sapphire & Emerald' },
    { legacyId: 'frlg', canonicalIds: ['firered', 'leafgreen'], title: 'FireRed & LeafGreen' },
    { legacyId: 'frlg_switch', canonicalIds: ['firered', 'leafgreen'], title: 'FireRed & LeafGreen (Switch)' },
    { legacyId: 'dppt', canonicalIds: ['diamond', 'pearl', 'platinum'], title: 'Diamond, Pearl & Platinum' },
    { legacyId: 'hgss', canonicalIds: ['heartgold', 'soulsilver'], title: 'HeartGold & SoulSilver' },
    { legacyId: 'bw', canonicalIds: ['black', 'white'], title: 'Black & White' },
    { legacyId: 'b2w2', canonicalIds: ['black2', 'white2'], title: 'Black 2 & White 2' },
    { legacyId: 'xy', canonicalIds: ['x', 'y'], title: 'X & Y' },
    { legacyId: 'oras', canonicalIds: ['omegaruby', 'alphasapphire'], title: 'Omega Ruby & Alpha Sapphire' },
    { legacyId: 'sm', canonicalIds: ['sun', 'moon'], title: 'Sun & Moon' },
    { legacyId: 'usum', canonicalIds: ['ultrasun', 'ultramoon'], title: 'Ultra Sun & Ultra Moon' },
  ];

  for (const pair of legacyPairs) {
    const availList = pair.canonicalIds.map((cid) => result[cid]).filter(Boolean) as GameAvailability[];
    const bestAvail =
      availList.find((a) => a.status === 'base') ||
      availList.find((a) => a.status === 'dlc') ||
      availList.find((a) => a.status === 'transfer_only') ||
      availList[0];

    if (bestAvail) {
      result[pair.legacyId] = {
        ...bestAvail,
        gameId: pair.legacyId,
        gameShortTitle: pair.title,
      };
    } else {
      result[pair.legacyId] = {
        gameId: pair.legacyId,
        gameShortTitle: pair.title,
        status: 'unavailable',
        requiresDlc: false,
        versionExclusive: 'Both Versions',
        whereToFind: `Not obtainable in ${pair.title}`,
        acquisitionMethod: `Not obtainable in ${pair.title}`,
        regionDexLabel: pair.title,
        pokedexCompletionGuide: `Unobtainable in ${pair.title}`,
      };
    }
  }

  return result as Record<GameId, GameAvailability>;
}

const DEFAULT_TYPES_CYCLE = [
  ['Grass'],
  ['Fire'],
  ['Water'],
  ['Normal', 'Flying'],
  ['Electric'],
  ['Bug', 'Poison'],
  ['Rock', 'Ground'],
  ['Psychic'],
  ['Ghost', 'Dark'],
  ['Dragon', 'Steel'],
  ['Fairy'],
  ['Fighting'],
  ['Ice', 'Water'],
];

import { ALL_1025_SPECIES_NAMES } from './nationalDexSpeciesNames';

export const STARTER_SPECIES_IDS = new Set<number>([
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  152, 153, 154, 155, 156, 157, 158, 159, 160,
  252, 253, 254, 255, 256, 257, 258, 259, 260,
  387, 388, 389, 390, 391, 392, 393, 394, 395,
  495, 496, 497, 498, 499, 500, 501, 502, 503,
  650, 651, 652, 653, 654, 655, 656, 657, 658,
  722, 723, 724, 725, 726, 727, 728, 729, 730,
  810, 811, 812, 813, 814, 815, 816, 817, 818,
  906, 907, 908, 909, 910, 911, 912, 913, 914,
]);

export const PSEUDO_LEGENDARY_IDS = new Set<number>([
  147, 148, 149, // Dragonite
  246, 247, 248, // Tyranitar
  371, 372, 373, // Salamence
  374, 375, 376, // Metagross
  443, 444, 445, // Garchomp
  633, 634, 635, // Hydreigon
  704, 705, 706, // Goodra
  782, 783, 784, // Kommo-o
  885, 886, 887, // Dragapult
  996, 997, 998, // Baxcalibur
]);

export const PARADOX_IDS = new Set<number>([
  984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995,
  1005, 1006, 1009, 1010, 1020, 1021, 1022, 1023,
]);

export const MYTHICAL_IDS = new Set<number>([
  151, 251, 385, 386, 489, 490, 491, 492, 493,
  494, 647, 648, 649, 719, 720, 721,
  801, 802, 807, 808, 809, 893, 1025,
]);

export const MAJOR_LEGENDARY_IDS = new Set<number>([
  150, 249, 250, 382, 383, 384, 483, 484, 487,
  643, 644, 646, 716, 717, 718, 789, 790, 791, 792, 800,
  888, 889, 890, 898, 1007, 1008,
]);

export const SUB_LEGENDARY_IDS = new Set<number>([
  144, 145, 146, 243, 244, 245, 377, 378, 379, 380, 381,
  480, 481, 482, 485, 486, 488,
  638, 639, 640, 641, 642, 645,
  772, 773, 785, 786, 787, 788,
  793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806,
  891, 892, 894, 895, 896, 897, 905,
  1001, 1002, 1003, 1004, 1014, 1015, 1016, 1017, 1024,
]);

export function buildInitialNationalDex(): PokemonEntry[] {
  const entries: PokemonEntry[] = [];
  for (let id = 1; id <= 1025; id++) {
    const info = ALL_1025_SPECIES_NAMES[id];
    const { generation, region } = getGenerationAndRegion(id);
    const name = info?.name || `Pokémon #${String(id).padStart(4, '0')}`;
    const types = info?.types || DEFAULT_TYPES_CYCLE[id % DEFAULT_TYPES_CYCLE.length];

    const category: PokemonEntry['category'] =
      MAJOR_LEGENDARY_IDS.has(id)
        ? 'Legendary'
        : MYTHICAL_IDS.has(id)
        ? 'Mythical'
        : SUB_LEGENDARY_IDS.has(id)
        ? 'Sub-Legendary'
        : PARADOX_IDS.has(id)
        ? 'Paradox'
        : PSEUDO_LEGENDARY_IDS.has(id)
        ? 'Pseudo-Legendary'
        : STARTER_SPECIES_IDS.has(id)
        ? 'Starter'
        : 'Standard';

    const boxNumber = Math.ceil(id / 30);
    const boxSlot = ((id - 1) % 30) + 1;
    const boxRow = Math.ceil(boxSlot / 6);
    const boxCol = ((boxSlot - 1) % 6) + 1;

    const availability = computeAvailabilityForPokemon(id);
    const homeTransfer = computeHomeTransferInfo(id, name);

    entries.push({
      id,
      name,
      generation,
      region,
      types,
      category,
      boxNumber,
      boxSlot,
      boxRow,
      boxCol,
      availability,
      homeTransfer,
      requiresAnyDlcInSwitchEra: false,
      primarySwitchSource: 'Base Game Catchable',
    });
  }
  return entries;
}
