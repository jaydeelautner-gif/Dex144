import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapsView } from '../src/components/MapsView';
import { buildInitialNationalDex, type DlcId } from '../src/data/pokemonData';
const dex=buildInitialNationalDex();
function Fixture(){
  const [dlc,setDlc]=useState<DlcId[]>([]);
  const [selected,setSelected]=useState('');
  return <main className="bg-slate-950 p-2"><button type="button" onClick={()=>setDlc(dlc.length?[]:['swsh-isle-of-armor'])}>Toggle Isle of Armor ownership</button><output aria-label="Selected map Pokémon">{selected}</output><MapsView dex={dex} ownedGames={['red','sword','scarlet','heartgold','firered','pogo','colo','xd','bd','pla']} ownedDlcs={dlc} gameProgress={{rb:['rb-badge-1']}} onSelectPokemon={pokemon=>setSelected(pokemon.name)} /></main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
