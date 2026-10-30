import { describe, expect, it } from 'vitest';
import { getSystemBodies } from '../data/systems';
import { getMoons } from '../data/moons';
import { orbitalPosition } from './simulation';
import { worldPosition } from './world-position';
describe('satellite coordinates', () => {
 it('keeps the Moon at its local orbital distance from a moving Earth', () => {
  const planets=getSystemBodies('solar','en'),moon=getMoons('en')[0],earth=planets.find(b=>b.id==='earth')!;
  for(const days of [0,7,100,365.2]){
   const a=worldPosition(moon,days,planets),b=orbitalPosition(earth,days);
   expect(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])).toBeCloseTo(moon.orbitRadius,9);
  }
 });
 it('preserves heliocentric planetary coordinates and rejects a missing parent',()=>{
  const planets=getSystemBodies('solar','en');
  expect(worldPosition(planets[3],50,planets)).toEqual(orbitalPosition(planets[3],50));
  expect(()=>worldPosition(getMoons('en')[0],0,[])).toThrow(/parent/);
 });
});
