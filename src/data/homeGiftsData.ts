import {
  getEvolutionFamilyForPokemon,
} from './pokemonEvolutionData';

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
 * ────────────────────────────────────────────────────────────────────────────
 * FALLBACK EVOLUTION CHAINS FOR GIFT SPECIES
 * ────────────────────────────────────────────────────────────────────────────
 * The main evolution database (pokemonEvolutionData.ts) is curated for
 * notable lines but does not cover every starter family. This table fills the
 * gaps so that gift eligibility correctly propagates to evolved forms of
 * every HOME gift species, regardless of whether the family is in the curated
 * list.
 *
 * The first ID in each array is the family head. If a family is already in
 * CURATED_EVOLUTION_FAMILIES, this entry is redundant but harmless.
 */
const HOME_GIFT_FALLBACK_CHAINS: number[][] = [
  [1, 2, 3],                                    // Bulbasaur
  [4, 5, 6],                                    // Charmander
  [7, 8, 9],                                    // Squirtle
  [172, 25, 26],                                // Pichu / Pikachu
  [133, 134, 135, 136, 196, 197, 470, 471, 700],// Eevee
  [155, 156, 157],                              // Cyndaquil
  [387, 388, 389],                              // Turtwig
  [390, 391, 392],                              // Chimchar
  [393, 394, 395],                              // Piplup
  [501, 502, 503],                              // Oshawott
  [722, 723, 724],                              // Rowlet
  [808, 809],                                   // Meltan
  [810, 811, 812],                              // Grookey
  [813, 814, 815],                              // Scorbunny
  [816, 817, 818],                              // Sobble
  [906, 907, 908],                              // Sprigatito
  [909, 910, 911],                              // Fuecoco
  [912, 913, 914],                              // Quaxly
];

/**
 * Maps every species ID to the ID of its family head, using both the fallback
 * chains above and the curated evolution database. Fallback entries take
 * priority when the same species appears in both, since they are specifically
 * tuned for the HOME gift list.
 */
const HOME_GIFT_FAMILY_HEAD: Record<number, number> = (() => {
  const map: Record<number, number> = {};

  // 1. Populate from fallback chains first
  for (const chain of HOME_GIFT_FALLBACK_CHAINS) {
    if (chain.length === 0) continue;
    const head = chain[0];
    for (const id of chain) {
      map[id] = head;
    }
  }

  // 2. Fill any remaining gift species from the curated evolution data
  for (const headId of Object.keys(HOME_GIFT_POKEMON_MAP).map(Number)) {
    if (map[headId] !== undefined) continue; // already covered
    const family = getEvolutionFamilyForPokemon(headId);
    for (const stage of family.stages) {
      if (map[stage.pokemonId] === undefined) {
        map[stage.pokemonId] = family.familyId;
      }
    }
  }

  return map;
})();

/**
 * The set of every species ID that can be registered as a HOME gift —
 * including every evolution of a gift species.
 */
const HOME_GIFTABLE_IDS: Set<number> = (() => {
  const set = new Set<number>();
  for (const headId of Object.keys(HOME_GIFT_POKEMON_MAP).map(Number)) {
    set.add(headId);
  }
  for (const id of Object.keys(HOME_GIFT_FAMILY_HEAD).map(Number)) {
    set.add(id);
  }
  return set;
})();

/**
 * Checks whether a Pokémon species (or any member of its evolution family)
 * can be received as a Gift in Pokémon HOME.
 */
export function canBeHomeGift(pokemonId: number): boolean {
  return HOME_GIFTABLE_IDS.has(pokemonId);
}

/**
 * Gets details about the Pokémon HOME gift.
 *
 * If the species itself has a dedicated gift definition, that is returned.
 * Otherwise, if it is an evolution of a gift species, the base form's gift
 * definition is returned (with its description preserved). The `speciesName`
 * on the returned object always reflects the base gift species, so the UI
 * can still show "Evolved form of X" if it wants.
 */
export function getHomeGiftInfo(
  pokemonId: number
): HomeGiftPokemonDefinition | undefined {
  // Direct hit — the exact species has its own gift definition
  const direct = HOME_GIFT_POKEMON_MAP[pokemonId];
  if (direct) return direct;

  // Family hit — find the head of this species' family
  const headId = HOME_GIFT_FAMILY_HEAD[pokemonId];
  if (headId === undefined) return undefined;

  const baseDef = HOME_GIFT_POKEMON_MAP[headId];
  if (!baseDef) return undefined;

  // Return an adapted copy — keep the base gift's metadata but note that this
  // is an evolved form, so the UI can render it accurately.
  return {
    ...baseDef,
    description:
      baseDef.description +
      ` (Evolved form of ${baseDef.speciesName})`,
  };
}