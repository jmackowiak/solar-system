import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Language } from "../i18n";
import {
  createGalaxyParticles,
  galaxyHazeCount,
  galaxyLowHazeCount,
  galaxyLowStarCount,
  galaxyStarCount,
  solarPosition,
} from "../lib/galaxy";

const pointVertex = /* glsl */ `
attribute float aSize;
attribute float aOpacity;
uniform float uPixelScale;
uniform float uMaxSize;
varying vec3 vColor;
varying float vOpacity;
void main(){
  vec4 viewPosition=modelViewMatrix*vec4(position,1.0);
  vColor=color;
  vOpacity=aOpacity;
  gl_PointSize=clamp(aSize*uPixelScale/max(1.0,-viewPosition.z),1.0,uMaxSize);
  gl_Position=projectionMatrix*viewPosition;
}`;
const pointFragment = /* glsl */ `
uniform float uFade;
uniform float uDensity;
varying vec3 vColor;
varying float vOpacity;
void main(){
  float radius=length(gl_PointCoord-vec2(0.5))*2.0;
  if(radius>1.0)discard;
  float glow=exp(-radius*radius*4.5)*(1.0-smoothstep(0.65,1.0,radius));
  gl_FragColor=vec4(vColor,glow*vOpacity*uFade*uDensity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function Population({
  high,
  haze = false,
  fade,
}: {
  high: boolean;
  haze?: boolean;
  fade: { value: number };
}) {
  const pixels = useThree(
    (state) => state.size.height * state.viewport.dpr * 0.5,
  );
  const material = useRef<THREE.ShaderMaterial>(null);
  // Fiber/Three may copy uniform objects when applying props. Update the actual
  // material rather than relying on a shared nested object's reference identity.
  useFrame(() => {
    if (material.current) material.current.uniforms.uFade.value = fade.value;
  });
  const particles = useMemo(
    () =>
      createGalaxyParticles(
        haze ? galaxyHazeCount : galaxyStarCount,
        haze ? "haze" : "stars",
      ),
    [haze],
  );
  const uniforms = useMemo(
    () => ({
      uFade: fade,
      uPixelScale: { value: pixels },
      uMaxSize: { value: haze ? 64 : 8 },
      uDensity: { value: high ? 1 : 1.65 },
    }),
    [pixels, haze, fade, high],
  );
  const count = haze
    ? high
      ? galaxyHazeCount
      : galaxyLowHazeCount
    : high
      ? galaxyStarCount
      : galaxyLowStarCount;
  return (
    <points renderOrder={haze ? 1 : 2} raycast={() => undefined}>
      <bufferGeometry drawRange={{ start: 0, count }}>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[particles.sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aOpacity"
          args={[particles.opacities, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={pointVertex}
        fragmentShader={pointFragment}
        uniforms={uniforms}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export interface GalaxyProps {
  high: boolean;
  fade: { value: number };
  onReady: () => void;
  language: Language;
  onEnter: () => void;
  labels: boolean;
  portal: RefObject<HTMLDivElement | null>;
}

/** A static reconstruction: camera changes drive renders; the galaxy never auto-rotates. */
export default function Galaxy({
  high,
  fade,
  onReady,
  language,
  onEnter,
  labels,
  portal,
}: GalaxyProps) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  const en = language === "en";
  const enter = en ? "Enter Solar System" : "Wejdź do Układu Słonecznego";
  return (
    <group name="milky-way">
      <Population high={high} fade={fade} haze />
      <Population high={high} fade={fade} />
      <group position={solarPosition}>
        <mesh position-y={0.2}>
          <sphereGeometry args={[0.32, 16, 8]} />
          <meshBasicMaterial color="#ffe0a3" />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.1}>
          <ringGeometry args={[1.1, 1.18, 64]} />
          <meshBasicMaterial
            color="#e8bf86"
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.1}>
          <ringGeometry args={[1.65, 1.68, 64]} />
          <meshBasicMaterial
            color="#e8bf86"
            side={THREE.DoubleSide}
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
        <mesh
          onClick={(event) => {
            if (event.delta > 5) return;
            event.stopPropagation();
            onEnter();
          }}
        >
          <sphereGeometry args={[2.4, 12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {labels && (
          <Html
            portal={portal as RefObject<HTMLElement>}
            position={[0, 2.5, 0]}
            center
            zIndexRange={[12, 0]}
            style={{ pointerEvents: "auto" }}
          >
            <button
              className="galaxy-marker"
              data-testid="galaxy-marker"
              aria-label={enter}
              onClick={onEnter}
              style={{
                display: "flex",
                alignItems: "flex-start",
                flexDirection: "column",
                gap: 5,
                padding: "12px 15px",
                background: "#101923ed",
                border: "1px solid #d8b27b66",
                borderRadius: 6,
                color: "#e4bb88",
                boxShadow: "0 8px 30px #0006",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                textAlign: "left",
                minHeight: 44,
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: "1.4px",
                  textTransform: "uppercase",
                }}
              >
                {en ? "You are here" : "Jesteś tutaj"}
              </span>
              <strong
                style={{ fontSize: 13, fontWeight: 500, color: "#e7e9eb" }}
              >
                {en ? "Solar System" : "Układ Słoneczny"}
              </strong>
              <span style={{ fontSize: 9, color: "#a1adb6" }}>
                {enter} <span aria-hidden="true">↗</span>
              </span>
            </button>
          </Html>
        )}
      </group>
    </group>
  );
}
