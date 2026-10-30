import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Mesh } from "three";
import type { Body } from "../data/bodies";
import type { Language } from "../i18n";
import { LIGHT_SPEED_KM_S } from "../lib/light-clock";
import type { LightClock } from "../lib/light-clock";

/** Distances alone share a scale: 1 scene unit = 100 million km. */
export default function LightTravel({ clock, bodies, target, portal, language }: {
  clock: RefObject<LightClock>;
  bodies: readonly Body[];
  target: string;
  portal: RefObject<HTMLDivElement | null>;
  language: Language;
}) {
  const pulse = useRef<Mesh>(null), trail = useRef<Mesh>(null);
  const planets = bodies.filter(body => !body.parentId && body.distanceMillionKm !== null && body.distanceMillionKm > 0);
  const furthest = Math.max(...planets.map(body => body.distanceMillionKm!)) / 100;
  const largestDiameter = Math.max(...planets.map(body => body.diameterKm));
  const leaders = useMemo(() => {
    const positions: number[] = [];
    bodies.filter(body => !body.parentId && body.distanceMillionKm !== null && body.distanceMillionKm > 0).forEach((body, index) => {
      const x = -24 + body.distanceMillionKm! / 100;
      const y = index < 4 ? -1.7 - index * 2.4 : (index % 2 ? -2.2 : 2.2);
      positions.push(x, 0, 0, x, y, 0);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [bodies]);
  useEffect(() => () => leaders.dispose(), [leaders]);
  useFrame(() => {
    const distance = Math.min(furthest, clock.current.seconds * LIGHT_SPEED_KM_S / 100_000_000);
    if (pulse.current) pulse.current.position.x = -24 + distance;
    if (trail.current) {
      trail.current.position.x = -24 + distance / 2;
      trail.current.scale.x = distance;
      trail.current.visible = distance > 0;
    }
  });
  return <group name="light-travel">
    <mesh position={[-24 + furthest / 2, 0, 0]}>
      <boxGeometry args={[furthest, 0.018, 0.018]} />
      <meshBasicMaterial color="#798794" transparent opacity={0.35} />
    </mesh>
    <lineSegments geometry={leaders}><lineBasicMaterial color="#75828d" transparent opacity={0.38} /></lineSegments>
    <mesh position={[-24, 0, 0]}>
      <sphereGeometry args={[0.32, 32, 16]} /><meshBasicMaterial color="#efbb70" />
    </mesh>
    <Html portal={portal as RefObject<HTMLElement>} position={[-24, 2.2, 0]} center zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
      <span className="light-label">{language === "en" ? "Sun" : "Słońce"}</span>
    </Html>
    {planets.map((body, index) => {
      const x = -24 + body.distanceMillionKm! / 100;
      const y = index < 4 ? -1.7 - index * 2.4 : (index % 2 ? -2.2 : 2.2);
      const radius = 0.16 + body.diameterKm / largestDiameter * 0.24;
      return <group key={body.id} position={[x, 0, 0]} name={`light-planet-${body.id}`}>
        <mesh><sphereGeometry args={[radius, 24, 12]} /><meshBasicMaterial color={body.color} /></mesh>
        {body.id === target && <mesh><ringGeometry args={[radius + 0.16, radius + 0.20, 48]} /><meshBasicMaterial color="#f0c991" /></mesh>}
        <Html portal={portal as RefObject<HTMLElement>} position={[0, y, 0]} center zIndexRange={[8, 0]} style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
          <span className={`light-label ${body.id === target ? "active" : ""}`}>{body.name}</span>
        </Html>
      </group>;
    })}
    <mesh ref={trail} position={[-24, 0, 0]} scale={[0, 1, 1]}>
      <boxGeometry args={[1, 0.045, 0.045]} /><meshBasicMaterial color="#ebbd76" toneMapped={false} transparent opacity={0.7} />
    </mesh>
    <mesh name="light-pulse" ref={pulse} position={[-24 + clock.current.seconds * LIGHT_SPEED_KM_S / 100_000_000, 0, 0]}>
      <sphereGeometry args={[0.22, 24, 12]} /><meshBasicMaterial color="#fff1bc" toneMapped={false} />
    </mesh>
  </group>;
}
