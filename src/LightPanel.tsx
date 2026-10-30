import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Body } from "./data/bodies";
import type { Language } from "./i18n";
import { lightArrivalSeconds, MAX_LIGHT_SECONDS, resetLight } from "./lib/light-clock";
import type { LightClock } from "./lib/light-clock";

function duration(seconds: number) {
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600), minutes = Math.floor(whole % 3600 / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${(whole % 60).toString().padStart(2, "0")}`;
}

export default function LightPanel({ language, clock, bodies, target, onTarget, onChange, onClose }: {
  language: Language;
  clock: RefObject<LightClock>;
  bodies: readonly Body[];
  target: string;
  onTarget: (id: string) => void;
  onChange: () => void;
  onClose: () => void;
}) {
  const en = language === "en", heading = useRef<HTMLHeadingElement>(null);
  const [snapshot, setSnapshot] = useState(() => ({ ...clock.current }));
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const timer = setInterval(() => setSnapshot(previous => {
      const next = clock.current;
      return previous.seconds === next.seconds && previous.playing === next.playing && previous.speed === next.speed
        ? previous : { ...next };
    }), 200);
    return () => clearInterval(timer);
  }, [clock]);
  const planets = bodies.filter(body => !body.parentId && body.distanceMillionKm !== null && body.distanceMillionKm > 0);
  const selected = planets.find(body => body.id === target) ?? planets[2];
  const arrival = lightArrivalSeconds(selected.distanceMillionKm!);
  const changed = () => { setSnapshot({ ...clock.current }); onChange(); };
  return <section className="light-panel" aria-label={en ? "Light journey" : "Podróż światła"}>
    <div className="light-panel-top">
      <h2 ref={heading} tabIndex={-1}>{en ? "Light journey" : "Podróż światła"}</h2>
      <output className="light-counter" aria-label={en ? "Elapsed light time" : "Czas podróży światła"}>{duration(snapshot.seconds)}</output>
      <button className="light-close" onClick={onClose} aria-label={en ? "Close light journey" : "Zamknij podróż światła"}>×</button>
    </div>
    <div className="light-target-row">
      <label className="light-target"><span className="light-sr-only">{en ? "Light destination" : "Cel podróży światła"}</span>
        <select value={target} onChange={event => onTarget(event.target.value)}>
          {planets.map(body => <option key={body.id} value={body.id}>{body.name}</option>)}
        </select>
      </label>
      <button className="light-arrival" aria-label={en ? "Jump to arrival" : "Przejdź do dotarcia światła"} onClick={() => {
        clock.current.seconds = arrival; clock.current.playing = false; changed();
      }}>
        <strong>{duration(arrival)}</strong><span>{en ? "Jump to arrival →" : "Światło dociera →"}</span>
      </button>
    </div>
    <div className="light-transport">
      <button className="light-play" aria-label={snapshot.playing ? (en ? "Pause light pulse" : "Wstrzymaj impuls światła") : (en ? "Start light pulse" : "Uruchom impuls światła")} onClick={() => {
        if (!clock.current.playing && clock.current.seconds >= MAX_LIGHT_SECONDS) clock.current.seconds = 0;
        clock.current.playing = !clock.current.playing; changed();
      }}><span aria-hidden="true">{snapshot.playing ? "Ⅱ" : "▷"}</span>{snapshot.playing ? (en ? "Pause" : "Pauza") : (en ? "Play" : "Odtwórz")}</button>
      <button className="light-reset" aria-label={en ? "Reset light pulse" : "Resetuj impuls światła"} onClick={() => { resetLight(clock.current); changed(); }}><span aria-hidden="true">↺</span></button>
      <label className="light-speed"><span className="light-sr-only">{en ? "Light playback speed" : "Tempo podróży światła"}</span>
        <select value={snapshot.speed} onChange={event => { clock.current.speed = Number(event.target.value); changed(); }}>
          <option value="60">1 min / s</option><option value="600">10 min / s</option>
        </select>
      </label>
    </div>
    <input className="light-scrubber" type="range" min="0" max={MAX_LIGHT_SECONDS} step="1" value={snapshot.seconds}
      aria-label={en ? "Light travel time" : "Czas lotu światła"} aria-valuetext={duration(snapshot.seconds)} onChange={event => {
        clock.current.seconds = Number(event.target.value); clock.current.playing = false; changed();
      }} />
    <details className="light-notes"><summary>{en ? "Mean distances · sizes enlarged" : "Średnie odległości · rozmiary powiększone"}</summary>
      <p>{en
        ? "Distances share one scale. Planets are frozen and aligned for this illustration; their arrangement is not an astronomical prediction. Times approximate a centre-to-centre journey from the Sun at 299,792.458 km/s in vacuum."
        : "Odległości zachowują wspólną skalę. Planety zatrzymano i ustawiono w linii; ten układ nie przedstawia rzeczywistych pozycji astronomicznych. Czasy przybliżają podróż między środkami Słońca i planet z prędkością 299 792,458 km/s w próżni."}</p>
      <a href="https://ssd.jpl.nasa.gov/astro_par.html" target="_blank" rel="noreferrer">NASA / JPL ↗</a>
    </details>
  </section>;
}
