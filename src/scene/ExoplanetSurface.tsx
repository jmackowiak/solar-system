import { useMemo } from "react";
import type { RefObject } from "react";
import { Color, Vector3, Vector4 } from "three";
import type { Group } from "three";
import type { Body } from "../data/bodies";

interface SurfaceStyle {
  colors: readonly [string, string, string];
  gas?: boolean;
  bands?: number;
}

// Original artistic palettes, not inferred maps or measurements of these worlds.
// In particular, a pale mineral patch does not represent observed ice or water.
const styles: Record<string, SurfaceStyle> = {
  "trappist-1-b": { colors: ["#302d2c", "#776555", "#ac8b6d"] },
  "trappist-1-c": { colors: ["#494039", "#958273", "#bbb09b"] },
  "trappist-1-d": { colors: ["#47423c", "#9d8665", "#b9ae95"] },
  "trappist-1-e": { colors: ["#484c4c", "#8a8a7f", "#b2a48c"] },
  "trappist-1-f": { colors: ["#4a5052", "#91928c", "#c0bdb0"] },
  "trappist-1-g": { colors: ["#535052", "#99958e", "#c4c5bd"] },
  "trappist-1-h": { colors: ["#55595b", "#a3a6a4", "#d0cec1"] },
  "kepler-90-b": { colors: ["#4a3931", "#a17c60", "#beaa8c"] },
  "kepler-90-c": { colors: ["#4a4439", "#98896c", "#b6ad91"] },
  "kepler-90-i": { colors: ["#363536", "#736b65", "#a39480"] },
  "kepler-90-d": { colors: ["#6f6861", "#b8ad99", "#d3cabb"], gas: true, bands: 17 },
  "kepler-90-e": { colors: ["#666267", "#a79e9c", "#c7bdb2"], gas: true, bands: 13 },
  "kepler-90-f": { colors: ["#766856", "#b8a48a", "#d0c1aa"], gas: true, bands: 20 },
  "kepler-90-g": { colors: ["#6c5544", "#b39b7b", "#ddc9a7"], gas: true, bands: 29 },
  "kepler-90-h": { colors: ["#656360", "#a3a194", "#d4c8af"], gas: true, bands: 24 },
  "toi-700-b": { colors: ["#44403c", "#918474", "#bca98f"] },
  "toi-700-c": { colors: ["#656367", "#a8a49d", "#c9c3af"], gas: true, bands: 15 },
  "toi-700-d": { colors: ["#454b4c", "#8b8d81", "#b0a68c"] },
  "toi-700-e": { colors: ["#49443c", "#978b70", "#b9ad91"] },
};

function seedFromId(id: string) {
  let seed = 2166136261;
  for (const letter of id) {
    seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619);
  }
  return seed >>> 0;
}

const vertexShader = /* glsl */ `
varying vec3 vLocalPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
  vLocalPosition = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPosition = world.xyz;
  // The host uses spherical meshes with uniform scale.
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uDark;
uniform vec3 uMiddle;
uniform vec3 uLight;
uniform vec3 uSeed;
uniform vec3 uStarlight;
uniform vec3 uHostPosition;
uniform float uRadius;
uniform float uBands;
uniform vec4 uCraters[8];

varying vec3 vLocalPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

// Seamless 3D value noise; this source and its surface recipes are original.
float hash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = fract(p);
  vec3 w = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(cell), hash(cell + vec3(1,0,0)), w.x),
        mix(hash(cell + vec3(0,1,0)), hash(cell + vec3(1,1,0)), w.x), w.y),
    mix(mix(hash(cell + vec3(0,0,1)), hash(cell + vec3(1,0,1)), w.x),
        mix(hash(cell + vec3(0,1,1)), hash(cell + vec3(1,1,1)), w.x), w.y), w.z);
}

float terrain(vec3 p) {
  float value = 0.0;
  float weight = 0.55;
  float totalWeight = 0.0;
  for (int i = 0; i < DETAIL_OCTAVES; i++) {
    value += weight * noise(p);
    totalWeight += weight;
    p = p * 2.03 + vec3(5.7, 9.2, 2.6);
    weight *= 0.48;
  }
  return value / totalWeight;
}

vec3 reliefNormal(vec3 normal, float height) {
  vec3 dx = dFdx(vWorldPosition);
  vec3 dy = dFdy(vWorldPosition);
  vec3 crossY = cross(dy, normal);
  vec3 crossX = cross(normal, dx);
  float det = dot(dx, crossY);
  vec3 gradient = (crossY * dFdx(height) + crossX * dFdy(height))
    * sign(det) / max(abs(det), 0.000001);
  return normalize(normal - gradient * uRadius * 0.008);
}

void main() {
  vec3 p = normalize(vLocalPosition);
  vec3 samplePoint = p * 3.2 + uSeed;
  float field = terrain(samplePoint);
  float mineral = noise(p * 8.5 + uSeed.zxy);
  // Suppress the finest features when the entire planet spans few pixels.
  float footprint = max(length(dFdx(p)), length(dFdy(p)));
  float detailVisibility = 1.0 - smoothstep(0.025, 0.10, footprint);
  vec3 normal = normalize(vWorldNormal);
  vec3 albedo;

  #if GAS_SURFACE == 1
    float latitude = p.y;
    float flow = noise(p * vec3(4.5, 2.0, 4.5) + uSeed) - 0.5;
    float belt = latitude * uBands + flow * 2.5;
    float broadBands = 0.5 + 0.5 * sin(belt + field * 2.4);
    float fineBands = 0.5 + 0.5 * sin(belt * 3.7 + mineral * 3.0);
    albedo = mix(uDark, uMiddle, 0.28 + broadBands * 0.72);
    float wisps = smoothstep(0.58, 0.90, fineBands) * detailVisibility;
    albedo = mix(albedo, uLight, 0.16 + wisps * 0.25);
    albedo *= 0.92 + field * 0.17;
  #else
    float relief = field;
    float craterShade = 0.0;
    // A small fixed population of impact shapes avoids costly cellular searches.
    for (int i = 0; i < CRATER_COUNT; i++) {
      float distanceToCrater = length(p - uCraters[i].xyz) / uCraters[i].w;
      float bowl = 1.0 - smoothstep(0.12, 0.88, distanceToCrater);
      float rim = 1.0 - smoothstep(0.0, 0.16, abs(distanceToCrater - 0.94));
      relief += (rim * 0.18 - bowl * 0.22) * detailVisibility;
      craterShade += bowl * 0.13 - rim * 0.035;
    }
    float fineGrain = noise(p * 45.0 + uSeed.yzx) - 0.5;
    relief += fineGrain * detailVisibility * 0.045;
    float highlands = smoothstep(0.24, 0.75, field);
    albedo = mix(uDark, uMiddle, highlands);
    float mineralDeposits = smoothstep(0.54, 0.80, mineral) * smoothstep(0.25, 0.65, field);
    albedo = mix(albedo, uLight, mineralDeposits * 0.32 + smoothstep(0.62, 0.86, field) * 0.30);
    albedo *= 0.96 + fineGrain * detailVisibility * 0.16 - craterShade;
    normal = reliefNormal(normal, relief);
  #endif

  // The system moves during scale transitions; light follows its actual host.
  vec3 lightDirection = normalize(uHostPosition - vWorldPosition);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float diffuse = max(dot(normal, lightDirection), 0.0);
  float smoothDaylight = smoothstep(-0.08, 0.32, dot(normal, lightDirection));
  float facing = max(dot(normalize(vWorldNormal), viewDirection), 0.0);
  float limb = 0.78 + 0.22 * pow(facing, 0.35);
  // Restrained, cool ambient fill keeps night terrain legible without city lights.
  vec3 color = albedo * (vec3(0.105, 0.112, 0.12)
    + uStarlight * (diffuse * 1.35 + smoothDaylight * 0.075)) * limb;
  #if GAS_SURFACE == 1
    float hazeRim = pow(1.0 - facing, 3.0) * smoothDaylight;
    color += uLight * uStarlight * hazeRim * 0.045;
  #endif

  gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #ifdef DITHERING
    gl_FragColor.rgb += (hash(vec3(gl_FragCoord.xy, 0.0)) - 0.5) / 255.0;
  #endif
}
`;

/** An opaque, texture-free artist's impression. Mount as the sphere's material. */
export default function ExoplanetSurface({ body, high, host }: { body: Body; high: boolean; host: RefObject<Group | null> }) {
  const style = styles[body.id];
  const uniforms = useMemo(() => {
    const palette = styles[body.id]?.colors ?? ["#494644", body.color, "#bdb4a3"];
    let state = seedFromId(body.id);
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const offset = new Vector3(random() * 40, random() * 40, random() * 40);
    const craters = Array.from({ length: 8 }, () => {
      const y = random() * 2 - 1;
      const angle = random() * Math.PI * 2;
      const r = Math.sqrt(1 - y * y);
      return new Vector4(r * Math.cos(angle), y, r * Math.sin(angle), 0.09 + random() * 0.18);
    });
    return {
      uDark: { value: new Color(palette[0]) },
      uMiddle: { value: new Color(palette[1]) },
      uLight: { value: new Color(palette[2]) },
      uSeed: { value: offset },
      uRadius: { value: body.displayRadius },
      uHostPosition: { value: new Vector3() },
      uBands: { value: styles[body.id]?.bands ?? 18 },
      uCraters: { value: craters },
      uStarlight: {
        value: new Color().setRGB(
          1,
          body.id.startsWith("trappist") ? 0.76 : body.id.startsWith("toi") ? 0.87 : 0.94,
          body.id.startsWith("trappist") ? 0.62 : body.id.startsWith("toi") ? 0.76 : 0.84,
        ),
      },
    };
  }, [body.id, body.color, body.displayRadius]);
  const defines = useMemo(() => ({
    GAS_SURFACE: style?.gas ? 1 : 0,
    DETAIL_OCTAVES: high ? 4 : 3,
    CRATER_COUNT: high ? 8 : 4,
  }), [style?.gas, high]);

  return (
    <shaderMaterial
      key={`${body.id}-${high ? "high" : "low"}`}
      name={`Exoplanet surface ${body.id}`}
      uniforms={uniforms}
      onBeforeRender={() => host.current?.getWorldPosition(uniforms.uHostPosition.value)}
      defines={defines}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      toneMapped
      dithering
    />
  );
}
