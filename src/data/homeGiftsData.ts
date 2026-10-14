export interface HomeGiftPokemonDefinition {
  pokemonId: number;
  speciesName: string;
  defaultVariantSuffix?: string;
  fixedLevel?: number;
  description: string;
  isShiny?: boolean;
}

export const HOME_GIFT_POKEMON_MAP: Record<number, HomeGiftPokemonDefinition> = {
  1: {
    pokemonId: 1,
    speciesName: 'Bulbasaur',
    fixedLevel: 5,
    description: 'Special Gigantamax Factor gift distributed via Pokémon HOME Mobile App',
  },
  4: {
    pokemonId: 4,
    speciesName: 'Charmander',
    fixedLevel: 5,
    description: 'Initial Kanto Starter gift received from Grand Oak in Pokémon HOME',
  },
  7: {
    pokemonId: 7,
    speciesName: 'Squirtle',
    fixedLevel: 5,
    description: 'Special Gigantamax Factor gift distributed via Pokémon HOME Mobile App',
  },
  25: {
    pokemonId: 25,
    speciesName: 'Pikachu',
    fixedLevel: 5,
    description: 'Initial Pokémon HOME log-in gift on Nintendo Switch / Mobile',
  },
  132: {
    pokemonId: 132,
    speciesName: 'Ditto',
    fixedLevel: 10,
    description: 'Wonder Box trading milestone achievement gift in Pokémon HOME',
  },
  133: {
    pokemonId: 133,
    speciesName: 'Eevee',
    fixedLevel: 5,
    description: 'Special Hidden Ability Eevee gift for depositing Pokémon into HOME',
  },
  155: {
    pokemonId: 155,
    speciesName: 'Cyndaquil',
    fixedLevel: 5,
    description: 'Legends: Arceus link gift with maxed effort levels in Pokémon HOME',
  },
  172: {
    pokemonId: 172,
    speciesName: 'Pichu',
    fixedLevel: 5,
    description: 'Binder sticker milestone achievement gift in Pokémon HOME Mobile App',
  },
  387: {
    pokemonId: 387,
    speciesName: 'Turtwig',
    fixedLevel: 5,
    description: 'Brilliant Diamond / Shining Pearl link gift with Hidden Ability Shell Armor',
  },
  390: {
    pokemonId: 390,
    speciesName: 'Chimchar',
    fixedLevel: 5,
    description: 'Brilliant Diamond / Shining Pearl link gift with Hidden Ability Iron Fist',
  },
  393: {
    pokemonId: 393,
    speciesName: 'Piplup',
    fixedLevel: 5,
    description: 'Brilliant Diamond / Shining Pearl link gift with Hidden Ability Defiant',
  },
  479: {
    pokemonId: 479,
    speciesName: 'Rotom',
    fixedLevel: 10,
    description: 'Special GTS trade achievement gift in Pokémon HOME',
  },
  490: {
    pokemonId: 490,
    speciesName: 'Manaphy',
    fixedLevel: 1,
    description: 'Special event Mystery Gift distribution in Pokémon HOME',
  },
  501: {
    pokemonId: 501,
    speciesName: 'Oshawott',
    fixedLevel: 5,
    description: 'Legends: Arceus link gift with maxed effort levels in Pokémon HOME',
  },
  722: {
    pokemonId: 722,
    speciesName: 'Rowlet',
    fixedLevel: 5,
    description: 'Legends: Arceus link gift with maxed effort levels in Pokémon HOME',
  },
  801: {
    pokemonId: 801,
    speciesName: 'Magearna',
    defaultVariantSuffix: 'original-color',
    fixedLevel: 50,
    description: 'Grand Prize Original Color Magearna gift for completing the National Pokédex in Pokémon HOME',
  },
  807: {
    pokemonId: 807,
    speciesName: 'Zeraora',
    fixedLevel: 100,
    isShiny: true,
    description: 'Global 1,000,000 Raid defeat celebration Shiny Zeraora gift in Pokémon HOME',
  },
  808: {
    pokemonId: 808,
    speciesName: 'Meltan',
    fixedLevel: 1,
    description: 'Mystery Box activation gift from Pokémon GO transfer connection to Pokémon HOME',
  },
  809: {
    pokemonId: 809,
    speciesName: 'Melmetal',
    defaultVariantSuffix: 'gmax',
    fixedLevel: 100,
    description: 'Special Gigantamax-capable Melmetal Mystery Gift for sending first Pokémon from GO to HOME',
  },
  810: {
    pokemonId: 810,
    speciesName: 'Grookey',
    fixedLevel: 5,
    description: 'Sword & Shield link gift with Hidden Ability Grassy Surge in Pokémon HOME',
  },
  813: {
    pokemonId: 813,
    speciesName: 'Scorbunny',
    fixedLevel: 5,
    description: 'Sword & Shield link gift with Hidden Ability Libero in Pokémon HOME',
  },
  816: {
    pokemonId: 816,
    speciesName: 'Sobble',
    fixedLevel: 5,
    description: 'Sword & Shield link gift with Hidden Ability Sniper in Pokémon HOME',
  },
  906: {
    pokemonId: 906,
    speciesName: 'Sprigatito',
    fixedLevel: 5,
    description: 'Scarlet & Violet link gift with Hidden Ability Protean in Pokémon HOME',
  },
  909: {
    pokemonId: 909,
    speciesName: 'Fuecoco',
    fixedLevel: 5,
    description: 'Scarlet & Violet link gift with Hidden Ability Unaware in Pokémon HOME',
  },
  912: {
    pokemonId: 912,
    speciesName: 'Quaxly',
    fixedLevel: 5,
    description: 'Scarlet & Violet link gift with Hidden Ability Moxie in Pokémon HOME',
  },
};

/**
 * Checks whether a Pokémon species can be received as a Gift in Pokémon HOME.
 */
export function canBeHomeGift(pokemonId: number): boolean {
  return Boolean(HOME_GIFT_POKEMON_MAP[pokemonId]);
}

/**
 * Gets details about the Pokémon HOME gift if available.
 */
export function getHomeGiftInfo(pokemonId: number): HomeGiftPokemonDefinition | undefined {
  return HOME_GIFT_POKEMON_MAP[pokemonId];
}
