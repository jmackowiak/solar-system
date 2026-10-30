export interface ComparisonLayout {
  leftRadius: number;
  rightRadius: number;
  leftX: number;
  rightX: number;
  width: number;
  height: number;
  /** Physical diameter ratio: right / left. */
  ratio: number;
}

/** Side-by-side spheres sharing one physical scale; no minimum-size exaggeration. */
export function comparisonLayout(
  leftDiameterKm: number,
  rightDiameterKm: number,
): ComparisonLayout {
  if (!Number.isFinite(leftDiameterKm) || leftDiameterKm <= 0 ||
      !Number.isFinite(rightDiameterKm) || rightDiameterKm <= 0) {
    throw new RangeError("Średnice porównywanych obiektów muszą być dodatnie i skończone");
  }
  const largestDiameter = Math.max(leftDiameterKm, rightDiameterKm);
  // Divide first so finite, very large diameters do not overflow during scaling.
  const leftRadius = 3.5 * (leftDiameterKm / largestDiameter);
  const rightRadius = 3.5 * (rightDiameterKm / largestDiameter);
  return {
    leftRadius,
    rightRadius,
    leftX: -0.4 - rightRadius,
    rightX: 0.4 + leftRadius,
    width: 2 * (leftRadius + rightRadius) + 0.8,
    height: 7,
    ratio: rightDiameterKm / leftDiameterKm,
  };
}
