import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Group, NoColorSpace, SRGBColorSpace, TextureLoader } from "three";
import type { Texture } from "three";
import type { Body } from "../data/bodies";
import { comparisonLayout } from "../lib/comparison";
import ExoplanetSurface from "./ExoplanetSurface";
import MoonSurface from "./MoonSurface";

const texturedBodies = new Set([
  "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune",
]);

function ComparedBody({ body, radius, x, high, host, portal }: {
  body: Body;
  radius: number;
  x: number;
  high: boolean;
  host: RefObject<Group | null>;
  portal: RefObject<HTMLDivElement | null>;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const [maps, setMaps] = useState<{
    id: string; low?: Texture; high?: Texture; cloud?: Texture;
  }>({ id: "" });
  const textured = texturedBodies.has(body.id);
  const requestKey = `${body.id}-${high ? "high" : "low"}`;
  useEffect(() => {
    if (!textured) return;
    let disposed = false;
    const owned: Texture[] = [];
    const loader = new TextureLoader();
    const load = (url: string, kind: "low" | "high" | "cloud") => {
      loader.load(url, (texture) => {
        if (disposed) { texture.dispose(); return; }
        owned.push(texture);
        texture.colorSpace = kind === "cloud" ? NoColorSpace : SRGBColorSpace;
        texture.anisotropy = high ? 4 : 1;
        setMaps((previous) => ({
          ...(previous.id === requestKey ? previous : { id: requestKey }),
          [kind]: texture,
        }));
        invalidate();
      }, undefined, () => {
        // The coloured sphere remains usable if a local image cannot be read.
        invalidate();
      });
    };
    load(`/textures/${body.id}-low.webp`, "low");
    if (high) load(`/textures/${body.id === "earth" ? "earth-high" : body.id}.webp`, "high");
    if (body.id === "earth")
      load(`/textures/${high ? "earth-clouds" : "earth-clouds-low"}.webp`, "cloud");
    return () => {
      disposed = true;
      owned.forEach((texture) => texture.dispose());
    };
  }, [body.id, textured, high, requestKey, invalidate]);
  const currentMaps = maps.id === requestKey ? maps : undefined;
  const map = currentMaps?.high || currentMaps?.low;
  // Procedural relief uses the physical mesh radius in scene units.
  const scaledBody = useMemo(() => ({ ...body, displayRadius: radius }), [body, radius]);
  const segments = high ? 64 : 32;
  return (
    <group position={[x, 0, 0]} name={`comparison-${body.id}`}>
      <mesh rotation={[0, -0.6, body.id === "uranus" ? 1.7 : body.id === "earth" ? 0.41 : 0.06]}>
        <sphereGeometry args={[radius, segments, segments / 2]} />
        {body.parentId ? <MoonSurface body={scaledBody} high={high} host={host} /> : textured ? (
          <meshStandardMaterial key={map?.uuid || "plain"} map={map}
            color={map ? "#ffffff" : body.color} roughness={0.95}
            emissive={body.color} emissiveIntensity={0.025} />
        ) : <ExoplanetSurface body={scaledBody} high={high} host={host} />}
      </mesh>
      {body.id === "earth" && currentMaps?.cloud && (
        <mesh rotation={[0, -0.5, 0.41]}>
          <sphereGeometry args={[radius * 1.018, segments, segments / 2]} />
          <meshStandardMaterial color="#ffffff" alphaMap={currentMaps.cloud}
            transparent opacity={0.65} depthWrite={false} />
        </mesh>
      )}
      <Html portal={portal as RefObject<HTMLElement>} position={[0, -radius - 0.45, 0]}
        center zIndexRange={[8, 0]} style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
        <span className="comparison-label">{body.name}</span>
      </Html>
    </group>
  );
}

/** Two static spheres in one physical scale. Engine alone owns the camera. */
export default function Comparison({ left, right, high, portal, onReady }: {
  left: Body;
  right: Body;
  high: boolean;
  portal: RefObject<HTMLDivElement | null>;
  onReady: () => void;
}) {
  const host = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const layout = comparisonLayout(left.diameterKm, right.diameterKm);
  useEffect(() => { onReady(); invalidate(); }, [onReady, invalidate]);
  return (
    <group name="size-comparison">
      <ambientLight intensity={0.3} />
      <group ref={host} position={[0, 6, 10]}>
        <pointLight color="#fff5e7" intensity={2.8} decay={0} />
      </group>
      <ComparedBody body={left} radius={layout.leftRadius} x={layout.leftX}
        high={high} host={host} portal={portal} />
      <ComparedBody body={right} radius={layout.rightRadius} x={layout.rightX}
        high={high} host={host} portal={portal} />
    </group>
  );
}
