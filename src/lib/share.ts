import { getSystemBodies, planetarySystems, type SystemId } from "../data/systems";
import { getMoons, moonParentById } from "../data/moons";
import { MAX_LIGHT_SECONDS } from "./light-clock";
import type { Language } from "../i18n";

export type SharedMode = "solar" | "galaxy" | "compare" | "light" | "neighborhood" | "phases";
export interface CameraSnapshot { position: [number, number, number]; target: [number, number, number] }
export interface SharedView {
  v: 1;
  mode: SharedMode;
  system: SystemId;
  selected: string | null;
  days: number;
  speed: number;
  paused: boolean;
  language: Language;
  orbits: boolean;
  labels: boolean;
  camera: CameraSnapshot | null;
  pair: [string, string];
  light: number;
  phase: number;
  range: 100 | 3000;
  eclipse: "phases" | "solar" | "lunar";
  moonParent?: "earth" | "jupiter" | "saturn" | null;
  lightTarget?: string;
  lightSpeed?: 60 | 600;
}
const systems = new Set(planetarySystems.map(s => s.id));
const modes = new Set(["solar", "galaxy", "compare", "light", "neighborhood", "phases"]);
const catalog = [...planetarySystems.flatMap(s => getSystemBodies(s.id, "en").slice(1)), ...getMoons("en")];
const ids = new Set(catalog.map(b => b.id));
const number = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const triple = (v: unknown): v is [number,number,number] => Array.isArray(v) && v.length === 3 && v.every(n => number(n,-10000,10000));
function validCamera(value: unknown): value is CameraSnapshot | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const c = value as CameraSnapshot;
  if (!triple(c.position) || !triple(c.target)) return false;
  const distance = Math.hypot(...c.position.map((n,i) => n - c.target[i]));
  return distance >= 0.1 && distance <= 1500;
}
/** Accept only a versioned, finite, bounded snapshot; never execute URL content. */
export function parseSharedView(search: string): SharedView | null {
  try {
    const raw = new URLSearchParams(search).get("view");
    if (!raw || raw.length > 3000) return null;
    const s: SharedView = JSON.parse(raw);
    if (!s || s.v !== 1 || !modes.has(s.mode) || !systems.has(s.system) ||
        !number(s.days,0,1e9) || !number(s.speed,0,100) || typeof s.paused !== "boolean" ||
        !["en","pl"].includes(s.language) || typeof s.orbits !== "boolean" || typeof s.labels !== "boolean" ||
        !validCamera(s.camera) || !Array.isArray(s.pair) || s.pair.length !== 2 || !s.pair.every(id => ids.has(id)) ||
        !number(s.light,0,MAX_LIGHT_SECONDS) || !number(s.phase,0,360) || ![100,3000].includes(s.range) ||
        !["phases","solar","lunar"].includes(s.eclipse)) return null;
    if (s.moonParent != null && (s.system !== "solar" || !["earth","jupiter","saturn"].includes(s.moonParent))) return null;
    if (s.moonParent && s.selected && s.selected !== s.moonParent && moonParentById[s.selected] !== s.moonParent) return null;
    if (s.lightTarget != null && !getSystemBodies("solar","en").slice(1).some(b=>b.id===s.lightTarget)) return null;
    if (s.lightSpeed != null && ![60,600].includes(s.lightSpeed)) return null;
    const bodyIds = new Set(getSystemBodies(s.system,"en").map(b => b.id));
    if (s.system === "solar") for (const id of Object.keys(moonParentById)) bodyIds.add(id);
    if (s.selected !== null && !bodyIds.has(s.selected)) return null;
    return s;
  } catch { return null; }
}
export function shareUrl(base: string, snapshot: SharedView): string {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set("view", JSON.stringify(snapshot));
  if (!parseSharedView(url.search)) throw new RangeError("Invalid view snapshot");
  return url.toString();
}
