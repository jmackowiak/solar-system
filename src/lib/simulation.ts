import type { Body } from "../data/bodies";
export const DEFAULT_SPEED = 8;
export interface Simulation {
  days: number;
  speed: number;
  paused: boolean;
}
export function initialSimulation(reduced = false, speed = DEFAULT_SPEED): Simulation {
  return { days: 0, speed, paused: reduced };
}
export function advance(sim: Simulation, seconds: number): Simulation {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError("Czas musi być nieujemny i skończony");
  return sim.paused ? sim : { ...sim, days: sim.days + seconds * sim.speed };
}
const TAU = Math.PI * 2;
type OrbitShape = Pick<Body, "orbitRadius" | "eccentricity" | "periapsisAngle">;
type TimedOrbit = OrbitShape & Pick<Body, "phase" | "orbitalPeriodDays">;

function normalizedAngle(angle: number): number {
  const wrapped = angle % TAU;
  return wrapped > Math.PI
    ? wrapped - TAU
    : wrapped < -Math.PI ? wrapped + TAU : wrapped;
}

/** Shared orbit geometry, parametrised by eccentric anomaly, with the star at a focus. */
export function orbitPoint(
  body: OrbitShape,
  eccentricAnomaly: number,
): [number, number, number] {
  if (body.orbitRadius === 0) return [0, 0, 0];
  const e = body.eccentricity ?? 0;
  const periapsis = body.periapsisAngle ?? 0;
  if (!Number.isFinite(body.orbitRadius) || body.orbitRadius < 0 ||
      !Number.isFinite(e) || e < 0 || e >= 1 ||
      !Number.isFinite(periapsis) || !Number.isFinite(eccentricAnomaly)) {
    throw new RangeError("Orbita wymaga skończonych parametrów i mimośrodu 0 ≤ e < 1");
  }
  const anomaly = normalizedAngle(eccentricAnomaly);
  const x = body.orbitRadius * (Math.cos(anomaly) - e);
  const z = body.orbitRadius * Math.sqrt(1 - e * e) * Math.sin(anomaly);
  const angle = normalizedAngle(periapsis);
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return [x * cos - z * sin, 0, x * sin + z * cos];
}

/** Solve M = E − e sin(E). The bracket also protects future high-e elliptical data. */
function eccentricAnomaly(meanAnomaly: number, e: number): number {
  if (e === 0 || meanAnomaly === 0) return meanAnomaly;
  const direction = meanAnomaly < 0 ? -1 : 1;
  const mean = Math.abs(meanAnomaly);
  let low = 0, high = Math.PI;
  let estimate = e < 0.8 ? mean + e * Math.sin(mean) : Math.PI;
  for (let i = 0; i < 12; i++) {
    const residual = estimate - e * Math.sin(estimate) - mean;
    if (Math.abs(residual) < 1e-13) return direction * estimate;
    if (residual > 0) high = estimate; else low = estimate;
    const next = estimate - residual / (1 - e * Math.cos(estimate));
    estimate = next > low && next < high ? next : (low + high) / 2;
  }
  // Fixed-cost fallback; solar eccentricities normally converge in 2–4 Newton steps.
  for (let i = 0; i < 36; i++) {
    if (estimate - e * Math.sin(estimate) > mean) high = estimate;
    else low = estimate;
    estimate = (low + high) / 2;
  }
  return direction * estimate;
}

export function orbitalPosition(body: TimedOrbit, days: number): [number, number, number] {
  if (body.orbitRadius === 0) return [0, 0, 0];
  const period = body.orbitalPeriodDays;
  if (!Number.isFinite(days) || !Number.isFinite(body.phase) ||
      (period !== null && (!Number.isFinite(period) || period < 0))) {
    throw new RangeError("Czas, faza i okres orbity muszą być skończone");
  }
  // Reduce time before multiplying by 2π; avoid constructing an enormous angle.
  const mean = normalizedAngle(
    normalizedAngle(body.phase) + (period ? ((days % period) / period) * TAU : 0),
  );
  return orbitPoint(body, eccentricAnomaly(mean, body.eccentricity ?? 0));
}
export type SimulationAction =
  | { type: "pause" }
  | { type: "resume" }
  | { type: "speed"; value: number }
  | { type: "reset"; reduced?: boolean; speed?: number };
export function control(sim: Simulation, action: SimulationAction): Simulation {
  switch (action.type) {
    case "pause":
      return { ...sim, paused: true };
    case "resume":
      return { ...sim, paused: false };
    case "speed":
      if (
        !Number.isFinite(action.value) ||
        action.value < 0 ||
        action.value > 100
      )
        throw new RangeError("Szybkość poza zakresem");
      return { ...sim, speed: action.value };
    case "reset":
      return initialSimulation(action.reduced, action.speed);
  }
}
