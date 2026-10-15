# Accurate Wild Encounter Data

This app bundles exact wild-encounter data (location area → method, chance %,
min/max level, per-version) for every Pokémon from [PokéAPI](https://pokeapi.co),
generated into a static JSON file at `public/data/encounters.json`.

## How it works

1. **`scripts/fetchEncounters.mjs`** (Node) fetches
   `GET /api/v2/pokemon/{1..1025}/encounters` from PokéAPI with limited
   concurrency + retries, maps each PokéAPI `version` to the app's `GameId`
   (see `VERSION_TO_GAME_ID`), groups identical rows across sibling versions
   (e.g. Red/Blue/Yellow share an area), and writes a compact bundle.

2. **`public/data/encounters.json`** is committed with the repo so the site
   serves it statically — no runtime API calls, works with the PWA offline
   cache (`dex-data-v1` in `vite.config.ts`).

3. **`src/data/encountersData.ts`** lazy-loads the bundle once per session and
   exposes `getEncountersForGame(dataset, pokemonId, gameId)`.

4. **`src/components/PokemonEncountersSection.tsx`** renders, per owned game,
   each location area with method, encounter chance, and level range. It is
   embedded in `PokemonDetailDrawer` and `PokemonFullPageView`.

## Regenerating the data

```bash
npm run fetch:encounters                      # or: python3 scripts/fetch_encounters.py
python3 scripts/fetch_encounters_supplement.py   # SV/PLA (Serebii) + BDSP/USUM
npm run generate:gates                         # regenerate milestone gates
```

Then commit the updated `public/data/encounters.json`.

## Known limits

- **Supplemented games**: PokéAPI's `/encounters` endpoint lacks Brilliant
  Diamond/Shining Pearl, Legends: Arceus, and Scarlet/Violet wild data, so
  **`scripts/fetch_encounters_supplement.py`** scrapes Serebii Pokearth
  spawntables (cached under `/tmp`) and appends `scarlet`/`violet`/`pla` rows;
  BDSP/BD & SP are derived from the faithful-remake DPPt bundle data and
  USUM from the SM data. Re-run it after `npm run fetch:encounters`.
- Species obtained only via evolution or transfer have no wild rows and show
  an explanatory message instead.

## Encounter summaries ("Where to find")

`summarizeEncountersForGame(dataset, pokemonId, gameId)` in
`src/data/encountersData.ts` derives the per-game "Where to find" text
straight from the bundle (top areas + method + level range + chance%). The
Catch Hub suggestion cards prefer this real, verified summary and only fall
back to curated availability text when a species×game pair has no bundle
rows (e.g. Colosseum/XD).

`scripts/generateEncounterCoverage.mjs` emits
`src/data/encounterCoverage.generated.ts` (species → games with verified
rows). `computeAvailabilityForPokemon` uses it to correct hand-curated
"unavailable" verdicts the verified data contradicts (e.g. Charmander in
Sword — Postwick gift + Max Raid dens), and labels each game's starter
species as a starter gift. The old fake rotating location arrays
(KANTO_LOCATIONS-style) are fully removed; the Pokemon detail drawer and
full-page "Your Owned Games" cards are gone, replaced by the per-owned-game
"Wild Encounters (Exact Data)" section.

## Milestone gates (badge → wild catchability)

`src/data/milestoneGates.tsx` now merges two sources:

- **Curated gates** (`CURATED_MILESTONE_GATES`) — hand-written entries for
  modern-game obtainability (SwSh DLC, PLA ranks, SV DLC, etc.).
- **Generated gates** (`src/data/milestoneGates.generated.ts`) — auto-derived
  from the PokéAPI wild-encounter bundle by `scripts/generateMilestoneGates.mjs`.
  Each location-area in every covered game is mapped to the badge / story
  milestone after which it is reachable (per-group progression zone tables in
  the generator), and each species is gated at the earliest area it appears in.

Merge rule: per species, curated ids win for their game prefix; generated ids
fill the prefixes the curated entry doesn't cover. Regenerate after refreshing
the encounter bundle with `npm run generate:gates`.

Groups without PokéAPI encounter coverage (SV, BDSP, PLA, Colosseum, XD, USUM)
have no generated gates; their grids in Fresh Catches are also not filtered
for evolution-only species.

## Encounter conditions (weather etc.)

The bundle now includes PokéAPI's `condition_values` per encounter row under
the compact key `cd` (only when non-empty). The UI surfaces the gameplay-
relevant families as chips on each encounter row: weather (rain, fog,
thunderstorm, snow, sandstorm, intense sun, overcast), time of day (GSC/HGSS),
seasons (BW), swarms, Poké Radar, honey tree groups, headbutt trees,
Bug-Catching Contest, radio channels, weekdays, and Max Den rarity/rating.
Noisier conditions (story-progress flags, Trophy Garden backlots, item and
trade requirements, etc.) are stored but intentionally not displayed.
