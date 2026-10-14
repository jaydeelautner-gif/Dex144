import type { GameId, DlcId } from './pokemonData';

export interface PokemonDexAvailability {
  gameId: GameId;
  status: 'base' | 'dlc' | 'transfer_only' | 'unavailable';
  requiresDlc: boolean;
  dlcId?: DlcId;
  dlcName?: string;
  versionExclusive: string;
  whereToFind: string;
}

// ==========================================
// POKÉMON COMPLETELY ABSENT FROM NINTENDO SWITCH
// These cannot enter LGPE, SwSh, BDSP, PLA, or SV
// ==========================================
export const COMPLETELY_ABSENT_FROM_SWITCH = new Set<number>([
  504, 505, // Patrat, Watchog
  511, 512, // Pansage, Simisage
  513, 514, // Pansear, Simisear
  515, 516, // Panpour, Simipour
  676,      // Furfrou
]);

// ==========================================
// LEGENDS: ARCEUS (PLA) - COMPLETE 242 (+2 BONUS) HISUI DEX
// ==========================================
export const PLA_HISUI_DEX_SPECIES = new Set<number>([
  // Starters
  155, 156, 157, // Cyndaquil, Quilava, Hisuian Typhlosion
  501, 502, 503, // Oshawott, Dewott, Hisuian Samurott
  722, 723, 724, // Rowlet, Dartrix, Hisuian Decidueye
  // Normal / Wild
  399, 400, // Bidoof, Bibarel
  396, 397, 398, // Starly, Staravia, Staraptor
  403, 404, 405, // Shinx, Luxio, Luxray
  265, 266, 267, 268, 269, // Wurmple, Silcoon, Beautifly, Cascoon, Dustox
  77, 78,   // Ponyta, Rapidash
  133, 134, 135, 136, 196, 197, 470, 471, 700, // Eevee + all 8 eeveelutions
  41, 42, 169, // Zubat, Golbat, Crobat
  425, 426, // Drifloon, Drifblim
  412, 413, 414, // Burmy, Wormadam, Mothim
  415, 416, // Combee, Vespiquen
  54, 55,   // Psyduck, Golduck
  418, 419, // Buizel, Floatzel
  420, 421, // Cherubi, Cherrim
  190, 424, // Aipom, Ambipom
  129, 130, // Magikarp, Gyarados
  118, 119, // Goldeen, Seaking
  339, 340, // Barboach, Whiscash
  453, 454, // Croagunk, Toxicroak
  58, 59,   // Hisuian Growlithe, Hisuian Arcanine
  74, 75, 76, // Geodude, Graveler, Golem
  95, 208,  // Onix, Steelix
  408, 409, // Cranidos, Rampardos
  410, 411, // Shieldon, Bastiodon
  438, 185, // Bonsly, Sudowoodo
  63, 64, 65, // Abra, Kadabra, Alakazam
  92, 93, 94, // Gastly, Haunter, Gengar
  406, 315, 407, // Budew, Roselia, Roserade
  427, 428, // Buneary, Lopunny
  440, 113, 242, // Happiny, Chansey, Blissey
  108, 463, // Lickitung, Lickilicky
  114, 465, // Tangela, Tangrowth
  193, 469, // Yanma, Yanmega
  449, 450, // Hippopotas, Hippowdon
  451, 452, // Skorupi, Drapion
  455,      // Carnivine
  363, 364, 365, // Spheal, Sealeo, Walrein
  459, 460, // Snover, Abomasnow
  434, 435, // Stunky, Skuntank
  216, 217, // Teddiursa, Ursaring
  901,      // Ursaluna
  211, 904, // Hisuian Qwilfish, Overqwil
  550, 902, // White-Striped Basculin, Basculegion
  66, 67, 68, // Machop, Machoke, Machamp
  439, 122, // Mime Jr., Mr. Mime
  433, 358, // Chingling, Chimecho
  704, 705, 706, // Goomy, Hisuian Sliggoo, Hisuian Goodra
  458, 226, // Mantyke, Mantine
  215, 461, 903, // Sneasel, Weavile, Sneasler
  100, 101, // Hisuian Voltorb, Hisuian Electrode
  81, 82, 462, // Magnemite, Magneton, Magnezone
  443, 444, 445, // Gible, Gabite, Garchomp
  447, 448, // Riolu, Lucario
  479,      // Rotom
  712, 713, // Bergmite, Hisuian Avalugg
  570, 571, // Hisuian Zorua, Hisuian Zoroark
  627, 628, // Rufflet, Hisuian Braviary
  123, 900, // Scyther, Kleavor
  234, 899, // Stantler, Wyrdeer
  201,      // Unown
  456, 457, // Finneon, Lumineon
  436, 437, // Bronzor, Bronzong
  477,      // Dusknoir
  355, 356, // Duskull, Dusclops
  220, 221, 473, // Swinub, Piloswine, Mamoswine
  200, 429, // Misdreavus, Mismagius
  361, 362, 478, // Snorunt, Glalie, Froslass
  246, 247, 248, // Larvitar, Pupitar, Tyranitar
  239, 125, 466, // Elekid, Electabuzz, Electivire
  240, 126, 467, // Magby, Magmar, Magmortar
  175, 176, 468, // Togepi, Togetic, Togekiss
  143, 446, // Snorlax, Munchlax
  480, 481, 482, // Uxie, Mesprit, Azelf
  483, 484, 487, // Dialga, Palkia, Giratina
  485, 486, 488, // Heatran, Regigigas, Cresselia
  489, 490,      // Phione, Manaphy
  491, 492, 493, // Darkrai, Shaymin, Arceus
  905,           // Enamorus
  641, 642, 645, // Tornadus, Thundurus, Landorus
]);

// ==========================================
// SCARLET & VIOLET (SV) - AUTHENTIC CANONICAL SETS
// ==========================================

// Paldea Base Pokédex (400 Species)
export const SV_PALDEA_BASE_SPECIES = new Set<number>([
  // Gen 9 Starters & Early Route
  906, 907, 908, // Sprigatito, Floragato, Meowscarada
  909, 910, 911, // Fuecoco, Crocalor, Skeledirge
  912, 913, 914, // Quaxly, Quaxwell, Quaquaval
  915, 916,      // Lechonk, Oinkologne
  917, 918,      // Tarountula, Spidops
  919, 920,      // Nymble, Lokix
  187, 188, 189, // Hoppip, Skiploom, Jumpluff
  661, 662, 663, // Fletchling, Fletchinder, Talonflame
  921, 922, 923, // Pawmi, Pawmo, Pawmot
  228, 229,      // Houndour, Houndoom
  734, 735,      // Yungoos, Gumshoos
  819, 820,      // Skwovet, Greedent
  191, 192,      // Sunkern, Sunflora
  401, 402,      // Kricketot, Kricketune
  664, 665, 666, // Scatterbug, Spewpa, Vivillon
  415, 416,      // Combee, Vespiquen
  821, 822, 823, // Rookidee, Corvisquire, Corviknight
  438, 185,      // Bonsly, Sudowoodo
  833, 834,      // Chewtle, Drednaw
  837, 838, 839, // Rolycoly, Carkol, Coalossal
  399, 400,      // Bidoof (none, shinx below)
  403, 404, 405, // Shinx, Luxio, Luxray
  54, 55,        // Psyduck, Golduck
  418, 419,      // Buizel, Floatzel
  129, 130,      // Magikarp, Gyarados
  846, 847,      // Arrokuda, Barraskewda
  179, 180, 181, // Mareep, Flaaffy, Ampharos
  183, 184,      // Marill, Azumarill
  298, 183, 184, // Azurill, Marill, Azumarill
  924, 925,      // Tandemaus, Maushold
  926, 927,      // Fidough, Dachsbun
  928, 929, 930, // Smoliv, Dolliv, Arboliva
  931,           // Squawkabilly
  932, 933, 934, // Nacli, Naclstack, Garganacl
  935, 936, 937, // Charcadet, Armarouge, Ceruledge
  938, 939,      // Tadbulb, Bellibolt
  940, 941,      // Wattrel, Kilowattrel
  942, 943,      // Maschiff, Mabosstiff
  944, 945,      // Shroodle, Grafaiai
  946, 947,      // Bramblin, Brambleghast
  948, 949,      // Toedscool, Toedscruel
  950,           // Klawf
  951, 952,      // Capsakid, Scovillain
  953, 954,      // Rellor, Rabsca
  955, 956,      // Flittle, Espathra
  957, 958, 959, // Tinkatink, Tinkatuff, Tinkaton
  960, 961,      // Wigglett, Wugtrio
  962,           // Bombirdier
  963, 964,      // Finizen, Palafin
  965, 966, 967, // Varoom, Revavroom
  968,           // Cyclizar
  969,           // Orthworm
  970,           // Glimmet, Glimmora
  971, 972,      // Greavard, Houndstone
  973,           // Flamigo
  974, 975,      // Cetoddle, Cetitan
  976,           // Veluza
  977,           // Dondozo
  978,           // Tatsugiri
  979,           // Annihilape
  980,           // Clodsire
  981,           // Farigiraf
  982,           // Dudunsparce
  983,           // Kingambit
  // Paradox Beasts / Future / Past
  984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995,
  // Pseudo-Legendary / Box Legendaries
  996, 997, 998, // Frigibax, Arctibax, Baxcalibur
  999, 1000,     // Gimmighoul, Gholdengo
  1001, 1002, 1003, 1004, // Ruinous Quartet: Wo-Chien, Chien-Pao, Ting-Lu, Chi-Yu
  1005, 1006,    // Roaring Moon, Iron Valiant
  1007, 1008,    // Koraidon, Miraidon
  // Returning Core Paldea Species
  133, 134, 135, 136, 196, 197, 470, 471, 700, // Eeveelutions
  58, 59,        // Growlithe, Arcanine
  246, 247, 248, // Larvitar, Pupitar, Tyranitar
  371, 372, 373, // Bagon, Shelgon, Salamence
  443, 444, 445, // Gible, Gabite, Garchomp
  633, 634, 635, // Deino, Zweilous, Hydreigon
  704, 705, 706, // Goomy, Sliggoo, Goodra
  885, 886, 887, // Dreepy, Drakloak, Dragapult
  77, 78,        // Ponyta (transfer only, but Girafarig 203)
  203, 981,      // Girafarig, Farigiraf
  206, 982,      // Dunsparce, Dudunsparce
  194, 980,      // Wooper, Clodsire
  56, 57, 979,   // Mankey, Primeape, Annihilape
  624, 625, 983, // Pawniard, Bisharp, Kingambit
  25, 26, 172,   // Pichu, Pikachu, Raichu
  74, 75, 76,    // Geodude, Graveler, Golem
  92, 93, 94,    // Gastly, Haunter, Gengar
  113, 242, 440, // Chansey, Blissey, Happiny
  128,           // Tauros (Combat, Blaze, Aqua)
  131,           // Lapras (Indigo Disk)
  143, 446,      // Snorlax, Munchlax
  214,           // Heracross
  215, 461,      // Sneasel, Weavile
  216, 217,      // Teddiursa, Ursaring
  225,           // Delibird
  231, 232,      // Phanpy, Donphan
  278, 279,      // Wingull, Pelipper
  280, 281, 282, 475, // Ralts, Kirlia, Gardevoir, Gallade
  285, 286,      // Shroomish, Breloom
  287, 288, 289, // Slakoth, Vigoroth, Slaking
  296, 297,      // Makuhita, Hariyama
  302,           // Sableye
  316, 317,      // Gulpin, Swalot
  322, 323,      // Numel, Camerupt
  324,           // Torkoal
  325, 326,      // Spoink, Grumpig
  331, 332,      // Cacnea, Cacturne
  333, 334,      // Swablu, Altaria
  335,           // Zangoose
  336,           // Seviper
  339, 340,      // Barboach, Whiscash
  353, 354,      // Shuppet, Banette
  357,           // Tropius
  359,           // Absol (transfer only)
  361, 362, 478, // Snorunt, Glalie, Froslass
  370,           // Luvdisc
  417,           // Pachirisu
  422, 423,      // Shellos, Gastrodon
  425, 426,      // Drifloon, Drifblim
  434, 435,      // Stunky, Skuntank
  436, 437,      // Bronzor, Bronzong
  441,           // Chatot
  442,           // Spiritomb
  447, 448,      // Riolu, Lucario
  449, 450,      // Hippopotas, Hippowdon
  453, 454,      // Croagunk, Toxicroak
  456, 457,      // Finneon, Lumineon
  459, 460,      // Snover, Abomasnow
  479,           // Rotom
  550,           // Basculin
  551, 552, 553, // Sandile, Krokorok, Krookodile
  570, 571,      // Zorua, Zoroark
  574, 575, 576, // Gothita, Gothorita, Gothitelle
  585, 586,      // Deerling, Sawsbuck
  590, 591,      // Foongus, Amoonguss
  592, 593,      // Frillish, Jellicent
  594,           // Alomomola
  595, 596,      // Joltik, Galvantula
  597, 598,      // Ferroseed, Ferrothorn
  599, 600, 601, // Klink, Klang, Klinklang
  602, 603, 604, // Tynamo, Eelektrik, Eelektross
  607, 608, 609, // Litwick, Lampent, Chandelure
  610, 611, 612, // Axew, Fraxure, Haxorus
  613, 614,      // Cubchoo, Beartic
  615,           // Cryogonal
  626,           // Bouffalant
  627, 628,      // Rufflet, Braviary
  629, 630,      // Vullaby, Mandibuzz
  631,           // Heatmor
  632,           // Durant
  667, 668,      // Litleo, Pyroar
  669, 670, 671, // Flabébé, Floette, Florges
  672, 673,      // Skiddo, Gogoat
  682, 683,      // Spritzee, Aromatisse
  684, 685,      // Swirlix, Slurpuff
  686, 687,      // Inkay, Malamar (Indigo Disk)
  690, 691,      // Skrelp, Dragalge
  692, 693,      // Clauncher, Clawitzer
  701,           // Hawlucha
  702,           // Dedenne
  703,           // Carbink
  707,           // Klefki
  708, 709,      // Phantump, Trevenant
  712, 713,      // Bergmite, Avalugg
  714, 715,      // Noibat, Noivern
  736, 737, 738, // Grubbin, Charjabug, Vikavolt (Teal Mask)
  741,           // Oricorio
  742, 743,      // Cutiefly, Ribombee
  744, 745,      // Rockruff, Lycanroc
  747, 748,      // Mareanie, Toxapex
  749, 750,      // Mudbray, Mudsdale
  751, 752,      // Dewpider, Araquanid (Indigo Disk)
  753, 754,      // Fomantis, Lurantis
  757, 758,      // Salandit, Salazzle
  761, 762, 763, // Bounsweet, Steenee, Tsareena
  764,           // Comfey (Indigo Disk)
  765,           // Oranguru
  766,           // Passimian
  769, 770,      // Sandygast, Palossand
  774,           // Minior (Indigo Disk)
  775,           // Komala
  778,           // Mimikyu
  779,           // Bruxish
  840, 841, 842, // Applin, Flapple, Appletun
  843, 844,      // Silicobra, Sandaconda
  845,           // Cramorant (Teal Mask)
  848, 849,      // Toxel, Toxtricity
  850, 851,      // Sizzlipede, Centiskorch
  852, 853,      // Clobbopus, Grapploct
  854, 855,      // Sinistea, Polteageist
  856, 857, 858, // Hatenna, Hattrem, Hatterene
  859, 860, 861, // Impidimp, Morgrem, Grimmsnarl
  868, 869,      // Milcery, Alcremie (Indigo Disk)
  870,           // Falinks
  871,           // Pincurchin
  872, 873,      // Snom, Frosmoth
  874,           // Stonjourner
  875,           // Eiscue
  876,           // Indeedee
  877,           // Morpeko (Teal Mask)
  878, 879,      // Cufant, Copperajah
]);

// Scarlet & Violet The Teal Mask DLC (Kitakami Pokédex - 200 species)
export const SV_TEAL_MASK_SPECIES = new Set<number>([
  1011,          // Dipplin
  1012, 1013,    // Poltchageist, Sinistcha
  1014, 1015, 1016, // Okidogi, Munkidori, Fezandipiti
  1017,          // Ogerpon
  // Returning in Kitakami
  23, 24,        // Ekans, Arbok
  27, 28,        // Sandshrew, Sandslash
  35, 36,        // Clefairy, Clefable
  37, 38,        // Vulpix, Ninetales
  60, 61, 62, 186, // Poliwag, Poliwhirl, Poliwrath, Politoed
  69, 70, 71,    // Bellsprout, Weepinbell, Victreebel
  74, 75, 76,    // Geodude, Graveler, Golem
  109, 110,      // Koffing, Weezing
  137, 233, 474, // Porygon, Porygon2, Porygon-Z
  143, 446,      // Snorlax, Munchlax
  161, 162,      // Sentret, Furret
  163, 164,      // Hoothoot, Noctowl
  165, 166,      // Ledyba, Ledian
  167, 168,      // Spinarak, Ariados
  170, 171,      // Chinchou, Lanturn
  175, 176, 468, // Togepi, Togetic, Togekiss
  190, 424,      // Aipom, Ambipom
  193, 469,      // Yanma, Yanmega
  194, 195,      // Wooper, Quagsire
  207, 472,      // Gligar, Gliscor
  218, 219,      // Slugma, Magcargo
  220, 221, 473, // Swinub, Piloswine, Mamoswine
  222,           // Corsola
  261, 262,      // Poochyena, Mightyena
  270, 271, 272, // Lotad, Lombre, Ludicolo
  273, 274, 275, // Seedot, Nuzleaf, Shiftry
  283, 284,      // Surskit, Masquerain
  290, 291, 292, // Nincada, Ninjask, Shedinja
  299, 476,      // Nosepass, Probopass
  313, 314,      // Volbeat, Illumise
  324,           // Torkoal
  325, 326,      // Spoink, Grumpig
  327,           // Spinda (transfer only)
  341, 342,      // Corphish, Crawdaunt
  349, 350,      // Feebas, Milotic
  355, 356, 477, // Duskull, Dusclops, Dusknoir
  358, 433,      // Chimecho, Chingling
  399, 400,      // Bidoof, Bibarel
  401, 402,      // Kricketot, Kricketune
  417,           // Pachirisu
  441,           // Chatot
  522, 523,      // Blitzle, Zebstrika
  532, 533, 534, // Timburr, Gurdurr, Conkeldurr
  540, 541, 542, // Sewaddle, Swadloon, Leavanny
  546, 547,      // Cottonee, Whimsicott
  559, 560,      // Scraggy, Scrafty
  577, 578, 579, // Solosis, Duosion, Reuniclus
  580, 581,      // Ducklett, Swanna
  607, 608, 609, // Litwick, Lampent, Chandelure
  619, 620,      // Mienfoo, Mienshao
  622, 623,      // Golett, Golurk
  624, 625,      // Pawniard, Bisharp
  708, 709,      // Phantump, Trevenant
  736, 737, 738, // Grubbin, Charjabug, Vikavolt
  742, 743,      // Cutiefly, Ribombee
  845,           // Cramorant
  877,           // Morpeko
]);

// Scarlet & Violet The Indigo Disk DLC (Blueberry Academy Dex - 240 species)
export const SV_INDIGO_DISK_SPECIES = new Set<number>([
  // Gen 9 New Indigo Species
  1018,          // Archaludon
  1019,          // Hydrapple
  1020, 1021,    // Gouging Fire, Raging Bolt
  1022, 1023,    // Iron Boulder, Iron Crown
  1024,          // Terapagos
  1025,          // Pecharunt
  // ALL 24 PAST STARTERS in Blueberry Terarium biomes:
  1, 2, 3,       // Bulbasaur, Ivysaur, Venusaur
  4, 5, 6,       // Charmander, Charmeleon, Charizard
  7, 8, 9,       // Squirtle, Wartortle, Blastoise
  152, 153, 154, // Chikorita, Bayleef, Meganium
  155, 156, 157, // Cyndaquil, Quilava, Typhlosion
  158, 159, 160, // Totodile, Croconaw, Feraligatr
  252, 253, 254, // Treecko, Grovyle, Sceptile
  255, 256, 257, // Torchic, Combusken, Blaziken
  258, 259, 260, // Mudkip, Marshtomp, Swampert
  387, 388, 389, // Turtwig, Grotle, Torterra
  390, 391, 392, // Chimchar, Monferno, Infernape
  393, 394, 395, // Piplup, Prinplup, Empoleon
  495, 496, 497, // Snivy, Servine, Serperior
  498, 499, 500, // Tepig, Pignite, Emboar
  501, 502, 503, // Oshawott, Dewott, Samurott
  650, 651, 652, // Chespin, Quilladin, Chesnaught
  653, 654, 655, // Fennekin, Braixen, Delphox
  656, 657, 658, // Froakie, Frogadier, Greninja
  722, 723, 724, // Rowlet, Dartrix, Decidueye
  725, 726, 727, // Litten, Torracat, Incineroar
  728, 729, 730, // Popplio, Brionne, Primarina
  810, 811, 812, // Grookey, Thwackey, Rillaboom
  813, 814, 815, // Scorbunny, Raboot, Cinderace
  816, 817, 818, // Sobble, Drizzile, Inteleon
  // Returning in Terarium
  43, 44, 45, 182, // Oddish, Gloom, Vileplume, Bellossom
  48, 49,        // Venonat, Venomoth
  50, 51,        // Diglett, Dugtrio (Alolan)
  79, 80, 199,   // Slowpoke, Slowbro, Slowking
  84, 85,        // Doduo, Dodrio
  86, 87,        // Seel, Dewgong
  88, 89,        // Grimer, Muk (Alolan)
  102, 103,      // Exeggcute, Exeggutor (Alolan)
  106, 107, 237, // Hitmonlee, Hitmonchan, Hitmontop, Tyrogue (236)
  236,           // Tyrogue
  111, 112, 464, // Rhyhorn, Rhydon, Rhyperior
  116, 117, 230, // Horsea, Seadra, Kingdra
  123, 212, 900, // Scyther, Scizor, Kleavor
  125, 466, 239, // Elekid, Electabuzz, Electivire
  126, 467, 240, // Magby, Magmar, Magmortar
  131,           // Lapras
  137, 233, 474, // Porygon, Porygon2, Porygon-Z
  227,           // Skarmory
  235,           // Smeargle
  241,           // Miltank
  299, 476,      // Nosepass, Probopass
  304, 305, 306, // Aron, Lairon, Aggron
  307, 308,      // Meditite, Medicham
  311, 312,      // Plusle, Minun
  328, 329, 330, // Trapinch, Vibrava, Flygon
  374, 375, 376, // Beldum, Metang, Metagross
  408, 409,      // Cranidos, Rampardos
  410, 411,      // Shieldon, Bastiodon
  522, 523,      // Blitzle, Zebstrika
  529, 530,      // Drilbur, Excadrill
  546, 547,      // Cottonee, Whimsicott
  572, 573,      // Minccino, Cinccino
  577, 578, 579, // Solosis, Duosion, Reuniclus
  595, 596,      // Joltik, Galvantula
  622, 623,      // Golett, Golurk
  677, 678,      // Espurr, Meowstic
  686, 687,      // Inkay, Malamar
  751, 752,      // Dewpider, Araquanid
  764,           // Comfey
  774,           // Minior
  854, 855,      // Sinistea, Polteageist
  868, 869,      // Milcery, Alcremie
  884, 1018,     // Duraludon, Archaludon
  // Snackworth Legendaries in Paldea after Indigo Disk
  144, 145, 146, // Articuno, Zapdos, Moltres
  243, 244, 245, // Raikou, Entei, Suicune
  249, 250,      // Lugia, Ho-Oh
  380, 381,      // Latias, Latios
  382, 383, 384, // Kyogre, Groudon, Rayquaza
  638, 639, 640, // Cobalion, Terrakion, Virizion
  643, 644, 646, // Reshiram, Zekrom, Kyurem
  789, 790, 791, 792, // Cosmog, Cosmoem, Solgaleo, Lunala
  891, 892,      // Kubfu, Urshifu
  896, 897, 898, // Glastrier, Spectrier, Calyrex
]);

// Scarlet & Violet Transfer-Only Species (via HOME)
export const SV_TRANSFER_ONLY_SPECIES = new Set<number>([
  150, 151,      // Mewtwo, Mew
  483, 484, 487, // Dialga, Palkia, Giratina
  480, 481, 482, // Uxie, Mesprit, Azelf
  485, 486, 488, // Heatran, Regigigas, Cresselia
  489, 490, 493, // Phione, Manaphy, Arceus
  491, 492,      // Darkrai, Shaymin
  641, 642, 645, // Tornadus, Thundurus, Landorus
  647, 648, 649, // Keldeo, Meloetta, Genesect
  719, 720, 721, // Diancie, Hoopa, Volcanion
  800, 801, 802, // Necrozma, Magearna, Marshadow
  807, 808, 809, // Zeraora, Meltan, Melmetal
  888, 889, 890, // Zacian, Zamazenta, Eternatus
  893,           // Zarude
  894, 895,      // Regieleki, Regidrago
  905,           // Enamorus
]);

// ==========================================
// SWORD & SHIELD (SWSH) - CANONICAL SETS
// ==========================================

// Galar Base Pokédex (400 Species)
export const SWSH_GALAR_BASE_SPECIES = new Set<number>([
  // Gen 8 Starters
  810, 811, 812, // Grookey, Thwackey, Rillaboom
  813, 814, 815, // Scorbunny, Raboot, Cinderace
  816, 817, 818, // Sobble, Drizzile, Inteleon
  819, 820,      // Skwovet, Greedent
  821, 822, 823, // Rookidee, Corvisquire, Corviknight
  824, 825, 826, // Blipbug, Dottler, Orbeetle
  827, 828,      // Nickit, Thievul
  829, 830,      // Gossifleur, Eldegoss
  831, 832,      // Wooloo, Dubwool
  833, 834,      // Chewtle, Drednaw
  835, 836,      // Yamper, Boltund
  837, 838, 839, // Rolycoly, Carkol, Coalossal
  840, 841, 842, // Applin, Flapple, Appletun
  843, 844,      // Silicobra, Sandaconda
  845,           // Cramorant
  846, 847,      // Arrokuda, Barraskewda
  848, 849,      // Toxel, Toxtricity
  850, 851,      // Sizzlipede, Centiskorch
  852, 853,      // Clobbopus, Grapploct
  854, 855,      // Sinistea, Polteageist
  856, 857, 858, // Hatenna, Hattrem, Hatterene
  859, 860, 861, // Impidimp, Morgrem, Grimmsnarl
  862,           // Obstagoon
  863,           // Perrserker
  864,           // Cursola
  865,           // Sirfetch'd
  866,           // Mr. Rime
  867,           // Runerigus
  868, 869,      // Milcery, Alcremie
  870,           // Falinks
  871,           // Pincurchin
  872, 873,      // Snom, Frosmoth
  874,           // Stonjourner
  875,           // Eiscue
  876,           // Indeedee
  877,           // Morpeko
  878, 879,      // Cufant, Copperajah
  880, 881, 882, 883, // Dracozolt, Arctozolt, Dracovish, Arctovish
  884,           // Duraludon
  885, 886, 887, // Dreepy, Drakloak, Dragapult
  888, 889, 890, // Zacian, Zamazenta, Eternatus
  // Returning in Galar Base Dex
  10, 11, 12,    // Caterpie, Metapod, Butterfree
  13, 14, 15,    // Grubbin (736-738)
  25, 26, 172,   // Pichu, Pikachu, Raichu
  43, 44, 45, 182, // Oddish, Gloom, Vileplume, Bellossom
  50, 51,        // Diglett, Dugtrio
  52, 53,        // Meowth, Persian
  54, 55,        // Psyduck, Golduck
  58, 59,        // Growlithe, Arcanine
  66, 67, 68,    // Machop, Machoke, Machamp
  77, 78,        // Ponyta, Rapidash (Galarian)
  83,            // Farfetch'd
  90, 91,        // Shellder, Cloyster
  92, 93, 94,    // Gastly, Haunter, Gengar
  95, 208,       // Onix, Steelix
  98, 99,        // Krabby, Kingler
  106, 107, 236, 237, // Hitmons, Tyrogue
  109, 110,      // Koffing, Weezing
  111, 112, 464, // Rhyhorn, Rhydon, Rhyperior
  118, 119,      // Goldeen, Seaking
  122,           // Mr. Mime
  129, 130,      // Magikarp, Gyarados
  131,           // Lapras
  132,           // Ditto
  133, 134, 135, 136, 196, 197, 470, 471, 700, // Eevees
  143, 446,      // Snorlax, Munchlax
  163, 164,      // Hoothoot, Noctowl
  170, 171,      // Chinchou, Lanturn
  175, 176, 468, // Togepi, Togetic, Togekiss
  177, 178,      // Natu, Xatu
  202, 360,      // Wynaut, Wobbuffet
  211,           // Qwilfish
  213,           // Shuckle
  215, 461,      // Sneasel, Weavile
  222,           // Corsola
  223, 224,      // Remoraid, Octillery
  225,           // Delibird
  226, 458,      // Mantine, Mantyke
  227,           // Skarmory (Isle of Armor)
  263, 264,      // Zigzagoon, Linoone
  270, 271, 272, // Lotad, Lombre, Ludicolo
  273, 274, 275, // Seedot, Nuzleaf, Shiftry
  278, 279,      // Wingull, Pelipper
  280, 281, 282, 475, // Ralts line
  290, 291, 292, // Nincada, Ninjask, Shedinja
  302,           // Sableye
  303,           // Mawile
  309, 310,      // Electrike, Manectric
  315, 406, 407, // Roselia line
  320, 321,      // Wailmer, Wailord
  328, 329, 330, // Trapinch, Vibrava, Flygon
  339, 340,      // Barboach, Whiscash
  341, 342,      // Corphish, Crawdaunt
  343, 344,      // Baltoy, Claydol
  349, 350,      // Feebas, Milotic
  355, 356, 477, // Duskull line
  361, 362, 478, // Snorunt line
  415, 416,      // Combee, Vespiquen
  422, 423,      // Shellos, Gastrodon
  425, 426,      // Drifloon, Drifblim
  434, 435,      // Stunky, Skuntank
  436, 437,      // Bronzor, Bronzong
  438, 185,      // Bonsly, Sudowoodo
  449, 450,      // Hippopotas, Hippowdon
  451, 452,      // Skorupi, Drapion
  453, 454,      // Croagunk, Toxicroak
  459, 460,      // Snover, Abomasnow
  479,           // Rotom
  509, 510,      // Purrloin, Liepard
  517, 518,      // Munna, Musharna
  519, 520, 521, // Pidove, Tranquill, Unfezant
  524, 525, 526, // Roggenrola, Boldore, Gigalith
  527, 528,      // Woobat, Swoobat
  529, 530,      // Drilbur, Excadrill
  532, 533, 534, // Timburr, Gurdurr, Conkeldurr
  535, 536, 537, // Tympole, Palpitoad, Seismitoad
  538,           // Throh
  539,           // Sawk
  546, 547,      // Cottonee, Whimsicott
  548, 549,      // Petilil, Lilligant (Isle of Armor)
  550,           // Basculin
  554, 555,      // Darumaka, Darmanitan
  556,           // Maractus
  557, 558,      // Dwebble, Crustle
  559, 560,      // Scraggy, Scrafty
  561,           // Sigilyph
  562, 563,      // Yamask, Cofagrigus
  568, 569,      // Trubbish, Garbodor
  572, 573,      // Minccino, Cinccino
  574, 575, 576, // Gothita line
  577, 578, 579, // Solosis line
  582, 583, 584, // Vanillite line
  587,           // Emolga (Isle of Armor)
  588, 589,      // Karrablast, Escavalier
  592, 593,      // Frillish, Jellicent
  595, 596,      // Joltik, Galvantula
  597, 598,      // Ferroseed, Ferrothorn
  599, 600, 601, // Klink line
  605, 606,      // Elgyem, Beheeyem
  607, 608, 609, // Litwick line
  610, 611, 612, // Axew line
  613, 614,      // Cubchoo, Beartic
  615,           // Cryogonal (Crown Tundra)
  616, 617,      // Shelmet, Accelgor
  618,           // Stunfisk
  622, 623,      // Golett, Golurk
  624, 625,      // Pawniard, Bisharp
  626,           // Bouffalant (Isle of Armor)
  627, 628,      // Rufflet, Braviary
  629, 630,      // Vullaby, Mandibuzz
  631,           // Heatmor
  632,           // Durant
  633, 634, 635, // Deino, Zweilous, Hydreigon
  677, 678,      // Espurr, Meowstic
  682, 683,      // Spritzee, Aromatisse
  684, 685,      // Swirlix, Slurpuff
  686, 687,      // Inkay, Malamar
  688, 689,      // Binacle, Barbaracle
  701,           // Hawlucha
  704, 705, 706, // Goomy, Sliggoo, Goodra
  708, 709,      // Phantump, Trevenant
  712, 713,      // Bergmite, Avalugg
  714, 715,      // Noibat, Noivern
  736, 737, 738, // Grubbin line
  742, 743,      // Cutiefly, Ribombee
  746,           // Wishiwashi
  747, 748,      // Mareanie, Toxapex
  749, 750,      // Mudbray, Mudsdale
  751, 752,      // Dewpider, Araquanid
  753, 754,      // Fomantis, Lurantis (Isle of Armor)
  755, 756,      // Morelull, Shiinotic
  757, 758,      // Salandit, Salazzle
  759, 760,      // Stufful, Bewear
  761, 762, 763, // Bounsweet line
  765,           // Oranguru
  766,           // Passimian
  767, 768,      // Wimpod, Golisopod
  769, 770,      // Sandygast, Palossand (Isle of Armor)
  771,           // Pyukumuku
  776,           // Turtonator
  777,           // Togedemaru
  778,           // Mimikyu
  780,           // Drampa
  781,           // Dhelmise
  782, 783, 784, // Jangmo-o line
]);

// Isle of Armor DLC (210 species)
export const SWSH_ISLE_OF_ARMOR_SPECIES = new Set<number>([
  891, 892,      // Kubfu, Urshifu
  1, 2, 3,       // Bulbasaur, Ivysaur, Venusaur
  7, 8, 9,       // Squirtle, Wartortle, Blastoise
  79, 80, 199,   // Galarian Slowpoke, Slowbro, Slowking
  27, 28,        // Sandshrew, Sandslash (Alolan)
  37, 38,        // Vulpix, Ninetales (Alolan)
  50, 51,        // Diglett, Dugtrio (Alolan)
  102, 103,      // Exeggcute, Exeggutor (Alolan)
  104, 105,      // Cubone, Marowak (Alolan)
  108, 463,      // Lickitung, Lickilicky
  113, 242, 440, // Chansey, Blissey, Happiny
  114, 465,      // Tangela, Tangrowth
  115,           // Kangaskhan
  116, 117, 230, // Horsea, Seadra, Kingdra
  120, 121,      // Staryu, Starmie
  123, 212,      // Scyther, Scizor
  127,           // Pinsir
  128,           // Tauros
  137, 233, 474, // Porygon, Porygon2, Porygon-Z
  179, 180, 181, // Mareep line
  183, 184, 298, // Marill line
  214,           // Heracross
  227,           // Skarmory
  241,           // Miltank
  265, 266, 267, 268, 269, // Wurmple line
  293, 294, 295, // Whismur line
  304, 305, 306, // Aron line
  318, 319,      // Carvanha, Sharpedo
  320, 321,      // Wailmer, Wailord
  427, 428,      // Buneary, Lopunny
  447, 448,      // Riolu, Lucario
  543, 544, 545, // Venipede line
  548, 549,      // Petilil, Lilligant
  551, 552, 553, // Sandile line
  570, 571,      // Zorua, Zoroark
  587,           // Emolga
  590, 591,      // Foongus, Amoonguss
  619, 620,      // Mienfoo, Mienshao
  621,           // Druddigon
  626,           // Bouffalant
  636, 637,      // Larvesta, Volcarona
  661, 662, 663, // Fletchling line
  690, 691,      // Skrelp, Dragalge
  692, 693,      // Clauncher, Clawitzer
  702,           // Dedenne
  707,           // Klefki
  753, 754,      // Fomantis, Lurantis
  764,           // Comfey
  769, 770,      // Sandygast, Palossand
  845,           // Cramorant
]);

// Crown Tundra DLC (210 species)
export const SWSH_CROWN_TUNDRA_SPECIES = new Set<number>([
  894, 895,      // Regieleki, Regidrago
  896, 897, 898, // Glastrier, Spectrier, Calyrex
  144, 145, 146, // Galarian Articuno, Zapdos, Moltres
  // Returning in Crown Tundra:
  29, 30, 31,    // Nidoran female line
  32, 33, 34,    // Nidoran male line
  41, 42, 169,   // Zubat, Golbat, Crobat
  124, 238,      // Jynx, Smoochum
  125, 239, 466, // Elekid line
  126, 240, 467, // Magby line
  142,           // Aerodactyl
  173, 35, 36,   // Cleffa, Clefairy, Clefable
  218, 219,      // Slugma, Magcargo
  220, 221, 473, // Swinub, Piloswine, Mamoswine
  222,           // Corsola
  225,           // Delibird
  246, 247, 248, // Larvitar, Pupitar, Tyranitar
  304, 305, 306, // Aron line
  333, 334,      // Swablu, Altaria
  345, 346,      // Lileep, Cradily
  347, 348,      // Anorith, Armaldo
  359,           // Absol
  363, 364, 365, // Spheal, Sealeo, Walrein
  366, 367, 368, // Clamperl line
  369,           // Relicanth
  371, 372, 373, // Bagon, Shelgon, Salamence
  374, 375, 376, // Beldum, Metang, Metagross
  377, 378, 379, // Regirock, Regice, Registeel
  403, 404, 405, // Shinx line
  443, 444, 445, // Gible, Gabite, Garchomp
  459, 460,      // Snover line
  564, 565,      // Tirtouga, Carracosta
  566, 567,      // Archen, Archeops
  577, 578, 579, // Solosis line
  582, 583, 584, // Vanillite line
  615,           // Cryogonal
  696, 697,      // Tyrunt, Tyrantrum
  698, 699,      // Amaura, Aurorus
  703,           // Carbink
  // Dynamax Adventures Past Legendaries
  150, 151,      // Mewtwo
  243, 244, 245, // Raikou, Entei, Suicune
  249, 250,      // Lugia, Ho-Oh
  380, 381,      // Latias, Latios
  382, 383, 384, // Kyogre, Groudon, Rayquaza
  480, 481, 482, // Uxie, Mesprit, Azelf
  483, 484, 487, // Dialga, Palkia, Giratina
  485, 486, 488, // Heatran, Regigigas, Cresselia
  638, 639, 640, // Cobalion, Terrakion, Virizion
  641, 642, 645, // Tornadus, Thundurus, Landorus
  643, 644, 646, // Reshiram, Zekrom, Kyurem
  716, 717, 718, // Xerneas, Yveltal, Zygarde
  785, 786, 787, 788, // Tapu Koko, Lele, Bulu, Fini
  789, 790, 791, 792, // Solgaleo, Lunala
  793, 794, 795, 796, 797, 798, 799, 800, // Ultra Beasts + Necrozma
  803, 804, 805, 806, // Poipole, Naganadel, Stakataka, Blacephalon
]);

// SwSh Transfer-Only Species
export const SWSH_TRANSFER_ONLY_SPECIES = new Set<number>([
  151,           // Mew
  251,           // Celebi
  385, 386,      // Jirachi, Deoxys
  647, 648, 649, // Keldeo (also wild in CT footprints!), Meloetta, Genesect
  719, 720, 721, // Diancie, Hoopa, Volcanion
  801, 802,      // Magearna, Marshadow
  807, 808, 809, // Zeraora, Meltan, Melmetal
  893,           // Zarude
]);

// ==========================================
// CANONICAL GENERATION 1-7 PLATFORM LIMITS & EXCLUSIVES
// ==========================================

// Let's Go Pikachu / Eevee (LGPE): #1–151 plus 808, 809
export function isLgpeAvailable(id: number): boolean {
  return (id >= 1 && id <= 151) || id === 808 || id === 809;
}

// BDSP: #1 to #493 only
export function isBdspAvailable(id: number): boolean {
  return id >= 1 && id <= 493;
}

// Gen I Red / Blue / Yellow: #1 to #151 only
export function isGen1Available(id: number): boolean {
  return id >= 1 && id <= 151;
}

// Gen II Gold / Silver / Crystal: #1 to #251 only
export function isGen2Available(id: number): boolean {
  return id >= 1 && id <= 251;
}

// Gen III RSE, FRLG, Colo, XD: #1 to #386 only
export function isGen3Available(id: number): boolean {
  return id >= 1 && id <= 386;
}

// Colosseum Shadow Pokémon (48 Species)
export const COLO_SHADOW_SPECIES = new Set<number>([
  153, 156, 159, // Bayleef, Quilava, Croconaw
  162, 164, 166, 168, // Furret, Noctowl, Ledian, Ariados
  176, 180, 185, 189, // Togetic, Flaaffy, Sudowoodo, Jumpluff
  190, 192, 193, 195, // Aipom, Sunflora, Yanma, Quagsire
  198, 200, 202, 204, 205, // Murkrow, Misdreavus, Wobbuffet, Pineco, Forretress
  206, 207, 210, 211, 213, 214, // Dunsparce, Gligar, Granbull, Qwilfish, Shuckle, Heracross
  215, 217, 219, 221, 223, 224, // Sneasel, Ursaring, Magcargo, Piloswine, Remoraid, Octillery
  225, 226, 227, 229, 232, // Delibird, Mantine, Skarmory, Houndoom, Donphan
  234, 235, 237, 241, // Stantler, Smeargle, Hitmontop, Miltank
  243, 244, 245, 248, 250, // Raikou, Entei, Suicune, Tyranitar, Ho-Oh
  // GBA Transfer Support for all other Gen 1-3
]);

// XD: Gale of Darkness Shadow Pokémon (83 Species)
export const XD_SHADOW_SPECIES = new Set<number>([
  133, // Eevee (Starter)
  249, // Shadow Lugia (XD001)
  144, 145, 146, // Articuno, Zapdos, Moltres
  149, 373, 248, // Dragonite, Salamence, Tyranitar
  115, 122, 123, 124, 125, 126, 127, 128, 131, 143, // Kangaskhan, Mr. Mime, Scyther, Jynx, Electabuzz, Magmar, Pinsir, Tauros, Lapras, Snorlax
  169, 178, 181, 184, 199, 208, 212, 214, 229, 230, 232, // Crobat, Xatu, Ampharos, Azumarill, Slowking, Steelix, Scizor, Heracross, Houndoom, Kingdra, Donphan
  262, 264, 272, 275, 277, 279, 282, 286, 289, 295, 297, // Mightyena, Linoone, Ludicolo, Shiftry, Swellow, Pelipper, Gardevoir, Breloom, Slaking, Exploud, Hariyama
  301, 302, 303, 306, 308, 310, 311, 312, 313, 314, 315, // Delcatty, Sableye, Mawile, Aggron, Medicham, Manectric, Plusle, Minun, Volbeat, Illumise, Roselia
  317, 319, 321, 323, 324, 326, 329, 332, 334, 335, 336, // Swalot, Sharpedo, Wailord, Camerupt, Torkoal, Grumpig, Vibrava, Cacturne, Altaria, Zangoose, Seviper
  337, 338, 340, 342, 344, 350, 351, 354, 356, 357, 358, 359, 362, 365, 370, // Lunatone, Solrock, Whiscash, Crawdaunt, Claydol, Milotic, Castform, Banette, Dusclops, Tropius, Chimecho, Absol, Glalie, Walrein, Luvdisc
]);

// ==========================================
// CANONICAL COMPANION VERSION EXCLUSIVES
// ==========================================

export const SWORD_EXCLUSIVES = new Set<number>([
  83, 865, 273, 274, 275, 303, 338, 554, 555, 559, 560, 574, 575, 576, 627, 628, 633, 634, 635, 684, 685, 766, 776, 782, 783, 784, 841, 874, 888, 127, 692, 693, 138, 139, 371, 372, 373,
]);

export const SHIELD_EXCLUSIVES = new Set<number>([
  77, 78, 222, 864, 270, 271, 272, 302, 337, 453, 454, 577, 578, 579, 629, 630, 246, 247, 248, 682, 683, 765, 780, 704, 705, 706, 842, 875, 889, 214, 690, 691, 140, 141, 443, 444, 445,
]);

export const SCARLET_EXCLUSIVES = new Set<number>([
  246, 247, 248, 425, 426, 434, 435, 633, 634, 635, 690, 691, 765, 874, 845, 936, 984, 985, 986, 987, 988, 989, 990, 1007, 1009, 1020, 1021, 207, 472, 408, 409, 37, 38,
]);

export const VIOLET_EXCLUSIVES = new Set<number>([
  200, 429, 316, 317, 371, 372, 373, 692, 693, 766, 885, 886, 887, 875, 877, 937, 991, 992, 993, 994, 995, 996, 997, 1008, 1010, 1022, 1023, 190, 424, 410, 411, 27, 28,
]);

export const BD_EXCLUSIVES = new Set<number>([
  10, 11, 12, 23, 24, 58, 59, 86, 87, 123, 212, 239, 125, 466, 198, 430, 207, 472, 246, 247, 248, 273, 274, 275, 303, 335, 338, 352, 408, 409, 434, 435, 483, 250, 243, 244, 245,
]);

export const SP_EXCLUSIVES = new Set<number>([
  13, 14, 15, 27, 28, 37, 38, 79, 80, 199, 240, 126, 467, 127, 200, 429, 216, 217, 234, 270, 271, 272, 302, 336, 337, 371, 372, 373, 410, 411, 431, 432, 484, 249, 144, 145, 146,
]);

export const LGP_EXCLUSIVES = new Set<number>([27, 28, 43, 44, 45, 56, 57, 58, 59, 88, 89, 123]);
export const LGE_EXCLUSIVES = new Set<number>([23, 24, 37, 38, 52, 53, 69, 70, 71, 109, 110, 127]);

export const RED_EXCLUSIVES = new Set<number>([23, 24, 43, 44, 45, 56, 57, 58, 59, 123, 125]);
export const BLUE_EXCLUSIVES = new Set<number>([27, 28, 37, 38, 52, 53, 69, 70, 71, 126, 127]);

export const GOLD_EXCLUSIVES = new Set<number>([56, 57, 58, 59, 167, 168, 207, 216, 217, 226, 231, 232]);
export const SILVER_EXCLUSIVES = new Set<number>([37, 38, 52, 53, 165, 166, 225, 227, 228, 229]);

export const RUBY_EXCLUSIVES = new Set<number>([273, 274, 275, 303, 335, 338, 381, 383]);
export const SAPPHIRE_EXCLUSIVES = new Set<number>([270, 271, 272, 302, 336, 337, 380, 382]);

export const FIRERED_EXCLUSIVES = new Set<number>([23, 24, 43, 44, 45, 54, 55, 58, 59, 90, 91, 123, 125, 194, 195, 198, 211, 225, 227]);
export const LEAFGREEN_EXCLUSIVES = new Set<number>([27, 28, 37, 38, 69, 70, 71, 79, 80, 120, 121, 126, 127, 183, 184, 200, 223, 224, 226]);

export const DIAMOND_EXCLUSIVES = new Set<number>([86, 87, 123, 198, 246, 247, 248, 261, 262, 304, 305, 306, 408, 409, 434, 435, 483]);
export const PEARL_EXCLUSIVES = new Set<number>([79, 80, 127, 200, 228, 229, 327, 371, 372, 373, 410, 411, 431, 432, 484]);

export const HEARTGOLD_EXCLUSIVES = new Set<number>([56, 57, 58, 59, 167, 168, 207, 226, 231, 232, 302, 343, 344, 382]);
export const SOULSILVER_EXCLUSIVES = new Set<number>([37, 38, 52, 53, 165, 166, 216, 217, 225, 227, 303, 316, 317, 383]);

export const BLACK_EXCLUSIVES = new Set<number>([13, 14, 15, 198, 228, 229, 285, 286, 574, 575, 576, 629, 630, 641, 643]);
export const WHITE_EXCLUSIVES = new Set<number>([10, 11, 12, 200, 261, 262, 548, 549, 577, 578, 579, 627, 628, 642, 644]);

export const BLACK2_EXCLUSIVES = new Set<number>([13, 14, 15, 240, 126, 467, 325, 326, 427, 428, 574, 575, 576, 629, 630, 643]);
export const WHITE2_EXCLUSIVES = new Set<number>([10, 11, 12, 239, 125, 466, 322, 323, 300, 301, 577, 578, 579, 627, 628, 644]);

export const X_EXCLUSIVES = new Set<number>([120, 121, 127, 228, 229, 261, 262, 304, 305, 306, 539, 684, 685, 692, 693, 716]);
export const Y_EXCLUSIVES = new Set<number>([90, 91, 214, 246, 247, 248, 309, 310, 509, 510, 538, 682, 683, 690, 691, 717]);

export const OMEGARUBY_EXCLUSIVES = new Set<number>([273, 274, 275, 303, 335, 338, 381, 383, 250, 483, 641, 643]);
export const ALPHASAPPHIRE_EXCLUSIVES = new Set<number>([270, 271, 272, 302, 336, 337, 380, 382, 249, 484, 642, 644]);

export const SUN_EXCLUSIVES = new Set<number>([37, 38, 546, 547, 627, 628, 766, 776, 791, 794, 798]);
export const MOON_EXCLUSIVES = new Set<number>([27, 28, 548, 549, 629, 630, 765, 780, 792, 795, 797]);

export const ULTRASUN_EXCLUSIVES = new Set<number>([37, 38, 228, 229, 408, 409, 546, 547, 627, 628, 692, 693, 766, 776, 791, 794, 798, 806]);
export const ULTRAMOON_EXCLUSIVES = new Set<number>([27, 28, 309, 310, 410, 411, 548, 549, 629, 630, 690, 691, 765, 780, 792, 795, 797, 805]);

