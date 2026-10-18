import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PokemonBreedingSection } from '../src/components/PokemonBreedingSection';
import { buildInitialNationalDex } from '../src/data/pokemonData';
const dex=buildInitialNationalDex();
function Fixture(){
  const [pokemon,setPokemon]=useState(dex.find(p=>p.id===183)!);
  return <main className="bg-slate-950 text-slate-100 p-4"><nav aria-label="Test species">{[183,172,132,490,150,30].map(id=><button key={id} onClick={()=>setPokemon(dex.find(p=>p.id===id)!)}>{dex.find(p=>p.id===id)!.name}</button>)}</nav><h1>{pokemon.name}</h1><PokemonBreedingSection pokemon={pokemon} dex={dex} ownedGames={['emerald','sword','scarlet','pla','red','diamond']} onSelectPokemon={setPokemon}/></main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
