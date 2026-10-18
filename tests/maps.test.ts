import assert from 'node:assert/strict';
import { ALL_CANONICAL_GAME_IDS } from '../src/data/pokemonData';
import { mapRegionsForGame, REGION_MAPS, REGION_LINKS } from '../src/data/gameMaps';
import { areaRegion, indexMapEncounters, placeMatchesArea } from '../src/utils/mapEncounters';
import type { EncounterDataset } from '../src/data/encountersData';
for(const game of ALL_CANONICAL_GAME_IDS){
  const regions=mapRegionsForGame(game);
  assert.ok(regions.length>0,`${game} has a map`);
  for(const region of regions){
    assert.ok(region.places.length>0,`${region.id} has labelled places`);
    assert.equal(new Set(region.places.map(p=>p.id)).size,region.places.length);
    assert.ok(region.places.every(p=>p.x>=0&&p.x<=1000&&p.y>=0&&p.y<=660));
  }
}
for(const [region,links] of Object.entries(REGION_LINKS))for(const link of links)for(const id of link)assert.ok(REGION_MAPS[region].places.some(place=>place.id===id),`${region}: link endpoint ${id} exists`);
assert.deepEqual(mapRegionsForGame('heartgold').map(r=>r.id),['johto','kanto']);
assert.deepEqual(mapRegionsForGame('firered').map(r=>r.id),['kanto','sevii']);
assert.deepEqual(mapRegionsForGame('scarlet').map(r=>r.id),['paldea']);
assert.deepEqual(mapRegionsForGame('sword').map(r=>r.id),['galar']);
assert.deepEqual(mapRegionsForGame('sword',['swsh-isle-of-armor']).map(r=>r.id),['galar','isle-armor']);
assert.deepEqual(mapRegionsForGame('scarlet',['sv-teal-mask','sv-indigo-disk']).map(r=>r.id),['paldea','kitakami','blueberry']);
const fixture:EncounterDataset={
  '1':{red:{'kanto-route-1-area':[{m:'walk',c:20,l:[2,4],v:['red']}]},blue:{'kanto-route-1-area':[{m:'walk',c:30,l:[5,7],v:['blue']}]}},
  '4':{red:{'kanto-route-10-area':[{m:'surf',c:0,l:[10,15],v:['red'],cd:['time-night']}]}},
  '25':{sword:{'fields-of-honor-area':[{m:'walk',c:10,l:[20,30],v:['sword']}]}}
};
const red=indexMapEncounters(fixture,'red');
assert.equal(red.get('kanto-route-1-area')?.[0].chance,20,'does not union sibling version rates');
assert.deepEqual(red.get('kanto-route-10-area')?.[0].conditions,['time-night']);
assert.equal(indexMapEncounters(fixture,'sword').size,0,'unowned DLC never enters area index');
assert.equal(indexMapEncounters(fixture,'sword',['swsh-isle-of-armor']).size,1);
assert.equal(indexMapEncounters(null,'red').size,0);
assert.equal(indexMapEncounters({'bad':{red:{broken:[]}}} as EncounterDataset,'red').size,0,'malformed entries do not crash the map');
const route=REGION_MAPS.kanto.places.find(p=>p.id==='kanto-route-1')!;
assert.ok(placeMatchesArea(route,'kanto-route-1-area'));
assert.equal(placeMatchesArea(route,'kanto-route-10-area'),false);
assert.equal(areaRegion('kanto-route-1-area','heartgold',['johto','kanto']),'kanto');
assert.equal(areaRegion('johto-route-29-area','heartgold',['johto','kanto']),'johto');
assert.equal(areaRegion('berry-forest-area','firered',['kanto','sevii']),'sevii');
assert.equal(areaRegion('fields-of-honor-area','sword',['galar','isle-armor']),'isle-armor');
console.log(`Maps tests passed: ${ALL_CANONICAL_GAME_IDS.length} game versions, region coverage, version-specific encounters, DLC ownership, subareas and multi-region classification.`);
