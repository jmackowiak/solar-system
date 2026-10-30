import { describe, expect, it } from "vitest";
import { bodies } from "./bodies";
import { getMoon, getMoons, moonParentById } from "./moons";
import { orbitalPosition } from "../lib/simulation";

describe("selected natural satellites", () => {
  it("provides exactly the six requested moons with correct parents", () => {
    const moons = getMoons("en");
    expect(moons.map((moon) => moon.id)).toEqual([
      "moon", "io", "europa", "ganymede", "callisto", "titan",
    ]);
    expect(moons.map((moon) => moon.parentId)).toEqual([
      "earth", "jupiter", "jupiter", "jupiter", "jupiter", "saturn",
    ]);
    expect(new Set(moons.map((moon) => moon.id)).size).toBe(6);
    for (const moon of moons) {
      expect(moonParentById[moon.id]).toBe(moon.parentId);
      expect(bodies.some((body) => body.id === moon.parentId)).toBe(true);
    }
    expect(getMoon("earth", "en")).toBeUndefined();
    expect(moonParentById["sun"]).toBeUndefined();
  });

  it("orders the Galilean moons by actual distance and period, independently of display scale", () => {
    const jovian = getMoons("en").filter((moon) => moon.parentId === "jupiter");
    expect(jovian.map((moon) => moon.id)).toEqual([
      "io", "europa", "ganymede", "callisto",
    ]);
    for (let i = 1; i < jovian.length; i++) {
      expect(jovian[i].distanceFromParentKm).toBeGreaterThan(jovian[i - 1].distanceFromParentKm);
      expect(jovian[i].orbitalPeriodDays).toBeGreaterThan(jovian[i - 1].orbitalPeriodDays!);
      expect(jovian[i].orbitRadius).toBeGreaterThan(jovian[i - 1].orbitRadius);
    }
  });

  it("keeps parent distances separate from Sun distances and uses synchronous orbital periods", () => {
    const moon = getMoon("moon", "en")!;
    const titan = getMoon("titan", "en")!;
    expect(moon.distanceFromParentKm).toBe(384400);
    expect(moon.orbitalPeriodDays).toBeCloseTo(27.3217, 4);
    expect(moon.orbitalPeriodDays).not.toBeCloseTo(29.53, 1);
    expect(titan.distanceFromParentKm).toBe(1221870);
    expect(titan.orbitalPeriodDays).toBeCloseTo(15.945421, 6);
    for (const satellite of getMoons("en")) {
      expect(satellite.distanceMillionKm).toBeNull();
      expect(satellite.rotationPeriodDays).toBe(satellite.orbitalPeriodDays);
      expect(satellite.eccentricity).toBe(0);
    }
  });

  it("has finite physically plausible measurements and unclipped local display orbits", () => {
    for (const moon of getMoons("en")) {
      expect(moon.diameterKm).toBeGreaterThan(3000);
      expect(moon.diameterKm).toBeLessThan(5300);
      expect(moon.distanceFromParentKm).toBeGreaterThan(300000);
      expect(moon.distanceFromParentKm).toBeLessThan(2000000);
      expect(moon.orbitalPeriodDays).toBeGreaterThan(1);
      expect(moon.orbitalPeriodDays).toBeLessThan(28);
      const parent = bodies.find((body) => body.id === moon.parentId)!;
      expect(moon.orbitRadius).toBeGreaterThan(parent.displayRadius + moon.displayRadius);
      for (const value of [moon.phase, moon.displayRadius, moon.orbitRadius]) {
        expect(Number.isFinite(value)).toBe(true);
      }
      if (moon.id === "titan") {
        expect(moon.orbitRadius - moon.displayRadius).toBeGreaterThan(parent.displayRadius * 2.3);
      }
    }
    expect(getMoon("ganymede", "en")!.diameterKm).toBeGreaterThan(getMoon("titan", "en")!.diameterKm);
  });

  it("repeats each parent-relative orbit after its actual period", () => {
    for (const moon of getMoons("en")) {
      const initial = orbitalPosition(moon, 0);
      orbitalPosition(moon, moon.orbitalPeriodDays!).forEach((value, index) => {
        expect(value).toBeCloseTo(initial[index], 10);
      });
      expect(Math.hypot(...initial)).toBeCloseTo(moon.orbitRadius, 10);
      expect(orbitalPosition(moon, moon.orbitalPeriodDays! / 4).every(Number.isFinite)).toBe(true);
    }
  });

  it("localises descriptions while preserving all numeric measurements and source provenance", () => {
    const en = getMoons("en"), pl = getMoons("pl");
    expect(getMoon("moon", "pl")!.name).toBe("Księżyc");
    expect(getMoon("ganymede", "pl")!.name).toBe("Ganimedes");
    for (let i = 0; i < en.length; i++) {
      expect(en[i].id).toBe(pl[i].id);
      expect(en[i].description).not.toBe(pl[i].description);
      expect(en[i].fact).not.toBe(pl[i].fact);
      expect(en[i].kind).not.toBe(pl[i].kind);
      expect(en[i].diameterKm).toBe(pl[i].diameterKm);
      expect(en[i].distanceFromParentKm).toBe(pl[i].distanceFromParentKm);
      expect(en[i].orbitalPeriodDays).toBe(pl[i].orbitalPeriodDays);
      expect(en[i].dataSources.length).toBeGreaterThanOrEqual(3);
      for (const source of [...en[i].dataSources, en[i].source]) {
        const url = new URL(source);
        expect(url.protocol).toBe("https:");
        expect(url.hostname.endsWith(".nasa.gov")).toBe(true);
      }
    }
    en[0].name = "UI mutation";
    expect(getMoon("moon", "en")!.name).toBe("Moon");
    expect(getMoon("moon", "en")!.dataSources).not.toBe(en[0].dataSources);
  });
});
