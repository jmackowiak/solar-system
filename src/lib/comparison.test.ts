import { describe, expect, it } from "vitest";
import { comparisonLayout } from "./comparison";

describe("one-scale diameter comparison", () => {
  it("preserves the physical diameter ratio in the sphere radii", () => {
    const result = comparisonLayout(12742, 139822);
    expect(result.rightRadius).toBe(3.5);
    expect(result.leftRadius / result.rightRadius).toBeCloseTo(12742 / 139822, 14);
    expect(result.ratio).toBeCloseTo(139822 / 12742, 12);
  });

  it("keeps a small moon honestly small beside a giant without a minimum radius", () => {
    const giantDiameter = 1_000_000_000;
    const moonDiameter = 3475;
    const result = comparisonLayout(giantDiameter, moonDiameter);
    expect(result.leftRadius).toBe(3.5);
    expect(result.rightRadius).toBeCloseTo(3.5 * moonDiameter / giantDiameter, 15);
    expect(result.rightRadius).toBeLessThan(0.0001);
    expect(result.ratio).toBe(moonDiameter / giantDiameter);
  });

  it.each([[1, 1], [3475, 1391400], [139822, 3122], [1e-100, 1e100]])(
    "has a 0.8 edge gap and a centred bounding box for %s and %s",
    (left, right) => {
      const result = comparisonLayout(left, right);
      const leftEdge = result.leftX - result.leftRadius;
      const leftInner = result.leftX + result.leftRadius;
      const rightInner = result.rightX - result.rightRadius;
      const rightEdge = result.rightX + result.rightRadius;
      expect(rightInner - leftInner).toBeCloseTo(0.8, 12);
      expect((leftEdge + rightEdge) / 2).toBeCloseTo(0, 12);
      expect(rightEdge - leftEdge).toBeCloseTo(result.width, 12);
      expect(leftEdge).toBeCloseTo(-result.width / 2, 12);
      expect(rightEdge).toBeCloseTo(result.width / 2, 12);
      expect(result.height).toBe(7);
      expect(Math.max(result.leftRadius, result.rightRadius) * 2).toBe(result.height);
    },
  );

  it("mirrors the layout when the compared objects swap places", () => {
    const first = comparisonLayout(5262, 139822);
    const swapped = comparisonLayout(139822, 5262);
    expect(swapped.leftRadius).toBe(first.rightRadius);
    expect(swapped.rightRadius).toBe(first.leftRadius);
    expect(swapped.leftX).toBe(-first.rightX);
    expect(swapped.rightX).toBe(-first.leftX);
    expect(swapped.width).toBe(first.width);
    expect(swapped.ratio).toBeCloseTo(1 / first.ratio, 14);
  });

  it("handles equally large or tiny finite inputs without overflowing scaled dimensions", () => {
    for (const diameter of [Number.MAX_VALUE, Number.MIN_VALUE]) {
      const result = comparisonLayout(diameter, diameter);
      expect(result.leftRadius).toBe(3.5);
      expect(result.rightRadius).toBe(3.5);
      expect(result.ratio).toBe(1);
      expect(Object.values(result).every(Number.isFinite)).toBe(true);
    }
  });

  it("rejects nonpositive and nonfinite diameters on either side", () => {
    for (const invalid of [0, -1, -Infinity, Infinity, NaN]) {
      expect(() => comparisonLayout(invalid, 12742)).toThrow(RangeError);
      expect(() => comparisonLayout(12742, invalid)).toThrow(RangeError);
    }
  });
});
