import assert from 'node:assert/strict';
import { COLOR_VARIANTS, COLOR_VARIANT_NOTES } from '../src/data/colorVariants.generated';
import { COLOR_SPRITE_FILES } from '../src/data/spriteFiles.generated';
import { getVariationsForPokemon } from '../src/data/regionalVariantsData';
import { buildInitialNationalDex } from '../src/data/pokemonData';
import { spriteSources } from '../src/utils/spriteSources';

const dex = buildInitialNationalDex();
const all = Object.values(COLOR_VARIANTS).flat();
assert.ok(all.length >= 200, `colour variants present (${all.length})`);
assert.ok(Object.keys(COLOR_VARIANTS).length >= 25, 'covers many species');

// Every colour form has a bundled sprite and resolves to a local source.
for (const variant of all) {
  // A base form shares the species sprite; every other form has its own artwork.
  if (!variant.base) assert.ok(COLOR_SPRITE_FILES[variant.spriteId], `sprite bundled for ${variant.name} (${variant.spriteId})`);
  assert.ok(spriteSources(variant.spriteId).length > 0, `${variant.name} resolves a sprite source`);
  assert.ok(variant.name.length > 0 && variant.kind.length > 0);
}
// Each entry is unique per species and has an id-safe suffix.
for (const [dexId, list] of Object.entries(COLOR_VARIANTS)) {
  const suffixes = list.map((v) => v.suffix);
  assert.equal(new Set(suffixes).size, suffixes.length, `#${dexId} suffixes unique`);
  assert.ok(suffixes.every((s) => /^[a-z0-9-]+$/.test(s)), `#${dexId} suffixes id-safe`);
}

// Known families and their expected shape.
assert.ok(COLOR_VARIANTS[666].length >= 18, 'Vivillon has its wing patterns');
assert.ok(COLOR_VARIANTS[869].length >= 60, 'Alcremie has its creams and sweets');
assert.ok(COLOR_VARIANTS[676].length >= 9, 'Furfrou has its trims');
assert.ok(COLOR_VARIANTS[493].length >= 17, 'Arceus has its type forms');
assert.ok(COLOR_VARIANTS[669].length >= 5, 'Flabébé has all five flower colours');
// Shellos and Gastrodon have West/East Sea forms, with the West Sea as the species form.
for (const id of [422, 423]) {
  const forms = COLOR_VARIANTS[id];
  const names = forms.map((v) => v.name);
  assert.ok(names.some((n) => n.includes('West Sea')), `#${id} has West Sea`);
  assert.ok(names.some((n) => n.includes('East Sea')), `#${id} has East Sea`);
  assert.ok(forms.some((v) => v.base), `#${id} marks its species form as shared artwork`);
}
assert.ok(COLOR_VARIANTS[421].some((v) => v.name.includes('Overcast')), 'Cherrim has Overcast Form');
assert.ok(COLOR_VARIANTS[585].length >= 3, 'Deerling has its seasons');
assert.ok(COLOR_VARIANT_NOTES.vivillon?.includes('region'), 'notes explain how a form is obtained');

// The variants surface on the species in the app.
for (const id of [666, 869, 676, 669]) {
  const mon = dex.find((p) => p.id === id)!;
  const variants = getVariationsForPokemon(mon);
  const colour = variants.filter((v) => COLOR_VARIANTS[id].some((c) => v.variantId === `${id}:${c.suffix}`));
  assert.equal(colour.length, COLOR_VARIANTS[id].length, `${mon.name} exposes every colour variant`);
  assert.ok(colour.every((v) => v.formName.startsWith(mon.name)), 'names are prefixed with the species');
}

// A species whose own form is a named variant must not also list a plain entry.
for (const id of [422, 423, 669, 666]) {
  const mon = dex.find((p) => p.id === id)!;
  const variants = getVariationsForPokemon(mon);
  const ids = variants.map((v) => v.variantId);
  assert.equal(new Set(ids).size, ids.length, `${mon.name} has no duplicate variants`);
  assert.ok(
    !variants.some((v) => v.variantId === `${id}:base`),
    `${mon.name} drops the redundant plain entry`,
  );
}
// Species without a named species-form keep their normal base entry.
for (const id of [25, 133, 1]) {
  const mon = dex.find((p) => p.id === id)!;
  assert.ok(
    getVariationsForPokemon(mon).some((v) => v.variantId === `${id}:base`),
    `${mon.name} keeps its base variant`,
  );
}
console.log(`Colour variant tests passed: ${Object.keys(COLOR_VARIANTS).length} species, ${all.length} forms, all sprites bundled and reachable in the app.`);
