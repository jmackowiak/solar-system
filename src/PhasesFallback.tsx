import type {Language} from "./i18n";
export default function PhasesFallback({angle,scenario,language}:{angle:number;scenario:"phases"|"solar"|"lunar";language:Language}){
 const a=angle*Math.PI/180,x=-5*Math.cos(a),y=-5*Math.sin(a),r=3475/12742,en=language==="en";
 const sx=scenario==="solar"?x:0,sy=scenario==="solar"?y:0,sr=scenario==="solar"?r:1,len=scenario==="solar"?6.5:9.5;
 return <div className="phases-fallback" role="img" aria-label={en?"Earth and Moon orbital diagram in 2D":"Schemat orbity Ziemi i Księżyca w 2D"}>
 <svg viewBox="-9 -6 20 12" aria-hidden="true"><circle r="5" fill="none" stroke="#738d9c66" strokeWidth=".025"/>
 {[-2,0,2].map(v=><path key={v} d={`M -8 ${v} H -2.2 l -.35 -.2 m .35 .2 l -.35 .2`} fill="none" stroke="#d5bb8d77" strokeWidth=".03"/>)}
 {scenario!=="phases"&&<path d={`M ${sx} ${sy-sr} L ${sx+len} ${sy} L ${sx} ${sy+sr} Z`} fill="#667a9460"/>}
 <circle r="1" fill="#426c8a"/><path d="M 0 -1 A 1 1 0 0 0 0 1 Z" fill="#86a9b1"/>
 <circle cx={x} cy={y} r={r} fill="#4c555d"/><path d={`M ${x} ${y-r} A ${r} ${r} 0 0 0 ${x} ${y+r} Z`} fill="#c6c1b4"/>
 <text x="0" y="1.6" textAnchor="middle" fill="#c6d1d8" fontSize=".35">{en?"Earth":"Ziemia"}</text><text x={x} y={y+.8} textAnchor="middle" fill="#c6d1d8" fontSize=".35">{en?"Moon":"Księżyc"}</text>
 </svg><p>{en?"Orbital diagram · view from above · distances illustrative":"Schemat orbity · widok z góry · umowne odległości"}</p></div>;
}
