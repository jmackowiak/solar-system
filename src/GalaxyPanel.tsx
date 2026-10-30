import { useEffect, useRef } from "react";
import type { Language } from "./i18n";
import { translate } from "./i18n";
import { galaxyCopy } from "./data/galaxy";
import Icon from "./Icon";
import { planetarySystems } from "./data/systems";
import type { SystemId } from "./data/systems";
export default function GalaxyPanel({
  language,
  onEnter,
  onSystem,
  collapsed,
  onCollapse,
}: {
  language: Language;
  onEnter: () => void;
  onSystem: (id: SystemId) => void;
  collapsed: boolean;
  onCollapse: () => void;
}) {
  const copy = galaxyCopy[language],
    t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  return (
    <section
      className={`object-panel galaxy-panel ${collapsed ? "collapsed" : ""}`}
      aria-label={t("O Drodze Mlecznej")}
    >
      <div className="mobile-handle" />
      <div className="panel-top">
        <span className="eyebrow">{t("MAPA GALAKTYKI")}</span>
        <button
          className="round-button collapse-button"
          aria-label={collapsed ? t("Rozwiń informacje") : t("Zwiń informacje")}
          aria-expanded={!collapsed}
          onClick={onCollapse}
        >
          <span className="collapse-label">{collapsed ? t("Szczegóły") : t("Zwiń")}</span>
          <Icon name="expand" />
        </button>
      </div>
      <span className="object-kind">{copy.subtitle}</span>
      <h2 ref={heading} tabIndex={-1}>
        {copy.title}
      </h2>
      <div className="panel-content">
        <p className="description">{copy.description}</p>
        <div className="galaxy-location">
          <span className="eyebrow">{t("NASZE POŁOŻENIE")}</span>
          <p>{copy.location}</p>
        </div>
        <button className="journey-button galaxy-enter" onClick={onEnter}>
          {t("Wejdź do Układu Słonecznego")}
          <Icon name="arrow" />
        </button>
        <div className="galaxy-systems">
          <span className="eyebrow">{t("UKŁADY W DRODZE MLECZNEJ")}</span>
          <p>{t("Odkryte planety innych gwiazd. Wybierz układ, aby odwiedzić jego światy.")}</p>
          {planetarySystems.filter((system) => system.id !== "solar").map((system) => <button key={system.id} aria-label={system.name} onClick={() => onSystem(system.id)}>
            <span className="system-star" style={{ background: system.starColor }} />
            <span><strong>{system.name}</strong><small>{Math.round(system.distanceLightYears).toLocaleString(language === "en" ? "en-GB" : "pl-PL")} {t("lat świetlnych od nas")}</small></span>
            <Icon name="arrow" size={15} />
          </button>)}
        </div>
        <dl>
          <div>
            <dt>{t("ODLEGŁOŚĆ OD CENTRUM")}</dt>
            <dd>{copy.distance}</dd>
          </div>
          <div>
            <dt>{t("ŚREDNICA DYSKU")}</dt>
            <dd>{copy.diameter}</dd>
          </div>
          <div>
            <dt>{t("OBIEG WOKÓŁ CENTRUM")}</dt>
            <dd>{copy.orbit}</dd>
          </div>
        </dl>
        <div className="fact">
          <span className="eyebrow">
            <Icon name="plus" size={14} />
            {t("OSOBNA SKALA")}
          </span>
          <p>{copy.approximation}</p>
        </div>
        <a
          className="source"
          href={copy.source}
          target="_blank"
          rel="noreferrer"
        >
          {copy.sourceLabel}
          <span>↗</span>
        </a>
      </div>
    </section>
  );
}
export function GalaxyFallback({
  language,
  onEnter,
}: {
  language: Language;
  onEnter: () => void;
}) {
  const en = language === "en";
  const arms = Array.from({ length: 4 }, (_, arm) =>
    Array.from({ length: 100 }, (_, i) => {
      const r = 7 + i * 0.42,
        a = (arm * Math.PI) / 2 + Math.log(r / 7) * 2;
      return `${i ? "L" : "M"}${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
    }).join(" "),
  );
  return (
    <div className="galaxy-fallback" data-testid="galaxy-fallback">
      <svg
        viewBox="-62 -62 124 124"
        role="img"
        aria-label={
          en
            ? "Schematic Milky Way with the Solar System marked"
            : "Schemat Drogi Mlecznej z zaznaczonym Układem Słonecznym"
        }
      >
        <defs>
          <radialGradient id="galaxy-core">
            <stop stopColor="#f9d4a2" stopOpacity=".8" />
            <stop offset="1" stopColor="#e2b778" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse rx="52" ry="52" fill="#1e2d3c" opacity=".3" />
        {arms.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={i % 2 ? "#63899f" : "#9baec1"}
            strokeWidth={i % 2 ? 2.5 : 4}
            opacity={i % 2 ? 0.4 : 0.7}
          />
        ))}
        <ellipse rx="21" ry="12" fill="url(#galaxy-core)" />
        <ellipse
          rx="11"
          ry="3"
          fill="#f9d4a2"
          opacity=".6"
          transform="rotate(20)"
        />
        <circle cx="22" cy="14" r="2" fill="#e9bf8b" />
        <circle
          cx="22"
          cy="14"
          r="5"
          stroke="#e9bf8b"
          strokeWidth=".5"
          fill="none"
        />
        <text x="22" y="24" textAnchor="middle" fill="#e9bf8b" fontSize="3.8">
          {en ? "You are here" : "Jesteś tutaj"}
        </text>
      </svg>
      <span className="eyebrow">
        {en ? "2D GALACTIC MAP" : "MAPA GALAKTYKI 2D"}
      </span>
      <span className="fallback-location">
        {en ? "You are here" : "Jesteś tutaj"}
      </span>
      <button className="journey-button" onClick={onEnter}>
        {en ? "Enter Solar System" : "Wejdź do Układu Słonecznego"}
        <Icon name="arrow" />
      </button>
    </div>
  );
}
