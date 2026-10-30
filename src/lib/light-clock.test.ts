import { describe, expect, it } from "vitest";
import { bodies } from "../data/bodies";
import { advanceLight, LIGHT_SPEED_KM_S, lightArrivalSeconds, MAX_LIGHT_SECONDS, resetLight } from "./light-clock";
import type { LightClock } from "./light-clock";

const initial = (): LightClock => ({ seconds: 0, playing: true, speed: 60 });

describe("light travel", () => {
  it("uses exact vacuum light speed and about 499 seconds to Earth", () => {
    expect(LIGHT_SPEED_KM_S).toBe(299_792.458);
    expect(lightArrivalSeconds(149.6)).toBeCloseTo(499.011886, 5);
    expect(lightArrivalSeconds(0)).toBe(0);
    expect(MAX_LIGHT_SECONDS).toBe(lightArrivalSeconds(bodies.find(body => body.id === "neptune")!.distanceMillionKm!));
  });
  it("gives the same light distance independent of frame subdivision", () => {
    const divided = initial(), whole = initial();
    for (let i = 0; i < 600; i++) advanceLight(divided, 1 / 60);
    advanceLight(whole, 10);
    expect(divided.seconds).toBeCloseTo(whole.seconds, 9);
    expect(divided.seconds * LIGHT_SPEED_KM_S).toBeCloseTo(whole.seconds * LIGHT_SPEED_KM_S, 4);
  });
  it("pauses, resumes and changes rate without rewriting elapsed light time", () => {
    const clock = initial();
    advanceLight(clock, 2);
    clock.playing = false;
    advanceLight(clock, 10);
    expect(clock.seconds).toBe(120);
    clock.speed = 600;
    clock.playing = true;
    advanceLight(clock, 2);
    expect(clock.seconds).toBe(1320);
  });
  it("clamps at Neptune and stops, including a single long frame", () => {
    const clock = initial();
    advanceLight(clock, 100_000);
    expect(clock).toEqual({ seconds: MAX_LIGHT_SECONDS, playing: false, speed: 60 });
    advanceLight(clock, 100_000);
    expect(clock.seconds).toBe(MAX_LIGHT_SECONDS);
  });
  it("resets emission and pauses while preserving the chosen rate", () => {
    const clock = { seconds: 500, playing: true, speed: 600 };
    expect(resetLight(clock)).toBe(clock);
    expect(clock).toEqual({ seconds: 0, playing: false, speed: 600 });
  });
  it("ignores non-positive deltas without making time run backwards", () => {
    const clock = initial();
    clock.seconds = 300;
    advanceLight(clock, -1);
    advanceLight(clock, 0);
    expect(clock.seconds).toBe(300);
  });
  it("rejects malformed clocks, distances and elapsed times", () => {
    for (const distance of [-1, NaN, Infinity]) expect(() => lightArrivalSeconds(distance)).toThrow(RangeError);
    for (const delta of [NaN, Infinity]) expect(() => advanceLight(initial(), delta)).toThrow(RangeError);
    for (const clock of [
      { ...initial(), seconds: -1 }, { ...initial(), seconds: Infinity },
      { ...initial(), speed: 0 }, { ...initial(), speed: NaN },
      { ...initial(), seconds: MAX_LIGHT_SECONDS + 1 },
    ]) expect(() => advanceLight(clock, 1)).toThrow(RangeError);
  });
});
