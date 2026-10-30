import { describe, expect, it } from "vitest";
import { LIGHT_SPEED_KM_S, equatorialToGalactic, illuminatedFraction, lightTravelSeconds } from "./discovery";
import { planetarySystems } from "../data/systems";

describe("light-travel geometry", () => {
  it("matches JPL's published one-au one-way light time", () => {
    expect(LIGHT_SPEED_KM_S).toBe(299792.458);
    expect(lightTravelSeconds(149.5978707)).toBeCloseTo(499.004783836, 8);
    expect(lightTravelSeconds(0)).toBe(0);
  });
  it("scales linearly with distance and uses seconds rather than simulation days", () => {
    expect(lightTravelSeconds(2 * 149.5978707)).toBeCloseTo(2 * lightTravelSeconds(149.5978707), 10);
    expect(lightTravelSeconds(4495.1)).toBeGreaterThan(4 * 3600);
    expect(lightTravelSeconds(4495.1)).toBeLessThan(4.5 * 3600);
  });
  it.each([-1, Infinity, -Infinity, NaN])("rejects invalid light distance %s", value => {
    expect(() => lightTravelSeconds(value)).toThrow(RangeError);
  });
});

describe("ideal lunar illumination", () => {
  it("distinguishes new Moon, both quarters and full Moon", () => {
    expect(illuminatedFraction(0)).toBe(0);
    expect(illuminatedFraction(Math.PI / 2)).toBeCloseTo(0.5, 14);
    expect(illuminatedFraction(Math.PI)).toBe(1);
    expect(illuminatedFraction(3 * Math.PI / 2)).toBeCloseTo(0.5, 14);
  });
  it("is periodic and bounded, including reversed orbits and multiple turns", () => {
    for (const angle of [-11, -Math.PI, -0.3, 0, 0.75, Math.PI, 13]) {
      expect(illuminatedFraction(angle)).toBeGreaterThanOrEqual(0);
      expect(illuminatedFraction(angle)).toBeLessThanOrEqual(1);
      expect(illuminatedFraction(angle + 2 * Math.PI)).toBeCloseTo(illuminatedFraction(angle), 14);
      expect(illuminatedFraction(-angle)).toBeCloseTo(illuminatedFraction(angle), 14);
    }
  });
  it.each([Infinity, -Infinity, NaN])("rejects invalid phase angle %s", value => {
    expect(() => illuminatedFraction(value)).toThrow(RangeError);
  });
});

describe("catalogue placement in Galactic coordinates", () => {
  it("maps the defining north Galactic pole to the positive z axis", () => {
    const p = equatorialToGalactic(192.85948, 27.12825, 100);
    expect(p.x).toBeCloseTo(0, 10);
    expect(p.y).toBeCloseTo(0, 10);
    expect(p.z).toBeCloseTo(100, 10);
  });
  it("places the approximate ICRS Galactic centre on the positive x axis", () => {
    // Hipparcos l=0,b=0 direction, rounded to 6 decimals in degrees.
    const p = equatorialToGalactic(266.404995, -28.936174, 100);
    expect(p.x).toBeCloseTo(100, 5);
    expect(p.y).toBeCloseTo(0, 4);
    expect(p.z).toBeCloseTo(0, 4);
  });
  it("preserves measured distances for every available planetary system", () => {
    for (const system of planetarySystems) {
      const p = equatorialToGalactic(system.ra, system.dec, system.distanceLightYears);
      expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(system.distanceLightYears, 9);
    }
  });
  it("matches the independently catalogued Galactic direction of Kepler-90", () => {
    const kepler = planetarySystems.find(s => s.id === "kepler-90")!;
    const p = equatorialToGalactic(kepler.ra, kepler.dec, kepler.distanceLightYears);
    const longitude = Math.atan2(p.y, p.x) * 180 / Math.PI;
    const latitude = Math.atan2(p.z, Math.hypot(p.x, p.y)) * 180 / Math.PI;
    // The two catalogues use slightly different astrometric source positions;
    // 0.0001 degree (~0.36 arcsec) tests the direction without false precision.
    expect(Math.abs(longitude - 79.2694904)).toBeLessThan(0.0001);
    expect(Math.abs(latitude - 19.2556547)).toBeLessThan(0.0001);
  });
  it("accepts wrapped RA and the Sun's zero-distance origin without inventing a direction", () => {
    const p = equatorialToGalactic(346.6263919, -5.0434618, 40.54);
    const wrapped = equatorialToGalactic(-13.3736081, -5.0434618, 40.54);
    expect(wrapped.x).toBeCloseTo(p.x, 12);
    expect(wrapped.y).toBeCloseTo(p.y, 12);
    expect(wrapped.z).toBeCloseTo(p.z, 12);
    expect(equatorialToGalactic(0, 0, 0)).toEqual({ x: 0, y: 0, z: 0 });
  });
  it("rejects nonfinite coordinates, impossible declinations and negative distances", () => {
    for (const values of [[NaN, 0, 1], [Infinity, 0, 1], [0, NaN, 1], [0, 90.01, 1], [0, -91, 1], [0, 0, -1], [0, 0, Infinity]]) {
      expect(() => equatorialToGalactic(...values as [number, number, number])).toThrow(RangeError);
    }
  });
});
