import type { Body } from '../data/bodies';
import { orbitalPosition } from './simulation';
/** One shared coordinate calculation for meshes, camera and collision guards. */
export function worldPosition(body: Body, days: number, bodies: readonly Body[]): [number, number, number] {
  const position = orbitalPosition(body, days);
  if (!body.parentId) return position;
  const parent = bodies.find((candidate) => candidate.id === body.parentId);
  if (!parent || parent.parentId) throw new Error(`Missing or unsupported parent: ${body.parentId}`);
  const origin = orbitalPosition(parent, days);
  return [origin[0] + position[0], origin[1] + position[1], origin[2] + position[2]];
}
