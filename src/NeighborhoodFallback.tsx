import {planetarySystems} from "./data/systems";
import {stellarOffset} from "./lib/stellar-position";
import type {Language} from "./i18n";
/** Orthographic Galactic-plane projection; text catalogue retains height/distance information. */
export default function NeighborhoodFallback({range,language}:{range:100|3000;language:Language}){
 const en=language==="en", radius=range/100;
 return <div className="neighborhood-fallback" role="img" aria-label={en?"Galactic plane projection in 2D":"Rzut na płaszczyznę Galaktyki w 2D"}>
  <svg viewBox="0 0 600 360" aria-hidden="true"><ellipse cx="300" cy="180" rx="245" ry="145" fill="#12242d22" stroke="#7894a344"/>
   {planetarySystems.filter(s=>s.distanceLightYears<=range).map(s=>{const p=stellarOffset(s.ra,s.dec,s.distanceLightYears,100);const x=300+p[0]/radius*245,y=180+p[2]/radius*145;return <g key={s.id}><circle cx={x} cy={y} r="4" fill={s.starColor}/><line x1="300" y1="180" x2={x} y2={y} stroke="#889ba444"/></g>;})}
  </svg>
  <p>{en?"2D projection · use the catalogue to visit a system":"Rzut 2D · wybierz układ z katalogu"}</p>
 </div>;
}
