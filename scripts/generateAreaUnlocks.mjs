/**
 * Generate the per-game location-area → unlock-milestone table used by the
 * Progress tab. It reuses the SAME zone regex tables as
 * scripts/generateMilestoneGates.mjs, so "which badge unlocks this route"
 * can never drift from "which badge gates these encounters".
 *
 * Areas come from the verified encounter bundle, so only real locations that
 * actually appear in gameplay are listed.
 *
 * Run:  node scripts/generateAreaUnlocks.mjs
 * Out:  src/data/areaUnlocks.generated.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const enc = JSON.parse(readFileSync(join(ROOT, 'public/data/encounters.json'), 'utf8'));

/** Zone tables — kept identical to generateMilestoneGates.mjs. */
const KANTO_ZONES = (p) => [
  [`${p}-champion`, /cerulean-cave|unknown-dungeon|mt-silver/],
  [`${p}-badge-8`, /kanto-victory-road|kanto-route-23/],
  [`${p}-badge-7`, /pokemon-mansion|mt-ember|cinnabar|kanto-sea-route-21/],
  [`${p}-badge-6`, /saffron-city|silph-co|fighting-dojo/],
  [`${p}-badge-5`, /fuchsia|safari-zone|seafoam|kanto-sea-route-(19|20)|kanto-route-1[2-5]|bond-bridge|canyon-entrance/],
  [`${p}-badge-4`, /celadon|kanto-route-1[6-8]|kanto-route-[78]/],
  [`${p}-badge-3`, /kanto-route-(9|10|11)|rock-tunnel|lavender|pokemon-tower|power-plant|digletts-cave|ss-anne|vermilion/],
  [`${p}-badge-2`, /kanto-route-[56]|kanto-route-2[45]|underground-path/],
  [`${p}-badge-1`, /kanto-route-[34]|mt-moon|cerulean/],
  ['start', /./],
];
const JOHTO_ZONES = (p) => [
  [`${p}-red`, /mt-silver|silver-cave|johto-route-28/],
  [`${p}-kanto`, /kanto-|cerulean|viridian|pewter|seafoam|mt-moon|rock-tunnel|cinnabar|saffron|celadon|fuchsia|lavender|vermilion|power-plant|mansion|digletts|tohjo/],
  [`${p}-badge-8`, /johto-victory-road|johto-route-2[67]|bell-tower|tin-tower/],
  [`${p}-badge-7`, /blackthorn|ice-path|dragons-den|johto-route-4[56]/],
  [`${p}-badge-6`, /lake-of-rage|mahogany|mt-mortar|johto-route-4[23]|team-rocket|reds-gyarados/],
  [`${p}-badge-5`, /cianwood|whirl|johto-sea-route-4[01]/],
  [`${p}-badge-4`, /ecruteak|burned-tower|johto-route-3[89]/],
  [`${p}-badge-3`, /goldenrod|national-park|johto-route-3[4-7]/],
  [`${p}-badge-2`, /azalea|ilex-forest/],
  ['start', /./],
];
const HOENN_ZONES = (p) => [
  [`${p}-champion`, /ever-grande|hoenn-victory-road|sky-pillar|mirage-island|mirage-spot|soaring|southern-island|faraway-island|desert-underpass|artisan-cave|altering-cave|battle-frontier|battle-resort|birth-island|marine-tunnel|crescent-isle|fabled-cave|gnarled-den|nameless-space|roaming/],
  [`${p}-badge-8`, /sootopolis|cave-of-origin|seafloor-cavern|ancient-tomb|desert-ruins|island-cave/],
  [`${p}-badge-7`, /mossdeep|hoenn-route-12[4-9]|shoal-cave|hoenn-route-13[0-4]/],
  [`${p}-badge-6`, /fortree|hoenn-route-11[8-9]|hoenn-route-12[0-3]|mt-pyre|hoenn-safari-zone|lilycove|hoenn-route-121/],
  [`${p}-badge-5`, /new-mauville|abandoned-ship|pacifidlog|hoenn-route-115/],
  [`${p}-badge-4`, /lavaridge|jagged-pass|meteor-falls|fiery-path|magma-hideout|hoenn-route-11[1-4]/],
  [`${p}-badge-3`, /mauville|hoenn-route-11[0-2]|hoenn-route-11[67]|verdanturf/],
  [`${p}-badge-2`, /hoenn-route-10[5-9]|granite-cave|dewford|rusturf-tunnel|slateport/],
  [`${p}-badge-1`, /petalburg-woods|hoenn-route-104|petalburg-city|rustboro/],
  ['start', /./],
];
const SINNOH_ZONES = (p) => [
  [`${p}-champion`, /spear-pillar|distortion-world|hall-of-origin|flower-paradise|stark-mountain|fight-area|survival-area|resort-area|sea-sp|sinnoh-sea-route-2|snowpoint-temple|turnback-cave|sendoff-spring|roaming/],
  [`${p}-badge-8`, /sunyshore|sinnoh-route-2[23][0-9]?|sinnoh-route-22[2-4]|victory-road/],
  [`${p}-badge-7`, /snowpoint|acuity|sinnoh-route-2[17]|lake-acuity|mt-coronet|celestic/],
  [`${p}-badge-6`, /canalave|iron-island|sinnoh-route-218/],
  [`${p}-badge-5`, /hearthome|sinnoh-route-20[89]|trophy-garden|sinnoh-route-21[01]/],
  [`${p}-badge-4`, /pastoria|great-marsh|sinnoh-route-21[2-9]|lake-valor|solaceon/],
  [`${p}-badge-3`, /veilstone/],
  [`${p}-badge-2`, /eterna|sinnoh-route-20[3-7]|old-chateau/],
  [`${p}-badge-1`, /floaroma|sinnoh-route-204|ravaged-path|fuego-ironworks|valley-windworks/],
  ['start', /./],
];
const UNOVA_ZONES = (p) => [
  [`${p}-champion`, /ns-castle|abundant-shrine|challengers-cave|liberty-garden|p2-laboratory|victory-road-bw2?|roaming/],
  [`${p}-badge-8`, /opelucid|unova-route-1[0-9]|unova-route-21|unova-route-23|victory-road|reversal-mountain|nature-sanctuary|seaside-cave|humilau-city|marine-tube/],
  [`${p}-badge-7`, /giant-chasm|moor-of-icirrus|relic-castle|icirrus|dragonspiral/],
  [`${p}-badge-6`, /mistralton-city|celestial-tower|unova-route-7/],
  [`${p}-badge-5`, /driftveil|chargestone|twist-mountain|unova-route-6|mistralton-cave|cold-storage/],
  [`${p}-badge-4`, /nimbasa|unova-route-[59]/],
  [`${p}-badge-3`, /castelia-city|lostlorn-forest|desert-resort|relic-path/],
  [`${p}-badge-2`, /castelia-sewers|unova-route-4|virbank/],
  [`${p}-badge-1`, /nacrene|pinwheel-forest|unova-route-3/],
  ['start', /./],
];
const KALOS_ZONES = (p) => [
  [`${p}-champion`, /kiloude-city|friend-safari|pokemon-league|roaming/],
  [`${p}-badge-8`, /victory-road|kalos-route-19|kalos-route-21|snowbelle/],
  [`${p}-badge-7`, /anistar|kalos-route-1[78]|terminus-cave/],
  [`${p}-badge-6`, /laverre|kalos-route-1[56]|frost-cavern/],
  [`${p}-badge-5`, /lumiose|kalos-route-1[34]|kalos-route-9/],
  [`${p}-badge-4`, /coumarine|kalos-route-1[12]|reflection-cave/],
  [`${p}-badge-3`, /shalour|kalos-route-9/],
  [`${p}-badge-2`, /cyllage|kalos-route-[678]|connecting-cave|ambrette|glittering-cave|azure-bay|pokemon-village/],
  [`${p}-badge-1`, /santalune|kalos-route-5/],
  ['start', /./],
];
const ALOLA_ZONES = (p) => [
  [`${p}-champion`, /pokemon-league|altar-of-the-moon|altar-of-the-sunne|lake-of-the-moone|lake-of-the-sunne|poke-pelago-elite|conservatory|roaming/],
  [`${p}-grand-3`, /poni-gauntlet|ancient-poni|poni-meadow|resolution-cave|seafolk|vast-poni|poni-coast|poni-wilds|poni-plains|kalae-bay|poke-pelago-poni|broken-wooden|exeggutor-island|haina-desert|ruins-of-abundance/],
  [`${p}-grand-2`, /ula'ula|ulaula|malie|tapu-village|mount-lanakila|po-town|aether-house|hokulani|thrifty-megamart|alola-route-1[0-7]|ruins-of-hope|aether-paradise|mount-lanak/],
  [`${p}-grand-1`, /akala|alola-route-[4-9]|wela-volcano|royal-avenue|konikoni|paniola|diving-spot|lanakila|ruins-of-life|dimensional-research|verdant-cavern|memorial-hill|brooklet-hill|lush-jungle|poke-pelago/],
  ['start', /./],
];
const GALAR_ZONES = [
  ['swsh-ct', /crown-tundra|freezington|giant-s-beds|giants-bed|dyna-tree-hill|frosting-field|tunnel-to-the-top|three-point-pass|crown-shrine|ballimere-lake|old-cemetery|lakeside-cave|rocky-picket|split-decision-cavern|roaring-sea-caves|frigid-sea-cave/],
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

const GROUP_ZONES = {
  rb: { zones: KANTO_ZONES('rb'), members: ['red', 'blue', 'yellow'] },
  frlg: {
    zones: KANTO_ZONES('frlg').slice(0, -1).concat([
      ['frlg-champion', /(four|five|six|seven)-island|icefall-cave|berry-forest|lost-cave|dilford-chamber|tanoby|pattern-bush|green-path|water-labyrinth|outcast-island|resort-gorgeous|valencia-island|ruin-valley|water-path|memorial-pillar|trainer-tower|sevault-canyon|sevii|birth-island|navel-rock/],
      ['frlg-badge-7', /(one|two|three)-island|kindle-road|treasure-beach|mt-ember|ember-spa|bond-bridge|canyon-entrance|five-isle-meadow|cape-brink/],
      ['start', /./],
    ]),
    members: ['firered', 'leafgreen'],
  },
  gs: { zones: JOHTO_ZONES('gs'), members: ['gold', 'silver', 'crystal'] },
  hgss: { zones: JOHTO_ZONES('hgss'), members: ['heartgold', 'soulsilver'] },
  rse: { zones: HOENN_ZONES('rse'), members: ['ruby', 'sapphire', 'emerald'] },
  oras: { zones: HOENN_ZONES('oras'), members: ['omegaruby', 'alphasapphire'] },
  dppt: { zones: SINNOH_ZONES('dppt'), members: ['diamond', 'pearl', 'platinum'] },
  bdsp: { zones: SINNOH_ZONES('bdsp'), members: ['bd', 'sp'] },
  bw: { zones: UNOVA_ZONES('bw'), members: ['black', 'white'] },
  b2w2: { zones: UNOVA_ZONES('b2w2'), members: ['black2', 'white2'] },
  xy: { zones: KALOS_ZONES('xy'), members: ['x', 'y'] },
  sm: { zones: ALOLA_ZONES('sm'), members: ['sun', 'moon'] },
  lgpe: { zones: KANTO_ZONES('lgpe'), members: ['lgp', 'lge'] },
  swsh: { zones: GALAR_ZONES, members: ['sword', 'shield'] },
  pla: { zones: [['pla-rank-1', /./]], members: ['pla'] },
  sv: { zones: [['start', /./]], members: ['scarlet', 'violet'] },
};

const areas = {}; // group → { areaName: milestoneId|null }
for (const [group, { zones, members }] of Object.entries(GROUP_ZONES)) {
  const found = new Map();
  for (const game of members) {
    for (const byGame of Object.values(enc)) {
      const rows = byGame[game];
      if (!rows) continue;
      for (const area of Object.keys(rows)) {
        if (found.has(area)) continue;
        let milestone = 'start';
        for (const [id, matcher] of zones) {
          if (matcher.test(area)) { milestone = id; break; }
        }
        found.set(area, milestone === 'start' ? null : milestone);
      }
    }
  }
  areas[group] = Object.fromEntries([...found.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

const lines = Object.entries(areas)
  .map(([group, list]) => {
    const inner = Object.entries(list)
      .map(([area, ms]) => `    ${JSON.stringify(area)}: ${ms === null ? 'null' : `'${ms}'`},`)
      .join('\n');
    return `  ${JSON.stringify(group)}: {\n${inner}\n  },`;
  })
  .join('\n');

const out = `/**
 * AUTO-GENERATED by scripts/generateAreaUnlocks.mjs — do not edit by hand.
 *
 * Maps each trackable game group's location areas (from the verified encounter
 * bundle) to the milestone that unlocks them, using the same zone tables as
 * scripts/generateMilestoneGates.mjs. \`null\` means reachable from the start.
 */
export const AREA_UNLOCKS: Record<string, Record<string, string | null>> = {
${lines}
};
`;

const dest = join(ROOT, 'src', 'data', 'areaUnlocks.generated.ts');
writeFileSync(dest, out);
const totals = Object.entries(areas).map(([g, a]) => `${g}:${Object.keys(a).length}`).join(' ');
console.log(`Wrote ${dest}\nAreas per group — ${totals}`);
