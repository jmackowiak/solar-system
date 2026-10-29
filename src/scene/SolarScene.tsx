import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { OrbitControls as Controls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import { bodies } from "../data/bodies";
import { englishBodyCopy } from "../data/body-translations";
import { translate } from "../i18n";
import type { Body } from "../data/bodies";
import { orbitalPosition } from "../lib/simulation";
import type { SceneProps } from "./types";

const vertex = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
void main(){vUv=uv; vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=-p.xyz;gl_Position=projectionMatrix*p;}`;
const sunFragment = `
uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
}
void main(){
 vec2 flow=vec2(time*.012,time*.003);
 float granules=noise(vUv*vec2(300.,150.)+flow);
 float field=noise(vUv*vec2(34.,17.)+flow*.3);
 float cells=smoothstep(.1,.9,granules)*.6+field*.4;
 float limb=pow(max(dot(normalize(vNormal),normalize(vView)),0.),.35);
 vec3 c=mix(vec3(.9,.15,.008),vec3(1.,.57,.12),cells)*(.55+limb*.6);
 gl_FragColor=vec4(c*1.5,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const haloFragment = `varying vec3 vNormal;varying vec3 vView;void main(){float f=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),3.);gl_FragColor=vec4(.95,.36,.07,f*.23);
#include <colorspace_fragment>
}`;

function Planet({
  body,
  props,
  high,
  portal,
}: {
  body: Body;
  props: SceneProps;
  high: boolean;
  portal: React.RefObject<HTMLDivElement | null>;
}) {
  const group = useRef<THREE.Group>(null),
    surface = useRef<THREE.Mesh>(null),
    clouds = useRef<THREE.Mesh>(null),
    sun = useRef<THREE.ShaderMaterial>(null);
  const [maps, setMaps] = useState<{
    low?: THREE.Texture;
    high?: THREE.Texture;
    cloud?: THREE.Texture;
  }>({});
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let cancelled = false;
    const owned: THREE.Texture[] = [];
    const loader = new THREE.TextureLoader();
    const load = (url: string, key: "low" | "high" | "cloud") =>
      loader.load(
        url,
        (t) => {
          owned.push(t);
          if (cancelled) {
            t.dispose();
            return;
          }
          t.colorSpace =
            key === "cloud" ? THREE.NoColorSpace : THREE.SRGBColorSpace;
          t.anisotropy = 4;
          setMaps((s) => ({ ...s, [key]: t }));
          props.onTexture(true);
          invalidate();
        },
        undefined,
        () => {
          if (!cancelled) props.onTexture(false);
        },
      );
    if (body.id !== "sun") load(`/textures/${body.id}-low.webp`, "low");
    return () => {
      cancelled = true;
      owned.forEach((t) => t.dispose());
    };
    // Callbacks are stable. Version explicitly retries failed requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body.id, props.textureVersion, invalidate]);
  useEffect(() => {
    if (props.selected !== body.id || body.id === "sun") return;
    let cancelled = false;
    const owned: THREE.Texture[] = [];
    const loader = new THREE.TextureLoader();
    const load = (url: string, key: "high" | "cloud") =>
      loader.load(
        url,
        (t) => {
          owned.push(t);
          if (cancelled) {
            t.dispose();
            return;
          }
          t.colorSpace =
            key === "cloud" ? THREE.NoColorSpace : THREE.SRGBColorSpace;
          t.anisotropy = 4;
          setMaps((s) => ({ ...s, [key]: t }));
          props.onTexture(true);
          invalidate();
        },
        undefined,
        () => {
          if (!cancelled) props.onTexture(false);
        },
      );
    load(
      `/textures/${body.id === "earth" && high ? "earth-high" : body.id}.webp`,
      "high",
    );
    if (body.id === "earth")
      load(
        high
          ? "/textures/earth-clouds.webp"
          : "/textures/earth-clouds-low.webp",
        "cloud",
      );
    return () => {
      cancelled = true;
      owned.forEach((t) => t.dispose());
      setMaps((s) => ({ ...s, high: undefined, cloud: undefined }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [high, props.selected, body.id, props.textureVersion, invalidate]);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.set(
      ...orbitalPosition(body, props.simulation.current.days),
    );
    const days = props.simulation.current.days;
    // Axial rotation uses a compressed visual rate; retrograde sign is preserved.
    if (surface.current)
      surface.current.rotation.y =
        ((days * 0.12) / Math.sqrt(Math.abs(body.rotationPeriodDays))) *
        Math.sign(body.rotationPeriodDays);
    if (clouds.current) clouds.current.rotation.y = days * 0.14;
    if (sun.current && !props.reduced) sun.current.uniforms.time.value = days;
  });
  const sunUniforms = useMemo(() => ({ time: { value: 0 } }), []);
  const r = body.displayRadius;
  const isSun = body.id === "sun";
  const map = maps.high || maps.low;
  const segments = high ? 64 : 32;
  return (
    <group
      ref={group}
      position={orbitalPosition(body, props.simulation.current.days)}
    >
      <mesh
        ref={surface}
        rotation-z={
          body.id === "uranus" ? 1.7 : body.id === "earth" ? 0.41 : 0.06
        }
        onClick={(e) => {
          if (e.delta > 5) return;
          e.stopPropagation();
          props.onSelect(body.id);
        }}
      >
        <sphereGeometry args={[r, segments, segments / 2]} />
        {isSun ? (
          <shaderMaterial
            ref={sun}
            vertexShader={vertex}
            fragmentShader={sunFragment}
            uniforms={sunUniforms}
          />
        ) : (
          <meshStandardMaterial
            key={map?.uuid || "untextured"}
            map={map}
            color={map ? "#ffffff" : body.color}
            roughness={0.95}
            emissive={body.color}
            emissiveIntensity={0.025}
          />
        )}
      </mesh>
      <mesh
        onClick={(e) => {
          if (e.delta > 5) return;
          e.stopPropagation();
          props.onSelect(body.id);
        }}
        visible={true}
      >
        <sphereGeometry args={[Math.max(r, 1.05), 16, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {isSun && (
        <mesh scale={1.12}>
          <sphereGeometry args={[r, 32, 16]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            vertexShader={vertex}
            fragmentShader={haloFragment}
          />
        </mesh>
      )}
      {body.id === "earth" && maps.cloud && (
        <mesh ref={clouds}>
          <sphereGeometry args={[r * 1.015, segments, segments / 2]} />
          <meshStandardMaterial
            color="white"
            alphaMap={maps.cloud}
            transparent
            opacity={0.65}
            depthWrite={false}
          />
        </mesh>
      )}
      {body.id === "saturn" && (
        <group rotation={[0.45, 0.1, 0.15]}>
          <SaturnRings radius={r} />
        </group>
      )}
      {props.selected === body.id && (
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[r * 1.27, r * 1.29, 80]} />
          <meshBasicMaterial
            color="#e5be8e"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {props.labels && (
        <Html
          portal={portal as React.RefObject<HTMLElement>}
          position={[0, props.selected === body.id ? r * 1.3 : r + 0.7, 0]}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "auto" }}
        >
          <button
            tabIndex={-1}
            className={`planet-label ${props.selected === body.id ? "active" : ""}`}
            onClick={() => props.onSelect(body.id)}
          >
            {props.language === "en"
              ? englishBodyCopy[body.id].name
              : body.name}
            <span />
          </button>
        </Html>
      )}
    </group>
  );
}
function SaturnRings({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(radius * 1.4, radius * 2.3, 100, 8);
    const pos = g.attributes.position,
      colors = [];
    for (let i = 0; i < pos.count; i++) {
      const d = Math.hypot(pos.getX(i), pos.getY(i)) / radius;
      const gap = d > 1.94 && d < 2.02;
      const c = new THREE.Color(
        gap ? "#20201f" : Math.sin(d * 220) > 0.25 ? "#ad9a7c" : "#776b58",
      );
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2}>
      <meshBasicMaterial
        vertexColors
        side={THREE.DoubleSide}
        transparent
        opacity={0.84}
      />
    </mesh>
  );
}
function Orbit({ body, selected }: { body: Body; selected: boolean }) {
  const line = useMemo(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          Array.from(
            { length: 193 },
            (_, i) =>
              new THREE.Vector3(
                Math.cos((i / 192) * Math.PI * 2) * body.orbitRadius,
                0,
                Math.sin((i / 192) * Math.PI * 2) * body.orbitRadius,
              ),
          ),
        ),
        new THREE.LineBasicMaterial({ transparent: true }),
      ),
    [body],
  );
  useEffect(
    () => () => {
      line.geometry.dispose();
      line.material.dispose();
    },
    [line],
  );
  line.material.color.set(selected ? "#b99d78" : "#617581");
  line.material.opacity = selected ? 0.6 : 0.21;
  return <primitive object={line} />;
}
function Particles({ high }: { high: boolean }) {
  const [stars, asteroids] = useMemo(() => {
    let seed = 420;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const stars = [],
      asteroids = [];
    for (let i = 0; i < 1800; i++) {
      const a = rnd() * Math.PI * 2,
        y = rnd() * 2 - 1,
        r = 160 + rnd() * 140;
      stars.push(
        Math.cos(a) * Math.sqrt(1 - y * y) * r,
        y * r,
        Math.sin(a) * Math.sqrt(1 - y * y) * r,
      );
    }
    for (let i = 0; i < 1200; i++) {
      const a = rnd() * Math.PI * 2,
        r = 20.2 + rnd() * 2.7;
      asteroids.push(Math.cos(a) * r, (rnd() - 0.5) * 0.4, Math.sin(a) * r);
    }
    return [new Float32Array(stars), new Float32Array(asteroids)];
  }, []);
  return (
    <>
      <points>
        <bufferGeometry drawRange={{ start: 0, count: high ? 1800 : 800 }}>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#9bafbd"
          size={0.12}
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <points>
        <bufferGeometry drawRange={{ start: 0, count: high ? 1200 : 500 }}>
          <bufferAttribute attach="attributes-position" args={[asteroids, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#827d72"
          size={0.055}
          transparent
          opacity={0.5}
          sizeAttenuation
        />
      </points>
    </>
  );
}
function Engine({ props, high }: { props: SceneProps; high: boolean }) {
  const controls = useRef<Controls>(null);
  const { camera, invalidate, gl, size, setDpr, scene } = useThree();
  const clockState = useRef(props.simulation.current);
  const onFailure = props.onFailure;
  const started = useRef(false);
  const flight = useRef<{
    from: THREE.Vector3;
    target: THREE.Vector3;
    start: THREE.Vector3;
    elapsed: number;
  } | null>(null);
  const following = useRef(new THREE.Vector3()),
    lastFrame = useRef(0),
    frames = useRef(0),
    sample = useRef({ elapsed: 0, frames: 0, slow: 0, demoted: false });
  const temp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      dest: new THREE.Vector3(),
      look: new THREE.Vector3(),
      diff: new THREE.Vector3(),
    }),
    [],
  );
  const selected = bodies.find((b) => b.id === props.selected);
  useEffect(() => {
    const c = new Controls(camera, gl.domElement);
    controls.current = c;
    c.enablePan = false;
    c.enableDamping = !props.reduced;
    c.dampingFactor = 0.09;
    c.rotateSpeed = 0.55;
    c.zoomSpeed = 0.8;
    c.minPolarAngle = 0.08;
    c.maxPolarAngle = Math.PI * 0.86;
    c.maxDistance = 420;
    const change = () => invalidate();
    const start = () => {
      flight.current = null;
      c.maxDistance = Math.max(
        c.getDistance(),
        selected ? selected.displayRadius * 24 : 420,
      );
      const el = document.querySelector<HTMLElement>('[data-testid="scene"]');
      if (el) el.dataset.flight = "false";
      invalidate();
    };
    c.addEventListener("change", change);
    c.addEventListener("start", start);
    return () => {
      c.removeEventListener("change", change);
      c.removeEventListener("start", start);
      c.dispose();
      controls.current = null;
    };
    // Controls' lifetime follows the renderer. Current selection is read in the frame loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl, invalidate]);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const start = new THREE.Vector3(
      ...(selected
        ? orbitalPosition(selected, props.simulation.current.days)
        : [0, 0, 0]),
    );
    following.current.copy(start);
    c.minDistance = 0.1;
    c.maxDistance = 600;
    c.enableDamping = false;
    c.update();
    if (!started.current && !selected) {
      started.current = true;
      camera.lookAt(start);
      return;
    }
    started.current = true;
    flight.current = {
      from: camera.position.clone(),
      target: c.target.clone(),
      start,
      elapsed: 0,
    };
    const el = document.querySelector<HTMLElement>('[data-testid="scene"]');
    if (el) el.dataset.flight = String(!props.reduced);
    invalidate();
    // navigation changes also restart framing for the same object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selected, props.navigation]);
  const paused = props.simulation.current.paused;
  const speed = props.simulation.current.speed;
  useEffect(() => {
    lastFrame.current = 0;
    invalidate();
  }, [paused, speed, invalidate]);
  useEffect(() => {
    if (controls.current) controls.current.enableDamping = !props.reduced;
  }, [props.reduced]);
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio, high ? 1.5 : 1));
    invalidate();
  }, [high, setDpr, invalidate]);
  useEffect(() => {
    lastFrame.current = 0;
    if (!props.hidden) invalidate();
  }, [props.hidden, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useEffect(() => {
    const original = scene.onAfterRender;
    scene.onAfterRender = () => {
      const el = document.querySelector<HTMLElement>('[data-testid="scene"]');
      if (el) {
        el.dataset.draws = String(gl.info.render.calls);
        el.dataset.triangles = String(gl.info.render.triangles);
      }
    };
    return () => {
      scene.onAfterRender = original;
    };
  }, [scene, gl]);
  useFrame((state) => {
    if (props.hidden || document.hidden) {
      lastFrame.current = 0;
      return;
    }
    // Control actions replace the simulation object. Reset before consuming any elapsed time,
    // including when a demand frame runs before React's passive effects.
    if (clockState.current !== props.simulation.current) {
      lastFrame.current = 0;
      clockState.current = props.simulation.current;
    }
    const now = performance.now(),
      rawDt = lastFrame.current ? (now - lastFrame.current) / 1000 : 0,
      dt = Math.min(rawDt, 0.1);
    lastFrame.current = now;
    const sim = props.simulation.current;
    if (!sim.paused) sim.days += rawDt * sim.speed;
    const c = controls.current;
    if (!c) return;
    if (selected) temp.pos.set(...orbitalPosition(selected, sim.days));
    else temp.pos.set(0, 0, 0);
    const f = flight.current;
    if (f) {
      f.elapsed += dt;
      const t = props.reduced ? 1 : Math.min(f.elapsed / 1.65, 1),
        e = t * t * (3 - 2 * t);
      const r = selected?.displayRadius || 0;
      if (selected) {
        const angle = Math.atan2(temp.pos.z, temp.pos.x) + 2.4;
        const d = r * (selected.id === "saturn" ? 8 : 6.5);
        temp.dest.set(
          temp.pos.x + Math.cos(angle) * d,
          temp.pos.y + r * 2.3,
          temp.pos.z + Math.sin(angle) * d,
        );
      } else {
        const d = size.width < 700 ? 280 : 100;
        temp.dest.set(d * 0.35, d * 0.65, d * 0.82);
      }
      camera.position.lerpVectors(f.from, temp.dest, e);
      camera.position.y +=
        Math.sin(t * Math.PI) *
        Math.min(f.from.distanceTo(temp.dest) * 0.28, 22);
      c.target.lerpVectors(f.target, temp.pos, e);
      camera.lookAt(c.target);
      if (t === 1) {
        flight.current = null;
        c.minDistance = selected
          ? selected.displayRadius * (selected.id === "saturn" ? 2.6 : 1.6)
          : 5;
        c.maxDistance = selected ? selected.displayRadius * 24 : 420;
        c.update();
        c.enableDamping = !props.reduced;
      }
    } else if (selected) {
      temp.diff.subVectors(temp.pos, following.current);
      camera.position.add(temp.diff);
      c.target.add(temp.diff);
      c.update();
    } else c.update();
    following.current.copy(temp.pos);
    // Guard all surfaces, including when flying past a different object.
    for (const b of bodies) {
      temp.look.set(...orbitalPosition(b, sim.days));
      temp.diff.subVectors(camera.position, temp.look);
      const min = b.displayRadius * (b.id === "saturn" ? 2.45 : 1.25);
      if (temp.diff.length() < min) {
        temp.diff.setLength(min);
        camera.position.copy(temp.look).add(temp.diff);
      }
    }
    frames.current++;
    const el = document.querySelector<HTMLElement>('[data-testid="scene"]');
    if (el) {
      el.dataset.quality = high ? "high" : "low";
      el.dataset.pixelRatio = String(gl.getPixelRatio());

      el.dataset.frames = String(frames.current);
      el.dataset.days = String(sim.days);
      el.dataset.flight = String(!!flight.current);
      el.dataset.target = props.selected || "overview";

      el.dataset.camera = camera.position
        .toArray()
        .map((v) => v.toFixed(3))
        .join(",");
      if (selected) {
        temp.look.copy(temp.pos).project(camera);
        el.dataset.projected = temp.look.toArray().join(",");
      }
    }
    if (frames.current === 2) props.onReady();
    const s = sample.current;
    if (rawDt > 0 && !sim.paused) {
      s.elapsed += rawDt;
      s.frames++;
      if (s.elapsed > 2) {
        const fps = s.frames / s.elapsed;
        if (fps < 42) s.slow++;
        else s.slow = 0;
        if (props.quality === "auto" && s.slow >= 2 && !s.demoted) {
          s.demoted = true;
          props.onQuality("low");
        }
        s.elapsed = 0;
        s.frames = 0;
      }
    }
    if ((!sim.paused && sim.speed > 0) || flight.current) state.invalidate();
  });
  return null;
}
export default function SolarScene(props: SceneProps) {
  const portal = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState<"low" | "high">(() =>
    window.innerWidth < 700 ? "low" : "high",
  );
  const high =
    props.quality === "high" || (props.quality === "auto" && auto === "high");
  const reportQuality = props.onQuality;
  useEffect(() => reportQuality(auto), [auto, reportQuality]);
  const quality = (q: "low" | "high") => {
    setAuto(q);
    props.onQuality(q);
  };
  return (
    <>
      <Canvas
        aria-label={translate(
          props.language,
          "Interaktywny Układ Słoneczny 3D",
        )}
        camera={{
          position: window.innerWidth < 700 ? [98, 182, 230] : [35, 65, 82],
          fov: 46,
          near: 0.1,
          far: 700,
        }}
        frameloop={props.hidden ? "never" : "demand"}
        dpr={1}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        fallback={
          <span>
            {translate(props.language, "Renderer 3D jest niedostępny.")}
          </span>
        }
      >
        <ambientLight intensity={0.24} />
        <pointLight
          position={[0, 0, 0]}
          color="#fff2df"
          intensity={3.2}
          decay={0}
        />
        <Engine props={{ ...props, onQuality: quality }} high={high} />
        <Particles high={high} />
        {props.orbits &&
          bodies
            .slice(1)
            .map((body) => (
              <Orbit
                key={body.id}
                body={body}
                selected={props.selected === body.id}
              />
            ))}
        {bodies.map((body) => (
          <Planet
            key={body.id}
            body={body}
            props={props}
            high={high}
            portal={portal}
          />
        ))}
      </Canvas>
      <div ref={portal} className="labels-layer" />
    </>
  );
}
