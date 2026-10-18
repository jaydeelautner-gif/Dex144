import type { RegionMap, TerrainFeature, TerrainKind } from '../data/gameMaps';
import { REGION_TERRAIN } from '../data/gameMaps';

// Decorative silhouettes only: pin positions are schematic, not walking tiles.
const shapes:Record<string,string>={
  kanto:'M70 35 780 35 900 130 920 350 780 425 720 565 590 590 530 540 450 480 300 470 300 610 180 625 140 520 165 390 80 280Z',
  johto:'M50 50 900 40 950 270 905 540 770 590 610 565 560 465 380 455 300 540 190 490 125 350 45 290Z',
  hoenn:'M55 35 385 30 470 80 480 210 655 60 710 105 630 250 485 335 495 450 420 560 270 550 235 425 75 430Z M715 220 790 185 835 245 790 300 715 295Z M850 115 930 115 960 200 870 235Z M740 360 830 340 875 420 800 480 735 435Z M875 435 965 430 980 570 905 590Z M75 550 160 565 180 635 95 640Z M535 515 660 505 675 570 540 585Z',
  sinnoh:'M100 80 390 70 450 30 650 25 720 105 860 130 930 270 900 420 970 485 830 580 635 585 510 625 310 600 125 625 70 430 135 245Z',
  unova:'M90 100 335 25 600 25 855 80 970 225 950 490 780 625 560 635 350 600 100 625 55 385Z M350 380 430 330 555 350 600 425 560 620 405 620Z',
  kalos:'M150 60 340 35 540 60 680 135 905 40 965 195 940 400 970 570 810 635 615 590 480 635 330 565 100 620 55 430 125 275 65 160Z',
  galar:'M330 20 660 20 705 100 850 125 900 280 765 380 610 390 605 530 475 635 330 635 280 530 320 400 140 350 140 210 265 120Z',
  hisui:'M100 110 350 70 465 25 665 35 715 130 805 175 945 270 955 455 790 550 610 605 340 625 180 535 70 385Z',
  paldea:'M210 70 415 25 640 35 850 80 965 270 905 465 735 610 480 635 250 610 90 480 55 280Z M435 245 520 215 595 280 565 350 460 355 405 300Z',
  orre:'M85 55 480 20 720 60 920 125 970 380 885 595 570 625 300 580 75 630 35 340Z',
  'isle-armor':'M310 45 650 55 790 95 935 215 865 355 690 485 480 595 285 525 125 370 205 220Z M85 70 165 65 200 130 145 170 75 130Z',
  'crown-tundra':'M300 20 630 35 740 135 715 240 930 260 915 430 660 525 570 630 325 590 135 535 155 340 290 230Z',
  kitakami:'M420 30 665 50 740 135 915 125 930 330 850 490 685 610 440 625 230 600 90 470 120 245 295 160Z',
  blueberry:'M150 55 H850 Q940 55 940 145 V520 Q940 610 850 610 H150 Q60 610 60 520 V145 Q60 55 150 55Z',
};
const FILL:Record<TerrainKind,{fill:string;stroke:string;opacity:number}>={
  water:{fill:'#0369a1',stroke:'#38bdf8',opacity:0.55},
  mountain:{fill:'#57534e',stroke:'#a8a29e',opacity:0.6},
  forest:{fill:'#166534',stroke:'#4ade80',opacity:0.5},
  desert:{fill:'#a16207',stroke:'#fbbf24',opacity:0.45},
  snow:{fill:'#e2e8f0',stroke:'#f8fafc',opacity:0.35},
  urban:{fill:'#94a3b8',stroke:'#e2e8f0',opacity:0.22},
};
function Feature({feature,region}:{feature:TerrainFeature;region:RegionMap}){
  const style=FILL[feature.kind];
  const path=feature.points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ')+(feature.kind==='water'?'Z':'');
  return <g>
    <path d={path} fill={style.fill} fillOpacity={style.opacity} stroke={style.stroke} strokeOpacity="0.45" strokeWidth="2" strokeLinejoin="round" />
    {feature.label && feature.points.length>=3 && (()=>{const [x,y]=feature.points[Math.floor(feature.points.length/2)];return <text x={x} y={y} textAnchor="middle" fill="#e2e8f0" stroke={region.color} strokeWidth="3" paintOrder="stroke" fontSize="11" fontStyle="italic" opacity="0.85">{feature.label}</text>;})()}
  </g>;
}
export function RegionTerrain({region}:{region:RegionMap}){
  const islands=region.id==='alola'?[[220,180,180,145],[650,190,200,140],[820,455,160,155],[260,515,150,120],[475,375,80,55]]:
    region.id==='sevii'?[[175,155,90,110],[420,150,75,70],[700,170,140,75],[225,370,90,110],[485,390,100,75],[760,390,100,100],[475,550,90,65],[850,560,50,40]]:
    region.islands && region.id!=='isle-armor'?[[220,200,180,130],[650,180,180,130],[760,480,180,130],[260,510,180,130]]:null;
  const features=REGION_TERRAIN[region.id]??[];
  return <g>
    {islands
      ? islands.map(([x,y,rx,ry],i)=><ellipse key={`land-${i}`} cx={x} cy={y} rx={rx} ry={ry} fill={region.color} fillOpacity="0.22" stroke={region.color} strokeOpacity="0.45" strokeWidth="3" />)
      : <path d={shapes[region.id]??'M100 80 300 30 700 35 910 100 960 290 900 560 680 615 320 620 90 560 45 310Z'} fill={region.color} fillOpacity="0.22" stroke={region.color} strokeOpacity="0.45" strokeWidth="3" />}
    {features.map((feature,i)=><Feature key={i} feature={feature} region={region} />)}
    {region.id==='blueberry' && <path d="M500 60 V610 M60 330 H940" fill="none" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="3" strokeDasharray="10 8" />}
  </g>;
}
