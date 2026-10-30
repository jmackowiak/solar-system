import { useEffect, useRef } from "react";
import type { Language } from "./i18n";
import { illuminatedFraction } from "./lib/discovery";
import Icon from "./Icon";

type Scenario = "phases" | "solar" | "lunar";
function phaseName(angle: number, en: boolean) {
  const a = ((angle % 360) + 360) % 360;
  if (a < 1 || a > 359) return en ? "New Moon" : "Nów";
  if (Math.abs(a - 90) < 1) return en ? "First quarter" : "Pierwsza kwadra";
  if (Math.abs(a - 180) < 1) return en ? "Full Moon" : "Pełnia";
  if (Math.abs(a - 270) < 1) return en ? "Last quarter" : "Ostatnia kwadra";
  if (a < 90) return en ? "Waxing crescent" : "Przybywający sierp";
  if (a < 180) return en ? "Waxing gibbous" : "Przybywający garb";
  if (a < 270) return en ? "Waning gibbous" : "Ubywający garb";
  return en ? "Waning crescent" : "Ubywający sierp";
}
function illuminatedPath(angle: number) {
  const a = angle * Math.PI / 180, cosine = Math.cos(a), waxing = angle <= 180;
  const r = 28, rx = Math.abs(cosine) * r;
  const outerSweep = waxing ? 1 : 0;
  const terminatorSweep = waxing ? (cosine < 0 ? 1 : 0) : (cosine < 0 ? 0 : 1);
  return `M 0 ${-r} A ${r} ${r} 0 0 ${outerSweep} 0 ${r} ${rx < 0.00001
    ? `L 0 ${-r}` : `A ${rx} ${r} 0 0 ${terminatorSweep} 0 ${-r}`} Z`;
}

export default function PhasesPanel({ language, angle, scenario, onAngle, onScenario, onClose }: {
  language: Language; angle: number; scenario: Scenario;
  onAngle: (angle: number) => void; onScenario: (scenario: Scenario) => void; onClose: () => void;
}) {
  const en = language === "en";
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  const percentage = Math.round(illuminatedFraction(angle * Math.PI / 180) * 100);
  const name = phaseName(angle, en);
  const scenarios: [Scenario, string][] = [["phases", en ? "Moon phases" : "Fazy Księżyca"],
    ["solar", en ? "Solar eclipse" : "Zaćmienie Słońca"], ["lunar", en ? "Lunar eclipse" : "Zaćmienie Księżyca"]];
  const presets = [[0, en ? "New" : "Nów"], [90, en ? "First quarter" : "I kwadra"],
    [180, en ? "Full" : "Pełnia"], [270, en ? "Last quarter" : "III kwadra"]] as const;
  return <section className="phases-panel" aria-label={en ? "Moon phases and eclipses" : "Fazy Księżyca i zaćmienia"}
    data-testid="phases-panel" data-angle={angle} data-scenario={scenario}>
    <header className="phases-panel-heading"><div><span className="eyebrow">{en ? "LIGHT AND SHADOW" : "ŚWIATŁO I CIEŃ"}</span>
      <h2 ref={heading} tabIndex={-1}>{en ? "Moon phases" : "Fazy Księżyca"}</h2></div>
      <button className="round-button" onClick={onClose} aria-label={en ? "Back to exploration" : "Powrót do eksploracji"}><Icon name="close" /></button>
    </header>
    <div className="phases-scenario"><label htmlFor="phases-scenario">{en ? "Scenario" : "Scenariusz"}</label>
      <select id="phases-scenario" value={scenario} onChange={event => onScenario(event.target.value as Scenario)}>
        {scenarios.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
    </div>
    <div className="phases-observation" aria-live="polite">
      <svg viewBox="-32 -32 64 64" role="img" aria-label={`${name}: ${percentage}% ${en ? "illuminated before eclipse shadowing" : "oświetlenia przed uwzględnieniem zaćmienia"}`}>
        <circle r="28" fill="#19242e" stroke="#8c9ba34d" strokeWidth="0.6" />
        <path d={illuminatedPath(angle)} fill="#d9d5c9" />
      </svg>
      <div><span className="eyebrow">{en ? "AS SEEN FROM EARTH" : "WIDOK Z ZIEMI"}</span>
        <strong>{name}</strong><span><b data-testid="phase-illumination">{percentage}%</b> {en ? "sunlit disk" : "oświetlonej tarczy"}</span>
        {scenario === "lunar" && <small>{en ? "Phase shown before eclipse darkening" : "Faza przed pociemnieniem podczas zaćmienia"}</small>}
      </div>
    </div>
    <div className="phases-slider"><label htmlFor="moon-angle">{en ? "Moon position" : "Pozycja Księżyca"}<output htmlFor="moon-angle">{angle}°</output></label>
      <input id="moon-angle" type="range" min="0" max="360" step="1" value={angle}
        onChange={event => onAngle(Number(event.target.value))} aria-valuetext={`${angle}°, ${name}, ${percentage}%`} />
    </div>
    <div className="phases-presets" role="group" aria-label={en ? "Primary phases" : "Podstawowe fazy"}>
      {presets.map(([value, label]) => <button key={value} aria-pressed={angle % 360 === value} onClick={() => onAngle(value)}>{label}</button>)}
    </div>
    <p className="phases-alignment" aria-live="polite">{scenario === "phases"
      ? (en ? "The Sun lights half the Moon. Its changing position reveals a different part of that half." : "Słońce oświetla połowę Księżyca. Zmiana położenia odsłania nam inną część tej połowy.")
      : scenario === "solar"
        ? (en ? "Sun → Moon → Earth. Near new Moon, the Moon’s narrow shadow can reach Earth." : "Słońce → Księżyc → Ziemia. Blisko nowiu wąski cień Księżyca może dosięgnąć Ziemi.")
        : (en ? "Sun → Earth → Moon. Near full Moon, the Moon can pass through Earth’s shadow." : "Słońce → Ziemia → Księżyc. Blisko pełni Księżyc może przejść przez cień Ziemi.")}</p>
    <details className="phases-notes"><summary>{en ? "Why not every month?" : "Dlaczego nie co miesiąc?"}</summary>
      <p>{en ? "The Moon’s orbit is tilted by about 5.14°. Most new and full Moons pass above or below the alignment needed for an eclipse. The phase scenario includes this tilt; eclipse scenarios deliberately align the orbital nodes with the Sun." : "Orbita Księżyca jest nachylona o około 5,14°. Podczas większości nowiów i pełni Księżyc mija ustawienie wymagane do zaćmienia, przechodząc wyżej lub niżej. Scenariusz faz pokazuje nachylenie, a scenariusze zaćmień celowo ustawiają węzły w kierunku Słońca."}</p>
      <p>{en ? "Educational model: distances and shadow cones are exaggerated for clarity. Cone shading is an analytic illustration, not a prediction of eclipse contacts, duration or visibility. The Moon/Earth diameter ratio is preserved; phase appearance uses parallel sunlight and a northern-hemisphere orientation." : "Model dydaktyczny: odległości i stożki cienia są umowne dla czytelności. Zacienienie jest ilustracją analityczną, nie prognozą kontaktów, czasu ani widoczności zaćmienia. Zachowano stosunek średnic Księżyca i Ziemi; widok faz zakłada równoległe światło i orientację z półkuli północnej."}</p>
      <a href="https://science.nasa.gov/moon/eclipses/" target="_blank" rel="noreferrer">NASA · {en ? "Moon phases and eclipses" : "fazy i zaćmienia"} ↗</a>
    </details>
    <span className="phases-model-note">{en ? "Educational model · not a live prediction" : "Model dydaktyczny · nie bieżąca prognoza"}</span>
  </section>;
}
