import type { ReactNode } from 'react';
/** Compact registration flag with a full-label touch target and explanatory tooltip. */
export function RegistrationToggle({label,title,children,checked,disabled=false,onChange}:{label:string;title:string;children:ReactNode;checked:boolean;disabled?:boolean;onChange:(checked:boolean)=>void}) {
  return <label title={title} className={`flex items-center gap-1.5 min-h-9 px-1.5 py-1 rounded-lg border text-[10px] font-semibold select-none ${disabled?'opacity-45 cursor-not-allowed border-slate-800 bg-slate-950':'cursor-pointer '+(checked?'bg-sky-950/30 border-sky-500/50 text-slate-100':'bg-slate-900 border-slate-700 text-slate-300')}`}>
    <input type="checkbox" aria-label={label} title={title} checked={checked} disabled={disabled} onChange={e=>onChange(e.target.checked)} className="w-4 h-4 shrink-0 accent-sky-400" />
    <span className="flex items-center gap-1 min-w-0 truncate">{children}</span>
  </label>;
}
