import { BREEDING_SPECIES, EGG_GROUPS } from '../data/breeding.generated';
import { GAMES, normalizeToCanonicalGames, type GameId } from '../data/pokemonData';

export const INCENSE_BABIES:Record<number,{item:string;without:number}>={
  298:{item:'Sea Incense',without:183},360:{item:'Lax Incense',without:202},
  406:{item:'Rose Incense',without:315},433:{item:'Pure Incense',without:358},
  438:{item:'Rock Incense',without:185},439:{item:'Odd Incense',without:122},
  440:{item:'Luck Incense',without:113},446:{item:'Full Incense',without:143},
  458:{item:'Wave Incense',without:226},
};
const NO_BREEDING:Record<string,string>={
  red:'Breeding was introduced in Gold and Silver.',blue:'Breeding was introduced in Gold and Silver.',yellow:'Breeding was introduced in Gold and Silver.',
  lgp:'Let’s Go has no breeding or Egg production.',lge:'Let’s Go has no breeding or Egg production.',
  pla:'Legends: Arceus has no breeding or Egg production.',pogo:'Pokémon GO hatches Eggs but does not breed Pokémon.',
  colo:'Colosseum has no breeding; use a compatible main-series game.',xd:'XD has no breeding; use a compatible main-series game.',
};
export function familyRoot(id:number):number {
  const seen=new Set<number>();let current=id;
  while(BREEDING_SPECIES[current]?.parent && !seen.has(current)) {seen.add(current);current=BREEDING_SPECIES[current].parent!;}
  return current;
}
export function babyForSpecies(id:number):number|null {
  const root=familyRoot(id);return BREEDING_SPECIES[root]?.baby?root:null;
}
export function eggGroupNames(id:number):string[]{
  const labels:Record<string,string>={'no-eggs':'No Eggs Discovered','humanshape':'Human-Like',water1:'Water 1',water2:'Water 2',water3:'Water 3',indeterminate:'Amorphous',ground:'Field',plant:'Grass'};
  return (BREEDING_SPECIES[id]?.groups??[]).map(group=>labels[EGG_GROUPS[group]] || EGG_GROUPS[group]?.replace(/^./,c=>c.toUpperCase()) || 'Unknown');
}
export interface BreedingGuide {
  gameId:GameId;generation:number;method:string|null;location:string;reason:string;
  canBreed:boolean;eggIds:number[];babyId:number|null;adultIds:number[];
  incense?:{item:string;babyId:number;without:number};hatchLevel:number;
}
/** Species-level rules; callers also check whether the Pokémon exists in that title. */
export function breedingGuide(id:number,gameId:GameId):BreedingGuide {
  const canonical=normalizeToCanonicalGames([gameId])[0]??gameId;
  const generation=GAMES.find(game=>game.id===canonical)?.generation??0;
  const babyId=babyForSpecies(id);
  const result:BreedingGuide={gameId:canonical,generation,method:null,location:'',reason:'',canBreed:false,eggIds:[],babyId,adultIds:[],hatchLevel:generation<=3?5:1};
  if(NO_BREEDING[canonical])return {...result,reason:NO_BREEDING[canonical]};
  const data=BREEDING_SPECIES[id];
  if(!data || generation<data.generation)return {...result,reason:'This Pokémon was not introduced in this generation.'};
  result.method=generation===9?'Picnic':'Day Care / Nursery';
  const locations:Record<string,string>={
    gold:'Route 34 Day Care',silver:'Route 34 Day Care',crystal:'Route 34 Day Care',
    ruby:'Route 117 Day Care',sapphire:'Route 117 Day Care',emerald:'Route 117 Day Care',
    firered:'Four Island Day Care (post-game)',leafgreen:'Four Island Day Care (post-game)',
    diamond:'Solaceon Town Day Care',pearl:'Solaceon Town Day Care',platinum:'Solaceon Town Day Care',
    heartgold:'Route 34 Day Care',soulsilver:'Route 34 Day Care',
    black:'Route 3 Day Care',white:'Route 3 Day Care',black2:'Route 3 Day Care (post-game)',white2:'Route 3 Day Care (post-game)',
    x:'Route 7 Day Care',y:'Route 7 Day Care',omegaruby:'Route 117 or Battle Resort Day Care',alphasapphire:'Route 117 or Battle Resort Day Care',
    sun:'Paniola Ranch Nursery',moon:'Paniola Ranch Nursery',ultrasun:'Paniola Ranch Nursery',ultramoon:'Paniola Ranch Nursery',
    sword:'Route 5 or Bridge Field Nursery',shield:'Route 5 or Bridge Field Nursery',bd:'Solaceon Town Nursery',sp:'Solaceon Town Nursery',
    scarlet:'Picnic Egg Basket — Egg Power helps',violet:'Picnic Egg Basket — Egg Power helps',
  };
  result.location=locations[canonical]??result.method;
  const incense=babyId?INCENSE_BABIES[babyId]:null;
  if(incense && generation<9 && BREEDING_SPECIES[babyId!].generation<=generation)result.incense={...incense,babyId:babyId!};
  if(data.baby){
    result.reason='Baby Pokémon cannot breed. Evolve first, or breed an adult in this family to obtain this baby.';
    result.eggIds=[id];
    result.adultIds=Object.keys(BREEDING_SPECIES).map(Number).filter(candidate=>familyRoot(candidate)===babyId && !BREEDING_SPECIES[candidate].groups.includes(15) && BREEDING_SPECIES[candidate].generation<=generation);
    return result;
  }
  if(data.groups.includes(15))return {...result,reason:'No Eggs Discovered — this Pokémon cannot breed.'};
  if(id===132)return {...result,canBreed:true,reason:'Ditto can pair with most breedable Pokémon, including male-only and genderless species. Two Ditto cannot produce an Egg; Ditto cannot hatch from an Egg.'};
  result.canBreed=true;
  result.reason=data.genderRate===-1 || data.genderRate===0?'Use Ditto as the breeding partner.':'Pair a female with a male sharing an Egg Group, or pair this Pokémon with Ditto.';
  let egg=id;
  while(BREEDING_SPECIES[egg]?.parent && BREEDING_SPECIES[BREEDING_SPECIES[egg].parent!].generation<=generation)egg=BREEDING_SPECIES[egg].parent!;
  result.eggIds=[result.incense?.without??egg];
  if([489,490].includes(id)){result.eggIds=[489];result.reason='Breed with Ditto to produce Phione. Phione does not evolve into Manaphy.';}
  if(id===29 || (generation>=5 && [32,33,34].includes(id)))result.eggIds=[29,32];
  if(id===314 || (generation>=5 && id===313))result.eggIds=[313,314];
  return result;
}
