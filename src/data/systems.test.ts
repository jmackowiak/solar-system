import { describe, expect, it } from "vitest";
import { bodies } from "./bodies";
import {
  AU_MILLION_KM,
  EARTH_RADIUS_KM,
  SOLAR_RADIUS_KM,
  exoplanetSnapshot,
  getSystemBodies,
  planetarySystems,
  stellarSnapshot,
  systemById,
} from "./systems";
import type { SystemId } from "./systems";

const expectedOrders = {
  "trappist-1": ["b", "c", "d", "e", "f", "g", "h"],
  "kepler-90": ["b", "c", "i", "d", "e", "f", "g", "h"],
  "toi-700": ["b", "c", "e", "d"],
} as const;

describe("planetary system snapshot", () => {
  it.each(Object.entries(expectedOrders))(
    "%s retains the confirmed planets in physical orbital order",
    (id, letters) => {
      const all = getSystemBodies(id as SystemId, "en");
      const planets = all.slice(1);
      expect(all[0].id).toBe(id);
      expect(all[0].orbitRadius).toBe(0);
      expect(all[0].orbitalPeriodDays).toBeNull();
      expect(planets.map((body) => body.id)).toEqual(
        letters.map((letter) => `${id}-${letter}`),
      );
      for (let i = 1; i < planets.length; i++) {
        expect(planets[i].distanceMillionKm).toBeGreaterThan(
          planets[i - 1].distanceMillionKm!,
        );
        expect(planets[i].orbitalPeriodDays).toBeGreaterThan(
          planets[i - 1].orbitalPeriodDays!,
        );
        expect(planets[i].orbitRadius).toBeGreaterThan(
          planets[i - 1].orbitRadius,
        );
      }
    },
  );

  it("converts the archived radius and semi-major axis without replacing missing uncertainties", () => {
    const measurement = exoplanetSnapshot.find(
      (planet) => planet.system === "toi-700" && planet.letter === "e",
    )!;
    const planet = getSystemBodies("toi-700", "en").find(
      (body) => body.id === "toi-700-e",
    )!;
    // Pass et al. 2026 replaced the older 0.953 Earth-radius estimate.
    expect(measurement.radiusEarth).toBe(0.919);
    expect(planet.diameterKm).toBe(
      Math.round(2 * EARTH_RADIUS_KM * 0.919),
    );
    expect(planet.distanceMillionKm).toBeCloseTo(
      0.1336 * AU_MILLION_KM,
      9,
    );
    expect(planet.orbitalPeriodDays).toBe(27.810124);
    expect(
      exoplanetSnapshot.find((row) => row.archiveName === "Kepler-90 i")!
        .semiMajorError,
    ).toEqual([null, null]);
  });

  it("uses measured stellar radii and explicitly omits unsupported axial periods", () => {
    for (const id of Object.keys(expectedOrders) as (keyof typeof expectedOrders)[]) {
      const all = getSystemBodies(id, "en");
      expect(all[0].diameterKm).toBe(
        Math.round(stellarSnapshot[id].radiusSolar * SOLAR_RADIUS_KM * 2),
      );
      for (const body of all) expect(body.rotationPeriodDays).toBe(0);
    }
  });

  it("keeps usable finite scientific and visual values for all systems", () => {
    const ids = new Set<string>();
    for (const system of planetarySystems) {
      expect(systemById[system.id]).toBe(system);
      expect(Number.isFinite(system.distanceLightYears)).toBe(true);
      expect(system.ra).toBeGreaterThanOrEqual(0);
      expect(system.ra).toBeLessThan(360);
      expect(Math.abs(system.dec)).toBeLessThanOrEqual(90);
      if (system.id !== "solar") {
        expect(system.distanceLightYears).toBeGreaterThan(0);
      }
      for (const body of getSystemBodies(system.id, "en")) {
        expect(ids.has(body.id)).toBe(false);
        ids.add(body.id);
        for (const number of [
          body.diameterKm, body.displayRadius, body.orbitRadius,
          body.phase, body.rotationPeriodDays,
        ]) expect(Number.isFinite(number)).toBe(true);
        expect(body.diameterKm).toBeGreaterThan(0);
        if (body.orbitRadius > 0) {
          expect(body.orbitalPeriodDays).toBeGreaterThan(0);
          expect(body.distanceMillionKm).toBeGreaterThan(0);
        }
        expect(body.source.startsWith("https://")).toBe(true);
        expect(body.dataSources.length).toBeGreaterThan(0);
        for (const source of body.dataSources) {
          expect(source.startsWith("https://")).toBe(true);
        }
      }
    }
  });

  it("provides both languages without mutating the original solar or scientific data", () => {
    const snapshotBefore = JSON.stringify(exoplanetSnapshot);
    const originalSun = { ...bodies[0] };
    for (const system of planetarySystems) {
      const en = getSystemBodies(system.id, "en");
      const pl = getSystemBodies(system.id, "pl");
      expect(en.map((body) => body.id)).toEqual(pl.map((body) => body.id));
      expect(system.copy.en.description).not.toBe(system.copy.pl.description);
      for (let i = 0; i < en.length; i++) {
        expect(en[i].description).not.toBe(pl[i].description);
        expect(en[i].fact).not.toBe(pl[i].fact);
        expect(en[i].diameterKm).toBe(pl[i].diameterKm);
        expect(en[i].orbitalPeriodDays).toBe(pl[i].orbitalPeriodDays);
        expect(en[i].distanceMillionKm).toBe(pl[i].distanceMillionKm);
      }
      en[0].name = "changed in UI";
      expect(getSystemBodies(system.id, "en")[0].name).not.toBe("changed in UI");
    }
    expect(bodies[0]).toEqual(originalSun);
    expect(getSystemBodies("solar", "pl")[0].name).toBe("Słońce");
    expect(getSystemBodies("solar", "en")[0].name).toBe("Sun");
    expect(JSON.stringify(exoplanetSnapshot)).toBe(snapshotBefore);
  });
});
