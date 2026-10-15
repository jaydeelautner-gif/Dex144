import { useState, useEffect, useCallback } from 'react';
import { HOME_PANEL_STORAGE_KEY, DEFAULT_HOME_PANELS, normalizeHomePanels, type HomePanelId, type HomePanelVisibility } from '../data/homePanels';
export function useHomePanels() {
  const [homePanels,setHomePanels]=useState<HomePanelVisibility>(()=>{
    try { return normalizeHomePanels(JSON.parse(localStorage.getItem(HOME_PANEL_STORAGE_KEY) ?? 'null')); }
    catch { return {...DEFAULT_HOME_PANELS}; }
  });
  useEffect(()=>{ try { localStorage.setItem(HOME_PANEL_STORAGE_KEY,JSON.stringify(homePanels)); } catch { /* Browser storage can be disabled. */ } },[homePanels]);
  useEffect(()=>{
    const listener=(e:StorageEvent)=>{ if(e.key===HOME_PANEL_STORAGE_KEY){try{setHomePanels(normalizeHomePanels(JSON.parse(e.newValue ?? 'null')));}catch{setHomePanels({...DEFAULT_HOME_PANELS});}} };
    window.addEventListener('storage',listener); return ()=>window.removeEventListener('storage',listener);
  },[]);
  const toggleHomePanel=useCallback((id:HomePanelId)=>setHomePanels(prev=>({...prev,[id]:!prev[id]})),[]);
  const resetHomePanels=useCallback(()=>setHomePanels({...DEFAULT_HOME_PANELS}),[]);
  /** Adopt a cloud profile's panel layout (cross-device sync). */
  const setCloudHomePanels=useCallback((next:HomePanelVisibility)=>setHomePanels(next),[]);
  return {homePanels,toggleHomePanel,resetHomePanels,setCloudHomePanels};
}
