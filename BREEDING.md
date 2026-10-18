# Baby Pokémon and breeding guide

Pokémon detail drawers and full pages include **Eggs & Baby Pokémon**. The section shows species egg groups, a family's baby form, compatible adult parents for babies, egg offspring, base hatch cycles and hatch level. Parents/offspring link to their species pages. The game selector defaults to owned titles and can show every supported title.

## Offline data

`src/data/breeding.generated.ts` contains egg groups, baby classification, gender ratio, hatch counter, introduction generation and direct pre-evolution for all 1,025 species. These come from three canonical PokéAPI CSV tables rather than 1,025 live API calls:

- `pokemon_species.csv`
- `pokemon_egg_groups.csv`
- `egg_groups.csv`

Regenerate with `npm run generate:breeding`. The generator validates completeness before replacing the checked-in file. No network request is made when users read the guide. The bundled data is included in the ordinary app/offline update.

## Title-specific rules

`src/utils/breeding.ts` provides:

- Day Care/Nursery locations for breeding games; Scarlet/Violet use Picnic Egg Baskets.
- No breeding in R/B/Y, Let's Go, Legends: Arceus, Colosseum, XD or GO. GO Egg hatching is not breeding.
- Babies cannot be breeding parents. Adult relatives are listed for obtaining the baby.
- Nine incense families from Generations III–VIII; Scarlet/Violet automatically produce the baby without incense. Babies not introduced in an earlier generation do not replace that generation's normal offspring.
- Lv. 5 hatchlings in Generations II/III; Lv. 1 from Generation IV onward. Base Egg cycles are displayed without claiming an exact universal step count.
- No Eggs Discovered, male-only/genderless Ditto pairings, Ditto not producing Ditto Eggs, and the Manaphy/Phione exception.
- Nidoran and Volbeat/Illumise split offspring, including the Gen V change for male/Ditto pairings.
- Gen VI+ Everstone/Destiny Knot hints and appropriate Flame Body hints.

Game mechanics were cross-checked with Bulbapedia's [breeding](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_breeding), [baby Pokémon](https://bulbapedia.bulbagarden.net/wiki/Baby_Pok%C3%A9mon), [Egg](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Egg) and [gender](https://bulbapedia.bulbagarden.net/wiki/Gender) pages.

The UI additionally checks the selected species' existing game-compatibility metadata. This is a species guide, not a form-level breeding simulator or an Egg Move learnset database; regional offspring and Everstone form rules are explicitly noted. Nursery locations are base-game locations, with no unowned expansion acquisition routes added.

## Tests

`npm run test:breeding` runs rule tests (all 1,025 entries, 19 babies, nine incense families and exceptional cases) plus browser checks for game switching, incense removal, baby parent links, non-breeding games and phone layout.
