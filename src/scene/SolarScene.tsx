import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Html } from "@react-three/drei";
import { OrbitControls as Controls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import ExoplanetSurface from "./ExoplanetSurface";
import MoonSurface from "./MoonSurface";
import Comparison from "./Comparison";
import LightTravel from "./LightTravel";
import Neighborhood from "./Neighborhood";
import { planetarySystems } from "../data/systems";
import { advanceLight } from "../lib/light-clock";
import { comparisonLayout } from "../lib/comparison";
import { worldPosition } from "../lib/world-position";
import { translate } from "../i18n";
import type { Body } from "../data/bodies";
import { orbitalPosition, orbitPoint } from "../lib/simulation";
import type { SceneProps } from "./types";
import { solarPosition } from "../lib/galaxy";
const Galaxy = lazy(() => import("./Galaxy"));
interface Worlds {
  solar: React.RefObject<THREE.Group | null>;
  galaxy: React.RefObject<THREE.Group | null>;
  blend: { value: number };
  galaxyReady: React.RefObject<boolean>;
}

const vertex = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
void main(){vUv=uv; vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=-p.xyz;gl_Position=projectionMatrix*p;}`;
const sunFragment = `
uniform float time;
uniform vec3 starTint;
uniform float tintAmount;
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
 c=mix(c,starTint*(.55+cells*.8)*(.55+limb*.6),tintAmount);
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
  host,
}: {
  body: Body;
  props: SceneProps;
  high: boolean;
  portal: React.RefObject<HTMLDivElement | null>;
  host: React.RefObject<THREE.Group | null>;
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
    if (props.systemId === "solar" && !body.parentId && body.id !== "sun") load(`/textures/${body.id}-low.webp`, "low");
    return () => {
      cancelled = true;
      owned.forEach((t) => t.dispose());
    };
    // Callbacks are stable. Version explicitly retries failed requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body.id, props.systemId, props.textureVersion, invalidate]);
  useEffect(() => {
    if (props.systemId !== "solar" || body.parentId || props.selected !== body.id || body.id === "sun") return;
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
  }, [high, props.selected, props.systemId, body.id, props.textureVersion, invalidate]);
  useFrame(() => {
    if (props.mode !== "solar" || !group.current) return;
    group.current.position.set(
      ...worldPosition(body, props.simulation.current.days, props.bodies),
    );
    const days = props.simulation.current.days;
    // Axial rotation uses a compressed visual rate; retrograde sign is preserved.
    if (surface.current && body.parentId) {
      const local = orbitalPosition(body, days);
      surface.current.rotation.y = -Math.atan2(local[2], local[0]);
    } else if (surface.current && body.rotationPeriodDays !== 0)
      surface.current.rotation.y =
        ((days * 0.12) / Math.sqrt(Math.abs(body.rotationPeriodDays))) *
        Math.sign(body.rotationPeriodDays);
    if (clouds.current) clouds.current.rotation.y = days * 0.14;
    if (sun.current && !props.reduced) sun.current.uniforms.time.value = days;
  });
  const sunUniforms = useMemo(() => ({ time: { value: 0 }, starTint: { value: new THREE.Color(props.starColor) }, tintAmount: { value: props.systemId === "solar" ? 0 : 0.8 } }), [props.starColor, props.systemId]);
  const r = body.displayRadius;
  const isSun = body.orbitRadius === 0;
  const map = maps.high || maps.low;
  const segments = high ? 64 : 32;
  return (
    <group
      ref={group}
      position={worldPosition(body, props.simulation.current.days, props.bodies)}
    >
      <mesh
        ref={surface}
        rotation-z={
          body.id === "uranus" ? 1.7 : body.id === "earth" ? 0.41 : 0.06
        }
        onClick={(e) => {
          if (props.mode !== "solar" || e.delta > 5) return;
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
        ) : body.parentId ? <MoonSurface body={body} high={high} host={host} /> : props.systemId !== "solar" ? <ExoplanetSurface body={body} high={high} host={host} /> : (
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
          if (props.mode !== "solar" || e.delta > 5) return;
          e.stopPropagation();
          props.onSelect(body.id);
        }}
        visible={true}
      >
        <sphereGeometry args={[Math.max(r, body.parentId ? 0.55 : 1.05), 16, 8]} />
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
        <Billboard><mesh>
          <ringGeometry args={[r * 1.22, r * 1.226, 80]} />
          <meshBasicMaterial
            color="#e5be8e"
            transparent
            opacity={0.32}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh></Billboard>
      )}
      {props.mode === "solar" && props.labels && (
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
            {body.name}
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
  const { orbitRadius, eccentricity, periapsisAngle } = body;
  const line = useMemo(
    () =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          Array.from(
            { length: 193 },
            (_, i) =>
              new THREE.Vector3(...orbitPoint({ orbitRadius, eccentricity, periapsisAngle }, (i / 192) * Math.PI * 2)),
          ),
        ),
        new THREE.LineBasicMaterial({ transparent: true }),
      ),
    [orbitRadius, eccentricity, periapsisAngle],
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
function SatelliteOrbits({ props }: { props: SceneProps }) {
  const ref = useRef<THREE.Group>(null);
  const parent = props.bodies.find(b => b.id === props.moonParent);
  useFrame(() => { if (ref.current && parent) ref.current.position.set(...worldPosition(parent, props.simulation.current.days, props.bodies)); });
  if (!parent) return null;
  return <group ref={ref} position={worldPosition(parent, props.simulation.current.days, props.bodies)}>{props.bodies.filter(b=>b.parentId===parent.id).map(body=><Orbit key={body.id} body={body} selected={props.selected===body.id}/>)}</group>;
}
function Particles({ high, asteroidBelt }: { high: boolean; asteroidBelt: boolean }) {
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
      {asteroidBelt && <points>
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
      </points>}
    </>
  );
}
function Engine({
  props,
  high,
  worlds,
}: {
  props: SceneProps;
  high: boolean;
  worlds: Worlds;
}) {
  const bodies = props.bodies;
  const controls = useRef<Controls>(null);
  const { camera, invalidate, gl, size, setDpr, scene } = useThree();
  const clockState = useRef(props.simulation.current);
  const clockMode = useRef(props.mode);
  const transitionMode = useRef(props.mode);
  const scaleTransition = useRef<{ from: number; elapsed: number } | null>(
    null,
  );
  const frameRadius = (id: string | null) => {
    const body = bodies.find(b=>b.id===id);
    return body && props.moonParent === id ? Math.max(body.displayRadius, ...bodies.filter(b=>b.parentId===id).map(m=>m.orbitRadius+m.displayRadius)) : body?.displayRadius;
  };
  const selectedRef = useRef<{ mode: string; radius?: number }>({
    mode: props.mode,
  });
  const manual = useRef(false);
  useEffect(() => {
    selectedRef.current = {
      mode: props.mode,
      radius: frameRadius(props.selected),
    };
  // The primitive navigation values refresh the controls' current bounding radius.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, props.selected, props.moonParent, bodies]);
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
  const selected =
    props.mode === "solar"
      ? bodies.find((b) => b.id === props.selected)
      : undefined;
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
      manual.current = true;
      lastFrame.current = 0;
      c.maxDistance = Math.max(
        c.getDistance(),
        selectedRef.current.mode === "compare" ? c.maxDistance : selectedRef.current.mode === "galaxy"
          ? 500
          : selectedRef.current.radius
            ? selectedRef.current.radius * 24
            : 420,
      );
      const el = document.querySelector<HTMLElement>('[data-testid="scene"]');
      if (el) el.dataset.flight = "false";
      invalidate();
    };
    const end = () => {
      manual.current = false;
    };
    c.addEventListener("end", end);
    c.addEventListener("change", change);
    c.addEventListener("start", start);
    return () => {
      c.removeEventListener("end", end);
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
    c.enableRotate = props.mode !== "compare" && props.mode !== "light";
    if (props.mode === "neighborhood") {
      flight.current=null; scaleTransition.current=null; worlds.blend.value=0; transitionMode.current=props.mode;
      const r=props.neighborhoodRange/100,fit=Math.max(r*3.3,r*3.4/Math.max(size.width/size.height,.15));
      c.target.set(0,0,0); camera.position.set(.35*fit,.6*fit,.8*fit); c.minDistance=r*.4; c.maxDistance=r*12; c.enableDamping=!props.reduced; c.update(); invalidate(); return;
    }
    if (props.mode === "light") {
      flight.current = null; scaleTransition.current = null; worlds.blend.value=0; transitionMode.current=props.mode;
      c.enableDamping=false; c.target.set(-1.5,-1.6,0);
      const fit=Math.max(17,52/Math.max(size.width/size.height,.15))/(2*Math.tan(23*Math.PI/180));
      camera.position.set(-1.5,-1.6,fit); c.minDistance=fit*.85; c.maxDistance=fit*3; c.update(); invalidate(); return;
    }
    if (props.mode === "compare") {
      flight.current = null;
      scaleTransition.current = null;
      worlds.blend.value = 0;
      transitionMode.current = props.mode;
      c.enableDamping = false;
      c.target.set(0, -0.3, 0);
      const layout = comparisonLayout(props.comparison.left.diameterKm, props.comparison.right.diameterKm);
      const height = Math.max(9, (layout.width + 1.8) / Math.max(size.width / size.height, 0.15));
      const fit = height / (2 * Math.tan(23 * Math.PI / 180));
      camera.position.set(0, -0.3, fit);
      c.minDistance = fit * 0.85;
      c.maxDistance = fit * 3;
      c.update();
      invalidate();
      return;
    }
    if (transitionMode.current !== props.mode) {
      scaleTransition.current = { from: worlds.blend.value, elapsed: 0 };
      transitionMode.current = props.mode;
    }
    const start = new THREE.Vector3(
      ...(selected
        ? worldPosition(selected, props.simulation.current.days, bodies)
        : [0, 0, 0]),
    );
    following.current.copy(start);
    c.minDistance = 0.1;
    c.maxDistance = 600;
    c.enableDamping = false;
    c.update();
    if (!started.current && !selected && props.mode === "solar") {
      started.current = true;
      const d = size.width < 700 ? Math.max(100, 120 / Math.max(size.width / size.height, 0.2)) : 100;
      camera.position.set(d * 0.35, d * 0.65, d * 0.82);
      camera.lookAt(start);
      c.update();
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
  }, [props.mode, props.selected, props.navigation]);
  useEffect(() => {
    const c = controls.current;
    if (props.mode === "neighborhood" && c) {
      const r=props.neighborhoodRange/100,fit=Math.max(r*3.3,r*3.4/Math.max(size.width/size.height,.15));
      c.target.set(0,0,0); camera.position.set(.35*fit,.6*fit,.8*fit); c.minDistance=r*.4; c.maxDistance=r*12; c.update(); invalidate(); return;
    }
    if (props.mode === "light" && c) {
      const fit=Math.max(17,52/Math.max(size.width/size.height,.15))/(2*Math.tan(23*Math.PI/180));
      c.target.set(-1.5,-1.6,0); camera.position.set(-1.5,-1.6,fit); c.minDistance=fit*.85; c.maxDistance=fit*3; c.update(); invalidate(); return;
    }
    if (props.mode === "compare" && c) {
      const layout = comparisonLayout(props.comparison.left.diameterKm, props.comparison.right.diameterKm);
      const fit = Math.max(9, (layout.width + 1.8) / Math.max(size.width / size.height, 0.15)) / (2 * Math.tan(23 * Math.PI / 180));
      c.target.set(0,-0.3,0); camera.position.set(0,-0.3,fit);
      c.minDistance=fit*.85; c.maxDistance=fit*3; c.update(); invalidate(); return;
    }
    if (props.mode !== "galaxy" || !c || flight.current) return;
    const fit = Math.max(110, 138 / Math.max(size.width / size.height, 0.2));
    if (c.getDistance() < fit) {
      temp.diff.subVectors(camera.position, c.target).setLength(fit);
      camera.position.copy(c.target).add(temp.diff);
      c.update();
      invalidate();
    }
  }, [size.width, size.height, props.mode, props.comparison.left.diameterKm, props.comparison.right.diameterKm, props.neighborhoodRange, camera, invalidate, temp]);
  useEffect(()=>{lastFrame.current=0;invalidate();},[props.lightVersion,invalidate]);
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
    let ready = false;
    const original = scene.onAfterRender;
    scene.onAfterRender = () => {
      const el = document.querySelector<HTMLElement>('[data-testid="scene"]');
      if (
        !ready &&
        gl.info.render.calls > 0 &&
        (props.mode !== "galaxy" || worlds.galaxyReady.current)
      ) {
        ready = true;
        props.onReady();
      }
      if (el) {
        el.dataset.draws = String(gl.info.render.calls);
        el.dataset.triangles = String(gl.info.render.triangles);
        el.dataset.points = String(gl.info.render.points);
        if(props.mode === "neighborhood" || props.mode === "galaxy") {
          const values:Record<string,number[]>={};
          for(const system of planetarySystems) {
            const object=scene.getObjectByName(`${props.mode === "galaxy" ? "galaxy-system" : "neighborhood"}-${system.id}`);
            if(object) values[system.id]=object.getWorldPosition(new THREE.Vector3()).toArray();
          }
          el.dataset[props.mode === "galaxy" ? "galaxySystems" : "neighborhoodPositions"]=JSON.stringify(values);
        }
        if(props.mode === "light") {
          el.dataset.lightSeconds = String(props.lightClock.current.seconds);
          el.dataset.pulseX = String(scene.getObjectByName("light-pulse")?.position.x);
        }
      }
    };
    return () => {
      scene.onAfterRender = original;
    };
    // readiness is tied to an actual render of the current navigation target
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, gl, props.mode, props.navigation, props.onReady]);
  useFrame((state) => {
    if (props.hidden || document.hidden) {
      lastFrame.current = 0;
      return;
    }
    // Control actions replace the simulation object. Reset before consuming any elapsed time,
    // including when a demand frame runs before React's passive effects.
    if (clockMode.current !== props.mode) {
      lastFrame.current = 0;
      clockMode.current = props.mode;
    }
    if (clockState.current !== props.simulation.current) {
      lastFrame.current = 0;
      clockState.current = props.simulation.current;
    }
    const now = performance.now(),
      rawDt = lastFrame.current ? (now - lastFrame.current) / 1000 : 0,
      dt = Math.min(rawDt, 0.1);
    lastFrame.current = now;
    const sim = props.simulation.current;
    if (props.mode === "solar" && !sim.paused) sim.days += rawDt * sim.speed;
    if (props.mode === "light") advanceLight(props.lightClock.current, rawDt);
    const scale = scaleTransition.current;
    if (scale) {
      scale.elapsed += dt;
      const progress = props.reduced ? 1 : Math.min(scale.elapsed / 1.65, 1),
        ease = progress * progress * (3 - 2 * progress);
      worlds.blend.value = THREE.MathUtils.lerp(
        scale.from,
        props.mode === "galaxy" ? 1 : 0,
        ease,
      );
      if (progress === 1) scaleTransition.current = null;
    }
    const blend = worlds.blend.value,
      solarScale = Math.exp(-blend * 11.5);
    if (worlds.solar.current) {
      worlds.solar.current.visible = (props.mode === "solar" || props.mode === "galaxy") && blend < 0.99999;
      worlds.solar.current.scale.setScalar(solarScale);
      worlds.solar.current.position.set(
        solarPosition[0] * blend,
        0,
        solarPosition[2] * blend,
      );
    }
    if (worlds.galaxy.current) worlds.galaxy.current.visible = (props.mode === "solar" || props.mode === "galaxy") && blend > 0.00001;

    const c = controls.current;
    if (!c) return;
    if (selected) {
      temp.pos
        .set(...worldPosition(selected, sim.days, bodies))
        .multiplyScalar(solarScale);
      temp.pos.x += solarPosition[0] * blend;
      temp.pos.z += solarPosition[2] * blend;
    } else if (props.mode === "solar")
      temp.pos.set(solarPosition[0] * blend, 0, solarPosition[2] * blend);
    else temp.pos.set(0, 0, 0);
    const f = flight.current;
    if (f) {
      f.elapsed += dt;
      const t = props.reduced ? 1 : Math.min(f.elapsed / 1.65, 1),
        e = t * t * (3 - 2 * t);
      const r = frameRadius(props.selected) || 0;
      if (selected) {
        const local = selected.parentId ? orbitalPosition(selected, sim.days) : null;
        const angle = local ? Math.atan2(local[2], local[0]) + 0.35 : Math.atan2(temp.pos.z, temp.pos.x) + 2.4;
        const d = r * (props.moonParent === selected.id ? 3.4 : selected.id === "saturn" ? 8 : size.width < 700 ? 7.5 : 6.5);
        temp.dest.set(
          temp.pos.x + Math.cos(angle) * d,
          temp.pos.y + r * 2.3,
          temp.pos.z + Math.sin(angle) * d,
        );
      } else if (props.mode === "galaxy") {
        const fit = Math.max(
          110,
          138 / Math.max(size.width / size.height, 0.2),
        );
        temp.dest.set(0.326 * fit, 0.632 * fit, 0.707 * fit);
      } else {
        const d = size.width < 700 ? Math.max(100, 120 / Math.max(size.width / size.height, 0.2)) : 100;
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
        c.minDistance =
          props.mode === "galaxy"
            ? 35
            : selected
              ? selected.displayRadius * (selected.id === "saturn" ? 2.6 : 1.6)
              : 5;
        c.maxDistance =
          props.mode === "galaxy"
            ? 500
            : selected
              ? (frameRadius(props.selected) || selected.displayRadius) * 24
              : 420;
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
    if (props.mode === "solar" && blend < 0.0001)
      for (const b of bodies) {
        temp.look.set(...worldPosition(b, sim.days, bodies));
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
      el.dataset.mode = props.mode;
      el.dataset.scaleFlight = String(!!scaleTransition.current);
      el.dataset.galaxyBlend = String(blend);
      el.dataset.quality = high ? "high" : "low";
      el.dataset.pixelRatio = String(gl.getPixelRatio());

      el.dataset.frames = String(frames.current);
      el.dataset.days = String(sim.days);
      el.dataset.flight = String(!!flight.current);
      el.dataset.target =
        props.mode !== "solar" ? props.mode : props.selected || "overview";

      el.dataset.camera = camera.position
        .toArray()
        .map((v) => v.toFixed(3))
        .join(",");
      if (selected) {
        temp.look.copy(temp.pos).project(camera);
        el.dataset.projected = temp.look.toArray().join(",");
      }
    }

    const s = sample.current;
    if (
      rawDt > 0 &&
      ((props.mode === "solar" && !sim.paused) ||
        flight.current ||
        manual.current)
    ) {
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
    if (
      (props.mode === "solar" && !sim.paused && sim.speed > 0) ||
      flight.current ||
      scaleTransition.current ||
      (props.mode === "light" && props.lightClock.current.playing)
    )
      state.invalidate();
  });
  return null;
}
export default function SolarScene(props: SceneProps) {
  const bodies = props.bodies;
  const portal = useRef<HTMLDivElement>(null);
  const solarWorld = useRef<THREE.Group>(null),
    galaxyWorld = useRef<THREE.Group>(null),
    galaxyReady = useRef(false);
  const blend = useRef({ value: props.mode === "galaxy" ? 1 : 0 }).current;
  const worlds = useMemo<Worlds>(
    () => ({ solar: solarWorld, galaxy: galaxyWorld, blend, galaxyReady }),
    [blend],
  );
  const [keepGalaxy, setKeepGalaxy] = useState(false);
  useEffect(() => {
    if (props.mode === "galaxy") setKeepGalaxy(true);
  }, [props.mode]);
  const invalidateGal = useRef<() => void>(() => {});
  const onGalaxyReady = useMemo(
    () => () => {
      galaxyReady.current = true;
      invalidateGal.current();
    },
    [],
  );

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
        aria-label={
          props.mode === "galaxy"
            ? props.language === "en"
              ? "Interactive 3D Milky Way"
              : "Interaktywna Droga Mleczna 3D"
            : props.systemId === "solar" ? translate(props.language, "Interaktywny Układ Słoneczny 3D") : `${props.systemId} · ${props.language === "en" ? "interactive planetary system in 3D" : "interaktywny układ planetarny 3D"}`
        }
        onCreated={(state) => {
          invalidateGal.current = state.invalidate;
        }}
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
        <Engine
          props={{ ...props, onQuality: quality }}
          high={high}
          worlds={worlds}
        />
        {props.mode === "neighborhood" && <Neighborhood language={props.language} range={props.neighborhoodRange} portal={portal} onSystem={props.onSystem} labels={props.labels}/>}
        {props.mode === "light" && <LightTravel clock={props.lightClock} bodies={props.solarBodies} target={props.lightTarget} portal={portal} language={props.language} />}
        {props.mode === "compare" && <Comparison left={props.comparison.left} right={props.comparison.right} high={high} portal={portal} onReady={invalidateGal.current} />}
        <group ref={solarWorld}>
          <pointLight
            position={[0, 0, 0]}
            color={props.starColor}
            intensity={3.2}
            decay={0}
          />

          <Particles high={high} asteroidBelt={props.systemId === "solar"} />
          {props.orbits &&
            bodies
              .slice(1).filter(b=>!b.parentId)
              .map((body) => (
                <Orbit
                  key={body.id}
                  body={body}
                  selected={props.selected === body.id}
                />
              ))}
          {props.orbits && props.moonParent && <SatelliteOrbits props={props} />}
          {bodies.map((body) => (
            <Planet
              key={body.id}
              body={body}
              props={props}
              high={high}
              portal={portal}
              host={solarWorld}
            />
          ))}
        </group>
        <group ref={galaxyWorld} visible={false}>
          {(props.mode === "galaxy" || keepGalaxy) && (
            <Suspense fallback={null}>
              <Galaxy
                high={high}
                language={props.language}
                onEnter={props.onEnterSolar}
                onSystem={props.onSystem}
                onNeighborhood={props.onNeighborhood}
                labels={props.mode === "galaxy" && props.labels}
                portal={portal}
                fade={blend}
                onReady={onGalaxyReady}
              />
            </Suspense>
          )}
        </group>
      </Canvas>
      <div ref={portal} className="labels-layer" />
    </>
  );
}
