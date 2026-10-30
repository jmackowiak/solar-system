/** NASA/JPL astrodynamic parameters: exact vacuum speed of light, km/s. */
export const LIGHT_SPEED_KM_S = 299_792.458;

/** One-way light time for a nonnegative distance expressed in millions of km. */
export function lightTravelSeconds(distanceMillionKm: number): number {
  if (!Number.isFinite(distanceMillionKm) || distanceMillionKm < 0) {
    throw new RangeError("Distance must be finite and nonnegative");
  }
  // Divide first so a very large finite distance does not overflow needlessly.
  return (distanceMillionKm / LIGHT_SPEED_KM_S) * 1_000_000;
}

/**
 * Visible illuminated fraction for an ideal spherical Moon with parallel sunlight.
 * Elongation is measured from new Moon: 0=new, π/2=quarter, π=full.
 * This is educational geometry, not a dated lunar ephemeris or eclipse model.
 */
export function illuminatedFraction(elongationRadians: number): number {
  if (!Number.isFinite(elongationRadians)) {
    throw new RangeError("Elongation must be finite");
  }
  return (1 - Math.cos(elongationRadians)) / 2;
}

export interface GalacticPosition {
  /** Toward Galactic longitude 0°, latitude 0° (approximately the centre). */
  x: number;
  /** Toward Galactic longitude 90°, latitude 0°. */
  y: number;
  /** Toward the north Galactic pole. */
  z: number;
}

// ESA Gaia EDR3 documentation, Eq. 4.62; Hipparcos convention in ICRS.
// Coefficients are rounded to their nearest representable JavaScript numbers.
const ICRS_TO_GALACTIC = [
  [-0.0548755604162154, -0.8734370902348850, -0.4838350155487132],
  [+0.4941094278755837, -0.4448296299600112, +0.7469822444972188],
  [-0.8676661490190047, -0.1980763734312015, +0.4559837761750669],
] as const;

/**
 * Heliocentric ICRS direction + distance → Cartesian Galactic coordinates in ly.
 * No proper-motion, parallax, epoch propagation or Galactocentric translation.
 * These are science coordinates; apply a documented rotation/scale for a scene.
 */
export function equatorialToGalactic(
  raDegrees: number,
  decDegrees: number,
  distanceLy: number,
): GalacticPosition {
  if (!Number.isFinite(raDegrees) || !Number.isFinite(decDegrees) ||
      !Number.isFinite(distanceLy) || decDegrees < -90 || decDegrees > 90 || distanceLy < 0) {
    throw new RangeError("Expected finite RA, declination within ±90°, and nonnegative distance");
  }
  if (distanceLy === 0) return { x: 0, y: 0, z: 0 };
  const ra = (raDegrees % 360) * Math.PI / 180;
  const dec = decDegrees * Math.PI / 180;
  const cosDec = Math.cos(dec);
  const icrs = [Math.cos(ra) * cosDec, Math.sin(ra) * cosDec, Math.sin(dec)];
  const [x, y, z] = ICRS_TO_GALACTIC.map(row =>
    (row[0] * icrs[0] + row[1] * icrs[1] + row[2] * icrs[2]) * distanceLy,
  );
  return { x, y, z };
}
