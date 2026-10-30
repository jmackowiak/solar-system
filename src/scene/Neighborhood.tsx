import { useEffect, useMemo } from "react";
import type { CSSProperties, RefObject } from "react";
import { Html } from "@react-three/drei";
import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial, DoubleSide } from "three";
import type { Language } from "../i18n";
import { planetarySystems } from "../data/systems";
import type { SystemId } from "../data/systems";
import { stellarOffset } from "../lib/stellar-position";

const solarDirectionLength = Math.hypot(22, 14);
const u = 22 / solarDirectionLength, v = 14 / solarDirectionLength;

function DistanceRing({ distance }: { distance: number }) {
  const positions = useMemo(() => {
    const r = distance / 100;
    return new Float32Array(Array.from({ length: 129 }, (_, i) => {
      const angle = i / 128 * Math.PI * 2;
      return [Math.cos(angle) * r, 0, Math.sin(angle) * r];
    }).flat());
  }, [distance]);
  const line=useMemo(()=>new Line(new BufferGeometry().setAttribute("position",new Float32BufferAttribute(positions,3)),new LineBasicMaterial({color:"#5a7a8b",transparent:true,opacity:.23,depthWrite:false})),[positions]);
  useEffect(()=>()=>{line.geometry.dispose();line.material.dispose();},[line]);
  return <primitive object={line} raycast={()=>undefined}/>;
}

/** Catalogue directions and distances, not a randomly populated stellar field. */
export default function Neighborhood({ language, range, portal, onSystem, labels }: {
  language: Language;
  range: 100 | 3000;
  portal: RefObject<HTMLDivElement | null>;
  onSystem: (id: SystemId) => void;
  labels: boolean;
}) {
  const en = language === "en";
  const visible = useMemo(() => planetarySystems
    .filter(system => system.distanceLightYears <= range)
    .map(system => ({ system, position: stellarOffset(system.ra, system.dec, system.distanceLightYears, 100) })), [range]);
  const points = useMemo(() => new Float32Array(visible.flatMap(s => s.position)), [visible]);
  const r = range / 100;
  const unit = en ? "ly" : "lat św.";
  const distances = range === 100 ? [100] : [1000, 2000, 3000];
  return <group name="stellar-neighborhood">
    {distances.map(distance => <DistanceRing key={distance} distance={distance} />)}
    <mesh rotation-x={-Math.PI / 2} raycast={() => undefined}>
      <circleGeometry args={[r, 96]} />
      <meshBasicMaterial color="#213844" transparent opacity={0.055} side={DoubleSide} depthWrite={false} />
    </mesh>
    <points raycast={() => undefined}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry>
      <pointsMaterial color="#f4d7ae" size={6} sizeAttenuation={false} toneMapped={false} />
    </points>
    {labels && distances.map(distance => <Html key={distance}
      portal={portal as RefObject<HTMLElement>} position={[distance / 100, 0, 0]} center
      zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
      <span className="neighborhood-grid-label">{distance.toLocaleString(en ? "en-GB" : "pl-PL")} {unit}</span>
    </Html>)}
    {visible.map(({ system, position: p }) => {
      const name = system.id === "solar" ? (en ? "Solar System" : "Układ Słoneczny") : system.name;
      const distance = system.distanceLightYears.toLocaleString(en ? "en-GB" : "pl-PL", { maximumFractionDigits: 2 });
      const offset = range === 3000 ? system.id === "trappist-1" ? -48 : system.id === "toi-700" ? 48 : 0 : system.id === "trappist-1" ? 32 : 0;
      return <group key={system.id} position={p} name={`neighborhood-${system.id}`}>
        <mesh onClick={event => {
          if (event.delta > 5) return;
          event.stopPropagation(); onSystem(system.id);
        }}>
          <sphereGeometry args={[range === 100 ? 0.06 : 0.14, 12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {labels && <Html portal={portal as RefObject<HTMLElement>}
          position={[0, 0, 0]} center zIndexRange={[12, 0]} style={{ pointerEvents: "auto" }}>
          <div className="neighborhood-anchor" style={{ "--label-offset": `${offset}px`, "--label-x": range === 3000 && system.id === "kepler-90" ? "-24px" : "0px" } as CSSProperties}>
            {range === 3000 && system.id === "kepler-90" && <span className="neighborhood-horizontal-leader" aria-hidden="true"/>}
            {offset !== 0 && <span className={`neighborhood-leader ${offset < 0 ? "up" : "down"}`} aria-hidden="true" />}
            <button className="neighborhood-marker" onClick={() => onSystem(system.id)}
              aria-label={`${en ? "Enter" : "Wejdź do"} ${name}`}>
              <span className="neighborhood-dot" style={{ backgroundColor: system.starColor }} aria-hidden="true" />
              <span><strong>{name}</strong><small>{distance} {unit}</small></span>
            </button>
          </div>
        </Html>}
      </group>;
    })}
    {labels && <Html portal={portal as RefObject<HTMLElement>}
      position={[-u * r, 0, -v * r]} center zIndexRange={[3, 0]} style={{ pointerEvents: "none" }}>
      <span className="neighborhood-direction">{en ? "Toward Galactic centre" : "W stronę centrum Galaktyki"} ↗</span>
    </Html>}
  </group>;
}
