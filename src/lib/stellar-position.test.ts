import {expect,it} from "vitest";
import {planetarySystems} from "../data/systems";
import {solarPosition} from "./galaxy";
import {stellarOffset,galacticSystemPosition} from "./stellar-position";
it("preserves all catalogue distances in both views and keeps the Sun at the origin",()=>{
 for(const s of planetarySystems){
  const p=stellarOffset(s.ra,s.dec,s.distanceLightYears,100);
  expect(Math.hypot(...p)*100).toBeCloseTo(s.distanceLightYears,8);
  const g=galacticSystemPosition(s);
  expect(Math.hypot(g[0]-solarPosition[0],g[1],g[2]-solarPosition[2])*1000).toBeCloseTo(s.distanceLightYears,8);
 }
 expect(galacticSystemPosition(planetarySystems[0])).toEqual([...solarPosition]);
});
it("rejects a zero or invalid map scale",()=>{
 for(const scale of [0,-1,Infinity,NaN]) expect(()=>stellarOffset(0,0,1,scale)).toThrow(RangeError);
});
