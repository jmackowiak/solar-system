import {useEffect,useState,type RefObject} from "react";
import type {Body} from "./data/bodies";
import type {Language} from "./i18n";
import {lightArrivalSeconds,type LightClock} from "./lib/light-clock";
export default function LightFallback({clock,bodies,target,language}:{clock:RefObject<LightClock>;bodies:readonly Body[];target:string;language:Language}) {
 const [seconds,setSeconds]=useState(clock.current.seconds);
 useEffect(()=>{const id=setInterval(()=>setSeconds(clock.current.seconds),100);return()=>clearInterval(id);},[clock]);
 const body=bodies.find(b=>b.id===target)!;
 const arrival=lightArrivalSeconds(body.distanceMillionKm!);
 const progress=Math.min(seconds/arrival,1);
 return <div className="light-fallback" role="img" aria-label={language==="en"?`Light from Sun to ${body.name}`:`Światło od Słońca do ${body.name}`}>
  <div className="light-fallback-label"><span>{language==="en"?"Sun":"Słońce"}</span><span>{body.name}</span></div>
  <svg viewBox="0 0 600 120" aria-hidden="true"><line x1="30" y1="60" x2="570" y2="60" stroke="#738392" strokeWidth="1"/><line x1="30" y1="60" x2={30+540*progress} y2="60" stroke="#e8be87" strokeWidth="3"/><circle cx="30" cy="60" r="13" fill="#efbc74"/><circle cx="570" cy="60" r="9" fill={body.color}/><circle cx={30+540*progress} cy="60" r="5" fill="#fff0bc"/></svg>
  <p>{language==="en"?"2D light path · distance normalized to the selected destination":"Tor światła 2D · odległość znormalizowana do wybranego celu"}</p>
 </div>;
}
