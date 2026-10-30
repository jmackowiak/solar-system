import { describe, it, expect } from "vitest";
import {
  advance,
  control,
  initialSimulation,
  orbitPoint,
  orbitalPosition,
} from "./simulation";
import { bodies } from "../data/bodies";
const orbit = { orbitRadius: 14, phase: 0, orbitalPeriodDays: 365.25 };
describe("simulation", () => {
  it("returns quarter orbit and repeats after a complete year", () => {
    expect(orbitalPosition(orbit, 365.25 / 4)[2]).toBeCloseTo(14);
    expect(orbitalPosition(orbit, 365.25)[0]).toBeCloseTo(14);
  });
  it("is independent of frame subdivision", () => {
    let s = initialSimulation();
    for (let i = 0; i < 600; i++) s = advance(s, 1 / 60);
    const whole = advance(initialSimulation(), 10);
    expect(s.days).toBeCloseTo(whole.days, 9);
    orbitalPosition(orbit, s.days).forEach((v, i) =>
      expect(v).toBeCloseTo(orbitalPosition(orbit, whole.days)[i], 9),
    );
  });
  it("pauses, resumes, changes speed without rewriting past time, and resets", () => {
    let s = advance(initialSimulation(), 2);
    s = control(s, { type: "pause" });
    expect(advance(s, 100).days).toBe(16);
    s = control(s, { type: "speed", value: 24 });
    s = advance(control(s, { type: "resume" }), 2);
    expect(s.days).toBe(64);
    expect(control(s, { type: "reset" })).toEqual(initialSimulation());
    expect(control(s, { type: "reset", reduced: true }).paused).toBe(true);
  });
  it("rejects invalid inputs and leaves the Sun stationary", () => {
    expect(() => advance(initialSimulation(), NaN)).toThrow();
    expect(() =>
      control(initialSimulation(), { type: "speed", value: -1 }),
    ).toThrow();
    expect(orbitalPosition({ ...orbit, orbitRadius: 0 }, 100)).toEqual([
      0, 0, 0,
    ]);
  });
  it("resets to an explicit system-specific speed and preserves numerical orbital timing", () => {
    const shortOrbit = { orbitRadius: 7, phase: 0.3, orbitalPeriodDays: 1.510826 };
    const start = initialSimulation(false, 0.25);
    let subdivided = start;
    for (let i = 0; i < 480; i++) subdivided = advance(subdivided, 1 / 60);
    const whole = advance(start, 8);
    orbitalPosition(shortOrbit, subdivided.days).forEach((v, i) =>
      expect(v).toBeCloseTo(orbitalPosition(shortOrbit, whole.days)[i], 9),
    );
    expect(control(whole, { type: "reset", speed: 0.25, reduced: true }))
      .toEqual({ days: 0, speed: 0.25, paused: true });
  });
});

describe("elliptical orbits", () => {
  const ellipse = {
    orbitRadius: 10, phase: 0, orbitalPeriodDays: 100,
    eccentricity: 0.6, periapsisAngle: 0,
  };
  const distance = (a: number[], b: number[]) =>
    Math.hypot(...a.map((value, i) => value - b[i]));

  it("places perihelion and aphelion at a(1−e) and a(1+e), with the star at a focus", () => {
    const perihelion = orbitalPosition(ellipse, 0);
    const aphelion = orbitalPosition(ellipse, 50);
    expect(perihelion[0]).toBeCloseTo(4, 11);
    expect(aphelion[0]).toBeCloseTo(-16, 11);
    expect(perihelion[2]).toBeCloseTo(0, 11);
    expect(aphelion[2]).toBeCloseTo(0, 11);
    expect((perihelion[0] + aphelion[0]) / 2).toBeCloseTo(-6, 11);
    orbitPoint(ellipse, Math.PI / 2).forEach((value, i) => {
      expect(value).toBeCloseTo([-6, 0, 8][i], 11);
    });
  });

  it("uses the same rotated ellipse for the visible path and timed planet position", () => {
    const rotated = { ...ellipse, periapsisAngle: Math.PI / 2 };
    const perihelion = orbitalPosition(rotated, 0);
    expect(perihelion[0]).toBeCloseTo(0, 11);
    expect(perihelion[2]).toBeCloseTo(4, 11);
    const eccentric = 1.37;
    const mean = eccentric - ellipse.eccentricity * Math.sin(eccentric);
    const days = mean / (Math.PI * 2) * ellipse.orbitalPeriodDays;
    orbitalPosition(rotated, days).forEach((value, i) => {
      expect(value).toBeCloseTo(orbitPoint(rotated, eccentric)[i], 10);
    });
  });

  it("travels farther and sweeps a larger angle near perihelion in equal time", () => {
    const step = ellipse.orbitalPeriodDays / 2000;
    const near = orbitalPosition(ellipse, 0);
    const nearNext = orbitalPosition(ellipse, step);
    const far = orbitalPosition(ellipse, 50);
    const farNext = orbitalPosition(ellipse, 50 + step);
    expect(distance(near, nearNext)).toBeGreaterThan(distance(far, farNext) * 3.9);
    const angle = (a: number[], b: number[]) =>
      Math.atan2(a[0] * b[2] - a[2] * b[0], a[0] * b[0] + a[2] * b[2]);
    expect(angle(near, nearNext)).toBeGreaterThan(angle(far, farNext) * 15);
  });

  it("repeats every orbital period and remains independent of frame subdivision for all eight planets", () => {
    let subdivided = initialSimulation();
    for (let i = 0; i < 600; i++) subdivided = advance(subdivided, 1 / 60);
    const whole = advance(initialSimulation(), 10);
    for (const body of bodies.slice(1)) {
      expect(body.eccentricity).toBeGreaterThan(0);
      const start = orbitalPosition(body, whole.days);
      orbitalPosition(body, whole.days + body.orbitalPeriodDays!).forEach((value, i) => {
        expect(value).toBeCloseTo(start[i], 9);
      });
      orbitalPosition(body, subdivided.days).forEach((value, i) => {
        expect(value).toBeCloseTo(start[i], 9);
      });
    }
  });

  it("preserves the circular approximation when no shape parameters were supplied", () => {
    for (const days of [-1000, -3, 0, 4, 1000]) {
      const circular = { ...orbit, phase: -0.7 };
      const angle = circular.phase + days / circular.orbitalPeriodDays * Math.PI * 2;
      const position = orbitalPosition(circular, days);
      expect(position[0]).toBeCloseTo(Math.cos(angle) * circular.orbitRadius, 10);
      expect(position[2]).toBeCloseTo(Math.sin(angle) * circular.orbitRadius, 10);
    }
  });

  it("normalises very large and negative time/angles while keeping finite bounded positions", () => {
    for (const days of [-1e300, -1e12, 1e12, 1e300]) {
      const position = orbitalPosition({ ...ellipse, phase: 1e20 }, days);
      expect(position.every(Number.isFinite)).toBe(true);
      expect(Math.hypot(...position)).toBeGreaterThanOrEqual(4 - 1e-10);
      expect(Math.hypot(...position)).toBeLessThanOrEqual(16 + 1e-10);
    }
    for (const angle of [-1e200, 1e200]) {
      expect(orbitPoint(ellipse, angle).every(Number.isFinite)).toBe(true);
    }
    expect(orbitalPosition(ellipse, -10)).toEqual(orbitalPosition(ellipse, 90));
    // A highly elliptical future data point must also terminate with a valid solution.
    const extreme = { ...ellipse, eccentricity: 0.99999999, phase: 1e-8 };
    const position = orbitalPosition(extreme, 0);
    const eccentric = Math.atan2(
      position[2] / (10 * Math.sqrt(1 - extreme.eccentricity ** 2)),
      position[0] / 10 + extreme.eccentricity,
    );
    expect(eccentric - extreme.eccentricity * Math.sin(eccentric)).toBeCloseTo(1e-8, 11);
  });

  it("rejects invalid elliptical parameters instead of producing NaN coordinates", () => {
    for (const eccentricity of [-0.1, 1, NaN, Infinity]) {
      expect(() => orbitalPosition({ ...ellipse, eccentricity }, 0)).toThrow(RangeError);
    }
    expect(() => orbitalPosition(ellipse, Infinity)).toThrow(RangeError);
    expect(() => orbitPoint(ellipse, NaN)).toThrow(RangeError);
    expect(() => orbitalPosition({ ...ellipse, phase: Infinity }, 0)).toThrow(RangeError);
  });
});
