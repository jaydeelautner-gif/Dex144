import React from 'react';
import type { GameId } from '../data/pokemonData';
import { GAMES } from '../data/pokemonData';

export interface GameVisualMeta {
  shortCode: string;
  originMarkName: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconColorClass: string;
}

export const GAME_VISUAL_META: Record<GameId, GameVisualMeta> = {
  rb: {
    shortCode: 'RB',
    originMarkName: 'Game Boy DMG Origin Mark',
    bgClass: 'bg-gradient-to-br from-red-950/90 to-blue-950/90',
    borderClass: 'border-red-500/60',
    textClass: 'text-red-200',
    iconColorClass: 'text-red-400',
  },
  yellow: {
    shortCode: 'YEL',
    originMarkName: 'Game Boy Yellow Origin Mark',
    bgClass: 'bg-gradient-to-br from-yellow-950/90 to-amber-950/90',
    borderClass: 'border-yellow-400/60',
    textClass: 'text-yellow-200',
    iconColorClass: 'text-yellow-400',
  },
  gs: {
    shortCode: 'GS',
    originMarkName: 'Game Boy Color Gold/Silver Mark',
    bgClass: 'bg-gradient-to-br from-amber-950/90 to-slate-800',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-200',
    iconColorClass: 'text-amber-400',
  },
  crystal: {
    shortCode: 'CRY',
    originMarkName: 'Game Boy Color Crystal Mark',
    bgClass: 'bg-gradient-to-br from-cyan-950/90 to-sky-950/90',
    borderClass: 'border-cyan-400/60',
    textClass: 'text-cyan-200',
    iconColorClass: 'text-cyan-300',
  },
  rse: {
    shortCode: 'RSE',
    originMarkName: 'Hoenn GBA Mark',
    bgClass: 'bg-gradient-to-br from-rose-950/80 via-emerald-950/70 to-blue-950/80',
    borderClass: 'border-emerald-500/50',
    textClass: 'text-emerald-200',
    iconColorClass: 'text-emerald-400',
  },
  frlg: {
    shortCode: 'FRLG (GBA)',
    originMarkName: 'Kanto GBA Mark',
    bgClass: 'bg-gradient-to-br from-orange-950/80 to-emerald-950/80',
    borderClass: 'border-orange-500/50',
    textClass: 'text-orange-200',
    iconColorClass: 'text-orange-400',
  },
  frlg_switch: {
    shortCode: 'FRLG (NSW)',
    originMarkName: 'Kanto Switch / NSO Mark',
    bgClass: 'bg-gradient-to-br from-red-950/80 to-emerald-950/80',
    borderClass: 'border-red-400/60',
    textClass: 'text-red-200',
    iconColorClass: 'text-emerald-400',
  },
  colo: {
    shortCode: 'COLO',
    originMarkName: 'GameCube Colosseum Snag Mark',
    bgClass: 'bg-gradient-to-br from-purple-950/90 to-slate-900',
    borderClass: 'border-purple-400/60',
    textClass: 'text-purple-200',
    iconColorClass: 'text-purple-400',
  },
  xd: {
    shortCode: 'XD',
    originMarkName: 'GameCube XD Shadow Lugia Mark',
    bgClass: 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90',
    borderClass: 'border-indigo-400/60',
    textClass: 'text-indigo-200',
    iconColorClass: 'text-indigo-400',
  },
  dppt: {
    shortCode: 'DPPt',
    originMarkName: 'Sinnoh DS Mark',
    bgClass: 'bg-gradient-to-br from-sky-950/80 via-slate-900 to-fuchsia-950/80',
    borderClass: 'border-sky-400/50',
    textClass: 'text-sky-200',
    iconColorClass: 'text-sky-300',
  },
  hgss: {
    shortCode: 'HGSS',
    originMarkName: 'Johto DS Mark',
    bgClass: 'bg-gradient-to-br from-amber-950/80 to-slate-900',
    borderClass: 'border-amber-400/50',
    textClass: 'text-amber-200',
    iconColorClass: 'text-amber-400',
  },
  bw: {
    shortCode: 'BW',
    originMarkName: 'Unova Mark',
    bgClass: 'bg-gradient-to-br from-slate-900 to-zinc-800',
    borderClass: 'border-slate-400/50',
    textClass: 'text-slate-100',
    iconColorClass: 'text-slate-200',
  },
  b2w2: {
    shortCode: 'B2W2',
    originMarkName: 'Unova Sequel Mark',
    bgClass: 'bg-gradient-to-br from-sky-950/80 via-slate-900 to-rose-950/80',
    borderClass: 'border-cyan-400/50',
    textClass: 'text-cyan-200',
    iconColorClass: 'text-cyan-400',
  },
  xy: {
    shortCode: 'XY',
    originMarkName: 'Gen VI Pentagon Mark',
    bgClass: 'bg-gradient-to-br from-blue-950/80 to-rose-950/80',
    borderClass: 'border-blue-400/50',
    textClass: 'text-blue-200',
    iconColorClass: 'text-blue-400',
  },
  oras: {
    shortCode: 'ORAS',
    originMarkName: 'Gen VI Pentagon Mark',
    bgClass: 'bg-gradient-to-br from-red-950/80 to-indigo-950/80',
    borderClass: 'border-red-400/50',
    textClass: 'text-red-200',
    iconColorClass: 'text-red-400',
  },
  sm: {
    shortCode: 'SM',
    originMarkName: 'Alola Clover Mark',
    bgClass: 'bg-gradient-to-br from-amber-950/80 to-violet-950/80',
    borderClass: 'border-amber-400/50',
    textClass: 'text-amber-200',
    iconColorClass: 'text-amber-400',
  },
  usum: {
    shortCode: 'USUM',
    originMarkName: 'Alola Clover Mark',
    bgClass: 'bg-gradient-to-br from-orange-950/80 via-slate-900 to-purple-950/80',
    borderClass: 'border-orange-400/50',
    textClass: 'text-orange-200',
    iconColorClass: 'text-orange-400',
  },
  lgpe: {
    shortCode: 'LGPE',
    originMarkName: "Let's Go Origin Mark",
    bgClass: 'bg-gradient-to-br from-yellow-950/80 to-amber-950/80',
    borderClass: 'border-yellow-400/50',
    textClass: 'text-yellow-200',
    iconColorClass: 'text-yellow-400',
  },
  pogo: {
    shortCode: 'GO',
    originMarkName: 'Pokémon GO Origin Mark',
    bgClass: 'bg-gradient-to-br from-cyan-950/80 to-blue-950/80',
    borderClass: 'border-cyan-400/50',
    textClass: 'text-cyan-200',
    iconColorClass: 'text-cyan-300',
  },
  swsh: {
    shortCode: 'SwSh',
    originMarkName: 'Galar Origin Mark',
    bgClass: 'bg-gradient-to-br from-cyan-950/85 to-rose-950/85',
    borderClass: 'border-cyan-400/50',
    textClass: 'text-cyan-100',
    iconColorClass: 'text-rose-400',
  },
  bdsp: {
    shortCode: 'BDSP',
    originMarkName: 'Sinnoh Triangle Trio Mark',
    bgClass: 'bg-gradient-to-br from-sky-950/80 to-pink-950/80',
    borderClass: 'border-sky-400/50',
    textClass: 'text-sky-200',
    iconColorClass: 'text-sky-300',
  },
  pla: {
    shortCode: 'PLA',
    originMarkName: 'Hisui Arceus Mark',
    bgClass: 'bg-gradient-to-br from-amber-950/80 to-slate-900',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-200',
    iconColorClass: 'text-amber-300',
  },
  sv: {
    shortCode: 'SV',
    originMarkName: 'Paldea Terastal Mark',
    bgClass: 'bg-gradient-to-br from-orange-950/85 to-purple-950/85',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-100',
    iconColorClass: 'text-amber-300',
  },
  // Canonical individual game versions:
  red: {
    shortCode: 'RED',
    originMarkName: 'Game Boy DMG Origin Mark',
    bgClass: 'bg-gradient-to-br from-red-950/90 to-red-900/90',
    borderClass: 'border-red-500/60',
    textClass: 'text-red-200',
    iconColorClass: 'text-red-400',
  },
  blue: {
    shortCode: 'BLU',
    originMarkName: 'Game Boy DMG Origin Mark',
    bgClass: 'bg-gradient-to-br from-blue-950/90 to-blue-900/90',
    borderClass: 'border-blue-500/60',
    textClass: 'text-blue-200',
    iconColorClass: 'text-blue-400',
  },
  gold: {
    shortCode: 'GLD',
    originMarkName: 'Game Boy Color Gold/Silver Mark',
    bgClass: 'bg-gradient-to-br from-amber-950/90 to-yellow-900/90',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-200',
    iconColorClass: 'text-amber-400',
  },
  silver: {
    shortCode: 'SLV',
    originMarkName: 'Game Boy Color Gold/Silver Mark',
    bgClass: 'bg-gradient-to-br from-slate-900 to-slate-800',
    borderClass: 'border-slate-400/60',
    textClass: 'text-slate-200',
    iconColorClass: 'text-slate-300',
  },
  ruby: {
    shortCode: 'RUBY',
    originMarkName: 'Hoenn GBA Mark',
    bgClass: 'bg-gradient-to-br from-rose-950/90 to-red-900/80',
    borderClass: 'border-rose-500/60',
    textClass: 'text-rose-200',
    iconColorClass: 'text-rose-400',
  },
  sapphire: {
    shortCode: 'SAPH',
    originMarkName: 'Hoenn GBA Mark',
    bgClass: 'bg-gradient-to-br from-blue-950/90 to-sky-900/80',
    borderClass: 'border-blue-500/60',
    textClass: 'text-blue-200',
    iconColorClass: 'text-blue-400',
  },
  emerald: {
    shortCode: 'EMER',
    originMarkName: 'Hoenn GBA Mark',
    bgClass: 'bg-gradient-to-br from-emerald-950/90 to-teal-900/80',
    borderClass: 'border-emerald-500/60',
    textClass: 'text-emerald-200',
    iconColorClass: 'text-emerald-400',
  },
  firered: {
    shortCode: 'FR',
    originMarkName: 'Kanto GBA Mark',
    bgClass: 'bg-gradient-to-br from-orange-950/90 to-red-900/80',
    borderClass: 'border-orange-500/60',
    textClass: 'text-orange-200',
    iconColorClass: 'text-orange-400',
  },
  leafgreen: {
    shortCode: 'LG',
    originMarkName: 'Kanto GBA Mark',
    bgClass: 'bg-gradient-to-br from-emerald-950/90 to-green-900/80',
    borderClass: 'border-emerald-500/60',
    textClass: 'text-emerald-200',
    iconColorClass: 'text-emerald-400',
  },
  diamond: {
    shortCode: 'DIA',
    originMarkName: 'Sinnoh DS Mark',
    bgClass: 'bg-gradient-to-br from-sky-950/90 to-blue-900/80',
    borderClass: 'border-sky-400/60',
    textClass: 'text-sky-200',
    iconColorClass: 'text-sky-300',
  },
  pearl: {
    shortCode: 'PRL',
    originMarkName: 'Sinnoh DS Mark',
    bgClass: 'bg-gradient-to-br from-pink-950/90 to-rose-900/80',
    borderClass: 'border-pink-400/60',
    textClass: 'text-pink-200',
    iconColorClass: 'text-pink-300',
  },
  platinum: {
    shortCode: 'PLAT',
    originMarkName: 'Sinnoh DS Mark',
    bgClass: 'bg-gradient-to-br from-slate-900 to-zinc-800',
    borderClass: 'border-slate-400/60',
    textClass: 'text-slate-200',
    iconColorClass: 'text-slate-300',
  },
  heartgold: {
    shortCode: 'HG',
    originMarkName: 'Johto DS Mark',
    bgClass: 'bg-gradient-to-br from-amber-950/90 to-yellow-900/80',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-200',
    iconColorClass: 'text-amber-400',
  },
  soulsilver: {
    shortCode: 'SS',
    originMarkName: 'Johto DS Mark',
    bgClass: 'bg-gradient-to-br from-slate-900 to-slate-800',
    borderClass: 'border-slate-400/60',
    textClass: 'text-slate-200',
    iconColorClass: 'text-slate-300',
  },
  black: {
    shortCode: 'BLK',
    originMarkName: 'Unova Mark',
    bgClass: 'bg-gradient-to-br from-zinc-950 to-neutral-900',
    borderClass: 'border-zinc-500/60',
    textClass: 'text-zinc-200',
    iconColorClass: 'text-zinc-300',
  },
  white: {
    shortCode: 'WHT',
    originMarkName: 'Unova Mark',
    bgClass: 'bg-gradient-to-br from-slate-900 to-slate-800',
    borderClass: 'border-slate-300/60',
    textClass: 'text-slate-100',
    iconColorClass: 'text-slate-200',
  },
  black2: {
    shortCode: 'B2',
    originMarkName: 'Unova Sequel Mark',
    bgClass: 'bg-gradient-to-br from-zinc-950 to-blue-950/80',
    borderClass: 'border-cyan-500/60',
    textClass: 'text-cyan-200',
    iconColorClass: 'text-cyan-400',
  },
  white2: {
    shortCode: 'W2',
    originMarkName: 'Unova Sequel Mark',
    bgClass: 'bg-gradient-to-br from-slate-900 to-rose-950/80',
    borderClass: 'border-rose-400/60',
    textClass: 'text-rose-200',
    iconColorClass: 'text-rose-300',
  },
  x: {
    shortCode: 'X',
    originMarkName: 'Gen VI Pentagon Mark',
    bgClass: 'bg-gradient-to-br from-blue-950/90 to-sky-900/80',
    borderClass: 'border-blue-400/60',
    textClass: 'text-blue-200',
    iconColorClass: 'text-blue-400',
  },
  y: {
    shortCode: 'Y',
    originMarkName: 'Gen VI Pentagon Mark',
    bgClass: 'bg-gradient-to-br from-rose-950/90 to-red-900/80',
    borderClass: 'border-rose-400/60',
    textClass: 'text-rose-200',
    iconColorClass: 'text-rose-400',
  },
  omegaruby: {
    shortCode: 'OR',
    originMarkName: 'Gen VI Pentagon Mark',
    bgClass: 'bg-gradient-to-br from-red-950/90 to-rose-900/80',
    borderClass: 'border-red-400/60',
    textClass: 'text-red-200',
    iconColorClass: 'text-red-400',
  },
  alphasapphire: {
    shortCode: 'AS',
    originMarkName: 'Gen VI Pentagon Mark',
    bgClass: 'bg-gradient-to-br from-indigo-950/90 to-blue-900/80',
    borderClass: 'border-indigo-400/60',
    textClass: 'text-indigo-200',
    iconColorClass: 'text-indigo-400',
  },
  sun: {
    shortCode: 'SUN',
    originMarkName: 'Alola Clover Mark',
    bgClass: 'bg-gradient-to-br from-amber-950/90 to-orange-900/80',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-200',
    iconColorClass: 'text-amber-400',
  },
  moon: {
    shortCode: 'MOON',
    originMarkName: 'Alola Clover Mark',
    bgClass: 'bg-gradient-to-br from-indigo-950/90 to-violet-900/80',
    borderClass: 'border-indigo-400/60',
    textClass: 'text-indigo-200',
    iconColorClass: 'text-indigo-400',
  },
  ultrasun: {
    shortCode: 'US',
    originMarkName: 'Alola Clover Mark',
    bgClass: 'bg-gradient-to-br from-orange-950/90 to-amber-900/80',
    borderClass: 'border-orange-400/60',
    textClass: 'text-orange-200',
    iconColorClass: 'text-orange-400',
  },
  ultramoon: {
    shortCode: 'UM',
    originMarkName: 'Alola Clover Mark',
    bgClass: 'bg-gradient-to-br from-purple-950/90 to-indigo-900/80',
    borderClass: 'border-purple-400/60',
    textClass: 'text-purple-200',
    iconColorClass: 'text-purple-400',
  },
  lgp: {
    shortCode: 'LGP',
    originMarkName: "Let's Go Origin Mark",
    bgClass: 'bg-gradient-to-br from-yellow-950/90 to-amber-900/80',
    borderClass: 'border-yellow-400/60',
    textClass: 'text-yellow-200',
    iconColorClass: 'text-yellow-400',
  },
  lge: {
    shortCode: 'LGE',
    originMarkName: "Let's Go Origin Mark",
    bgClass: 'bg-gradient-to-br from-amber-950/90 to-orange-900/80',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-200',
    iconColorClass: 'text-amber-400',
  },
  sword: {
    shortCode: 'SW',
    originMarkName: 'Galar Origin Mark',
    bgClass: 'bg-gradient-to-br from-cyan-950/90 to-blue-900/80',
    borderClass: 'border-cyan-400/60',
    textClass: 'text-cyan-200',
    iconColorClass: 'text-cyan-400',
  },
  shield: {
    shortCode: 'SH',
    originMarkName: 'Galar Origin Mark',
    bgClass: 'bg-gradient-to-br from-rose-950/90 to-red-900/80',
    borderClass: 'border-rose-400/60',
    textClass: 'text-rose-200',
    iconColorClass: 'text-rose-400',
  },
  bd: {
    shortCode: 'BD',
    originMarkName: 'Sinnoh Triangle Trio Mark',
    bgClass: 'bg-gradient-to-br from-sky-950/90 to-blue-900/80',
    borderClass: 'border-sky-400/60',
    textClass: 'text-sky-200',
    iconColorClass: 'text-sky-300',
  },
  sp: {
    shortCode: 'SP',
    originMarkName: 'Sinnoh Triangle Trio Mark',
    bgClass: 'bg-gradient-to-br from-pink-950/90 to-fuchsia-900/80',
    borderClass: 'border-pink-400/60',
    textClass: 'text-pink-200',
    iconColorClass: 'text-pink-300',
  },
  scarlet: {
    shortCode: 'SCA',
    originMarkName: 'Paldea Terastal Mark',
    bgClass: 'bg-gradient-to-br from-orange-950/90 to-red-900/80',
    borderClass: 'border-orange-500/60',
    textClass: 'text-orange-200',
    iconColorClass: 'text-orange-400',
  },
  violet: {
    shortCode: 'VIO',
    originMarkName: 'Paldea Terastal Mark',
    bgClass: 'bg-gradient-to-br from-purple-950/90 to-violet-900/80',
    borderClass: 'border-purple-500/60',
    textClass: 'text-purple-200',
    iconColorClass: 'text-purple-300',
  },
};

export const GameOriginIcon: React.FC<{
  gameId: GameId;
  className?: string;
}> = ({ gameId, className = 'w-4 h-4' }) => {
  switch (gameId) {
    case 'sv':
    case 'scarlet':
    case 'violet':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12 1.5L14.6 7.4L21 6.5L16.8 11.8L21 17.5L14.6 16.6L12 22.5L9.4 16.6L3 17.5L7.2 11.8L3 6.5L9.4 7.4L12 1.5ZM12 8.2L9.2 12L12 15.8L14.8 12L12 8.2Z" />
        </svg>
      );
    case 'pla':
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 1.5V5M12 19V22.5M1.5 12H5M19 12H22.5M4.5 4.5L7.2 7.2M16.8 16.8L19.5 19.5M19.5 4.5L16.8 7.2M7.2 16.8L4.5 19.5" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        </svg>
      );
    case 'bdsp':
    case 'bd':
    case 'sp':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <polygon points="12,2.5 16.2,9.8 7.8,9.8" />
          <polygon points="6.2,12.5 10.4,19.8 2,19.8" />
          <polygon points="17.8,12.5 22,19.8 13.6,19.8" />
        </svg>
      );
    case 'swsh':
    case 'sword':
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12 2L19 5.2V11.8C19 16.6 15.9 20.6 12 22C8.1 20.6 5 16.6 5 11.8V5.2L12 2ZM12 5.2L10.3 9.5H13.7L12 5.2ZM11 11V18.2H13V11H11Z" />
        </svg>
      );
    case 'pogo':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.8 13.2C16.3 15.9 14.1 17.5 11.8 17.5C8.8 17.5 6.5 15.1 6.5 12C6.5 8.9 8.8 6.5 11.8 6.5C13.6 6.5 15.1 7.2 16.1 8.4L14.3 9.9C13.7 9.2 12.8 8.8 11.8 8.8C10 8.8 8.9 10.2 8.9 12C8.9 13.8 10 15.2 11.8 15.2C13.3 15.2 14.2 14.3 14.4 13.2H11.8V11.2H16.9C16.9 11.8 16.9 12.6 16.8 13.2Z" />
        </svg>
      );
    case 'lgpe':
    case 'lgp':
    case 'lge':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M13.5 2L7 12.5H12L9.5 22L18 10.5H12.8L13.5 2Z" />
        </svg>
      );
    case 'sm':
    case 'usum':
    case 'sun':
    case 'moon':
    case 'ultrasun':
    case 'ultramoon':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12 2C14.2 2 15.5 4.2 14.2 6.8L12 10.5L9.8 6.8C8.5 4.2 9.8 2 12 2ZM12 22C9.8 22 8.5 19.8 9.8 17.2L12 13.5L14.2 17.2C15.5 19.8 14.2 22 12 22ZM2 12C2 9.8 4.2 8.5 6.8 9.8L10.5 12L6.8 14.2C4.2 15.5 2 14.2 2 12ZM22 12C22 14.2 19.8 15.5 17.2 14.2L13.5 12L17.2 9.8C19.8 8.5 22 9.8 22 12Z" />
        </svg>
      );
    case 'xy':
    case 'oras':
    case 'x':
    case 'y':
    case 'omegaruby':
    case 'alphasapphire':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <polygon points="12,2.2 21.5,9.1 17.9,20.5 6.1,20.5 2.5,9.1" />
        </svg>
      );
    case 'bw':
    case 'b2w2':
    case 'black':
    case 'white':
    case 'black2':
    case 'white2':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C14.76 4 17 6.24 17 9C17 11.76 14.76 14 12 14C9.24 14 7 16.24 7 19C4.8 17.3 3.5 14.8 3.5 12C3.5 7.58 7.3 4 12 4ZM12 7.5C11.17 7.5 10.5 8.17 10.5 9C10.5 9.83 11.17 10.5 12 10.5C12.83 10.5 13.5 9.83 13.5 9C13.5 8.17 12.83 7.5 12 7.5ZM12 15.5C12.83 15.5 13.5 16.17 13.5 17C13.5 17.83 12.83 18.5 12 18.5C11.17 18.5 10.5 17.83 10.5 17C10.5 16.17 11.17 15.5 12 15.5Z" />
        </svg>
      );
    case 'dppt':
    case 'hgss':
    case 'diamond':
    case 'pearl':
    case 'platinum':
    case 'heartgold':
    case 'soulsilver':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <polygon points="12,2 21,12 12,22 3,12" />
        </svg>
      );
    case 'rb':
    case 'yellow':
    case 'red':
    case 'blue':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M5 3C3.9 3 3 3.9 3 5V21H21V5C21 3.9 20.1 3 19 3H5ZM6 6H18V13H6V6ZM8 16H11V19H8V16ZM14 16H16V18H14V16Z" />
        </svg>
      );
    case 'gs':
    case 'crystal':
    case 'gold':
    case 'silver':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M4 3C4 2.45 4.45 2 5 2H19C19.55 2 20 2.45 20 3V21C20 21.55 19.55 22 19 22H5C4.45 22 4 21.55 4 21V3ZM6 5V13H18V5H6ZM9 15H15V17H9V15ZM9 18H13V19H9V18Z" />
        </svg>
      );
    case 'colo':
    case 'xd':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7ZM12 9.5C10.62 9.5 9.5 10.62 9.5 12C9.5 13.38 10.62 14.5 12 14.5C13.38 14.5 14.5 13.38 14.5 12C14.5 10.62 13.38 9.5 12 9.5Z" />
        </svg>
      );
    case 'frlg_switch':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M3 6C3 4.34 4.34 3 6 3H10V21H6C4.34 21 3 19.66 3 18V6ZM6 7C5.45 7 5 7.45 5 8C5 8.55 5.45 9 6 9C6.55 9 7 8.55 7 8C7 7.45 6.55 7 6 7ZM14 3H18C19.66 3 21 4.34 21 6V18C21 19.66 19.66 21 18 21H14V3ZM18 15C17.45 15 17 15.45 17 16C17 16.55 17.45 17 18 17C18.55 17 19 16.55 19 16C19 15.45 18.55 15 18 15Z" />
        </svg>
      );
    case 'rse':
    case 'frlg':
    case 'ruby':
    case 'sapphire':
    case 'emerald':
    case 'firered':
    case 'leafgreen':
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M4 5C4 3.9 4.9 3 6 3H18C19.1 3 20 3.9 20 5V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V5ZM7 6V11H17V6H7ZM9 14H15V17H9V14Z" />
        </svg>
      );
  }
};

export const GameLogoBadge: React.FC<{
  gameId: GameId;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCode?: boolean;
  className?: string;
}> = ({ gameId, size = 'md', showCode = true, className = '' }) => {
  const meta = GAME_VISUAL_META[gameId];
  const gameInfo = GAMES.find((g) => g.id === gameId);
  const sizeMap = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1 rounded',
    sm: 'px-2 py-1 text-[11px] gap-1.5 rounded-md',
    md: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
    lg: 'px-3 py-2 text-xs gap-2 rounded-xl',
  };
  const iconSizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      title={`${gameInfo?.title || gameId} (${meta?.originMarkName || 'Origin Mark'})`}
      className={`inline-flex items-center font-mono-tabular font-bold border select-none shrink-0 ${meta?.bgClass || 'bg-slate-900'} ${meta?.borderClass || 'border-slate-700'} ${meta?.textClass || 'text-slate-200'} ${sizeMap[size]} ${className}`}
    >
      <GameOriginIcon
        gameId={gameId}
        className={`${iconSizeMap[size]} ${meta?.iconColorClass || 'text-slate-300'} shrink-0`}
      />
      {showCode && <span>{meta?.shortCode || gameId.toUpperCase()}</span>}
    </div>
  );
};

export const PokemonHomeIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2L3 9.2V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V9.2L12 2ZM12 6.5C15.04 6.5 17.5 8.96 17.5 12C17.5 15.04 15.04 17.5 12 17.5C8.96 17.5 6.5 15.04 6.5 12C6.5 8.96 8.96 6.5 12 6.5ZM12 8.3C10.23 8.3 8.76 9.54 8.39 11.2H10.35C10.65 10.45 11.27 9.95 12 9.95C12.73 9.95 13.35 10.45 13.65 11.2H15.61C15.24 9.54 13.77 8.3 12 8.3ZM12 13.4C11.23 13.4 10.6 12.77 10.6 12C10.6 11.23 11.23 10.6 12 10.6C12.77 10.6 13.4 11.23 13.4 12C13.4 12.77 12.77 13.4 12 13.4Z" />
  </svg>
);

export const PokemonHomeLogoBadge: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}> = ({ size = 'md', label = 'Pokémon HOME', className = '' }) => {
  const sizeMap = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1 rounded',
    sm: 'px-2 py-1 text-[11px] gap-1.5 rounded-md',
    md: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
    lg: 'px-3 py-2 text-xs gap-2 rounded-xl',
  };
  const iconSizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      title="Pokémon HOME Cloud Storage"
      className={`inline-flex items-center font-mono-tabular font-bold border select-none shrink-0 bg-gradient-to-br from-emerald-950/90 via-teal-950/85 to-cyan-950/90 border-emerald-400/60 text-emerald-200 ${sizeMap[size]} ${className}`}
    >
      <PokemonHomeIcon className={`${iconSizeMap[size]} text-emerald-400 shrink-0`} />
      <span>{label}</span>
    </div>
  );
};
