import { equatorialToGalactic } from "./discovery";
import { solarPosition } from "./galaxy";
import type { PlanetarySystem } from "../data/systems";
const r=Math.hypot(solarPosition[0],solarPosition[2]);
const u=solarPosition[0]/r, v=solarPosition[2]/r;
/** Right-handed Galactic basis: x inward, y Galactic rotation, z north/up. */
export function stellarOffset(ra:number,dec:number,distanceLy:number,lightYearsPerUnit:number):[number,number,number]{
 if(!Number.isFinite(lightYearsPerUnit)||lightYearsPerUnit<=0) throw new RangeError("Scale must be positive");
 const g=equatorialToGalactic(ra,dec,distanceLy);
 return [(-u*g.x-v*g.y)/lightYearsPerUnit,g.z/lightYearsPerUnit,(-v*g.x+u*g.y)/lightYearsPerUnit];
}
export function galacticSystemPosition(system:PlanetarySystem):[number,number,number]{
 const p=stellarOffset(system.ra,system.dec,system.distanceLightYears,1000);
 return [solarPosition[0]+p[0],p[1],solarPosition[2]+p[2]];
}
