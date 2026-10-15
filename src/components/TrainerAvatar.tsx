import React from 'react';
import type { GameId } from '../data/pokemonData';

/** Skin tones, hair colors, outfit/cap colors. */
export const SKIN_TONES = ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC', '#6B4226'];
export const HAIR_COLORS = ['#0B0B0B', '#4A2C2A', '#8B4513', '#B8860B', '#DAA520', '#C1440E', '#7F7F7F', '#E8E8E8', '#7B2D8B', '#1B5E9B'];
export const OUTFIT_COLORS = ['#B91C1C', '#1D4ED8', '#15803D', '#A16207', '#7C3AED', '#0F766E', '#334155', '#DB2777'];
export const CAP_COLORS = [...OUTFIT_COLORS, '#0B0B0B', '#F5F5F5'];
export const HAIR_STYLES = ['short', 'long', 'spiky', 'bob'] as const;
export const ACCESSORIES = ['none', 'glasses', 'cap', 'headband'] as const;

export type HairStyle = (typeof HAIR_STYLES)[number];
export type Accessory = (typeof ACCESSORIES)[number];
export interface TrainerAvatarConfig {
  skin: number;
  hairStyle: HairStyle;
  hairColor: number;
  outfit: number;
  accessory: Accessory;
  accessoryColor: number;
}

export const DEFAULT_AVATAR: Required<TrainerAvatarConfig> = {
  skin: 2, hairStyle: 'short', hairColor: 0, outfit: 0, accessory: 'none', accessoryColor: 4,
};

export function normalizeAvatar(raw: unknown): TrainerAvatarConfig {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown, d: number, max: number) => { const n = typeof v === 'number' ? v : Number(v); return Number.isInteger(n) && n >= 0 && n < max ? n : d; };
  return {
    skin: num(c.skin, DEFAULT_AVATAR.skin, SKIN_TONES.length),
    hairStyle: HAIR_STYLES.includes(c.hairStyle as HairStyle) ? c.hairStyle as HairStyle : DEFAULT_AVATAR.hairStyle,
    hairColor: num(c.hairColor, DEFAULT_AVATAR.hairColor, HAIR_COLORS.length),
    outfit: num(c.outfit, DEFAULT_AVATAR.outfit, OUTFIT_COLORS.length),
    accessory: ACCESSORIES.includes(c.accessory as Accessory) ? c.accessory as Accessory : DEFAULT_AVATAR.accessory,
    accessoryColor: num(c.accessoryColor, DEFAULT_AVATAR.accessoryColor, CAP_COLORS.length),
  };
}

const HAIR_SHAPES: Record<HairStyle, React.ReactNode> = {
  short: <path d="M35 40 Q35 22 55 22 Q75 22 75 40 L75 44 Q75 34 55 32 Q35 34 35 44 Z" />,
  long: <path d="M35 40 Q35 22 55 22 Q75 22 75 40 L75 62 L68 58 L68 42 Q55 34 42 42 L42 58 L35 62 Z" />,
  spiky: <path d="M35 42 L38 24 L44 32 L50 18 L56 30 L62 16 L68 30 L72 22 L75 42 Q55 32 35 42 Z" />,
  bob: <path d="M33 46 Q32 22 55 22 Q78 22 77 46 L72 44 Q74 32 55 32 Q36 32 38 44 Z" />,
};

/** SVG trainer avatar, fully offline (no sprite files needed). */
export const TrainerAvatar: React.FC<{
  config?: TrainerAvatarConfig | null;
  size?: number;
  className?: string;
}> = ({ config, size = 96, className = '' }) => {
  const c = normalizeAvatar(config);
  const skin = SKIN_TONES[c.skin];
  const hair = HAIR_COLORS[c.hairColor];
  const outfit = OUTFIT_COLORS[c.outfit];
  const acc = CAP_COLORS[c.accessoryColor];
  return (
    <svg viewBox="0 0 110 110" width={size} height={size} className={className} role="img" aria-label="Trainer avatar">
      <circle cx="55" cy="55" r="52" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
      {/* body */}
      <path d="M20 102 Q22 76 55 76 Q88 76 90 102 Z" fill={outfit} />
      {/* head */}
      <circle cx="55" cy="52" r="20" fill={skin} />
      {/* hair */}
      <g fill={hair}>{HAIR_SHAPES[c.hairStyle]}</g>
      {/* eyes + smile */}
      <circle cx="48" cy="52" r="2.4" fill="#111827" />
      <circle cx="62" cy="52" r="2.4" fill="#111827" />
      <path d="M49 60 Q55 65 61 60" stroke="#111827" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* accessories */}
      {c.accessory === 'cap' && <g><path d="M35 40 Q35 20 55 20 Q75 20 75 40 L75 42 L35 42 Z" fill={acc} /><rect x="72" y="37" width="14" height="4.5" rx="2" fill={acc} /></g>}
      {c.accessory === 'headband' && <rect x="35" y="36" width="40" height="5" rx="2.5" fill={acc} />}
      {c.accessory === 'glasses' && <g><circle cx="48" cy="52" r="5.5" fill="none" stroke={acc} strokeWidth="2" /><circle cx="62" cy="52" r="5.5" fill="none" stroke={acc} strokeWidth="2" /><line x1="53.5" y1="52" x2="56.5" y2="52" stroke={acc} strokeWidth="2" /></g>}
    </svg>
  );
};

/** All-choice grids for the builder. */
export const AvatarBuilder: React.FC<{
  config: TrainerAvatarConfig;
  onChange: (next: TrainerAvatarConfig) => void;
}> = ({ config, onChange }) => {
  const row = (
    label: string,
    options: readonly string[],
    active: number | string,
    apply: (index: number) => void,
    renderColor?: boolean,
  ) => (
    <fieldset>
      <legend className="text-xs font-bold text-amber-300 mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            onClick={() => apply(i)}
            aria-pressed={active === i}
            className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 ${active === i ? 'border-amber-400 scale-110' : 'border-slate-700'}`}
            style={renderColor ? { backgroundColor: opt, color: opt === '#F5F5F5' || opt === '#FFDBAC' || opt === '#E8E8E8' ? '#111' : 'transparent' } : undefined}
          >
            {!renderColor && opt.slice(0, 8)}
          </button>
        ))}
      </div>
    </fieldset>
  );
  return (
    <div className="flex flex-col gap-3">
      {row('Skin tone', SKIN_TONES, config.skin, (i) => onChange({ ...config, skin: i }), true)}
      {row('Hair style', HAIR_STYLES, config.hairStyle, (i) => onChange({ ...config, hairStyle: HAIR_STYLES[i] }))}
      {row('Hair color', HAIR_COLORS, config.hairColor, (i) => onChange({ ...config, hairColor: i }), true)}
      {row('Outfit color', OUTFIT_COLORS, config.outfit, (i) => onChange({ ...config, outfit: i }), true)}
      {row('Accessory', ACCESSORIES, config.accessory, (i) => onChange({ ...config, accessory: ACCESSORIES[i] }))}
      {config.accessory !== 'none' && row('Accessory color', CAP_COLORS, config.accessoryColor, (i) => onChange({ ...config, accessoryColor: i }), true)}
    </div>
  );
};

/** localStorage helpers (device cache of the cloud-synced avatar). */
export const AVATAR_STORAGE_KEY = 'homedex_avatar_v1';
export function loadLocalAvatar(): TrainerAvatarConfig | null {
  try {
    const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
    return raw ? normalizeAvatar(JSON.parse(raw)) : null;
  } catch { return null; }
}
export function saveLocalAvatar(config: TrainerAvatarConfig): void {
  try { localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(config)); } catch { /* ignore */ }
}
export type { GameId };
