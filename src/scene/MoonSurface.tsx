import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Color, Vector3, Vector4 } from "three";
import type { Group, ShaderMaterial } from "three";
import type { Body } from "../data/bodies";

// Original schematic appearances, not observed surface maps.
const appearances: Record<string, { mode: number; palette: readonly [string, string, string] }> = {
  moon: { mode: 0, palette: ["#62605d", "#a7a49b", "#d4d0c4"] },
  io: { mode: 1, palette: ["#8f713b", "#d4ba74", "#f3e0a7"] },
  europa: { mode: 2, palette: ["#9b8f7c", "#c9c6b5", "#e2dcc7"] },
  ganymede: { mode: 3, palette: ["#595b59", "#a1a29b", "#cbc7ba"] },
  callisto: { mode: 4, palette: ["#3e3d3a", "#797971", "#c8c3b3"] },
  titan: { mode: 5, palette: ["#7b522c", "#bc8b49", "#ddba76"] },
};

const vertexShader = /* glsl */ `
varying vec3 vLocal, vWorld, vNormal;
varying float vRadius;
void main() {
  vLocal = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vRadius = length(modelMatrix[0].xyz) * length(position);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const fragmentShader = /* glsl */ `
uniform vec3 uDark, uMiddle, uLight, uSeed, uHostPosition;
uniform vec4 uCraters[24];
varying vec3 vLocal, vWorld, vNormal;
varying float vRadius;
float hash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
    mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
    mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float terrain(vec3 p) {
  float sum = 0.0, weight = 0.55, total = 0.0;
  for (int i=0; i<OCTAVES; i++) {
    sum += noise(p)*weight; total += weight;
    p = p*2.03+vec3(5.7,9.2,2.6); weight *= 0.48;
  }
  return sum/total;
}
vec3 reliefNormal(vec3 n, float h) {
  vec3 dx=dFdx(vWorld), dy=dFdy(vWorld), ry=cross(dy,n), rx=cross(n,dx);
  float det=dot(dx,ry);
  vec3 gradient=(ry*dFdx(h)+rx*dFdy(h))*sign(det)/max(abs(det),0.000001);
  return normalize(n-gradient*vRadius*0.012);
}
void main() {
  vec3 p=normalize(vLocal), n=normalize(vNormal);
  float field=terrain(p*3.6+uSeed), detail=noise(p*25.0+uSeed.zxy);
  float lod=1.0-smoothstep(0.025,0.10,max(length(dFdx(p)),length(dFdy(p))));
  vec3 albedo;
  #if SURFACE_MODE == 5
    // The opaque haze hides Titan's terrain; only broad, subdued cloud structure.
    float haze=0.5+0.5*sin(p.y*5.0+field*2.8);
    albedo=mix(uMiddle,uLight,0.24+haze*0.16+(field-0.5)*0.18);
    albedo=mix(albedo,uDark,pow(abs(p.y),5.0)*0.22);
  #elif SURFACE_MODE == 1
    albedo=mix(uDark,uMiddle,smoothstep(0.24,0.70,field));
    albedo=mix(albedo,uLight,smoothstep(0.52,0.77,field)*0.60);
    float vents=smoothstep(0.76,0.88,noise(p*14.0+uSeed.zxy))*lod;
    albedo=mix(albedo,vec3(0.045,0.025,0.012),vents*0.70);
    n=reliefNormal(n,field+detail*lod*0.025);
  #elif SURFACE_MODE == 2
    float distortion=(field-0.5)*1.4;
    float fault=1.0-smoothstep(0.025,0.08,abs(sin(dot(p,vec3(15,4,9))+distortion)));
    float crossing=1.0-smoothstep(0.018,0.06,abs(sin(dot(p,vec3(-7,12,5))-distortion)));
    albedo=mix(uMiddle,uLight,0.44+(field-0.5)*0.25);
    albedo=mix(albedo,uDark,(fault*0.30+crossing*0.17)*lod);
    n=reliefNormal(n,field*0.15-fault*lod*0.06);
  #else
    float height=field+detail*lod*0.035, bowls=0.0, rims=0.0;
    for (int i=0; i<CRATER_COUNT; i++) {
      float d=length(p-uCraters[i].xyz)/uCraters[i].w;
      float bowl=1.0-smoothstep(0.05,0.90,d);
      float rim=1.0-smoothstep(0.0,0.15,abs(d-0.96));
      bowls+=bowl; rims+=rim;
      height+=(rim*0.15-bowl*0.20)*lod;
    }
    albedo=mix(uDark,uMiddle,0.30+smoothstep(0.25,0.72,field)*0.70);
    #if SURFACE_MODE == 3
      float grooves=1.0-smoothstep(0.02,0.13,abs(sin(dot(p,vec3(17,6,3))+field*2.0)));
      albedo=mix(albedo,uLight,grooves*smoothstep(0.50,0.68,field)*0.22*lod);
    #endif
    #if SURFACE_MODE == 4
      albedo=mix(albedo,uLight,clamp(rims*0.35+bowls*0.12,0.0,0.60)*lod);
    #else
      albedo=mix(albedo,uLight,clamp(rims*0.16,0.0,0.40)*lod);
      albedo*=1.0-min(bowls,1.0)*0.16*lod;
    #endif
    n=reliefNormal(n,height);
  #endif
  vec3 light=normalize(uHostPosition-vWorld), view=normalize(cameraPosition-vWorld);
  float daylight=max(dot(n,light),0.0), facing=max(dot(normalize(vNormal),view),0.0);
  float limb=0.80+0.20*pow(facing,0.35);
  vec3 color=albedo*(vec3(0.105,0.112,0.12)+vec3(1.0,0.96,0.89)*daylight*1.35)*limb;
  #if SURFACE_MODE == 5
    color+=uLight*pow(1.0-facing,3.0)*smoothstep(-0.05,0.30,dot(n,light))*0.045;
  #endif
  gl_FragColor=vec4(max(color,vec3(0.0)),1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #ifdef DITHERING
    gl_FragColor.rgb+=(hash(vec3(gl_FragCoord.xy,0.0))-0.5)/255.0;
  #endif
}`;

/** Material only. The host ref is the Solar System group, whose origin is the Sun. */
export default function MoonSurface({ body, high, host }: {
  body: Body; high: boolean; host: RefObject<Group | null>;
}) {
  const material = useRef<ShaderMaterial>(null);
  const appearance = appearances[body.id] ?? appearances.moon;
  const uniforms = useMemo(() => {
    let state = 2166136261;
    for (const letter of body.id) state = Math.imul(state ^ letter.charCodeAt(0), 16777619);
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const seed = new Vector3(random()*40, random()*40, random()*40);
    const craters = Array.from({ length: 24 }, (_, i) => {
      const y=random()*2-1, angle=random()*Math.PI*2, r=Math.sqrt(1-y*y);
      return new Vector4(r*Math.cos(angle),y,r*Math.sin(angle),i<8 ? 0.09+random()*0.07 : 0.035+random()*0.07);
    });
    return {
      uDark: { value: new Color(appearance.palette[0]) },
      uMiddle: { value: new Color(appearance.palette[1]) },
      uLight: { value: new Color(appearance.palette[2]) },
      uSeed: { value: seed }, uHostPosition: { value: new Vector3() }, uCraters: { value: craters },
    };
  }, [body.id, appearance]);
  const defines = useMemo(() => ({
    SURFACE_MODE: appearance.mode, OCTAVES: high ? 4 : 3, CRATER_COUNT: high ? 24 : 12,
  }), [appearance.mode, high]);
  return <shaderMaterial ref={material} key={`${body.id}-${high}`} name={`Moon surface ${body.id}`}
    uniforms={uniforms} defines={defines} vertexShader={vertexShader} fragmentShader={fragmentShader}
    onBeforeRender={() => {
      const position = material.current?.uniforms.uHostPosition.value as Vector3 | undefined;
      if (position) { if (host.current) host.current.getWorldPosition(position); else position.set(0,0,0); }
    }} toneMapped dithering />;
}
