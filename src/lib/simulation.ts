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
export function orbitalPosition(
  body: Pick<Body, "orbitRadius" | "phase" | "orbitalPeriodDays">,
  days: number,
): [number, number, number] {
  if (body.orbitRadius === 0) return [0, 0, 0];
  const a =
    body.phase +
    (body.orbitalPeriodDays
      ? (days / body.orbitalPeriodDays) * Math.PI * 2
      : 0);
  return [Math.cos(a) * body.orbitRadius, 0, Math.sin(a) * body.orbitRadius];
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
