import { Children, cloneElement, isValidElement, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { HOME_PANELS, type HomePanelId } from '../data/homePanels';
export const HOME_DESIGN_KEY='homedex_home_design_v1';
const EVENT='homedex-home-design-changed';
export interface HomeDesign { updatedAt:number; layout:'left'|'right'|'stacked'; columns:1|2; spacing:'comfortable'|'compact'; order:HomePanelId[] }
export const DEFAULT_HOME_DESIGN:HomeDesign={updatedAt:0,layout:'left',columns:1,spacing:'comfortable',order:HOME_PANELS.map(p=>p.id)};
export function normalizeHomeDesign(raw:unknown):HomeDesign {
  const data=(raw && typeof raw==='object'?raw:{}) as Partial<HomeDesign>;
  const known=new Set<string>(HOME_PANELS.map(p=>p.id));
  const order=[...new Set((Array.isArray(data.order)?data.order:[]).filter((id):id is HomePanelId=>typeof id==='string' && known.has(id)))];
  return {updatedAt:typeof data.updatedAt==='number' && Number.isFinite(data.updatedAt)?data.updatedAt:0,layout:data.layout==='right'||data.layout==='stacked'?data.layout:'left',columns:data.columns===2?2:1,spacing:data.spacing==='compact'?'compact':'comfortable',order:[...order,...HOME_PANELS.map(p=>p.id).filter(id=>!order.includes(id))]};
}
function read():HomeDesign {try{return normalizeHomeDesign(JSON.parse(localStorage.getItem(HOME_DESIGN_KEY)||'null'));}catch{return normalizeHomeDesign(null);}}
export function saveHomeDesign(value:HomeDesign){const serialized=JSON.stringify(normalizeHomeDesign(value));if(localStorage.getItem(HOME_DESIGN_KEY)===serialized)return;localStorage.setItem(HOME_DESIGN_KEY,serialized);window.dispatchEvent(new Event(EVENT));}
export function adoptHomeDesign(raw:unknown){const cloud=normalizeHomeDesign(raw);if(cloud.updatedAt>read().updatedAt)saveHomeDesign(cloud);}
export function useHomeDesign(){
  const [design,setDesign]=useState(read);
  useEffect(()=>{const update=()=>setDesign(read());window.addEventListener(EVENT,update);window.addEventListener('storage',update);return()=>{window.removeEventListener(EVENT,update);window.removeEventListener('storage',update);};},[]);
  const update=(next:HomeDesign)=>{try{saveHomeDesign({...next,updatedAt:Date.now()});}catch{setDesign(next);}};
  return {design,update,rank:(id:HomePanelId)=>design.order.indexOf(id)};
}
/** Keeps actual DOM order and keyboard navigation consistent with the selected order. */
export function OrderedHomeContent({children}:{children:ReactNode}){
  const {rank}=useHomeDesign();
  const nodes=Children.toArray(children) as ReactElement<{ 'data-home-panel'?:HomePanelId;style?:object}>[];
  return <>{nodes.sort((a,b)=>rank(a.props?.['data-home-panel'] as HomePanelId)-rank(b.props?.['data-home-panel'] as HomePanelId)).map(child=>isValidElement(child)?cloneElement(child,{style:{...child.props.style,order:rank(child.props['data-home-panel'] as HomePanelId),minWidth:0}}):child)}</>;
}
