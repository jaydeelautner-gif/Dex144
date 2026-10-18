import assert from 'node:assert/strict';
import { BREEDING_SPECIES } from '../src/data/breeding.generated';
import { babyForSpecies, breedingGuide, eggGroupNames, familyRoot, INCENSE_BABIES } from '../src/utils/breeding';
assert.equal(Object.keys(BREEDING_SPECIES).length,1025);
assert.equal(Object.values(BREEDING_SPECIES).filter(data=>data.baby).length,19);
for(let id=1;id<=1025;id++){
  assert.ok(BREEDING_SPECIES[id].groups.length>0);
  const seen=new Set<number>();let current:number|null=id;
  while(current){assert.ok(!seen.has(current),`cycle in species #${id}`);seen.add(current);current=BREEDING_SPECIES[current].parent;}
  assert.ok(familyRoot(id)>=1);
}
assert.deepEqual(eggGroupNames(1),['Monster','Grass']);
for(const game of ['red','blue','yellow','lgp','lge','pla','colo','xd','pogo'] as const){
  const guide=breedingGuide(25,game);assert.equal(guide.method,null,game);assert.equal(guide.canBreed,false,game);
}
assert.deepEqual(breedingGuide(25,'gold').eggIds,[172]);
assert.deepEqual(breedingGuide(6,'gold').eggIds,[4]);
assert.equal(breedingGuide(25,'crystal').hatchLevel,5);
assert.equal(breedingGuide(25,'diamond').hatchLevel,1);
assert.equal(babyForSpecies(26),172);
assert.equal(babyForSpecies(849),848);
assert.equal(breedingGuide(172,'gold').canBreed,false);
assert.ok(breedingGuide(172,'gold').adultIds.includes(25));
assert.equal(breedingGuide(848,'sword').canBreed,false);
assert.deepEqual(breedingGuide(849,'sword').eggIds,[848]);
assert.deepEqual(breedingGuide(183,'gold').eggIds,[183], 'Azurill did not exist in Gen II');
assert.equal(breedingGuide(183,'gold').incense,undefined);
assert.equal(breedingGuide(315,'ruby').incense,undefined,'Budew did not exist in Gen III');
assert.deepEqual(breedingGuide(315,'ruby').eggIds,[315]);
for(const [id,value] of Object.entries(INCENSE_BABIES)){
  const baby=Number(id);
  const earlier=breedingGuide(value.without,'sword');
  assert.equal(earlier.incense?.item,value.item);
  assert.equal(earlier.incense?.babyId,baby);
  assert.deepEqual(earlier.eggIds,[value.without]);
  const sv=breedingGuide(value.without,'scarlet');
  assert.equal(sv.incense,undefined);
  assert.deepEqual(sv.eggIds,[baby]);
}
assert.deepEqual(breedingGuide(490,'diamond').eggIds,[489]);
assert.deepEqual(breedingGuide(489,'diamond').eggIds,[489]);
assert.equal(breedingGuide(132,'sword').canBreed,true);
assert.deepEqual(breedingGuide(132,'sword').eggIds,[]);
for(const id of [30,31,150,144,1007,1008])assert.equal(breedingGuide(id,'scarlet').canBreed,false);
assert.deepEqual(breedingGuide(34,'gold').eggIds,[32]);
assert.deepEqual(breedingGuide(34,'black').eggIds,[29,32]);
assert.deepEqual(breedingGuide(29,'gold').eggIds,[29,32]);
assert.deepEqual(breedingGuide(313,'ruby').eggIds,[313]);
assert.deepEqual(breedingGuide(313,'black').eggIds,[313,314]);
assert.deepEqual(breedingGuide(314,'ruby').eggIds,[313,314]);
assert.equal(breedingGuide(1,'sv').method,'Picnic','legacy game ids resolve');
assert.match(breedingGuide(1,'black2').location,/post-game/);
console.log('Breeding tests passed: 1,025 species, 19 babies, nine incense rules, generation changes, non-breeding games, Ditto and special offspring.');
