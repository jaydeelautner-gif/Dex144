import React from 'react';
import { POKEBALLS, type PokeballId } from '../data/pokemonInventoryData';

const BALL_COLORS: Record<PokeballId, [string, string]> = {
  'poke-ball': ['#e84141', '#ff9d87'],
  'great-ball': ['#2879d0', '#ef5960'],
  'ultra-ball': ['#252b35', '#f5d442'],
  'master-ball': ['#9b50ce', '#f394d2'],
  'safari-ball': ['#73943e', '#b6a36a'],
  'sport-ball': ['#e57336', '#f1cf59'],
  'fast-ball': ['#e94c45', '#f2da72'],
  'level-ball': ['#d94b38', '#f0be42'],
  'lure-ball': ['#398fd0', '#ee705d'],
  'heavy-ball': ['#69717b', '#aeb8c3'],
  'love-ball': ['#e879a8', '#f5b8d0'],
  'friend-ball': ['#57a56b', '#c2d75a'],
  'moon-ball': ['#424c83', '#9da8e8'],
  'net-ball': ['#3b9eaa', '#d5b06e'],
  'dive-ball': ['#379fc7', '#9be2ed'],
  'nest-ball': ['#8ab44b', '#e2d16b'],
  'repeat-ball': ['#db5543', '#f0d6bb'],
  'timer-ball': ['#bd443d', '#d8b16b'],
  'luxury-ball': ['#252a32', '#c69a4b'],
  'premier-ball': ['#e9edf2', '#e65e5e'],
  'dusk-ball': ['#344c38', '#a4b34e'],
  'heal-ball': ['#e884aa', '#f3d6e6'],
  'quick-ball': ['#e8c83b', '#5fa6d5'],
  'cherish-ball': ['#d94f4f', '#f5c7c7'],
  'park-ball': ['#68a65e', '#e39a8c'],
  'dream-ball': ['#c27ecb', '#f2b8dc'],
  'beast-ball': ['#4167c8', '#48d4ca'],
  'strange-ball': ['#82926a', '#c3b99d'],
  'feather-ball': ['#7c9bc2', '#d7e8ed'],
  'wing-ball': ['#6098c8', '#d6e7ec'],
  'jet-ball': ['#4a91c8', '#c9e5ef'],
  'leaden-ball': ['#737c8c', '#c2c8ce'],
  'gigaton-ball': ['#48566c', '#d1b16d'],
};

interface PokeballBackdropProps {
  ballType: PokeballId;
}

export const PokeballIcon: React.FC<PokeballBackdropProps> = ({ ballType }) => {
  const [topColor, accentColor] = BALL_COLORS[ballType];
  const ballName = POKEBALLS.find((ball) => ball.id === ballType)?.name ?? 'Poké Ball';

  return (
    <svg
      viewBox="0 0 20 20"
      className="inline-block h-4 w-4 shrink-0 align-middle"
      role="img"
      aria-label={ballName}
    >
      <title>{ballName}</title>
      <circle cx="10" cy="10" r="8.25" fill="#e8edf2" />
      <path d="M1.75 10a8.25 8.25 0 0 1 16.5 0z" fill={topColor} />
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="#101827" strokeWidth="1.5" />
      <path d="M1.75 10h16.5" stroke="#101827" strokeWidth="2.5" />
      <circle cx="10" cy="10" r="2.75" fill="#e8edf2" stroke="#101827" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="1.2" fill={accentColor} />
    </svg>
  );
};
