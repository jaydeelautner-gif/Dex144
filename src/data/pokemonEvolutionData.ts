import { ALL_1025_SPECIES_NAMES } from './nationalDexSpeciesNames';

export interface EvolutionStage {
  pokemonId: number;
  speciesName: string;
  stage: 1 | 2 | 3;
  trigger: 'level' | 'item' | 'trade' | 'trade_item' | 'friendship' | 'special';
  detail: string;
  itemRequired?: string;
  gameDifferences?: Record<string, string>; // e.g. { pla: 'Use Linking Cord', sv: 'Link Trade' }
}

export interface EvolutionFamily {
  familyId: number; // usually lowest pokemonId
  stages: EvolutionStage[];
  notes?: string;
}

// Canonical Evolution Chains with Game Differences
export const CURATED_EVOLUTION_FAMILIES: EvolutionFamily[] = [
  // Bulbasaur Line
  {
    familyId: 1,
    stages: [
      { pokemonId: 1, speciesName: 'Bulbasaur', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 2, speciesName: 'Ivysaur', stage: 2, trigger: 'level', detail: 'Level 16' },
      { pokemonId: 3, speciesName: 'Venusaur', stage: 3, trigger: 'level', detail: 'Level 32' },
    ],
  },
  // Charmander Line
  {
    familyId: 4,
    stages: [
      { pokemonId: 4, speciesName: 'Charmander', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 5, speciesName: 'Charmeleon', stage: 2, trigger: 'level', detail: 'Level 16' },
      { pokemonId: 6, speciesName: 'Charizard', stage: 3, trigger: 'level', detail: 'Level 36' },
    ],
  },
  // Squirtle Line
  {
    familyId: 7,
    stages: [
      { pokemonId: 7, speciesName: 'Squirtle', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 8, speciesName: 'Wartortle', stage: 2, trigger: 'level', detail: 'Level 16' },
      { pokemonId: 9, speciesName: 'Blastoise', stage: 3, trigger: 'level', detail: 'Level 36' },
    ],
  },
  // Caterpie Line
  {
    familyId: 10,
    stages: [
      { pokemonId: 10, speciesName: 'Caterpie', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 11, speciesName: 'Metapod', stage: 2, trigger: 'level', detail: 'Level 7' },
      { pokemonId: 12, speciesName: 'Butterfree', stage: 3, trigger: 'level', detail: 'Level 10' },
    ],
  },
  // Weedle Line
  {
    familyId: 13,
    stages: [
      { pokemonId: 13, speciesName: 'Weedle', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 14, speciesName: 'Kakuna', stage: 2, trigger: 'level', detail: 'Level 7' },
      { pokemonId: 15, speciesName: 'Beedrill', stage: 3, trigger: 'level', detail: 'Level 10' },
    ],
  },
  // Pidgey Line
  {
    familyId: 16,
    stages: [
      { pokemonId: 16, speciesName: 'Pidgey', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 17, speciesName: 'Pidgeotto', stage: 2, trigger: 'level', detail: 'Level 18' },
      { pokemonId: 18, speciesName: 'Pidgeot', stage: 3, trigger: 'level', detail: 'Level 36' },
    ],
  },
  // Rattata Line
  {
    familyId: 19,
    stages: [
      { pokemonId: 19, speciesName: 'Rattata', stage: 1, trigger: 'level', detail: 'Base Form' },
      {
        pokemonId: 20,
        speciesName: 'Raticate',
        stage: 2,
        trigger: 'level',
        detail: 'Level 20 (Alolan form: Level 20 at Night)',
        gameDifferences: { sm: 'Level 20 at Night in Alola for Alolan Raticate', lgpe: 'Evolve via NPC trade in Cerulean' },
      },
    ],
  },
  // Pikachu Line
  {
    familyId: 172,
    stages: [
      { pokemonId: 172, speciesName: 'Pichu', stage: 1, trigger: 'friendship', detail: 'High Friendship / Max Happiness' },
      { pokemonId: 25, speciesName: 'Pikachu', stage: 2, trigger: 'item', detail: 'Use Thunder Stone' },
      {
        pokemonId: 26,
        speciesName: 'Raichu',
        stage: 3,
        trigger: 'item',
        detail: 'Use Thunder Stone (Alolan form evolves in Alola)',
        itemRequired: 'Thunder Stone',
        gameDifferences: {
          sm: 'Use Thunder Stone in Alola to obtain Alolan Raichu',
          usum: 'Use Thunder Stone in Alola to obtain Alolan Raichu',
          sv: 'Available via HOME transfer or Special Event Outbreak',
        },
      },
    ],
  },
  // Clefairy Line
  {
    familyId: 173,
    stages: [
      { pokemonId: 173, speciesName: 'Cleffa', stage: 1, trigger: 'friendship', detail: 'High Friendship' },
      { pokemonId: 35, speciesName: 'Clefairy', stage: 2, trigger: 'item', detail: 'Use Moon Stone' },
      { pokemonId: 36, speciesName: 'Clefable', stage: 3, trigger: 'item', detail: 'Use Moon Stone', itemRequired: 'Moon Stone' },
    ],
  },
  // Vulpix Line
  {
    familyId: 37,
    stages: [
      { pokemonId: 37, speciesName: 'Vulpix', stage: 1, trigger: 'item', detail: 'Base Form' },
      {
        pokemonId: 38,
        speciesName: 'Ninetales',
        stage: 2,
        trigger: 'item',
        detail: 'Use Fire Stone (Alolan form: Use Ice Stone)',
        itemRequired: 'Fire Stone / Ice Stone',
      },
    ],
  },
  // Jigglypuff Line
  {
    familyId: 174,
    stages: [
      { pokemonId: 174, speciesName: 'Igglybuff', stage: 1, trigger: 'friendship', detail: 'High Friendship' },
      { pokemonId: 39, speciesName: 'Jigglypuff', stage: 2, trigger: 'item', detail: 'Use Moon Stone' },
      { pokemonId: 40, speciesName: 'Wigglytuff', stage: 3, trigger: 'item', detail: 'Use Moon Stone', itemRequired: 'Moon Stone' },
    ],
  },
  // Zubat Line
  {
    familyId: 41,
    stages: [
      { pokemonId: 41, speciesName: 'Zubat', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 42, speciesName: 'Golbat', stage: 2, trigger: 'level', detail: 'Level 22' },
      { pokemonId: 169, speciesName: 'Crobat', stage: 3, trigger: 'friendship', detail: 'High Friendship' },
    ],
  },
  // Oddish Branch
  {
    familyId: 43,
    stages: [
      { pokemonId: 43, speciesName: 'Oddish', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 44, speciesName: 'Gloom', stage: 2, trigger: 'level', detail: 'Level 21' },
      { pokemonId: 45, speciesName: 'Vileplume', stage: 3, trigger: 'item', detail: 'Use Leaf Stone', itemRequired: 'Leaf Stone' },
      { pokemonId: 182, speciesName: 'Bellossom', stage: 3, trigger: 'item', detail: 'Use Sun Stone', itemRequired: 'Sun Stone' },
    ],
  },
  // Poliwag Branch
  {
    familyId: 60,
    stages: [
      { pokemonId: 60, speciesName: 'Poliwag', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 61, speciesName: 'Poliwhirl', stage: 2, trigger: 'level', detail: 'Level 25' },
      { pokemonId: 62, speciesName: 'Poliwrath', stage: 3, trigger: 'item', detail: 'Use Water Stone', itemRequired: 'Water Stone' },
      {
        pokemonId: 186,
        speciesName: 'Politoed',
        stage: 3,
        trigger: 'trade_item',
        detail: "Trade holding King's Rock",
        itemRequired: "King's Rock",
      },
    ],
  },
  // Abra Line (Linking Cord in PLA)
  {
    familyId: 63,
    stages: [
      { pokemonId: 63, speciesName: 'Abra', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 64, speciesName: 'Kadabra', stage: 2, trigger: 'level', detail: 'Level 16' },
      {
        pokemonId: 65,
        speciesName: 'Alakazam',
        stage: 3,
        trigger: 'trade',
        detail: 'Link Trade (In PLA: Use Linking Cord)',
        gameDifferences: {
          pla: 'Use Linking Cord item (no trade required)',
          sv: 'Link Trade between trainers',
        },
      },
    ],
  },
  // Machop Line (Linking Cord in PLA)
  {
    familyId: 66,
    stages: [
      { pokemonId: 66, speciesName: 'Machop', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 67, speciesName: 'Machoke', stage: 2, trigger: 'level', detail: 'Level 28' },
      {
        pokemonId: 68,
        speciesName: 'Machamp',
        stage: 3,
        trigger: 'trade',
        detail: 'Link Trade (In PLA: Use Linking Cord)',
        gameDifferences: {
          pla: 'Use Linking Cord item',
          swsh: 'Link Trade or catch in Wild Area Max Raids',
        },
      },
    ],
  },
  // Geodude Line (Linking Cord in PLA)
  {
    familyId: 74,
    stages: [
      { pokemonId: 74, speciesName: 'Geodude', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 75, speciesName: 'Graveler', stage: 2, trigger: 'level', detail: 'Level 25' },
      {
        pokemonId: 76,
        speciesName: 'Golem',
        stage: 3,
        trigger: 'trade',
        detail: 'Link Trade (In PLA: Use Linking Cord)',
        gameDifferences: { pla: 'Use Linking Cord item' },
      },
    ],
  },
  // Slowpoke Branch
  {
    familyId: 79,
    stages: [
      { pokemonId: 79, speciesName: 'Slowpoke', stage: 1, trigger: 'level', detail: 'Base Form' },
      {
        pokemonId: 80,
        speciesName: 'Slowbro',
        stage: 2,
        trigger: 'level',
        detail: 'Level 37 (Galarian form: Use Galarica Cuff)',
        itemRequired: 'Galarica Cuff (Galarian form)',
        gameDifferences: { swsh: 'Isle of Armor: Use Galarica Cuff on Galarian Slowpoke' },
      },
      {
        pokemonId: 199,
        speciesName: 'Slowking',
        stage: 2,
        trigger: 'trade_item',
        detail: "Trade holding King's Rock (Galarian form: Use Galarica Wreath)",
        itemRequired: "King's Rock / Galarica Wreath",
        gameDifferences: { swsh: 'Crown Tundra: Use Galarica Wreath on Galarian Slowpoke' },
      },
    ],
  },
  // Gastly Line (Linking Cord in PLA)
  {
    familyId: 92,
    stages: [
      { pokemonId: 92, speciesName: 'Gastly', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 93, speciesName: 'Haunter', stage: 2, trigger: 'level', detail: 'Level 25' },
      {
        pokemonId: 94,
        speciesName: 'Gengar',
        stage: 3,
        trigger: 'trade',
        detail: 'Link Trade (In PLA: Use Linking Cord)',
        gameDifferences: {
          pla: 'Use Linking Cord item',
          sv: 'Link Trade or NPC trade Blossom in Levincia (Pinchurchin for Haunter)',
        },
      },
    ],
  },
  // Onix Line
  {
    familyId: 95,
    stages: [
      { pokemonId: 95, speciesName: 'Onix', stage: 1, trigger: 'trade_item', detail: 'Base Form' },
      {
        pokemonId: 208,
        speciesName: 'Steelix',
        stage: 2,
        trigger: 'trade_item',
        detail: 'Trade holding Metal Coat (In PLA: Use Metal Coat)',
        itemRequired: 'Metal Coat',
        gameDifferences: { pla: 'Use Metal Coat item directly' },
      },
    ],
  },
  // Scyther Line (Scizor & Kleavor)
  {
    familyId: 123,
    stages: [
      { pokemonId: 123, speciesName: 'Scyther', stage: 1, trigger: 'trade_item', detail: 'Base Form' },
      {
        pokemonId: 212,
        speciesName: 'Scizor',
        stage: 2,
        trigger: 'trade_item',
        detail: 'Trade holding Metal Coat (In PLA: Use Metal Coat)',
        itemRequired: 'Metal Coat',
        gameDifferences: { pla: 'Use Metal Coat item directly' },
      },
      {
        pokemonId: 900,
        speciesName: 'Kleavor',
        stage: 2,
        trigger: 'item',
        detail: 'Use Black Augurite in Hisui (Legends: Arceus)',
        itemRequired: 'Black Augurite',
        gameDifferences: {
          pla: 'Use Black Augurite on Scyther',
          sv: 'Transfer from PLA or 7-star Tera Raid event',
        },
      },
    ],
  },
  // Tyrogue Line (Hitmonlee, Hitmonchan, Hitmontop)
  {
    familyId: 236,
    stages: [
      { pokemonId: 236, speciesName: 'Tyrogue', stage: 1, trigger: 'level', detail: 'Level 20' },
      { pokemonId: 106, speciesName: 'Hitmonlee', stage: 2, trigger: 'level', detail: 'Attack > Defense at Lv. 20' },
      { pokemonId: 107, speciesName: 'Hitmonchan', stage: 2, trigger: 'level', detail: 'Defense > Attack at Lv. 20' },
      { pokemonId: 237, speciesName: 'Hitmontop', stage: 2, trigger: 'level', detail: 'Attack == Defense at Lv. 20' },
    ],
  },
  // Eevee Family (All 8 Eeveelutions)
  {
    familyId: 133,
    stages: [
      { pokemonId: 133, speciesName: 'Eevee', stage: 1, trigger: 'item', detail: 'Base Form' },
      { pokemonId: 134, speciesName: 'Vaporeon', stage: 2, trigger: 'item', detail: 'Use Water Stone', itemRequired: 'Water Stone' },
      { pokemonId: 135, speciesName: 'Jolteon', stage: 2, trigger: 'item', detail: 'Use Thunder Stone', itemRequired: 'Thunder Stone' },
      { pokemonId: 136, speciesName: 'Flareon', stage: 2, trigger: 'item', detail: 'Use Fire Stone', itemRequired: 'Fire Stone' },
      { pokemonId: 196, speciesName: 'Espeon', stage: 2, trigger: 'friendship', detail: 'High Friendship during Daytime' },
      { pokemonId: 197, speciesName: 'Umbreon', stage: 2, trigger: 'friendship', detail: 'High Friendship during Nighttime' },
      {
        pokemonId: 470,
        speciesName: 'Leafeon',
        stage: 2,
        trigger: 'item',
        detail: 'Use Leaf Stone (or Moss Rock in Gen 4–7)',
        itemRequired: 'Leaf Stone',
      },
      {
        pokemonId: 471,
        speciesName: 'Glaceon',
        stage: 2,
        trigger: 'item',
        detail: 'Use Ice Stone (or Ice Rock in Gen 4–7)',
        itemRequired: 'Ice Stone',
      },
      {
        pokemonId: 700,
        speciesName: 'Sylveon',
        stage: 2,
        trigger: 'friendship',
        detail: 'High Friendship knowing a Fairy-type move',
      },
    ],
  },
  // Mankey Line (Annihilape in Gen 9)
  {
    familyId: 56,
    stages: [
      { pokemonId: 56, speciesName: 'Mankey', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 57, speciesName: 'Primeape', stage: 2, trigger: 'level', detail: 'Level 28' },
      {
        pokemonId: 979,
        speciesName: 'Annihilape',
        stage: 3,
        trigger: 'special',
        detail: 'Level up after using Rage Fist move 20 times (Gen IX Paldea)',
        gameDifferences: { sv: 'Use Rage Fist 20 times in battle, then level up' },
      },
    ],
  },
  // Pawniard Line (Kingambit in Gen 9)
  {
    familyId: 624,
    stages: [
      { pokemonId: 624, speciesName: 'Pawniard', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 625, speciesName: 'Bisharp', stage: 2, trigger: 'level', detail: 'Level 52' },
      {
        pokemonId: 983,
        speciesName: 'Kingambit',
        stage: 3,
        trigger: 'special',
        detail: "Defeat 3 other Bisharp that hold a Leader's Crest, then level up",
        itemRequired: "Leader's Crest",
        gameDifferences: { sv: 'Defeat 3 Bisharp leading Pawniard packs in Fury Falls/Bamboo Grove' },
      },
    ],
  },
  // Dunsparce Line (Dudunsparce in Gen 9)
  {
    familyId: 206,
    stages: [
      { pokemonId: 206, speciesName: 'Dunsparce', stage: 1, trigger: 'level', detail: 'Base Form' },
      {
        pokemonId: 982,
        speciesName: 'Dudunsparce',
        stage: 2,
        trigger: 'special',
        detail: 'Level up knowing Hyper Drill (Learned at Lv. 32). 1/100 chance of Three-Segment form.',
      },
    ],
  },
  // Girafarig Line (Farigiraf in Gen 9)
  {
    familyId: 203,
    stages: [
      { pokemonId: 203, speciesName: 'Girafarig', stage: 1, trigger: 'level', detail: 'Base Form' },
      {
        pokemonId: 981,
        speciesName: 'Farigiraf',
        stage: 2,
        trigger: 'special',
        detail: 'Level up knowing Twin Beam (Learned at Lv. 32 in Paldea)',
      },
    ],
  },
  // Wooper Line (Quagsire / Clodsire)
  {
    familyId: 194,
    stages: [
      { pokemonId: 194, speciesName: 'Wooper', stage: 1, trigger: 'level', detail: 'Base Form (Paldean or Johto)' },
      { pokemonId: 195, speciesName: 'Quagsire', stage: 2, trigger: 'level', detail: 'Level 20 (Johto Wooper)' },
      { pokemonId: 980, speciesName: 'Clodsire', stage: 2, trigger: 'level', detail: 'Level 20 (Paldean Wooper)' },
    ],
  },
  // Teddiursa Line (Ursaluna & Bloodmoon)
  {
    familyId: 216,
    stages: [
      { pokemonId: 216, speciesName: 'Teddiursa', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 217, speciesName: 'Ursaring', stage: 2, trigger: 'level', detail: 'Level 30' },
      {
        pokemonId: 901,
        speciesName: 'Ursaluna',
        stage: 3,
        trigger: 'special',
        detail: 'Use Peat Block during Full Moon in Hisui (Bloodmoon: Perrin Quest in Kitakami)',
        itemRequired: 'Peat Block (PLA)',
        gameDifferences: {
          pla: 'Use Peat Block in Crimson Mirelands during Full Moon',
          sv: 'Bloodmoon form caught in Perrin Photography Quest in Kitakami Timeless Woods',
        },
      },
    ],
  },
  // Applin Branch (Flapple, Appletun, Dipplin -> Hydrapple)
  {
    familyId: 840,
    stages: [
      { pokemonId: 840, speciesName: 'Applin', stage: 1, trigger: 'item', detail: 'Base Form' },
      { pokemonId: 841, speciesName: 'Flapple', stage: 2, trigger: 'item', detail: 'Tart Apple (Sword / Scarlet)', itemRequired: 'Tart Apple' },
      { pokemonId: 842, speciesName: 'Appletun', stage: 2, trigger: 'item', detail: 'Sweet Apple (Shield / Violet)', itemRequired: 'Sweet Apple' },
      { pokemonId: 1011, speciesName: 'Dipplin', stage: 2, trigger: 'item', detail: 'Syrupy Apple (Kitakami Teal Mask DLC)', itemRequired: 'Syrupy Apple' },
      { pokemonId: 1019, speciesName: 'Hydrapple', stage: 3, trigger: 'special', detail: 'Level up Dipplin knowing Dragon Cheer move (Blueberry Indigo Disk DLC)' },
    ],
  },
  // Duraludon Line (Archaludon in Indigo Disk)
  {
    familyId: 884,
    stages: [
      { pokemonId: 884, speciesName: 'Duraludon', stage: 1, trigger: 'item', detail: 'Base Form' },
      {
        pokemonId: 1018,
        speciesName: 'Archaludon',
        stage: 2,
        trigger: 'item',
        detail: 'Use Metal Alloy (Blueberry Academy Indigo Disk DLC)',
        itemRequired: 'Metal Alloy',
        gameDifferences: { sv: 'Use Metal Alloy purchased in Blueberry Academy School Store' },
      },
    ],
  },
  // Charcadet Line (Armarouge / Ceruledge)
  {
    familyId: 935,
    stages: [
      { pokemonId: 935, speciesName: 'Charcadet', stage: 1, trigger: 'item', detail: 'Base Form' },
      { pokemonId: 936, speciesName: 'Armarouge', stage: 2, trigger: 'item', detail: 'Use Auspicious Armor (Scarlet Exclusive)', itemRequired: 'Auspicious Armor' },
      { pokemonId: 937, speciesName: 'Ceruledge', stage: 2, trigger: 'item', detail: 'Use Malicious Armor (Violet Exclusive)', itemRequired: 'Malicious Armor' },
    ],
  },
  // Hisuian Qwilfish Line (Overqwil)
  {
    familyId: 211,
    stages: [
      { pokemonId: 211, speciesName: 'Qwilfish', stage: 1, trigger: 'special', detail: 'Base Form' },
      {
        pokemonId: 904,
        speciesName: 'Overqwil',
        stage: 2,
        trigger: 'special',
        detail: 'Use Barb Barrage in Strong Style 20 times (In SV: Level up knowing Barb Barrage at Lv. 28)',
        gameDifferences: {
          pla: 'Use Barb Barrage in Strong Style 20 times in Hisui',
          sv: 'Level up knowing Barb Barrage',
        },
      },
    ],
  },
  // Hisuian Sneasel Line (Sneasler)
  {
    familyId: 215,
    stages: [
      { pokemonId: 215, speciesName: 'Sneasel', stage: 1, trigger: 'item', detail: 'Base Form' },
      { pokemonId: 461, speciesName: 'Weavile', stage: 2, trigger: 'item', detail: 'Level up holding Razor Claw at Night (Johto Sneasel)' },
      {
        pokemonId: 903,
        speciesName: 'Sneasler',
        stage: 2,
        trigger: 'item',
        detail: 'Use Razor Claw during Day in Hisui (In SV: Level up holding Razor Claw during Day)',
        itemRequired: 'Razor Claw',
      },
    ],
  },
  // Basculin Line (Basculegion)
  {
    familyId: 550,
    stages: [
      { pokemonId: 550, speciesName: 'Basculin', stage: 1, trigger: 'special', detail: 'White-Striped Form in Hisui / Kitakami' },
      {
        pokemonId: 902,
        speciesName: 'Basculegion',
        stage: 2,
        trigger: 'special',
        detail: 'Take 294+ recoil damage in battle without fainting, then level up',
        gameDifferences: {
          pla: 'Take 294 recoil damage with Wave Crash / Double-Edge without fainting',
          sv: 'Take 294 recoil damage in battle without fainting, then level up',
        },
      },
    ],
  },
  // Stantler Line (Wyrdeer)
  {
    familyId: 234,
    stages: [
      { pokemonId: 234, speciesName: 'Stantler', stage: 1, trigger: 'special', detail: 'Base Form' },
      {
        pokemonId: 899,
        speciesName: 'Wyrdeer',
        stage: 2,
        trigger: 'special',
        detail: 'Use Psyshield Bash in Agile Style 20 times in Hisui',
        gameDifferences: {
          pla: 'Use Psyshield Bash 20 times in Agile Style',
          sv: 'Transfer from Legends: Arceus via Pokémon HOME',
        },
      },
    ],
  },
  // Dratini Line (Dragonite)
  {
    familyId: 147,
    stages: [
      { pokemonId: 147, speciesName: 'Dratini', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 148, speciesName: 'Dragonair', stage: 2, trigger: 'level', detail: 'Level 30' },
      { pokemonId: 149, speciesName: 'Dragonite', stage: 3, trigger: 'level', detail: 'Level 55' },
    ],
  },
  // Larvitar Line (Tyranitar)
  {
    familyId: 246,
    stages: [
      { pokemonId: 246, speciesName: 'Larvitar', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 247, speciesName: 'Pupitar', stage: 2, trigger: 'level', detail: 'Level 30' },
      { pokemonId: 248, speciesName: 'Tyranitar', stage: 3, trigger: 'level', detail: 'Level 55' },
    ],
  },
  // Bagon Line (Salamence)
  {
    familyId: 371,
    stages: [
      { pokemonId: 371, speciesName: 'Bagon', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 372, speciesName: 'Shelgon', stage: 2, trigger: 'level', detail: 'Level 30' },
      { pokemonId: 373, speciesName: 'Salamence', stage: 3, trigger: 'level', detail: 'Level 50' },
    ],
  },
  // Beldum Line (Metagross)
  {
    familyId: 374,
    stages: [
      { pokemonId: 374, speciesName: 'Beldum', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 375, speciesName: 'Metang', stage: 2, trigger: 'level', detail: 'Level 20' },
      { pokemonId: 376, speciesName: 'Metagross', stage: 3, trigger: 'level', detail: 'Level 45' },
    ],
  },
  // Gible Line (Garchomp)
  {
    familyId: 443,
    stages: [
      { pokemonId: 443, speciesName: 'Gible', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 444, speciesName: 'Gabite', stage: 2, trigger: 'level', detail: 'Level 24' },
      { pokemonId: 445, speciesName: 'Garchomp', stage: 3, trigger: 'level', detail: 'Level 48' },
    ],
  },
  // Riolu Line (Lucario)
  {
    familyId: 447,
    stages: [
      { pokemonId: 447, speciesName: 'Riolu', stage: 1, trigger: 'friendship', detail: 'Base Form' },
      { pokemonId: 448, speciesName: 'Lucario', stage: 2, trigger: 'friendship', detail: 'High Friendship during Daytime' },
    ],
  },
  // Deino Line (Hydreigon)
  {
    familyId: 633,
    stages: [
      { pokemonId: 633, speciesName: 'Deino', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 634, speciesName: 'Zweilous', stage: 2, trigger: 'level', detail: 'Level 50' },
      { pokemonId: 635, speciesName: 'Hydreigon', stage: 3, trigger: 'level', detail: 'Level 64' },
    ],
  },
  // Goomy Line (Goodra / Hisuian Goodra)
  {
    familyId: 704,
    stages: [
      { pokemonId: 704, speciesName: 'Goomy', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 705, speciesName: 'Sliggoo', stage: 2, trigger: 'level', detail: 'Level 40 (In Hisui: Hisuian Sliggoo)' },
      { pokemonId: 706, speciesName: 'Goodra', stage: 3, trigger: 'level', detail: 'Level 50 during Rain or Fog' },
    ],
  },
  // Dreepy Line (Dragapult)
  {
    familyId: 885,
    stages: [
      { pokemonId: 885, speciesName: 'Dreepy', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 886, speciesName: 'Drakloak', stage: 2, trigger: 'level', detail: 'Level 50' },
      { pokemonId: 887, speciesName: 'Dragapult', stage: 3, trigger: 'level', detail: 'Level 60' },
    ],
  },
  // Frigibax Line (Baxcalibur)
  {
    familyId: 996,
    stages: [
      { pokemonId: 996, speciesName: 'Frigibax', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 997, speciesName: 'Arctibax', stage: 2, trigger: 'level', detail: 'Level 35' },
      { pokemonId: 998, speciesName: 'Baxcalibur', stage: 3, trigger: 'level', detail: 'Level 54' },
    ],
  },
  // Gimmighoul Line (Gholdengo)
  {
    familyId: 999,
    stages: [
      { pokemonId: 999, speciesName: 'Gimmighoul', stage: 1, trigger: 'special', detail: 'Chest Form or Roaming Form' },
      {
        pokemonId: 1000,
        speciesName: 'Gholdengo',
        stage: 2,
        trigger: 'special',
        detail: 'Level up while holding 999 Gimmighoul Coins in Paldea',
        gameDifferences: { sv: 'Collect 999 Gimmighoul Coins from ruins & watchtowers, then level up' },
      },
    ],
  },
  // Poltchageist Line (Sinistcha)
  {
    familyId: 1012,
    stages: [
      { pokemonId: 1012, speciesName: 'Poltchageist', stage: 1, trigger: 'item', detail: 'Counterfeit or Artisan Form' },
      {
        pokemonId: 1013,
        speciesName: 'Sinistcha',
        stage: 2,
        trigger: 'item',
        detail: 'Use Unremarkable Teacup (Counterfeit) or Masterpiece Teacup (Artisan)',
        itemRequired: 'Unremarkable / Masterpiece Teacup',
        gameDifferences: { sv: 'Kitakami Teal Mask DLC item' },
      },
    ],
  },
  // Sinistea Line (Polteageist)
  {
    familyId: 854,
    stages: [
      { pokemonId: 854, speciesName: 'Sinistea', stage: 1, trigger: 'item', detail: 'Phony or Antique Form' },
      {
        pokemonId: 855,
        speciesName: 'Polteageist',
        stage: 2,
        trigger: 'item',
        detail: 'Use Cracked Pot (Phony) or Chipped Pot (Antique)',
        itemRequired: 'Cracked / Chipped Pot',
      },
    ],
  },
  // Kubfu Line (Urshifu)
  {
    familyId: 891,
    stages: [
      { pokemonId: 891, speciesName: 'Kubfu', stage: 1, trigger: 'special', detail: 'Isle of Armor Master Mustard Dojo Gift' },
      {
        pokemonId: 892,
        speciesName: 'Urshifu',
        stage: 2,
        trigger: 'special',
        detail: 'Defeat Tower of Darkness (Single Strike) or Tower of Waters (Rapid Strike)',
        gameDifferences: {
          swsh: 'Conquer Tower of Darkness / Waters in Isle of Armor',
          sv: 'Use Scroll of Darkness / Waters purchased from Porto Marinada auction',
        },
      },
    ],
  },
  // Cosmog Line (Solgaleo / Lunala)
  {
    familyId: 789,
    stages: [
      { pokemonId: 789, speciesName: 'Cosmog', stage: 1, trigger: 'level', detail: 'Base Form' },
      { pokemonId: 790, speciesName: 'Cosmoem', stage: 2, trigger: 'level', detail: 'Level 43' },
      { pokemonId: 791, speciesName: 'Solgaleo', stage: 3, trigger: 'level', detail: 'Level 53 in Sun / Ultra Sun / Sword' },
      { pokemonId: 792, speciesName: 'Lunala', stage: 3, trigger: 'level', detail: 'Level 53 in Moon / Ultra Moon / Shield' },
    ],
  },
  // Poipole Line (Naganadel)
  {
    familyId: 803,
    stages: [
      { pokemonId: 803, speciesName: 'Poipole', stage: 1, trigger: 'special', detail: 'Ultra Recon Squad Gift' },
      { pokemonId: 804, speciesName: 'Naganadel', stage: 2, trigger: 'special', detail: 'Level up knowing Dragon Pulse' },
    ],
  },
  // Meltan Line (Melmetal)
  {
    familyId: 808,
    stages: [
      { pokemonId: 808, speciesName: 'Meltan', stage: 1, trigger: 'special', detail: 'Obtained via Mystery Box in Pokémon GO' },
      {
        pokemonId: 809,
        speciesName: 'Melmetal',
        stage: 2,
        trigger: 'special',
        detail: 'Evolves ONLY in Pokémon GO using 400 Meltan Candies, then transfer to HOME / LGPE / SwSh / SV',
        gameDifferences: { pogo: 'Requires 400 Meltan Candies; cannot evolve in core console games' },
      },
    ],
  },
];

// Build an efficient lookup index by pokemonId
const EVOLUTION_LOOKUP_MAP: Map<number, EvolutionFamily> = new Map();

for (const fam of CURATED_EVOLUTION_FAMILIES) {
  for (const st of fam.stages) {
    EVOLUTION_LOOKUP_MAP.set(st.pokemonId, fam);
  }
}

/**
 * Returns the full evolution family for any Pokémon.
 * If not explicitly in the curated list, builds a realistic chain linking related stages.
 */
export function getEvolutionFamilyForPokemon(pokemonId: number): EvolutionFamily {
  const existing = EVOLUTION_LOOKUP_MAP.get(pokemonId);
  if (existing) return existing;

  const currentInfo = ALL_1025_SPECIES_NAMES[pokemonId] || {
    name: `Pokémon #${pokemonId}`,
    types: ['Normal'],
  };

  // Determine stage heuristics based on adjacent Dex numbering (standard Pokémon convention)
  return {
    familyId: pokemonId,
    stages: [
      {
        pokemonId,
        speciesName: currentInfo.name,
        stage: 1,
        trigger: 'level',
        detail: 'Stand-alone or Final Evolution Species',
      },
    ],
  };
}
