import { useEffect, useRef } from "react";
import type { Language } from "./i18n";
import { planetarySystems } from "./data/systems";
import type { SystemId } from "./data/systems";
import Icon from "./Icon";

export default function NeighborhoodPanel({ language, range, onRange, onSystem, onClose }: {
  language: Language;
  range: 100 | 3000;
  onRange: (range: 100 | 3000) => void;
  onSystem: (id: SystemId) => void;
  onClose: () => void;
}) {
  const en = language === "en";
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  const inRange = planetarySystems.filter(system => system.distanceLightYears <= range).length;
  return <section className="neighborhood-panel" aria-label={en ? "Stellar neighborhood" : "Sąsiedztwo Słońca"}
    data-testid="neighborhood-panel" data-range={range}>
    <header className="neighborhood-panel-heading">
      <div><span className="eyebrow">{en ? "OUR GALACTIC ADDRESS" : "NASZ GALAKTYCZNY ADRES"}</span>
        <h2 ref={heading} tabIndex={-1}>{en ? "Stellar neighborhood" : "Sąsiedztwo Słońca"}</h2></div>
      <button className="round-button" onClick={onClose} aria-label={en ? "Back to exploration" : "Powrót do eksploracji"}>
        <Icon name="close" />
      </button>
    </header>
    <div className="neighborhood-range" role="group" aria-label={en ? "Map range" : "Zasięg mapy"}>
      {([100, 3000] as const).map(value => <button key={value} aria-pressed={value === range} onClick={() => onRange(value)}>
        {value.toLocaleString(en ? "en-GB" : "pl-PL")} {en ? "ly" : "lat św."}
      </button>)}
      <span aria-live="polite">{inRange}/4 {en ? "in range" : "w zasięgu"}</span>
    </div>
    <nav className="neighborhood-catalog" aria-label={en ? "Nearby system catalogue" : "Katalog pobliskich układów"}>
      {planetarySystems.map(system => {
        const name = system.id === "solar" ? (en ? "Solar System" : "Układ Słoneczny") : system.name;
        const distance = system.distanceLightYears.toLocaleString(en ? "en-GB" : "pl-PL", { maximumFractionDigits: 2 });
        const inside = system.distanceLightYears <= range;
        return <div key={system.id} className={`neighborhood-catalog-item ${inside ? "in-range" : "outside-range"}`}>
          <button onClick={() => onSystem(system.id)} aria-label={`${en ? "Visit" : "Odwiedź"} ${name}`}>
            <span className="neighborhood-dot" style={{ backgroundColor: system.starColor }} aria-hidden="true" />
            <span><strong>{name}</strong><small>{distance} {en ? "ly away" : "lat św. od nas"}
              {!inside && <span> · {en ? "beyond range" : "poza zasięgiem"}</span>}</small></span>
            <Icon name="arrow" size={14} />
          </button>
          <a href={system.source} target="_blank" rel="noreferrer" aria-label={`${en ? "NASA source for" : "Źródło NASA dla"} ${name}`}>NASA ↗</a>
        </div>;
      })}
    </nav>
    <details className="neighborhood-map-notes">
      <summary>{en ? "About this map" : "O tej mapie"}</summary>
      <p>{en
        ? "A selection of the four systems available in Orbita, not a complete stellar catalogue. Empty space here does not mean that no other stars exist."
        : "Wybór czterech układów dostępnych w Orbicie, nie pełny katalog gwiazd. Puste miejsce na mapie nie oznacza, że nie ma tam innych gwiazd."}</p>
      <p>{en
        ? "Positions share one distance scale, using catalogue ICRS directions and distances transformed to Galactic coordinates. Markers are enlarged; labels may be offset for readability. Rings lie in the Galactic plane. Your planetary simulation is preserved."
        : "Położenia zachowują wspólną skalę odległości: katalogowe kierunki ICRS i dystanse przeliczono na współrzędne galaktyczne. Markery są powiększone, a etykiety mogą być przesunięte dla czytelności. Okręgi leżą w płaszczyźnie Galaktyki. Czas symulacji planet jest zachowany."}</p>
      <a href="https://gea.esac.esa.int/archive/documentation/GEDR3/Data_processing/chap_cu3ast/sec_cu3ast_intro/ssec_cu3ast_intro_tansforms.html" target="_blank" rel="noreferrer">ESA Gaia · {en ? "coordinate transformation" : "transformacja współrzędnych"} ↗</a>
    </details>
    <span className="neighborhood-scale-note">{en ? "Measured distances · enlarged markers" : "Katalogowe odległości · powiększone markery"}</span>
  </section>;
}
