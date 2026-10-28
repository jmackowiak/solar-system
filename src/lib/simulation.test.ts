import { describe, it, expect } from "vitest";
import {
  advance,
  control,
  initialSimulation,
  orbitalPosition,
} from "./simulation";
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
});
