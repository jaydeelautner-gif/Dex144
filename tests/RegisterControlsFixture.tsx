import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RegisterPokemonView } from '../src/components/RegisterPokemonView';
import { BoxSlotMiniMap } from '../src/components/BoxSlotMiniMap';
import { buildInitialNationalDex } from '../src/data/pokemonData';
const dex=buildInitialNationalDex();
function Fixture(){
  const [initial,setInitial]=useState(1);
  const [saved,setSaved]=useState<unknown>(null);
  return <div className="bg-slate-950 text-slate-100 p-2">
    <button type="button" onClick={()=>setInitial(1025)}>Jump to final box</button>
    <div data-testid="static-minimap"><BoxSlotMiniMap boxNumber={1} boxSlot={1} size="sm" /></div>
    <output aria-label="Registered specimen">{saved?JSON.stringify(saved):''}</output>
    <RegisterPokemonView dex={dex} ownedGames={['scarlet','red','bd']} inventory={[]} initialPokemonId={initial} onSaveNewInstance={setSaved} onOpenPokemonPage={()=>{}} />
  </div>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
