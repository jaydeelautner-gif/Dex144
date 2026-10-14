/**
 * Generate MILESTONE_GATES entries from the wild-encounter bundle.
 *
 * For every trackable game group that has encounter coverage in
 * public/data/encounters.json, we map each location-area to the badge /
 * milestone after which it is reachable, then derive: "species X becomes
 * catchable in the wild once milestone M is completed".
 *
 * Zones are ordered MOST-RESTRICTIVE FIRST (champion → badge 8 → … → start
 * catch-all). For each species the EARLIEST zone (min progression) across
 * all its encounter areas in the group's member games wins.
 *
 * Output: src/data/milestoneGates.generated.ts (GENERATED_MILESTONE_GATES)
 * Run: node scripts/generateMilestoneGates.mjs
 */
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const enc = JSON.parse(readFileSync(join(ROOT, 'public/data/encounters.json'), 'utf8'));

/** Kanto geography shared by RBY / FRLG / LGPE (ids parameterised). */
const KANTO_ZONES = (p) => [
  [`${p}-champion`, /cerulean-cave|mt-silver/],
  [`${p}-badge-8`, /kanto-victory-road|kanto-route-23/],
  [`${p}-badge-7`, /pokemon-mansion|mt-ember/],
  [`${p}-badge-6`, /saffron-city|silph-co|fighting-dojo/],
  [`${p}-badge-5`, /fuchsia|safari-zone|kanto-route-1[2-5]|bond-bridge|canyon-entrance/],
  [`${p}-badge-4`, /celadon|kanto-route-[78]/],
  [`${p}-badge-3`, /kanto-route-(9|10|11)|rock-tunnel|lavender|pokemon-tower|power-plant|digletts-cave|vermilion/],
  [`${p}-badge-2`, /kanto-route-[56]|underground-path|sea-route-(19|20|21)|cinnabar/],
  [`${p}-badge-1`, /kanto-route-[34]|mt-moon|cerulean/],
  ['start', /./],
];

/** Johto (+ post-champion Kanto) shared by GSC / HGSS. */
const JOHTO_ZONES = (p) => [
  [`${p}-red`, /mt-silver|silver-cave|johto-route-28/],
  [`${p}-kanto`, /kanto-/],
  [`${p}-badge-8`, /johto-victory-road|johto-route-2[67]|bell-tower|tin-tower/],
  [`${p}-badge-7`, /ice-path|blackthorn|johto-route-4[456]|dragons-den/],
  [`${p}-badge-6`, /lake-of-rage|mahogany|mt-mortar|johto-route-4[23]|team-rocket|reds-gyarados/],
  [`${p}-badge-4`, /cianwood|whirl|johto-sea-route-4[01]/],
  [`${p}-badge-3`, /ecruteak|burned-tower|national-park|goldenrod|johto-route-3[5-9]/],
  [`${p}-badge-2`, /johto-route-34/],
  [`${p}-badge-1`, /azalea|ilex-forest/],
  ['start', /./],
];

/** Hoenn shared by RSE / ORAS. */
const HOENN_ZONES = (p) => [
  [`${p}-champion`, /ever-grande|hoenn-victory-road|sky-pillar|mirage-island|southern-island|faraway-island|desert-underpass|artisan-cave|altering-cave|battle-frontier|battle-resort|birth-island|marine-tunnel|crescent-isle|fabled-cave|gnarled-den|nameless-space|roaming/],
  [`${p}-badge-8`, /sootopolis|cave-of-origin|seafloor-cavern|ancient-tomb|desert-ruins|island-cave/],
  [`${p}-badge-7`, /mossdeep|hoenn-route-12[4-9]|shoal-cave|hoenn-route-13[0-3]/],
  [`${p}-badge-6`, /fortree|hoenn-route-11[8-9]|hoenn-route-12[0-3]|mt-pyre|hoenn-safari-zone|lilycove|hoenn-route-121/],
  [`${p}-badge-5`, /new-mauville|abandoned-ship|pacifidlog|hoenn-route-115/],
  [`${p}-badge-4`, /lavaridge|jagged-pass|hoenn-route-11[1-4]/],
  [`${p}-badge-3`, /mauville|hoenn-route-11[0-2]|hoenn-route-11[67]|verdanturf/],
  [`${p}-badge-2`, /hoenn-route-10[5-9]|granite-cave|dewford|rusturf-tunnel|slateport/],
  [`${p}-badge-1`, /petalburg-woods|hoenn-route-104|petalburg-city/],
  ['start', /./],
];

/** Sinnoh (DPPt). */
const SINNOH_ZONES = (p) => [
  [`${p}-champion`, /spear-pillar|distortion-world|hall-of-origin|flower-paradise|stark-mountain|fight-area|survival-area|resort-area|sea-sp|snowpoint-temple|turnback-cave|roaming/],
  [`${p}-badge-8`, /sunyshore|sinnoh-route-2[23][0-9]?|sinnoh-route-22[2-4]|victory-road/],
  [`${p}-badge-7`, /snowpoint|acuity|sinnoh-route-2[17]|lake-acuity|mt-coronet-[4-6]f|celestic/],
  [`${p}-badge-6`, /canalave|iron-island|sinnoh-route-218/],
  [`${p}-badge-5`, /hearthome|sinnoh-route-21[01]/],
  [`${p}-badge-4`, /pastoria|great-marsh|sinnoh-route-21[2-9]|lake-valor|solaceon/],
  [`${p}-badge-3`, /veilstone/],
  [`${p}-badge-2`, /eterna|sinnoh-route-20[5-6]|old-chateau/],
  [`${p}-badge-1`, /floaroma|sinnoh-route-204|ravaged-path|fuego-ironworks|valley-windworks/],
  ['start', /./],
];

/** Unova (BW / B2W2). */
const UNOVA_ZONES = (p) => [
  [`${p}-champion`, /ns-castle|abundant-shrine|challengers-cave|liberty-garden|p2-laboratory|victory-road-bw2?|roaming/],
  [`${p}-badge-8`, /opelucid|unova-route-1[01]|victory-road|reversal-mountain/],
  [`${p}-badge-7`, /giant-chasm|moor-of-icirrus|relic-castle|icirrus/],
  [`${p}-badge-6`, /mistralton-city|celestial-tower|unova-route-7/],
  [`${p}-badge-5`, /driftveil|chargestone|twist-mountain|unova-route-6|mistralton-cave|cold-storage/],
  [`${p}-badge-4`, /nimbasa|unova-route-[59]/],
  [`${p}-badge-3`, /castelia-city|lostlorn-forest|desert-resort|relic-path/],
  [`${p}-badge-2`, /castelia-sewers|unova-route-4/],
  [`${p}-badge-1`, /nacrene|pinwheel-forest|unova-route-3/],
  ['start', /./],
];

/** Kalos (XY). */
const KALOS_ZONES = (p) => [
  [`${p}-champion`, /kiloude-city|friend-safari|pokemon-league|roaming/],
  [`${p}-badge-8`, /victory-road|kalos-route-19|snowbelle/],
  [`${p}-badge-7`, /anistar|kalos-route-1[78]/],
  [`${p}-badge-6`, /laverre|kalos-route-1[56]/],
  [`${p}-badge-5`, /lumiose|kalos-route-1[34]|kalos-route-9/],
  [`${p}-badge-4`, /coumarine|kalos-route-1[12]/],
  [`${p}-badge-3`, /shalour|kalos-route-9/],
  [`${p}-badge-2`, /cyllage|kalos-route-[678]|connecting-cave|ambrette|glittering-cave/],
  [`${p}-badge-1`, /santalune|kalos-route-5/],
  ['start', /./],
];

/** Alola (SM). */
const ALOLA_ZONES = (p) => [
  [`${p}-champion`, /pokemon-league|altar-of-the-moon|altar-of-the-sunne|lake-of-the-moone|lake-of-the-sunne|mahalo-trail|ten-carat-hill|conservatory|roaming/],
  [`${p}-grand-3`, /poni-gauntlet|ancient-poni|poni-meadow|resolution-cave|seafolk|vast-poni|poni-coast|broken-wooden|exeggutor-island|haina-desert|ruins-of-abundance/],
  [`${p}-grand-2`, /ula'ula|ulaula|malie|tapu-village|mount-lanakila|po-town|aether-house|hokulani|thrifty-megamart|alola-route-1[0-7]|ruins-of-hope|aether-paradise|mount-lanak/],
  [`${p}-grand-1`, /akala|alola-route-[4-9]|wela-volcano|royal-avenue|konikoni|paniola|diving-spot|lanakila|ruins-of-life|dimensional-research|verdant-cavern|memorial-hill/],
  ['start', /./],
];

/** Galar (SwSh). */
const GALAR_ZONES = [
  ['swsh-ct', /crown-tundra|freezington|giant-s-bed|dyna-tree-hill|frosting-field|tunnel-to-the-top|three-point-pass|crown-shrine|ballimur-lake|old-cemetery|lakeside-cave|rocky-picket|split-decision-cavern|roaring-sea-caves|frigid-sea-cave/],
  ['swsh-ioa', /isle-of-armor|master-dojo|warm-up-tunnel|potbottom|soothing-sands|forest-of-focus|courage-sea|wisdom-lake|loop-lagoon|challenge-beach|challenge-road|stepping-stone-sea/],
  ['swsh-champion', /energy-plant-tower|galar-pokemon-league|rose-tower|roaming/],
  ['swsh-badge-8', /hammerlocke-gym|lake-of-outrage|galar-route-10/],
  ['swsh-badge-7', /spikemuth|galar-route-9/],
  ['swsh-badge-6', /circhester|galar-route-8|giants-mirror|giants-cap|north-lake-miloch|south-lake-miloch/],
  ['swsh-badge-5', /ballonlea|glimwood-tangle|galar-route-7/],
  ['swsh-badge-4', /stow-on-side|dusty-bowl|galar-route-6|watchtower-ruins|hammerlocke-hills|stony-wilderness/],
  ['swsh-badge-3', /motostoke|bridge-field|galar-route-5|galar-mine-no|dappled-grove|giants-seat/],
  ['swsh-badge-2', /hulbury|galar-route-4/],
  ['swsh-badge-1', /galar-mine|galar-route-3|turffield|meetup-spot|east-lake-axewell|axews-eye/],
  ['start', /./],
];

/** Hisui (PLA) — areas unlock progressively via star rank + story beats.
 *  Coarse mapping: sub-areas inherit their main region's rank. */
const HISUI_ZONES = (p) => [
  [`${p}-rank-6`, /space-time|distortion|stark-mountain|turnback|spear-pillar|temple-of-sinnoh|icepeak-arena|lavadomesanctum|top/],
  [`${p}-rank-5`, /alabaster/],
  [`${p}-rank-4`, /coronet/],
  [`${p}-rank-3`, /cobalt/],
  [`${p}-rank-2`, /crimson/],
  [`${p}-rank-1`, /obsidian|jubilife|aspiration|grandtree|fieldlands-camp|sandgemflats|obsidianfalls|horseshoe|deertrack|aipom|bolderoll/],
  ['start', /./],
];

/** Paldea (SV) — open world, but zones follow the recommended badge path.
 *  Titan areas gate behind the ride-ability they unlock. */
const PALDEA_ZONES = [
  ['sv-champion', /areazero|greatcrater|zerogate|zerolab/],
  ['sv-gym-8', /glaseadomountain/],
  ['sv-gym-7', /alfornada/],
  ['sv-gym-6', /montenevera|north-province|northpaldeansea/],
  ['sv-titan-5', /casseroyalake/],
  ['sv-titan-4', /asadodesert/],
  ['sv-gym-5', /medali/],
  ['sv-gym-4', /cascarrafa/],
  ['sv-gym-3', /levincia/],
  ['sv-gym-2', /artazon|east-province|eastpaldeansea/],
  ['sv-gym-1', /cortondo|west-province|westpaldeansea/],
  ['start', /./],
];

const GROUP_ZONES = {
  rb: { zones: KANTO_ZONES('rb'), members: ['red', 'blue', 'yellow'] },
  frlg: { zones: KANTO_ZONES('frlg').concat([['frlg-badge-7', /(one|two|three)-island|kindle-road|treasure-beach|mt-ember|ember-spa|bond-bridge|canyon-entrance|five-isle-meadow/], ['frlg-champion', /(four|five|six|seven)-island|icefall-cave|berry-forest|lost-cave|dilford-chamber|tanoby|pattern-bush|green-path|water-labyrinth|outcast-island|resort-gorgeous|valencia-island|ruin-valley|sevii|birth-island|navel-rock/]]), members: ['firered', 'leafgreen'] },
  gs: { zones: JOHTO_ZONES('gs'), members: ['gold', 'silver', 'crystal'] },
  hgss: { zones: JOHTO_ZONES('hgss'), members: ['heartgold', 'soulsilver'] },
  rse: { zones: HOENN_ZONES('rse'), members: ['ruby', 'sapphire', 'emerald'] },
  oras: { zones: HOENN_ZONES('oras'), members: ['omegaruby', 'alphasapphire'] },
  dppt: { zones: SINNOH_ZONES('dppt'), members: ['diamond', 'pearl', 'platinum'] },
  bw: { zones: UNOVA_ZONES('bw'), members: ['black', 'white'] },
  b2w2: { zones: UNOVA_ZONES('b2w2'), members: ['black2', 'white2'] },
  bdsp: { zones: SINNOH_ZONES('bdsp'), members: ['bd', 'sp'] },
  pla: { zones: HISUI_ZONES('pla'), members: ['pla'] },
  sv: { zones: PALDEA_ZONES, members: ['scarlet', 'violet'] },
  xy: { zones: KALOS_ZONES('xy'), members: ['x', 'y'] },
  sm: { zones: ALOLA_ZONES('sm'), members: ['sun', 'moon'] },
  lgpe: { zones: KANTO_ZONES('lgpe'), members: ['lgp', 'lge'] },
  swsh: { zones: GALAR_ZONES, members: ['sword', 'shield'] },
};

const gates = {}; // speciesId → Set<milestoneId>

for (const [group, { zones, members }] of Object.entries(GROUP_ZONES)) {
  for (const [pid, byGame] of Object.entries(enc)) {
    let bestIdx = -1; // max zone index over all matched areas (max = earliest progression)
    for (const game of members) {
      const areas = byGame[game];
      if (!areas) continue;
      for (const areaName of Object.keys(areas)) {
        for (let i = 0; i < zones.length; i++) {
          const [msId, matcher] = zones[i];
          if (matcher.test(areaName)) {
            if (i > bestIdx) bestIdx = i;
            break; // first match in ordered list wins for this area
          }
        }
      }
    }
    if (bestIdx >= 0) {
      const msId = zones[bestIdx][0];
      if (msId !== 'start') {
        const id = Number(pid);
        (gates[id] ??= new Set()).add(msId);
      }
    }
  }
}

// Serialize
const lines = [];
for (const [id, set] of Object.entries(gates).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0])) {
  lines.push(`  ${id}: [${[...set].map((s) => `'${s}'`).join(', ')}],`);
}

const perGroup = {};
for (const ids of Object.values(gates)) for (const m of ids) {
  const g = m.split('-')[0];
  perGroup[g] = (perGroup[g] ?? 0) + 1;
}

const out = `/**
 * AUTO-GENERATED by scripts/generateMilestoneGates.mjs — do not edit by hand.
 *
 * Maps national dex number → the earliest milestone (badge / story beat) after
 * which that Pokémon is catchable in the wild in that game group, derived from
 * the PokéAPI wild-encounter bundle and per-game progression zone tables.
 * Merged with the curated gates in milestoneGates.tsx (curated entries win
 * per game prefix).
 */
export const GENERATED_MILESTONE_GATES: Record<number, string[]> = {
${lines.join('\n')}
};
`;

const dest = join(ROOT, 'src', 'data', 'milestoneGates.generated.ts');
writeFileSync(dest, out);
console.log(`Wrote ${dest}: ${Object.keys(gates).length} species gated`);
console.log('Per group:', perGroup);