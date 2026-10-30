import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial, DoubleSide, SRGBColorSpace, TextureLoader, Vector3 } from "three";
import type { Group, Texture } from "three";
import type { Language } from "../i18n";
import { getMoons } from "../data/moons";
import MoonSurface from "./MoonSurface";

type Scenario = "phases" | "solar" | "lunar";
const orbitRadius = 5, moonRadius = 3475 / 12742;
const nodeAxis = new Vector3(Math.SQRT1_2, 0, Math.SQRT1_2);
const inclination = 5.14 * Math.PI / 180;

function moonPosition(angle: number, tilted: boolean) {
  const a = angle * Math.PI / 180;
  const p = new Vector3(-orbitRadius * Math.cos(a), 0, -orbitRadius * Math.sin(a));
  if (tilted) p.applyAxisAngle(nodeAxis, inclination);
  return p;
}

function Segment({ points, opacity = 0.35, color = "#7798a9" }: {
  points: number[]; opacity?: number; color?: string;
}) {
  const positions = useMemo(() => new Float32Array(points), [points]);
  const line=useMemo(()=>new Line(new BufferGeometry().setAttribute("position",new Float32BufferAttribute(positions,3)),new LineBasicMaterial({color,transparent:true,opacity,depthWrite:false})),[positions,color,opacity]);
  useEffect(()=>()=>{line.geometry.dispose();line.material.dispose();},[line]);
  return <primitive object={line} raycast={()=>undefined}/>;
}

/** A labelled diagram of an umbra, not a physically visible cloud in space. */
function ShadowCone({ origin, radius, length }: { origin: Vector3; radius: number; length: number }) {
  return <group position={origin} name="phase-shadow">
    <mesh position={[length / 2, 0, 0]} rotation-z={-Math.PI / 2} raycast={() => undefined}>
      <cylinderGeometry args={[0, radius, length, 48, 1, true]} />
      <meshBasicMaterial color="#658397" transparent opacity={0.09} side={DoubleSide} depthWrite={false} />
    </mesh>
    <Segment points={[0, 0, -radius, length, 0, 0, 0, 0, radius]} opacity={0.4} />
  </group>;
}

const overlayVertex = /* glsl */ `
varying vec3 vWorld;
void main(){
  vec4 world=modelMatrix*vec4(position,1.0);
  vWorld=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}`;
const overlayFragment = /* glsl */ `
uniform vec3 uOrigin;
uniform float uRadius,uLength,uLunar;
varying vec3 vWorld;
void main(){
  vec3 relative=vWorld-uOrigin;
  if(relative.x<=0.0||relative.x>=uLength)discard;
  float radius=uRadius*(1.0-relative.x/uLength);
  float radial=length(relative.yz);
  float shadow=1.0-smoothstep(max(0.0,radius-0.025),radius+0.025,radial);
  if(shadow<0.001)discard;
  vec3 tint=mix(vec3(0.001,0.002,0.003),vec3(0.055,0.012,0.006),uLunar);
  gl_FragColor=vec4(tint,shadow*0.94);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Analytic intersection of the receiving sphere and the same illustrated cone. */
function ShadowOverlay({ target, targetRadius, origin, radius, length, lunar }: {
  target: Vector3; targetRadius: number; origin: Vector3; radius: number; length: number; lunar: boolean;
}) {
  const uniforms = useMemo(() => ({ uOrigin: { value: origin.clone() }, uRadius: { value: radius },
    uLength: { value: length }, uLunar: { value: lunar ? 1 : 0 } }), [origin, radius, length, lunar]);
  return <mesh position={target} raycast={() => undefined}>
    <sphereGeometry args={[targetRadius * 1.003, 48, 32]} />
    <shaderMaterial vertexShader={overlayVertex} fragmentShader={overlayFragment} uniforms={uniforms}
      transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
}

/** User-controlled educational geometry; no clock, animation loop or camera. */
export default function MoonPhases({ angle, scenario, language, portal }: {
  angle: number; scenario: Scenario; language: Language; portal: RefObject<HTMLDivElement | null>;
}) {
  const invalidate = useThree(state => state.invalidate);
  const host = useRef<Group>(null);
  const [earthMap, setEarthMap] = useState<Texture>();
  useEffect(() => {
    let disposed = false;
    let owned: Texture | undefined;
    new TextureLoader().load("/textures/earth-low.webp", texture => {
      if (disposed) { texture.dispose(); return; }
      owned = texture; texture.colorSpace = SRGBColorSpace; setEarthMap(texture); invalidate();
    }, undefined, () => invalidate());
    return () => { disposed = true; owned?.dispose(); };
  }, [invalidate]);
  const tilted = scenario === "phases";
  const moon = useMemo(() => moonPosition(angle, tilted), [angle, tilted]);
  const orbit = useMemo(() => Array.from({ length: 129 }, (_, i) => moonPosition(i / 128 * 360, tilted).toArray()).flat(), [tilted]);
  const moonBody = useMemo(() => ({ ...getMoons(language)[0], displayRadius: moonRadius }), [language]);
  const earth = useMemo(() => new Vector3(), []);
  const shadowOrigin = scenario === "solar" ? moon : earth;
  const shadowRadius = scenario === "solar" ? moonRadius : 1;
  const shadowLength = scenario === "solar" ? 6.5 : 9.5;
  const en = language === "en";
  return <group name="moon-phases-model">
    <ambientLight intensity={0.11} />
    <group ref={host} position={[-20, 0, 0]}><directionalLight intensity={2.3} color="#fff5e8" /></group>
    <Segment points={orbit} opacity={0.35} />
    {[-2, 2].map(z => <Segment key={z} points={[-8, 0, z, -2.2, 0, z]} color="#c3a479" opacity={0.23} />)}
    <mesh rotation={[0.2, -1.2, 0.41]}>
      <sphereGeometry args={[1, 64, 40]} />
      <meshStandardMaterial key={earthMap?.uuid || "plain"} map={earthMap} color={earthMap ? "#ffffff" : "#527b9b"}
        emissive="#274052" emissiveIntensity={0.035} roughness={0.95} />
    </mesh>
    <mesh name="phase-moon" position={moon} rotation-y={-Math.atan2(moon.z, moon.x)}>
      <sphereGeometry args={[moonRadius, 48, 32]} />
      <MoonSurface body={moonBody} high={false} host={host} />
    </mesh>
    {scenario !== "phases" && <>
      <ShadowCone origin={shadowOrigin} radius={shadowRadius} length={shadowLength} />
      <ShadowOverlay target={scenario === "solar" ? earth : moon}
        targetRadius={scenario === "solar" ? 1 : moonRadius}
        origin={shadowOrigin} radius={shadowRadius} length={shadowLength} lunar={scenario === "lunar"} />
      <Html portal={portal as RefObject<HTMLElement>} position={[scenario === "solar" ? 2.5 : 5.5, 0, 3.6]}
        center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <span className="phases-scene-label umbra">{en ? "Umbra · diagram" : "Cień całkowity · schemat"}</span>
      </Html>
    </>}
    <Html portal={portal as RefObject<HTMLElement>} position={[0, 0, 1.5]} center zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
      <span className="phases-scene-label">{en ? "Earth" : "Ziemia"}</span>
    </Html>
    <Html portal={portal as RefObject<HTMLElement>} position={[moon.x, moon.y, moon.z + 0.65]} center zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
      <span className="phases-scene-label">{en ? "Moon" : "Księżyc"}</span>
    </Html>
    <Html portal={portal as RefObject<HTMLElement>} position={[-7.2, 0, 2.5]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
      <span className="phases-scene-label sunlight">{en ? "Sunlight →" : "Światło Słońca →"}</span>
    </Html>
  </group>;
}
