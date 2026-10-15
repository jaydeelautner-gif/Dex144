import React from 'react';
import type { GameId } from '../data/pokemonData';

/** Skin tones, hair colors, outfit colors. */
export const SKIN_TONES = ['#F5D5B8', '#FFDBAC', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3317'];
export const HAIR_COLORS = ['#0B0B0B', '#4A2C2A', '#8B4513', '#B8860B', '#DAA520', '#C1440E', '#7F7F7F', '#E8E8E8', '#7B2D8B', '#1B5E9B', '#E11D48'];
export const OUTFIT_COLORS = ['#B91C1C', '#1D4ED8', '#15803D', '#A16207', '#7C3AED', '#0F766E', '#334155', '#DB2777', '#F59E0B', '#1E293B'];

export const HAIR_STYLES = ['short', 'long', 'spiky', 'bob', 'ponytail', 'buzz'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const EYE_STYLES = ['friendly', 'determined', 'cheery'] as const;
export type EyeStyle = (typeof EYE_STYLES)[number];

/** Headwear sits on top of the hair. */
export const HEADWEAR = ['none', 'cap', 'beanie', 'strawhat', 'visored'] as const;
export type Headwear = (typeof HEADWEAR)[number];

/** Outfit silhouettes. */
export const OUTFIT_STYLES = ['jacket', 'hoodie', 'tee'] as const;
export type OutfitStyle = (typeof OUTFIT_STYLES)[number];

/** Small extras. */
export const ACCESSORIES = ['none', 'glasses', 'scarf'] as const;
export type Accessory = (typeof ACCESSORIES)[number];

export interface TrainerAvatarConfig {
  skin: number;
  hairStyle: HairStyle;
  hairColor: number;
  eyeStyle: EyeStyle;
  outfitStyle: OutfitStyle;
  outfit: number;
  outfitAccent: number;
  headwear: Headwear;
  headwearColor: number;
  accessory: Accessory;
  accessoryColor: number;
}

export const DEFAULT_AVATAR: Required<TrainerAvatarConfig> = {
  skin: 1, hairStyle: 'short', hairColor: 0, eyeStyle: 'friendly',
  outfitStyle: 'jacket', outfit: 0, outfitAccent: 7,
  headwear: 'cap', headwearColor: 0, accessory: 'none', accessoryColor: 4,
};

function pickEnum<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return options.includes(value as T) ? value as T : fallback;
}

export function normalizeAvatar(raw: unknown): TrainerAvatarConfig {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown, d: number, max: number) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isInteger(n) && n >= 0 && n < max ? n : d;
  };
  return {
    skin: num(c.skin, DEFAULT_AVATAR.skin, SKIN_TONES.length),
    hairStyle: pickEnum(HAIR_STYLES, c.hairStyle, DEFAULT_AVATAR.hairStyle),
    hairColor: num(c.hairColor, DEFAULT_AVATAR.hairColor, HAIR_COLORS.length),
    eyeStyle: pickEnum(EYE_STYLES, c.eyeStyle, DEFAULT_AVATAR.eyeStyle),
    outfitStyle: pickEnum(OUTFIT_STYLES, c.outfitStyle, DEFAULT_AVATAR.outfitStyle),
    outfit: num(c.outfit, DEFAULT_AVATAR.outfit, OUTFIT_COLORS.length),
    outfitAccent: num(c.outfitAccent, DEFAULT_AVATAR.outfitAccent, OUTFIT_COLORS.length),
    headwear: pickEnum(HEADWEAR, c.headwear, DEFAULT_AVATAR.headwear),
    headwearColor: num(c.headwearColor, DEFAULT_AVATAR.headwearColor, OUTFIT_COLORS.length),
    accessory: pickEnum(ACCESSORIES, c.accessory, DEFAULT_AVATAR.accessory),
    accessoryColor: num(c.accessoryColor, DEFAULT_AVATAR.accessoryColor, OUTFIT_COLORS.length),
  };
}

const HAIR_SHAPES: Record<HairStyle, React.ReactNode> = {
  short: <path d="M34 42 Q34 21 55 21 Q76 21 76 42 L76 46 Q76 34 55 31 Q34 34 34 46 Z" />,
  long: <path d="M32 44 Q32 21 55 21 Q78 21 78 44 L78 66 L70 61 L70 41 Q55 33 40 41 L40 61 L32 66 Z" />,
  spiky: <path d="M33 44 L37 22 L43 31 L49 15 L55 28 L62 14 L67 29 L72 20 L77 44 Q55 31 33 44 Z" />,
  bob: <path d="M31 48 Q31 21 55 21 Q79 21 79 48 L73 45 Q75 32 55 32 Q35 32 37 45 Z" />,
  ponytail: <g>
    <path d="M34 42 Q34 21 55 21 Q76 21 76 42 L76 46 Q76 34 55 31 Q34 34 34 46 Z" />
    <circle cx="78" cy="46" r="7" />
    <path d="M76 44 Q90 52 86 70 Q84 62 76 58 Z" />
  </g>,
  buzz: <path d="M35 40 Q36 24 55 24 Q74 24 75 40 Q55 32 35 40 Z" />,
};

function eyes(style: EyeStyle): React.ReactNode {
  if (style === 'determined') {
    return (
      <g>
        <path d="M44 50 L52 50" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        <circle cx="49.5" cy="52.5" r="2" fill="#111827" />
        <path d="M58 50 L66 50" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60.5" cy="52.5" r="2" fill="#111827" />
        <path d="M44 46 L52 47" stroke="#111827" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M58 47 L66 46" stroke="#111827" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    );
  }
  if (style === 'cheery') {
    return (
      <g stroke="#111827" strokeWidth="2.2" fill="none" strokeLinecap="round">
        <path d="M45 52 Q48 48 51 52" />
        <path d="M59 52 Q62 48 65 52" />
      </g>
    );
  }
  return (
    <g>
      <circle cx="48" cy="51" r="2.6" fill="#111827" />
      <circle cx="62" cy="51" r="2.6" fill="#111827" />
    </g>
  );
}

const OUTFIT_SHAPES: Record<OutfitStyle, { accent: string; fill: string; extra: React.ReactNode }> = {
  jacket: {
    accent: '#FFFFFF', fill: '',
    extra: (
      <g>
        <path d="M50 76 L55 88 L60 76 L60 102 L50 102 Z" fill="rgba(255,255,255,0.9)" />
        <path d="M55 88 L55 102" stroke="#0B0F17" strokeWidth="2" />
      </g>
    ),
  },
  hoodie: {
    accent: '#FFFFFF', fill: '',
    extra: (
      <g>
        <path d="M42 78 Q55 90 68 78 L68 82 Q55 94 42 82 Z" fill="rgba(0,0,0,0.25)" />
        <line x1="50" y1="80" x2="49" y2="90" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="80" x2="61" y2="90" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
  },
  tee: {
    accent: '#FFFFFF', fill: '',
    extra: <path d="M42 78 L48 82 L55 78 L62 82 L68 78" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" />,
  },
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
  const outfitShape = OUTFIT_SHAPES[c.outfitStyle];
  return (
    <svg viewBox="0 0 110 110" width={size} height={size} className={className} role="img" aria-label="Trainer avatar">
      <circle cx="55" cy="55" r="52" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
      {/* shoulders/arms */}
      <path d="M14 102 Q16 82 28 78 L28 102 Z" fill={skin} />
      <path d="M96 102 Q94 82 82 78 L82 102 Z" fill={skin} />
      {/* torso */}
      <path d="M20 104 Q22 76 40 74 L70 74 Q88 76 90 104 Z" fill={outfit} />
      {outfitShape.extra}
      {/* collar */}
      <path d="M44 74 L55 84 L66 74" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" />
      {/* neck + head */}
      <rect x="50" y="66" width="10" height="8" rx="3" fill={skin} />
      <circle cx="55" cy="50" r="21" fill={skin} />
      {/* ears */}
      <circle cx="34.5" cy="51" r="3.5" fill={skin} />
      <circle cx="75.5" cy="51" r="3.5" fill={skin} />
      {/* hair */}
      <g fill={hair}>{HAIR_SHAPES[c.hairStyle]}</g>
      {/* face */}
      {eyes(c.eyeStyle)}
      <path d="M50 60 Q55 64.5 60 60" stroke="#111827" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      {/* accessories over hair */}
      {c.accessory === 'glasses' && (
        <g>
          <circle cx="48" cy="51" r="6" fill="none" stroke={OUTFIT_COLORS[c.accessoryColor]} strokeWidth="2.2" />
          <circle cx="62" cy="51" r="6" fill="none" stroke={OUTFIT_COLORS[c.accessoryColor]} strokeWidth="2.2" />
          <line x1="54" y1="51" x2="56" y2="51" stroke={OUTFIT_COLORS[c.accessoryColor]} strokeWidth="2.2" />
        </g>
      )}
      {c.accessory === 'scarf' && (
        <g>
          <path d="M40 70 Q55 80 70 70 L70 78 Q55 88 40 78 Z" fill={OUTFIT_COLORS[c.accessoryColor]} />
          <path d="M68 76 L74 92 L66 90 Z" fill={OUTFIT_COLORS[c.accessoryColor]} />
        </g>
      )}
      {/* headwear */}
      {c.headwear === 'cap' && (
        <g>
          <path d="M33 38 Q33 17 55 17 Q77 17 77 38 L77 41 L33 41 Z" fill={OUTFIT_COLORS[c.headwearColor]} />
          <path d="M33 38 L77 38 L77 41 L33 41 Z" fill="rgba(0,0,0,0.3)" />
          <rect x="74" y="35" width="16" height="5" rx="2.5" fill={OUTFIT_COLORS[c.headwearColor]} />
          <circle cx="55" cy="20" r="3" fill="rgba(255,255,255,0.85)" />
        </g>
      )}
      {c.headwear === 'beanie' && (
        <g>
          <path d="M33 40 Q33 18 55 18 Q77 18 77 40 L77 43 L33 43 Z" fill={OUTFIT_COLORS[c.headwearColor]} />
          <rect x="31" y="40" width="48" height="6" rx="3" fill="rgba(255,255,255,0.8)" />
          <circle cx="55" cy="16" r="4" fill={OUTFIT_COLORS[c.headwearColor]} />
        </g>
      )}
      {c.headwear === 'strawhat' && (
        <g>
          <ellipse cx="55" cy="34" rx="34" ry="7" fill={OUTFIT_COLORS[c.headwearColor]} />
          <path d="M40 34 Q40 18 55 18 Q70 18 70 34 Z" fill={OUTFIT_COLORS[c.headwearColor]} />
          <rect x="40" y="29" width="30" height="4" fill="#B45309" />
        </g>
      )}
      {c.headwear === 'visored' && (
        <g>
          <path d="M34 40 Q34 22 55 22 Q76 22 76 40 Z" fill={OUTFIT_COLORS[c.headwearColor]} />
          <rect x="36" y="38" width="38" height="7" rx="3.5" fill="#0EA5E9" opacity="0.85" />
        </g>
      )}
    </svg>
  );
};

const Swatches: React.FC<{
  label: string;
  options: readonly string[];
  active: number;
  onPick: (i: number) => void;
}> = ({ label, options, active, onPick }) => (
  <fieldset>
    <legend className="text-xs font-bold text-amber-300 mb-1.5">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map((color, i) => (
        <button
          key={color}
          type="button"
          aria-pressed={active === i}
          onClick={() => onPick(i)}
          className={`w-9 h-9 rounded-lg border-2 cursor-pointer transition-transform hover:scale-105 ${active === i ? 'border-amber-400 scale-110' : 'border-slate-700'}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  </fieldset>
);

const Chips: React.FC<{
  label: string;
  options: readonly string[];
  active: string;
  onPick: (i: number) => void;
}> = ({ label, options, active, onPick }) => (
  <fieldset>
    <legend className="text-xs font-bold text-amber-300 mb-1.5">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          aria-pressed={active === opt}
          onClick={() => onPick(i)}
          className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${active === opt ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-slate-700 text-slate-300 hover:text-white'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  </fieldset>
);

/** All-choice grids for the builder. */
export const AvatarBuilder: React.FC<{
  config: TrainerAvatarConfig;
  onChange: (next: TrainerAvatarConfig) => void;
}> = ({ config, onChange }) => {
  const randomize = () => {
    const rand = (n: number) => Math.floor(Math.random() * n);
    onChange({
      skin: rand(SKIN_TONES.length),
      hairStyle: HAIR_STYLES[rand(HAIR_STYLES.length)],
      hairColor: rand(HAIR_COLORS.length),
      eyeStyle: EYE_STYLES[rand(EYE_STYLES.length)],
      outfitStyle: OUTFIT_STYLES[rand(OUTFIT_STYLES.length)],
      outfit: rand(OUTFIT_COLORS.length),
      outfitAccent: rand(OUTFIT_COLORS.length),
      headwear: HEADWEAR[rand(HEADWEAR.length)],
      headwearColor: rand(OUTFIT_COLORS.length),
      accessory: ACCESSORIES[rand(ACCESSORIES.length)],
      accessoryColor: rand(OUTFIT_COLORS.length),
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
          Trainers across every region dress up — make yours!
        </span>
        <button
          type="button"
          onClick={randomize}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold cursor-pointer"
        >
          🎲 Surprise me
        </button>
      </div>
      <Swatches label="Skin tone" options={SKIN_TONES} active={config.skin} onPick={(i) => onChange({ ...config, skin: i })} />
      <Chips label="Hair style" options={HAIR_STYLES} active={config.hairStyle} onPick={(i) => onChange({ ...config, hairStyle: HAIR_STYLES[i] })} />
      <Swatches label="Hair color" options={HAIR_COLORS} active={config.hairColor} onPick={(i) => onChange({ ...config, hairColor: i })} />
      <Chips label="Eyes" options={EYE_STYLES} active={config.eyeStyle} onPick={(i) => onChange({ ...config, eyeStyle: EYE_STYLES[i] })} />
      <Chips label="Outfit" options={OUTFIT_STYLES} active={config.outfitStyle} onPick={(i) => onChange({ ...config, outfitStyle: OUTFIT_STYLES[i] })} />
      <Swatches label="Outfit color" options={OUTFIT_COLORS} active={config.outfit} onPick={(i) => onChange({ ...config, outfit: i })} />
      <Swatches label="Accent color" options={OUTFIT_COLORS} active={config.outfitAccent} onPick={(i) => onChange({ ...config, outfitAccent: i })} />
      <Chips label="Headwear" options={HEADWEAR} active={config.headwear} onPick={(i) => onChange({ ...config, headwear: HEADWEAR[i] })} />
      {config.headwear !== 'none' && (
        <Swatches label="Headwear color" options={OUTFIT_COLORS} active={config.headwearColor} onPick={(i) => onChange({ ...config, headwearColor: i })} />
      )}
      <Chips label="Accessory" options={ACCESSORIES} active={config.accessory} onPick={(i) => onChange({ ...config, accessory: ACCESSORIES[i] })} />
      {config.accessory !== 'none' && (
        <Swatches label="Accessory color" options={OUTFIT_COLORS} active={config.accessoryColor} onPick={(i) => onChange({ ...config, accessoryColor: i })} />
      )}
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
