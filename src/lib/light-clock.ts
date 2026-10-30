import { lightTravelSeconds } from "./discovery";
export { LIGHT_SPEED_KM_S } from "./discovery";

export interface LightClock {
  seconds: number;
  playing: boolean;
  /** Simulated light-travel seconds per real second. */
  speed: number;
}

export const lightArrivalSeconds = lightTravelSeconds;

// Neptune's mean distance in the canonical Solar System dataset, in million km.
export const MAX_LIGHT_SECONDS = lightArrivalSeconds(4515);

function validate(clock: LightClock, maximum: number) {
  if (!Number.isFinite(maximum) || maximum <= 0 ||
      !Number.isFinite(clock.seconds) || clock.seconds < 0 || clock.seconds > maximum ||
      !Number.isFinite(clock.speed) || clock.speed <= 0 || typeof clock.playing !== "boolean")
    throw new RangeError("Invalid light clock");
}

/** Mutates the one Engine-owned clock; no frame-duration cap or second time owner. */
export function advanceLight(clock: LightClock, deltaSeconds: number, maximum = MAX_LIGHT_SECONDS): LightClock {
  validate(clock, maximum);
  if (!Number.isFinite(deltaSeconds)) throw new RangeError("Light-clock delta must be finite");
  if (!clock.playing || deltaSeconds <= 0) return clock;
  clock.seconds = Math.min(maximum, clock.seconds + deltaSeconds * clock.speed);
  if (clock.seconds === maximum) clock.playing = false;
  return clock;
}

/** Reset the pulse to emission and pause; keep the user's playback speed. */
export function resetLight(clock: LightClock): LightClock {
  validate(clock, MAX_LIGHT_SECONDS);
  clock.seconds = 0;
  clock.playing = false;
  return clock;
}
