import { RecentCommunityPets } from '../src/components/RecentCommunityPets';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { InventoryView } from '../src/components/InventoryView';
import { LivingBoxesView } from '../src/components/LivingBoxesView';
import { PublicStatsPageView } from '../src/components/PublicStatsPageView';
import { buildInitialNationalDex } from '../src/data/pokemonData';
import type { PokemonInstance } from '../src/data/pokemonInventoryData';
const dex=buildInitialNationalDex();
const inventory:PokemonInstance[]=Array.from({length:35},(_,i)=>({pokeId:'ID'+String(i).padStart(10,'0'),pokemonId:i+1,nickname:'',level:10+i,gender:'male',variantId:`${i+1}:base`,variantName:'Standard',isShiny:false,gameId:'red',isHomeGift:false,isTraded:false,storedInHome:true,isInLivingBox:true,createdAt:1000+i,updatedAt:1000+i}));
const ids=new Set(inventory.map(p=>p.pokemonId));
function Fixture(){
  const [view,setView]=useState('inventory');const [box,setBox]=useState(1);const [lookup,setLookup]=useState('');
  const common={dex,inventory,caughtSet:ids,shinySet:new Set<number>(),livingSet:ids,caughtVariantsSet:new Set<string>(),boxSelectedVariantsMap:new Map<number,string>(),boxSelectedGamesMap:new Map()};
  return <><nav aria-label="Fixture navigation">{['inventory','boxes','living','community'].map(v=><button key={v} onClick={()=>setView(v)}>{v}</button>)}</nav>
    <output aria-label="Selected community POKEID">{lookup}</output>
    {view==='community' && <RecentCommunityPets dex={dex} onLookup={setLookup} />}
    {view==='inventory' && <InventoryView dex={dex} inventory={inventory} onUpdateInstance={()=>{}} onRequestEvolve={()=>{}} onDeleteInstance={()=>{}} onOpenPokemonPage={()=>{}} onOpenTrainerCardForPokeId={()=>{}} onNavigateToRegister={()=>{}} />}
    {view==='boxes' && <LivingBoxesView {...common} activeBox={box} onChangeBox={setBox} selectedGame="all" onSelectBoxVariant={()=>{}} onSelectPokemon={()=>{}} />}
    {view==='living' && <PublicStatsPageView {...common} trainerName="Display Test" ownedGames={['red']} ownedDlcs={[]} gameCatches={{}} />}
  </>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
