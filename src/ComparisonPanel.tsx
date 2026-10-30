import { useEffect, useRef } from "react";
import type { Body } from "./data/bodies";
import type { Language } from "./i18n";

interface Props {
  language: Language;
  left: Body;
  right: Body;
  catalog: readonly Body[];
  onLeft: (id: string) => void;
  onRight: (id: string) => void;
  onClose: () => void;
  fallback: boolean;
}

/** Compact controls remain outside WebGL, including the proportional 2D view. */
export default function ComparisonPanel({
  language, left, right, catalog, onLeft, onRight, onClose, fallback,
}: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const en = language === "en";
  const locale = en ? "en-GB" : "pl-PL";
  const number = new Intl.NumberFormat(locale);
  const ratio = new Intl.NumberFormat(locale, { maximumSignificantDigits: 3 })
    .format(right.diameterKm / left.diameterKm);
  const maximum = Math.max(left.diameterKm, right.diameterKm);
  const groups = [
    { label: en ? "Solar System" : "Układ Słoneczny", bodies: catalog.filter(body => !body.parentId && !body.id.includes("-")) },
    { label: en ? "Exoplanets" : "Egzoplanety", bodies: catalog.filter(body => !body.parentId && body.id.includes("-")) },
    { label: en ? "Moons" : "Księżyce", bodies: catalog.filter(body => body.parentId) },
  ];
  const field = (body: Body, side: "left" | "right", onChange: (id: string) => void) => (
    <label className="comparison-field" htmlFor={`comparison-${side}`}>
      <span>{side === "left" ? (en ? "First object" : "Pierwszy obiekt") : (en ? "Second object" : "Drugi obiekt")}</span>
      <select id={`comparison-${side}`} value={body.id} onChange={event => onChange(event.target.value)}>
        {groups.map(group => <optgroup key={group.label} label={group.label}>
          {group.bodies.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
        </optgroup>)}
      </select>
      <span className="comparison-diameter">{number.format(body.diameterKm)} km</span>
    </label>
  );
  return (
    <>
      {fallback && <div className="comparison-fallback" role="img"
        aria-label={en
          ? `${left.name} and ${right.name} at the same scale. Diameter ratio, second to first: ${ratio}.`
          : `${left.name} i ${right.name} w jednej skali. Stosunek średnic drugiego do pierwszego: ${ratio}.`}>
        {[left, right].map((body, index) => <div className="comparison-fallback-item" key={index}>
          <div className="comparison-fallback-sphere" style={{
            width: `${body.diameterKm / maximum * 100}%`,
            background: `radial-gradient(circle at 32% 30%, ${body.color}, #141a23 88%)`,
          }} />
          <span className="comparison-fallback-caption">{body.name}</span>
        </div>)}
      </div>}
      <section className="comparison-panel" aria-label={en ? "Size comparison" : "Porównanie rozmiarów"}>
        <div className="comparison-top">
          <h2 ref={heading} tabIndex={-1}>{en ? "Size comparison" : "Porównanie rozmiarów"}</h2>
          <div className="comparison-ratio" aria-label={en ? "Diameter ratio, second to first" : "Stosunek średnic drugiego do pierwszego"}>
            <strong>{ratio}×</strong><span>{en ? "second / first" : "drugi / pierwszy"}</span>
          </div>
          <button className="comparison-close" onClick={onClose} aria-label={en ? "Close comparison" : "Zamknij porównanie"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="comparison-fields">{field(left, "left", onLeft)}{field(right, "right", onRight)}</div>
        <p className="comparison-note">{en
          ? "One scale · solid-body diameters, rings omitted. Exoplanet sizes are estimates; surfaces are artistic impressions."
          : "Jedna skala · średnice brył, bez pierścieni. Rozmiary egzoplanet są szacunkowe; powierzchnie to wizje artystyczne."}</p>
      </section>
    </>
  );
}
