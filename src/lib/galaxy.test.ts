import { describe, expect, it } from "vitest";
import { createGalaxyParticles, solarPosition } from "./galaxy";

describe("illustrative galaxy population", () => {
  it("keeps existing stars in exactly the same positions when quality increases", () => {
    const low = createGalaxyParticles(1000);
    const high = createGalaxyParticles(3500);
    expect(high.positions.slice(0, low.positions.length)).toEqual(
      low.positions,
    );
    expect(high.colors.slice(0, low.colors.length)).toEqual(low.colors);
    expect(high.sizes.slice(0, low.sizes.length)).toEqual(low.sizes);
    expect(high.opacities.slice(0, low.opacities.length)).toEqual(
      low.opacities,
    );
  });
  it("has a bounded disk, a central concentration and finite GPU attributes", () => {
    const data = createGalaxyParticles(4000);
    let central = 0;
    for (let i = 0; i < data.sizes.length; i++) {
      const radius = Math.hypot(
        data.positions[i * 3],
        data.positions[i * 3 + 2],
      );
      if (radius < 10) central++;
      expect(radius).toBeLessThan(54);
      expect(Math.abs(data.positions[i * 3 + 1])).toBeLessThan(4);
      expect(data.sizes[i]).toBeGreaterThan(0);
      expect(data.opacities[i]).toBeGreaterThanOrEqual(0);
      expect(data.opacities[i]).toBeLessThanOrEqual(1);
    }
    expect(central).toBeGreaterThan(650);
    for (const buffer of Object.values(data))
      expect(buffer.every(Number.isFinite)).toBe(true);
    expect(Math.hypot(...solarPosition)).toBeCloseTo(26.08, 1);
  });
  it("generates deterministic independent haze and validates allocation limits", () => {
    expect(createGalaxyParticles(20, "haze").positions).toEqual(
      createGalaxyParticles(20, "haze").positions,
    );
    expect(createGalaxyParticles(20, "haze").positions).not.toEqual(
      createGalaxyParticles(20).positions,
    );
    expect(() => createGalaxyParticles(-1)).toThrow(RangeError);
    expect(() => createGalaxyParticles(Infinity)).toThrow(RangeError);
    expect(() => createGalaxyParticles(100_001)).toThrow(RangeError);
  });
});
