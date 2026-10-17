import type { ReactNode } from 'react';
/** Compact registration flags with a full-label touch target. */
export function RegistrationToggle({label,children,checked,disabled=false,onChange}:{label:string;children:ReactNode;checked:boolean;disabled?:boolean;onChange:(checked:boolean)=>void}) {
  return <label className={`flex items-center gap-2 min-h-10 px-2 py-1.5 rounded-lg border text-[11px] font-semibold select-none ${disabled?'opacity-45 cursor-not-allowed border-slate-800 bg-slate-950':'cursor-pointer '+(checked?'bg-sky-950/30 border-sky-500/50 text-slate-100':'bg-slate-900 border-slate-700 text-slate-300')}`}>
    <input type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={e=>onChange(e.target.checked)} className="w-4 h-4 shrink-0 accent-sky-400" />
    <span className="flex items-center gap-1.5 min-w-0">{children}</span>
  </label>;
}
