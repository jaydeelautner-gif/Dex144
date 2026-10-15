import { sanitizeInventory } from '../src/firebase';
import { readFileSync } from 'node:fs';
import { EVOLUTION_EDGES } from '../src/data/evolutionEdges.generated';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildInitialNationalDex } from '../src/data/pokemonData';
import type { PokemonInstance } from '../src/data/pokemonInventoryData';
import { evolvePokepet, getPokepetEvolutionChoices, evolvedAwaySpecies, type EvolutionRequest } from '../src/utils/pokepetEvolution';
import { sanitizeEvolutionHistory } from '../src/utils/evolutionHistory';
import { reacquisitionHint, applyEvolutionAcquisitionHints } from '../src/utils/reacquisition';
import { formatStorageLocationLabel } from '../src/data/pokemonInventoryData';
import { EvolvePokepetModal } from '../src/components/EvolvePokepetModal';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const ruleGraph = JSON.parse(rules.match(/let next = ([^\n]+);/)![1]);
assert.equal(Object.values(ruleGraph).flat().length, EVOLUTION_EDGES.length);
for (const edge of EVOLUTION_EDGES) assert.ok(ruleGraph[String(edge.from)].includes(edge.to));
const dex = buildInitialNationalDex();
const pet: PokemonInstance = { pokeId: 'IDABCDEFGHIJ', pokemonId: 1, nickname: 'Leaf', level: 12, gender: 'male', variantId: '1:base', variantName: 'Standard', isShiny: true, gameId: 'red', isHomeGift: false, isTraded: false, storedInHome: false, isInLivingBox: false, createdAt: 100, updatedAt: 100 };
const request: EvolutionRequest = { pokeId: pet.pokeId, expectedSpeciesId: 1, targetId: 2, level: 1, usedItem: true, itemName: 'Rare Candy', gameId: 'red', returnedToHome: false, placement: 'inventory', homeMoveConfirmed: false };
assert.deepEqual(getPokepetEvolutionChoices(pet,dex).map(c=>c.target.id), [2]); // no skipped stage
const evolved = evolvePokepet(pet,request,dex,[pet],200);
assert.equal(evolved.pokemonId,2); assert.equal(evolved.level,1); // explicit any-level policy
for (const key of ['pokeId','gender','isShiny','nickname','gameId','createdAt'] as const) assert.equal(evolved[key],pet[key]);
assert.equal(evolved.variantId,'2:base');
assert.equal(evolved.evolutionHistory?.[0].itemName,'Rare Candy');
assert.equal(evolved.evolutionHistory?.[0].usedItem,true);
const reloaded = sanitizeInventory(JSON.parse(JSON.stringify([evolved])))[0];
assert.equal(reloaded.pokeId,pet.pokeId);
assert.equal(reloaded.pokemonId,2);
assert.equal(reloaded.currentGameId,'red');
assert.deepEqual(reloaded.evolutionHistory,evolved.evolutionHistory);
assert.equal(sanitizeEvolutionHistory(JSON.parse(JSON.stringify(evolved.evolutionHistory))).length,1);
assert.equal(sanitizeEvolutionHistory([{ fromSpeciesId: 'bad' }]).length,0);
assert.deepEqual(evolvedAwaySpecies([evolved],'red'),[1]);
assert.deepEqual(evolvedAwaySpecies([evolved,{...pet,pokeId:'ID0123456789'}],'red'),[]);
assert.deepEqual(evolvedAwaySpecies([evolved],'blue'),[]);
assert.throws(()=>evolvePokepet(pet,{...request,targetId:3},dex,[pet]),/next evolution/);
assert.throws(()=>evolvePokepet(pet,{...request,level:0},dex,[pet]),/level/);
assert.throws(()=>evolvePokepet(pet,{...request,level:101},dex,[pet]),/level/);
assert.throws(()=>evolvePokepet(pet,{...request,itemName:''},dex,[pet]),/item/);
assert.throws(()=>evolvePokepet(pet,{...request,expectedSpeciesId:4},dex,[pet]),/changed/);
const home = {...pet,storedInHome:true,isInLivingBox:true};
assert.throws(()=>evolvePokepet(home,request,dex,[home]),/HOME/);
assert.throws(()=>evolvePokepet(home,{...request,homeMoveConfirmed:true,placement:''},dex,[home]),/placement/);
const placed = evolvePokepet(home,{...request,homeMoveConfirmed:true,returnedToHome:true,placement:'slot'},dex,[home]);
assert.equal(placed.isInLivingBox,true); assert.equal(placed.livingBoxSlot,dex.find(p=>p.id===2)!.boxSlot);
assert.throws(()=>evolvePokepet(home,{...request,homeMoveConfirmed:true,returnedToHome:true,placement:'slot'},dex,[home,{...placed,pokeId:'ID0123456789'}]),/occupied/);
const inventoryChoice = evolvePokepet(home,{...request,homeMoveConfirmed:true,placement:'inventory',usedItem:false},dex,[home]);
assert.equal(inventoryChoice.isInLivingBox,false); assert.equal(inventoryChoice.storedInHome,false); assert.equal(inventoryChoice.evolutionHistory?.[0].itemName,'');
// Direct graph stops sibling branches from evolving into each other.
const eevee = {...pet,pokemonId:133,variantId:'133:base'};
assert.ok(getPokepetEvolutionChoices(eevee,dex).length>=8);
assert.equal(getPokepetEvolutionChoices({...pet,pokemonId:134,variantId:'134:base'},dex).length,0);
assert.deepEqual(getPokepetEvolutionChoices({...pet,pokemonId:810,variantId:'810:base'},dex).map(c=>c.target.id),[811]);
assert.ok(!getPokepetEvolutionChoices({...pet,pokemonId:281,variantId:'281:base',gender:'female'},dex).some(c=>c.target.id===475));
assert.equal(getPokepetEvolutionChoices({...pet,pokemonId:1,variantId:'1:unknown-form'},dex).length,0);
assert.equal(getPokepetEvolutionChoices({...pet,pokemonId:37,variantId:'37:alola'},dex)[0]?.variantId,'38:alola');
assert.deepEqual(getPokepetEvolutionChoices({...pet,pokemonId:52,variantId:'52:galar'},dex).map(c=>c.target.id),[863]);
const dataset: any = {1:{red:{'viridian-forest-area':[{m:'walk',c:5,l:[5,8],v:['red']}]}}};
assert.match(reacquisitionHint(dataset,1,'red'),/wild reacquisition recorded/);
assert.match(reacquisitionHint({1:{red:{'pallet-town':[{m:'gift',c:100,l:[5,5],v:['red']}]}}} as any,1,'red'),/no wild reacquisition/);
assert.match(reacquisitionHint(null,1,'red'),/Loading/);
// Runtime availability follows the SAME game only, and resets once reacquired.
const giftOnly: any = {1:{red:{'pallet-town':[{m:'gift',c:100,l:[5,5],v:['red']}]}}};
const overlay = applyEvolutionAcquisitionHints(dex,[evolved],giftOnly);
assert.equal(overlay.find(p=>p.id===1)!.availability.red.reacquisitionMode,'trade_or_other');
assert.equal(overlay.find(p=>p.id===1)!.availability.blue.reacquisitionMode,undefined);
assert.equal(dex.find(p=>p.id===1)!.availability.red.reacquisitionMode,undefined); // immutable source
assert.equal(applyEvolutionAcquisitionHints(dex,[evolved],dataset).find(p=>p.id===1)!.availability.red.reacquisitionMode,'wild');
assert.equal(applyEvolutionAcquisitionHints(dex,[evolved,pet],giftOnly).find(p=>p.id===1)!.availability.red.reacquisitionMode,undefined);
assert.equal(applyEvolutionAcquisitionHints(dex,[evolved],null).find(p=>p.id===1)!.availability.red.reacquisitionMode,'unverified');
assert.match(formatStorageLocationLabel({...inventoryChoice,isHomeGift:true,currentGameId:'red'}),/Red/); // HOME gift is origin, not permanent storage
const markup = renderToStaticMarkup(React.createElement(EvolvePokepetModal,{pet:home,dex,inventory:[home],ownedGames:['red'],onClose:()=>{},onConfirm:async()=>{}}));
for (const text of ['New level','Clear','Backspace level','Was an item used','Living Dex placement','moved this PokéPet out of HOME','Confirm evolution']) assert.ok(markup.includes(text),text);
console.log('Evolution tests passed: identity, direct branches, variants, gender, levels, item log, HOME, slots, reacquisition, modal controls.');
