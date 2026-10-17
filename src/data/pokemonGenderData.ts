export interface GenderInfo {
  genderRatio: 'both' | 'male_only' | 'female_only' | 'genderless';
  hasVisualDifference: boolean;
  femaleSpriteId?: number;
  femaleImageUrl?: string;
  femaleDescription?: string;
}

// Species with officially recognized visual gender dimorphism in official Pokémon games:
export const GENDER_DIFFERENCE_POKEMON_IDS: Record<number, { femaleSpriteId?: number; femaleImageUrl?: string; femaleDescription?: string }> = {
  3: { femaleImageUrl: '/sprites/pokeapi/female/3.png', femaleDescription: 'Female Venusaur has a visible seed in the center of its flower bud.' },
  12: { femaleImageUrl: '/sprites/pokeapi/female/12.png', femaleDescription: 'Female Butterfree has distinct purple/black markings on its lower wings.' },
  19: { femaleImageUrl: '/sprites/pokeapi/female/19.png', femaleDescription: 'Female Rattata has shorter whiskers.' },
  20: { femaleImageUrl: '/sprites/pokeapi/female/20.png', femaleDescription: 'Female Raticate has shorter whiskers.' },
  25: { femaleImageUrl: '/sprites/pokeapi/female/25.png', femaleDescription: 'Female Pikachu has a heart-shaped indentation on the end of its tail.' },
  26: { femaleImageUrl: '/sprites/pokeapi/female/26.png', femaleDescription: 'Female Raichu has a clipped lightning bolt tip on its tail.' },
  41: { femaleImageUrl: '/sprites/pokeapi/female/41.png', femaleDescription: 'Female Zubat has smaller fangs.' },
  42: { femaleImageUrl: '/sprites/pokeapi/female/42.png', femaleDescription: 'Female Golbat has smaller fangs.' },
  44: { femaleImageUrl: '/sprites/pokeapi/female/44.png', femaleDescription: 'Female Gloom has one large spot on each pistil petal instead of many small ones.' },
  45: { femaleImageUrl: '/sprites/pokeapi/female/45.png', femaleDescription: 'Female Vileplume has larger white spots on its flower petals.' },
  64: { femaleImageUrl: '/sprites/pokeapi/female/64.png', femaleDescription: 'Female Kadabra has shorter whiskers.' },
  65: { femaleImageUrl: '/sprites/pokeapi/female/65.png', femaleDescription: 'Female Alakazam has shorter mustache whiskers.' },
  84: { femaleImageUrl: '/sprites/pokeapi/female/84.png', femaleDescription: 'Female Doduo has brown necks instead of black.' },
  85: { femaleImageUrl: '/sprites/pokeapi/female/85.png', femaleDescription: 'Female Dodrio has brown necks instead of black.' },
  97: { femaleImageUrl: '/sprites/pokeapi/female/97.png', femaleDescription: 'Female Hypno has longer neck fur.' },
  111: { femaleImageUrl: '/sprites/pokeapi/female/111.png', femaleDescription: 'Female Rhyhorn has a smaller horn.' },
  112: { femaleImageUrl: '/sprites/pokeapi/female/112.png', femaleDescription: 'Female Rhydon has a smaller horn.' },
  118: { femaleImageUrl: '/sprites/pokeapi/female/118.png', femaleDescription: 'Female Goldeen has a smaller horn.' },
  119: { femaleImageUrl: '/sprites/pokeapi/female/119.png', femaleDescription: 'Female Seaking has a smaller horn.' },
  123: { femaleImageUrl: '/sprites/pokeapi/female/123.png', femaleDescription: 'Female Scyther has a larger abdomen.' },
  129: { femaleImageUrl: '/sprites/pokeapi/female/129.png', femaleDescription: 'Female Magikarp has white whiskers instead of yellow.' },
  130: { femaleImageUrl: '/sprites/pokeapi/female/130.png', femaleDescription: 'Female Gyarados has white whiskers instead of blue.' },
  133: { femaleImageUrl: '/sprites/pokeapi/female/133.png', femaleDescription: 'Female Eevee has a heart-shaped floral pattern at the tip of its tail.' },
  154: { femaleImageUrl: '/sprites/pokeapi/female/154.png', femaleDescription: 'Female Meganium has shorter antenna stamens.' },
  165: { femaleImageUrl: '/sprites/pokeapi/female/165.png', femaleDescription: 'Female Ledyba has smaller antennae.' },
  166: { femaleImageUrl: '/sprites/pokeapi/female/166.png', femaleDescription: 'Female Ledian has smaller antennae.' },
  178: { femaleImageUrl: '/sprites/pokeapi/female/178.png', femaleDescription: 'Female Xatu has two yellow stripes on its body instead of three.' },
  185: { femaleImageUrl: '/sprites/pokeapi/female/185.png', femaleDescription: 'Female Sudowoodo has a smaller branch on its head.' },
  186: { femaleImageUrl: '/sprites/pokeapi/female/186.png', femaleDescription: 'Female Politoed has smaller pink cheeks.' },
  190: { femaleImageUrl: '/sprites/pokeapi/female/190.png', femaleDescription: 'Female Aipom has shorter head hair.' },
  194: { femaleImageUrl: '/sprites/pokeapi/female/194.png', femaleDescription: 'Female Wooper has one pair of gill branches instead of two.' },
  195: { femaleImageUrl: '/sprites/pokeapi/female/195.png', femaleDescription: 'Female Quagsire has smaller back fins.' },
  198: { femaleImageUrl: '/sprites/pokeapi/female/198.png', femaleDescription: 'Female Murkrow has a smaller head crest.' },
  202: { femaleImageUrl: '/sprites/pokeapi/female/202.png', femaleDescription: 'Female Wobbuffet has bright red lipstick on its mouth.' },
  203: { femaleImageUrl: '/sprites/pokeapi/female/203.png', femaleDescription: 'Female Girafarig has a smaller dark hind section.' },
  207: { femaleImageUrl: '/sprites/pokeapi/female/207.png', femaleDescription: 'Female Gligar has a smaller tail stinger.' },
  208: { femaleImageUrl: '/sprites/pokeapi/female/208.png', femaleDescription: 'Female Steelix has one less tooth on each lower jaw side.' },
  212: { femaleImageUrl: '/sprites/pokeapi/female/212.png', femaleDescription: 'Female Scizor has a larger abdomen.' },
  214: { femaleImageUrl: '/sprites/pokeapi/female/214.png', femaleDescription: 'Female Heracross has a heart-shaped horn crown.' },
  215: { femaleImageUrl: '/sprites/pokeapi/female/215.png', femaleDescription: 'Female Sneasel has a shorter left ear feather.' },
  217: { femaleImageUrl: '/sprites/pokeapi/female/217.png', femaleDescription: 'Female Ursaring has longer shoulder fur.' },
  221: { femaleImageUrl: '/sprites/pokeapi/female/221.png', femaleDescription: 'Female Piloswine has shorter tusks.' },
  224: { femaleImageUrl: '/sprites/pokeapi/female/224.png', femaleDescription: 'Female Octillery has smaller suction cups.' },
  229: { femaleImageUrl: '/sprites/pokeapi/female/229.png', femaleDescription: 'Female Houndoom has shorter curved horns.' },
  232: { femaleImageUrl: '/sprites/pokeapi/female/232.png', femaleDescription: 'Female Donphan has shorter tusks.' },
  255: { femaleImageUrl: '/sprites/pokeapi/female/255.png', femaleDescription: 'Male Torchic has a tiny black speck on its rear, while female does not.' },
  256: { femaleImageUrl: '/sprites/pokeapi/female/256.png', femaleDescription: 'Female Combusken has shorter head feathers.' },
  257: { femaleImageUrl: '/sprites/pokeapi/female/257.png', femaleDescription: 'Female Blaziken has shorter hair-like head crests.' },
  267: { femaleImageUrl: '/sprites/pokeapi/female/267.png', femaleDescription: 'Female Beautifly has smaller red wing spots.' },
  269: { femaleImageUrl: '/sprites/pokeapi/female/269.png', femaleDescription: 'Female Dustox has smaller antennae.' },
  272: { femaleImageUrl: '/sprites/pokeapi/female/272.png', femaleDescription: 'Female Ludicolo has thinner brown stripes.' },
  274: { femaleImageUrl: '/sprites/pokeapi/female/274.png', femaleDescription: 'Female Nuzleaf has a smaller head leaf.' },
  275: { femaleImageUrl: '/sprites/pokeapi/female/275.png', femaleDescription: 'Female Shiftry has smaller leafy hand fans.' },
  307: { femaleImageUrl: '/sprites/pokeapi/female/307.png', femaleDescription: 'Female Meditite has lower ear-like tufts.' },
  308: { femaleImageUrl: '/sprites/pokeapi/female/308.png', femaleDescription: 'Female Medicham has smaller bulb on head.' },
  315: { femaleImageUrl: '/sprites/pokeapi/female/315.png', femaleDescription: 'Female Roselia has a longer leaf skirt.' },
  316: { femaleImageUrl: '/sprites/pokeapi/female/316.png', femaleDescription: 'Female Gulpin has a shorter feather.' },
  317: { femaleImageUrl: '/sprites/pokeapi/female/317.png', femaleDescription: 'Female Swalot has shorter whiskers.' },
  322: { femaleImageUrl: '/sprites/pokeapi/female/322.png', femaleDescription: 'Female Numel has a larger single hump.' },
  323: { femaleImageUrl: '/sprites/pokeapi/female/323.png', femaleDescription: 'Female Camerupt has larger volcano humps.' },
  332: { femaleImageUrl: '/sprites/pokeapi/female/332.png', femaleDescription: 'Female Cacturne has a large diamond on chest.' },
  350: { femaleImageUrl: '/sprites/pokeapi/female/350.png', femaleDescription: 'Female Milotic has longer pink ear antennae.' },
  369: { femaleImageUrl: '/sprites/pokeapi/female/369.png', femaleDescription: 'Female Relicanth has shorter jaw whiskers.' },
  396: { femaleImageUrl: '/sprites/pokeapi/female/396.png', femaleDescription: 'Female Starly has a smaller white forehead dot.' },
  397: { femaleImageUrl: '/sprites/pokeapi/female/397.png', femaleDescription: 'Female Staravia has a smaller forehead spot.' },
  398: { femaleImageUrl: '/sprites/pokeapi/female/398.png', femaleDescription: 'Female Staraptor has a smaller forehead white patch.' },
  399: { femaleImageUrl: '/sprites/pokeapi/female/399.png', femaleDescription: 'Female Bidoof has three tail curls instead of five.' },
  400: { femaleImageUrl: '/sprites/pokeapi/female/400.png', femaleDescription: 'Female Bibarel has a lighter mask pattern.' },
  401: { femaleImageUrl: '/sprites/pokeapi/female/401.png', femaleDescription: 'Female Kricketot has a smaller neck collar.' },
  402: { femaleImageUrl: '/sprites/pokeapi/female/402.png', femaleDescription: 'Female Kricketune has a smaller mustache.' },
  403: { femaleImageUrl: '/sprites/pokeapi/female/403.png', femaleDescription: 'Female Shinx has blue hind feet instead of black and shorter hair tuft.' },
  404: { femaleImageUrl: '/sprites/pokeapi/female/404.png', femaleDescription: 'Female Luxio has shorter mane hair and exposed ankles.' },
  405: { femaleImageUrl: '/sprites/pokeapi/female/405.png', femaleDescription: 'Female Luxray has a shorter mane.' },
  407: { femaleImageUrl: '/sprites/pokeapi/female/407.png', femaleDescription: 'Female Roserade has a longer cape.' },
  415: { femaleImageUrl: '/sprites/pokeapi/female/415.png', femaleDescription: 'Female Combee has a red oval forehead gem and is the only one that can evolve into Vespiquen!' },
  417: { femaleImageUrl: '/sprites/pokeapi/female/417.png', femaleDescription: 'Female Pachirisu has a shorter head stripe.' },
  418: { femaleImageUrl: '/sprites/pokeapi/female/418.png', femaleDescription: 'Female Buizel has one back fin spot instead of two.' },
  419: { femaleImageUrl: '/sprites/pokeapi/female/419.png', femaleDescription: 'Female Floatzel has one back spot instead of two.' },
  424: { femaleImageUrl: '/sprites/pokeapi/female/424.png', femaleDescription: 'Female Ambipom has longer head cowlick hair.' },
  443: { femaleImageUrl: '/sprites/pokeapi/female/443.png', femaleDescription: 'Male Gible has a dorsal fin notch; female has a smooth fin.' },
  444: { femaleImageUrl: '/sprites/pokeapi/female/444.png', femaleDescription: 'Male Gabite has a dorsal fin notch; female has a smooth fin.' },
  445: { femaleImageUrl: '/sprites/pokeapi/female/445.png', femaleDescription: 'Male Garchomp has a dorsal fin notch; female has a smooth fin.' },
  449: { femaleImageUrl: '/sprites/pokeapi/female/449.png', femaleDescription: 'Female Hippopotas has an inverted brown/tan color scheme.' },
  450: { femaleImageUrl: '/sprites/pokeapi/female/450.png', femaleDescription: 'Female Hippowdon is completely black/charcoal colored instead of sandy yellow!' },
  453: { femaleImageUrl: '/sprites/pokeapi/female/453.png', femaleDescription: 'Female Croagunk has higher chest bandage markings.' },
  454: { femaleImageUrl: '/sprites/pokeapi/female/454.png', femaleDescription: 'Female Toxicroak has a smaller vocal throat sac.' },
  456: { femaleImageUrl: '/sprites/pokeapi/female/456.png', femaleDescription: 'Female Finneon has larger tail fins.' },
  457: { femaleImageUrl: '/sprites/pokeapi/female/457.png', femaleDescription: 'Female Lumineon has larger pectoral fins.' },
  459: { femaleImageUrl: '/sprites/pokeapi/female/459.png', femaleDescription: 'Female Snover has a white midriff section.' },
  460: { femaleImageUrl: '/sprites/pokeapi/female/460.png', femaleDescription: 'Female Abomasnow has longer chest fur.' },
  461: { femaleImageUrl: '/sprites/pokeapi/female/461.png', femaleDescription: 'Female Weavile has shorter ear feathers.' },
  464: { femaleImageUrl: '/sprites/pokeapi/female/464.png', femaleDescription: 'Female Rhyperior has a smaller upper horn.' },
  465: { femaleImageUrl: '/sprites/pokeapi/female/465.png', femaleDescription: 'Female Tangrowth has more red on its fingers.' },
  469: { femaleDescription: 'Female Yanmega has smaller tail appendages.' },
  473: { femaleImageUrl: '/sprites/pokeapi/female/473.png', femaleDescription: 'Female Mamoswine has shorter tusks.' },
  521: { femaleImageUrl: '/sprites/pokeapi/female/521.png', femaleDescription: 'Male Unfezant has a vibrant pink/green mask & wattle; Female Unfezant is understated brown/tan.' },
  592: { femaleImageUrl: '/sprites/pokeapi/female/592.png', femaleDescription: 'Male Frillish is cyan blue with a frown; Female Frillish is bright pink with eyelashes and a smile.' },
  593: { femaleImageUrl: '/sprites/pokeapi/female/593.png', femaleDescription: 'Male Jellicent is blue with a giant mustache; Female Jellicent is pink with a frilly collar and crown.' },
  668: { femaleImageUrl: '/sprites/pokeapi/female/668.png', femaleDescription: 'Male Pyroar has a massive kanji-shaped fire mane; Female Pyroar has a long flowing fiery ponytail.' },
  678: { femaleImageUrl: '/sprites/pokeapi/female/678.png', femaleDescription: 'Male Meowstic is navy blue with white accents; Female Meowstic is white with navy blue accents and different stats/moves.' },
  876: { femaleImageUrl: '/sprites/pokeapi/female/876.png', femaleDescription: 'Male Indeedee has horns pointing upwards; Female Indeedee has horns pointing downwards with gentle eyes.' },
  902: { femaleDescription: 'Male Basculegion has reddish-purple ghostly souls & barbel chin hair; Female Basculegion has cyan blue-white ghostly smoke.' },
  916: { femaleImageUrl: '/sprites/pokeapi/female/916.png', femaleDescription: 'Male Oinkologne is dark charcoal with magenta perfume; Female Oinkologne is brown with yellow eyelashes and floral tail.' },
};

// Genderless species (Mythicals, Legendaries, Porygon, Magnemite, Beldum, etc.)
export const GENDERLESS_POKEMON_IDS = new Set<number>([
  81, 82, 100, 101, 120, 121, 137, 144, 145, 146, 150, 151,
  201, 233, 243, 244, 245, 249, 250, 251,
  292, 337, 338, 343, 344, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  436, 437, 462, 474, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494,
  599, 600, 601, 615, 622, 623, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  703, 716, 717, 718, 719, 720, 721,
  774, 781, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809,
  854, 855, 869, 880, 881, 882, 883, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898,
  999, 1000, 1001, 1002, 1003, 1004, 1007, 1008, 1009, 1010, 1014, 1015, 1016, 1017, 1020, 1021, 1022, 1023, 1024, 1025
]);

// Male only species
export const MALE_ONLY_POKEMON_IDS = new Set<number>([
  32, 33, 34, 106, 107, 128, 236, 237, 313, 381, 414, 475, 538, 539, 627, 628, 641, 642, 645, 859, 860, 861
]);

// Female only species
export const FEMALE_ONLY_POKEMON_IDS = new Set<number>([
  29, 30, 31, 113, 115, 124, 241, 242, 314, 380, 413, 416, 440, 478, 548, 549, 629, 630, 669, 670, 671, 757, 758, 761, 762, 763, 856, 857, 858, 868, 905, 957, 958, 959, 1016
]);

/**
 * Checks the gender distribution and visual differences for a Pokémon species.
 */
export function getPokemonGenderInfo(pokemonId: number): GenderInfo {
  if (GENDERLESS_POKEMON_IDS.has(pokemonId)) {
    return { genderRatio: 'genderless', hasVisualDifference: false };
  }
  if (MALE_ONLY_POKEMON_IDS.has(pokemonId)) {
    return { genderRatio: 'male_only', hasVisualDifference: false };
  }
  if (FEMALE_ONLY_POKEMON_IDS.has(pokemonId)) {
    return { genderRatio: 'female_only', hasVisualDifference: false };
  }
  const diff = GENDER_DIFFERENCE_POKEMON_IDS[pokemonId];
  if (diff) {
    return {
      genderRatio: 'both',
      hasVisualDifference: true,
      femaleSpriteId: diff.femaleSpriteId,
      femaleImageUrl: diff.femaleImageUrl,
      femaleDescription: diff.femaleDescription,
    };
  }
  return {
    genderRatio: 'both',
    hasVisualDifference: false,
  };
}

export function canPokemonBeTraded(pokemonId: number): boolean {
  return true;
}
