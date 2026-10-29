/**
 * Original deterministic, illustrative barred-spiral galaxy.
 * These points are a visual population, not measured positions of real stars.
 * Model units are approximately 1,000 light-years; the Sun marker is schematic.
 */
export const galaxyRadius = 50;
export const solarPosition: [number, number, number] = [22, 0, 14];
export const galaxyStarCount = 35_000;
export const galaxyLowStarCount = 12_000;
export const galaxyHazeCount = 3_600;
export const galaxyLowHazeCount = 1_100;

export interface GalaxyParticles {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  opacities: Float32Array;
}

function randomGenerator(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

/** Each prefix is independent of the requested total, so quality never relocates stars. */
export function createGalaxyParticles(
  count: number,
  kind: "stars" | "haze" = "stars",
): GalaxyParticles {
  if (!Number.isInteger(count) || count < 0 || count > 100_000) {
    throw new RangeError(
      "Galaxy particle count must be an integer from 0 to 100,000",
    );
  }
  const random = randomGenerator(kind === "stars" ? 0x4f524249 : 0x4d494c4b);
  const normal = () =>
    Math.max(
      -3,
      Math.min(
        3,
        Math.sqrt(-2 * Math.log(Math.max(random(), 1e-7))) *
          Math.cos(random() * Math.PI * 2),
      ),
    );
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const opacities = new Float32Array(count);
  const sunAngle = Math.atan2(solarPosition[2], solarPosition[0]);
  const sunRadius = Math.hypot(solarPosition[0], solarPosition[2]);
  const isHaze = kind === "haze";

  for (let i = 0; i < count; i++) {
    const population = random();
    let x: number, y: number, z: number;
    let warm: number,
      cluster = false,
      extinction = 1;

    if (population < 0.19) {
      // A central bar with a thicker, nearly spherical nuclear bulge.
      const nuclear = random() < 0.32;
      const major = normal() * (nuclear ? 1.65 : 4.4);
      const minor = normal() * (nuclear ? 1.35 : 1.65);
      const barAngle = 0.65;
      x = major * Math.cos(barAngle) - minor * Math.sin(barAngle);
      z = major * Math.sin(barAngle) + minor * Math.cos(barAngle);
      y = normal() * (nuclear ? 1.2 : 0.85);
      warm = 0.85 + random() * 0.15;
    } else if (population < 0.84) {
      const spur = population > 0.77;
      // Two major arms and two softer partial bands. Their exact paths are artistic.
      const arm =
        random() < 0.79 ? (random() < 0.5 ? 0 : 2) : random() < 0.5 ? 1 : 3;
      cluster = random() < 0.22;
      let radius = spur
        ? 20 + random() * 13
        : 5.5 + Math.pow(random(), 0.84) * 43.5;
      if (cluster && !spur)
        radius = 8 + Math.floor(random() * 10) * 4 + normal() * 0.55;
      const width = (cluster ? 0.023 : 0.055) + radius * 0.0006;
      const across = normal();
      const angle = spur
        ? sunAngle + Math.log(radius / sunRadius) * 2.5 + across * 0.025
        : 0.65 +
          arm * Math.PI * 0.5 +
          Math.log(radius / 6) * 2.5 +
          across * width;
      radius += normal() * (isHaze ? 0.7 : 0.35);
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = normal() * (0.16 + radius * 0.008);
      // Narrow lanes of reduced emission suggest dust; this is not radiative transfer.
      const lane = Math.exp(-Math.pow((across - 0.55) / 0.35, 2));
      extinction = 1 - lane * 0.78;
      warm = 0.14 + Math.max(0, 1 - radius / 19) * 0.55;
      if (arm % 2 === 1 && !spur) extinction *= 0.56;
    } else {
      // A faint diffuse disk bridges the arms without hiding their negative space.
      const radius = Math.sqrt(random()) * 48;
      const angle = random() * Math.PI * 2;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = normal() * (0.25 + radius * 0.015);
      warm = 0.35 + Math.max(0, 1 - radius / 22) * 0.4;
      extinction = 0.24;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    const luminosity = 0.45 + random() * 0.55;
    const white = cluster ? 0.25 + random() * 0.25 : random() * 0.18;
    // Authored linear RGB. Old stars warm the core; the arms contain bluer young populations.
    colors[i * 3] = ((0.28 + warm * 0.72) * (1 - white) + white) * luminosity;
    colors[i * 3 + 1] =
      ((0.43 + warm * 0.18) * (1 - white) + white) * luminosity;
    colors[i * 3 + 2] =
      ((0.78 - warm * 0.68) * (1 - white) + white) * luminosity;
    sizes[i] = isHaze
      ? 3.5 + random() * 6.5
      : (cluster ? 0.35 : 0.12) + Math.pow(random(), 3) * 0.55;
    opacities[i] = extinction * (isHaze ? 0.048 : 0.35 + random() * 0.65);
  }
  return { positions, colors, sizes, opacities };
}
