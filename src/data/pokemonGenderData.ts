export interface GenderInfo {
  genderRatio: 'both' | 'male_only' | 'female_only' | 'genderless';
  hasVisualDifference: boolean;
  femaleSpriteId?: number;
  femaleImageUrl?: string;
  femaleDescription?: string;
}

// Species with officially recognized visual gender dimorphism in official Pokémon games:
export const GENDER_DIFFERENCE_POKEMON_IDS: Record<number, { femaleSpriteId?: number; femaleImageUrl?: string; femaleDescription?: string }> = {
  3: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/venusaur-f.png', femaleDescription: 'Female Venusaur has a visible seed in the center of its flower bud.' },
  12: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/butterfree-f.png', femaleDescription: 'Female Butterfree has distinct purple/black markings on its lower wings.' },
  19: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/rattata-f.png', femaleDescription: 'Female Rattata has shorter whiskers.' },
  20: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/raticate-f.png', femaleDescription: 'Female Raticate has shorter whiskers.' },
  25: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/pikachu-f.png', femaleDescription: 'Female Pikachu has a heart-shaped indentation on the end of its tail.' },
  26: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/raichu-f.png', femaleDescription: 'Female Raichu has a clipped lightning bolt tip on its tail.' },
  41: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/zubat-f.png', femaleDescription: 'Female Zubat has smaller fangs.' },
  42: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/golbat-f.png', femaleDescription: 'Female Golbat has smaller fangs.' },
  44: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/gloom-f.png', femaleDescription: 'Female Gloom has one large spot on each pistil petal instead of many small ones.' },
  45: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/vileplume-f.png', femaleDescription: 'Female Vileplume has larger white spots on its flower petals.' },
  64: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/kadabra-f.png', femaleDescription: 'Female Kadabra has shorter whiskers.' },
  65: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/alakazam-f.png', femaleDescription: 'Female Alakazam has shorter mustache whiskers.' },
  84: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/doduo-f.png', femaleDescription: 'Female Doduo has brown necks instead of black.' },
  85: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/dodrio-f.png', femaleDescription: 'Female Dodrio has brown necks instead of black.' },
  97: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/hypno-f.png', femaleDescription: 'Female Hypno has longer neck fur.' },
  111: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/rhyhorn-f.png', femaleDescription: 'Female Rhyhorn has a smaller horn.' },
  112: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/rhydon-f.png', femaleDescription: 'Female Rhydon has a smaller horn.' },
  118: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/goldeen-f.png', femaleDescription: 'Female Goldeen has a smaller horn.' },
  119: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/seaking-f.png', femaleDescription: 'Female Seaking has a smaller horn.' },
  123: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/scyther-f.png', femaleDescription: 'Female Scyther has a larger abdomen.' },
  129: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/magikarp-f.png', femaleDescription: 'Female Magikarp has white whiskers instead of yellow.' },
  130: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/gyarados-f.png', femaleDescription: 'Female Gyarados has white whiskers instead of blue.' },
  133: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/eevee-f.png', femaleDescription: 'Female Eevee has a heart-shaped floral pattern at the tip of its tail.' },
  154: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/meganium-f.png', femaleDescription: 'Female Meganium has shorter antenna stamens.' },
  165: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/ledyba-f.png', femaleDescription: 'Female Ledyba has smaller antennae.' },
  166: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/ledian-f.png', femaleDescription: 'Female Ledian has smaller antennae.' },
  178: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/xatu-f.png', femaleDescription: 'Female Xatu has two yellow stripes on its body instead of three.' },
  185: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/sudowoodo-f.png', femaleDescription: 'Female Sudowoodo has a smaller branch on its head.' },
  186: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/politoed-f.png', femaleDescription: 'Female Politoed has smaller pink cheeks.' },
  190: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/aipom-f.png', femaleDescription: 'Female Aipom has shorter head hair.' },
  194: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/wooper-f.png', femaleDescription: 'Female Wooper has one pair of gill branches instead of two.' },
  195: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/quagsire-f.png', femaleDescription: 'Female Quagsire has smaller back fins.' },
  198: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/murkrow-f.png', femaleDescription: 'Female Murkrow has a smaller head crest.' },
  202: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/wobbuffet-f.png', femaleDescription: 'Female Wobbuffet has bright red lipstick on its mouth.' },
  203: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/girafarig-f.png', femaleDescription: 'Female Girafarig has a smaller dark hind section.' },
  207: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/gligar-f.png', femaleDescription: 'Female Gligar has a smaller tail stinger.' },
  208: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/steelix-f.png', femaleDescription: 'Female Steelix has one less tooth on each lower jaw side.' },
  212: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/scizor-f.png', femaleDescription: 'Female Scizor has a larger abdomen.' },
  214: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/heracross-f.png', femaleDescription: 'Female Heracross has a heart-shaped horn crown.' },
  215: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/sneasel-f.png', femaleDescription: 'Female Sneasel has a shorter left ear feather.' },
  217: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/ursaring-f.png', femaleDescription: 'Female Ursaring has longer shoulder fur.' },
  221: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/piloswine-f.png', femaleDescription: 'Female Piloswine has shorter tusks.' },
  224: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/octillery-f.png', femaleDescription: 'Female Octillery has smaller suction cups.' },
  229: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/houndoom-f.png', femaleDescription: 'Female Houndoom has shorter curved horns.' },
  232: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/donphan-f.png', femaleDescription: 'Female Donphan has shorter tusks.' },
  255: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/torchic-f.png', femaleDescription: 'Male Torchic has a tiny black speck on its rear, while female does not.' },
  256: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/combusken-f.png', femaleDescription: 'Female Combusken has shorter head feathers.' },
  257: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/blaziken-f.png', femaleDescription: 'Female Blaziken has shorter hair-like head crests.' },
  267: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/beautifly-f.png', femaleDescription: 'Female Beautifly has smaller red wing spots.' },
  269: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/dustox-f.png', femaleDescription: 'Female Dustox has smaller antennae.' },
  272: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/ludicolo-f.png', femaleDescription: 'Female Ludicolo has thinner brown stripes.' },
  274: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/nuzleaf-f.png', femaleDescription: 'Female Nuzleaf has a smaller head leaf.' },
  275: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/shiftry-f.png', femaleDescription: 'Female Shiftry has smaller leafy hand fans.' },
  307: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/meditite-f.png', femaleDescription: 'Female Meditite has lower ear-like tufts.' },
  308: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/medicham-f.png', femaleDescription: 'Female Medicham has smaller bulb on head.' },
  315: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/roselia-f.png', femaleDescription: 'Female Roselia has a longer leaf skirt.' },
  316: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/gulpin-f.png', femaleDescription: 'Female Gulpin has a shorter feather.' },
  317: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/swalot-f.png', femaleDescription: 'Female Swalot has shorter whiskers.' },
  322: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/numel-f.png', femaleDescription: 'Female Numel has a larger single hump.' },
  323: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/camerupt-f.png', femaleDescription: 'Female Camerupt has larger volcano humps.' },
  332: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/cacturne-f.png', femaleDescription: 'Female Cacturne has a large diamond on chest.' },
  350: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/milotic-f.png', femaleDescription: 'Female Milotic has longer pink ear antennae.' },
  369: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/relicanth-f.png', femaleDescription: 'Female Relicanth has shorter jaw whiskers.' },
  396: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/starly-f.png', femaleDescription: 'Female Starly has a smaller white forehead dot.' },
  397: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/staravia-f.png', femaleDescription: 'Female Staravia has a smaller forehead spot.' },
  398: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/staraptor-f.png', femaleDescription: 'Female Staraptor has a smaller forehead white patch.' },
  399: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/bidoof-f.png', femaleDescription: 'Female Bidoof has three tail curls instead of five.' },
  400: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/bibarel-f.png', femaleDescription: 'Female Bibarel has a lighter mask pattern.' },
  401: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/kricketot-f.png', femaleDescription: 'Female Kricketot has a smaller neck collar.' },
  402: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/kricketune-f.png', femaleDescription: 'Female Kricketune has a smaller mustache.' },
  403: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/shinx-f.png', femaleDescription: 'Female Shinx has blue hind feet instead of black and shorter hair tuft.' },
  404: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/luxio-f.png', femaleDescription: 'Female Luxio has shorter mane hair and exposed ankles.' },
  405: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/luxray-f.png', femaleDescription: 'Female Luxray has a shorter mane.' },
  407: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/roserade-f.png', femaleDescription: 'Female Roserade has a longer cape.' },
  415: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/combee-f.png', femaleDescription: 'Female Combee has a red oval forehead gem and is the only one that can evolve into Vespiquen!' },
  417: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/pachirisu-f.png', femaleDescription: 'Female Pachirisu has a shorter head stripe.' },
  418: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/buizel-f.png', femaleDescription: 'Female Buizel has one back fin spot instead of two.' },
  419: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/floatzel-f.png', femaleDescription: 'Female Floatzel has one back spot instead of two.' },
  424: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/ambipom-f.png', femaleDescription: 'Female Ambipom has longer head cowlick hair.' },
  443: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/gible-f.png', femaleDescription: 'Male Gible has a dorsal fin notch; female has a smooth fin.' },
  444: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/gabite-f.png', femaleDescription: 'Male Gabite has a dorsal fin notch; female has a smooth fin.' },
  445: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/garchomp-f.png', femaleDescription: 'Male Garchomp has a dorsal fin notch; female has a smooth fin.' },
  449: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/hippopotas-f.png', femaleDescription: 'Female Hippopotas has an inverted brown/tan color scheme.' },
  450: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/hippowdon-f.png', femaleDescription: 'Female Hippowdon is completely black/charcoal colored instead of sandy yellow!' },
  453: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/croagunk-f.png', femaleDescription: 'Female Croagunk has higher chest bandage markings.' },
  454: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/toxicroak-f.png', femaleDescription: 'Female Toxicroak has a smaller vocal throat sac.' },
  456: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/finneon-f.png', femaleDescription: 'Female Finneon has larger tail fins.' },
  457: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/lumineon-f.png', femaleDescription: 'Female Lumineon has larger pectoral fins.' },
  459: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/snover-f.png', femaleDescription: 'Female Snover has a white midriff section.' },
  460: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/abomasnow-f.png', femaleDescription: 'Female Abomasnow has longer chest fur.' },
  461: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/weavile-f.png', femaleDescription: 'Female Weavile has shorter ear feathers.' },
  464: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/rhyperior-f.png', femaleDescription: 'Female Rhyperior has a smaller upper horn.' },
  465: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/tangrowth-f.png', femaleDescription: 'Female Tangrowth has more red on its fingers.' },
  469: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/yanmega-f.png', femaleDescription: 'Female Yanmega has smaller tail appendages.' },
  473: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/mamoswine-f.png', femaleDescription: 'Female Mamoswine has shorter tusks.' },
  521: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/unfezant-f.png', femaleDescription: 'Male Unfezant has a vibrant pink/green mask & wattle; Female Unfezant is understated brown/tan.' },
  592: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/frillish-f.png', femaleDescription: 'Male Frillish is cyan blue with a frown; Female Frillish is bright pink with eyelashes and a smile.' },
  593: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/jellicent-f.png', femaleDescription: 'Male Jellicent is blue with a giant mustache; Female Jellicent is pink with a frilly collar and crown.' },
  668: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/pyroar-f.png', femaleDescription: 'Male Pyroar has a massive kanji-shaped fire mane; Female Pyroar has a long flowing fiery ponytail.' },
  678: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/meowstic-f.png', femaleDescription: 'Male Meowstic is navy blue with white accents; Female Meowstic is white with navy blue accents and different stats/moves.' },
  876: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/indeedee-f.png', femaleDescription: 'Male Indeedee has horns pointing upwards; Female Indeedee has horns pointing downwards with gentle eyes.' },
  902: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/basculegion-f.png', femaleDescription: 'Male Basculegion has reddish-purple ghostly souls & barbel chin hair; Female Basculegion has cyan blue-white ghostly smoke.' },
  916: { femaleImageUrl: 'https://play.pokemonshowdown.com/sprites/dex/oinkologne-f.png', femaleDescription: 'Male Oinkologne is dark charcoal with magenta perfume; Female Oinkologne is brown with yellow eyelashes and floral tail.' },
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
