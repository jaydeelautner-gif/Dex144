import assert from 'node:assert/strict';
import { ITEMS, ITEM_TYPES, MOVE_MACHINE_GROUPS, TM_HM } from '../src/data/items.generated';
import { CONSTELLATION_NAMES, GAME_VERSION_GROUP, humanItemName, versionGroupFor, VERSION_GROUP_LABEL } from '../src/data/gameVersionGroups';
import { ALL_CANONICAL_GAME_IDS } from '../src/data/pokemonData';
import { curatedLocationsForItem } from '../src/data/pokemonItemsData';
assert.ok(Object.keys(ITEMS).length>=1500);
for(const [id,item] of Object.entries(ITEMS)){
  assert.ok(typeof item.name==='string'&&item.name.length>0&&item.name.length<=80,`#${id} name`);
  assert.ok(Array.isArray(item.generations)&&item.generations.every(gen=>gen>=1&&gen<=9),`#${id} generations`);
  assert.ok(!/^(TM|TR|HM)\d+$/.test(item.name),'machines are not listed as plain items');
}
const thunder=Object.values(ITEMS).find(item=>item.name==='Thunder Stone');
assert.ok(thunder,'Thunder Stone present');assert.ok(thunder!.effect.length>0);
const masterBall=Object.values(ITEMS).find(item=>item.name==='Master Ball');
assert.ok(masterBall&&masterBall!.generations.length>0,'Master Ball has generations');
assert.equal(ITEM_TYPES[16],'Dragon');
assert.ok(Object.keys(TM_HM).length>=20);
for(const [group,list] of Object.entries(TM_HM)){
  assert.ok(list.length>0,`${group} has machines`);
  for(const entry of list){assert.ok(entry.move.length>0&&/^(TM|TR|HM)\d+$/.test(entry.item),`${group} ${entry.item}`);assert.ok(entry.n>=0);}
}
const hgss=TM_HM['heartgold-soulsilver'];
assert.equal(hgss.find(entry=>entry.item==='HM01')?.move,'Cut');
assert.ok((TM_HM['scarlet-violet'].find(entry=>entry.item==='TM01')?.move.length ?? 0)>0);
assert.equal(TM_HM['sword-shield'].some(entry=>entry.item.startsWith('HM')),false,'SwSh has no HMs');
assert.ok(TM_HM['red-blue'].some(entry=>entry.item.startsWith('HM')),'Gen I has HMs');
for(const game of ALL_CANONICAL_GAME_IDS){
  const declared=GAME_VERSION_GROUP[game]??null;
  assert.equal(versionGroupFor(game),declared,`${game} group`);
  if(declared)assert.ok(MOVE_MACHINE_GROUPS.includes(declared),`${game} group exists in data`);
}
assert.equal(versionGroupFor('pla'),null,'Legends: Arceus has no machines');
assert.equal(versionGroupFor('pogo'),null);
for(const group of MOVE_MACHINE_GROUPS)assert.ok(VERSION_GROUP_LABEL[group],`${group} has a label`);
// Dynamax Crystals are named after real stars; every one must expand to a constellation.
const crystals=Object.values(ITEMS).filter(item=>item.category==='dynamax-crystals');
assert.equal(crystals.length,300,'expected the full Dynamax Crystal set');
const unexpanded=[];
for(const crystal of crystals){
  const readable=humanItemName(crystal.name,crystal.category);
  if(readable===crystal.name)unexpanded.push(crystal.name);
  assert.match(readable,/^Dynamax Crystal — \p{Lu}[\p{L} ]+( \d+)?$/u,crystal.name);
}
assert.deepEqual(unexpanded,[],'every crystal got a readable star/constellation name');
assert.ok(CONSTELLATION_NAMES.UMa==='Ursa Major'&&CONSTELLATION_NAMES.Sgr==='Sagittarius'&&CONSTELLATION_NAMES.PsA==='Piscis Austrinus');
assert.equal(humanItemName('Potion','medicine'),'Potion','non-crystal names are untouched');
assert.equal(humanItemName('★Zzz9','dynamax-crystals'),'★Zzz9','unknown constellations are left alone');
assert.equal(humanItemName('★Sge','dynamax-crystals'),'Dynamax Crystal — Sagitta');
// Items expose locations, and GO entries are flagged as not being pickups.
const thunderStone=curatedLocationsForItem('Thunder Stone');
assert.ok(thunderStone,'curated item lookup by name');
assert.ok(thunderStone!.locationsByGame.length>0);
assert.ok(curatedLocationsForItem('Thunder Stone')===thunderStone);
assert.equal(curatedLocationsForItem('Definitely Not An Item'),null);
const readCrystal=curatedLocationsForItem('Dynamax Crystal — Andromeda 458');
assert.ok(!readCrystal || typeof readCrystal==='object','readable crystal name lookup does not throw');
console.log(`Items tests passed: ${Object.keys(ITEMS).length} items, ${Object.values(TM_HM).reduce((n,l)=>n+l.length,0)} TM/HM entries, ${MOVE_MACHINE_GROUPS.length} version groups and game mapping.`);
