import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { bodies as physicalBodies } from "./data/bodies";
import { englishBodyCopy, englishTourStops } from "./data/body-translations";
import { useLanguage } from "./i18n";
import type { Language } from "./i18n";
import { control, initialSimulation } from "./lib/simulation";
import type { Quality } from "./scene/types";
import Icon from "./Icon";
import GalaxyPanel, { GalaxyFallback } from "./GalaxyPanel";
import type { ViewMode } from "./scene/types";
const SolarScene = lazy(() => import("./scene/SolarScene"));
const polishStops = [
  {
    id: "sun",
    title: "Gwiazda, która daje nam życie",
    text: "Niemal cała masa naszego układu skupia się tutaj. W jądrze Słońca wodór przemienia się w hel — i uwalnia energię.",
  },
  {
    id: "earth",
    title: "Nasz błękitny adres",
    text: "Oceany, cienka atmosfera i niezwykła równowaga. To jedyny świat, na którym znamy życie.",
  },
  {
    id: "jupiter",
    title: "Świat bez stałego lądu",
    text: "Spójrz na pasy chmur. W atmosferze tego gazowego olbrzyma szaleją burze większe od Ziemi.",
  },
  {
    id: "saturn",
    title: "Miliardy drobin, jeden pierścień",
    text: "Z daleka wyglądają jak gładka tafla. Z bliska pierścienie Saturna to niezliczone kawałki lodu i skał.",
  },
  {
    id: "neptune",
    title: "Na krańcu planetarnej podróży",
    text: "Światło Słońca dociera tu po około czterech godzinach. Dalej rozciąga się królestwo lodowych światów.",
  },
];
function canRender() {
  if (new URLSearchParams(location.search).has("fallback")) return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const bodies = useMemo(
    () =>
      physicalBodies.map((body) =>
        language === "en" ? { ...body, ...englishBodyCopy[body.id] } : body,
      ),
    [language],
  );
  const [mode, setMode] = useState<ViewMode>("solar");
  const stops = language === "en" ? englishTourStops : polishStops;
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const simulation = useRef(initialSimulation(reduced));
  const [paused, setPaused] = useState(reduced),
    [speed, setSpeed] = useState(8),
    [days, setDays] = useState(0);
  const [selected, setSelected] = useState<string | null>(null),
    [navigation, setNavigation] = useState(0),
    [orbits, setOrbits] = useState(true),
    [labels, setLabels] = useState(true),
    [quality, setQuality] = useState<Quality>("auto"),
    [autoQuality, setAutoQuality] = useState("high");
  const [settings, setSettings] = useState(false),
    [about, setAbout] = useState(false),
    [tour, setTour] = useState<number | null>(null),
    [collapsed, setCollapsed] = useState(false);
  const [fallback, setFallback] = useState(() => !canRender()),
    [ready, setReady] = useState(false),
    [textureErrors, setTextureErrors] = useState(0),
    [loaded, setLoaded] = useState(0),
    [textureVersion, setTextureVersion] = useState(0),
    [hidden, setHidden] = useState(document.hidden);
  const panel = useRef<HTMLHeadingElement>(null),
    lastTrigger = useRef<HTMLElement | null>(null),
    settingsButton = useRef<HTMLButtonElement>(null),
    aboutButton = useRef<HTMLButtonElement>(null),
    aboutDialog = useRef<HTMLDialogElement>(null);
  const body = bodies.find((b) => b.id === selected);
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      if (fallback && mode === "solar" && !hidden && !simulation.current.paused)
        simulation.current.days +=
          ((now - last) / 1000) * simulation.current.speed;
      last = now;
      setDays(simulation.current.days);
    }, 200);
    return () => clearInterval(id);
  }, [fallback, hidden, mode]);
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(m.matches);
      if (m.matches) {
        simulation.current = control(simulation.current, { type: "pause" });
        setPaused(true);
      }
    };
    m.addEventListener("change", change);
    return () => m.removeEventListener("change", change);
  }, []);
  const select = useCallback((id: string) => {
    setMode("solar");
    lastTrigger.current = document.querySelector<HTMLElement>(
      `.object-nav button[data-body-id="${id}"]`,
    );
    setSelected(id);
    setNavigation((n) => n + 1);
    setCollapsed(false);
  }, []);
  const home = useCallback(() => {
    setMode("solar");
    setSelected(null);
    setNavigation((n) => n + 1);
    setTour(null);
    lastTrigger.current?.focus();
  }, []);
  useEffect(() => {
    if (selected) panel.current?.focus({ preventScroll: true });
  }, [selected]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (about) {
          setAbout(false);
          aboutButton.current?.focus();
        } else if (settings) {
          setSettings(false);
          settingsButton.current?.focus();
        } else home();
      }
      if (
        mode === "solar" &&
        e.code === "Space" &&
        (e.target === document.body || e.target instanceof HTMLCanvasElement)
      ) {
        e.preventDefault();
        simulation.current = control(simulation.current, {
          type: simulation.current.paused ? "resume" : "pause",
        });
        setPaused(simulation.current.paused);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [about, settings, home, mode]);
  useEffect(() => {
    if (about) aboutDialog.current?.showModal();
    else aboutDialog.current?.close();
  }, [about]);
  const onReady = useCallback(() => {
      performance.mark("orbita-ready");
      setReady(true);
    }, []),
    onFailure = useCallback(() => {
      setFallback(true);
      setReady(false);
    }, []),
    onTexture = useCallback(
      (ok: boolean) =>
        ok ? setLoaded((n) => n + 1) : setTextureErrors((n) => n + 1),
      [],
    ),
    onQuality = useCallback((q: "low" | "high") => setAutoQuality(q), []);
  const togglePause = () => {
    simulation.current = control(simulation.current, {
      type: paused ? "resume" : "pause",
    });
    setPaused(!paused);
  };
  const toggleReduced = () => {
    const r = !reduced;
    setReduced(r);
    if (r) {
      simulation.current = control(simulation.current, { type: "pause" });
      setPaused(true);
    }
  };
  const switchMode = (next: ViewMode) => {
    if (mode !== next && !fallback) setReady(false);
    setMode(next);
    setSelected(null);
    setTour(null);
    setSettings(false);
    setCollapsed(false);
    setNavigation((n) => n + 1);
  };
  const enterSolar = useCallback(() => {
    if (!fallback) setReady(false);
    setMode("solar");
    setSelected(null);
    setTour(null);
    setCollapsed(false);
    setNavigation((n) => n + 1);
  }, [fallback]);
  const reset = () => {
    simulation.current = initialSimulation(reduced);
    setDays(0);
    setSpeed(8);
    setPaused(reduced);
    home();
  };
  const step = (index: number) => {
    setTour(index);
    select(stops[index].id);
  };
  const format = (n: number) =>
    new Intl.NumberFormat(language === "en" ? "en-GB" : "pl-PL", {
      maximumFractionDigits: 2,
    }).format(n);
  return (
    <main
      className={`app ${body || mode === "galaxy" ? "has-selection" : ""} ${mode === "galaxy" ? "galaxy-mode" : "solar-mode"} ${reduced ? "reduced" : ""}`}
    >
      <div
        className="space"
        data-testid="scene"
        data-ready={ready ? "true" : "false"}
        data-mode={mode}
        data-target={mode === "galaxy" ? "galaxy" : selected || "overview"}
        data-flight="false"
        data-frames="0"
        data-draws="0"
      >
        {!fallback ? (
          <SceneBoundary onError={onFailure}>
            <Suspense
              fallback={
                <div className="scene-loader">
                  <span className="loading-orbit" />
                  {t("Przygotowywanie obserwatorium…")}
                </div>
              }
            >
              <SolarScene
                mode={mode}
                onEnterSolar={enterSolar}
                language={language}
                simulation={simulation}
                selected={selected}
                navigation={navigation}
                reduced={reduced}
                hidden={hidden}
                orbits={orbits}
                labels={labels}
                quality={quality}
                textureVersion={textureVersion}
                onSelect={select}
                onReady={onReady}
                onFailure={onFailure}
                onQuality={onQuality}
                onTexture={onTexture}
              />
            </Suspense>
          </SceneBoundary>
        ) : mode === "galaxy" ? (
          <GalaxyFallback language={language} onEnter={enterSolar} />
        ) : (
          <div className="fallback" data-testid="fallback">
            <div className="flat-system">
              {bodies.map((b, i) => (
                <button
                  key={b.id}
                  style={
                    {
                      "--planet-color": b.color,
                      "--i": i,
                    } as React.CSSProperties
                  }
                  onClick={() => select(b.id)}
                  aria-label={`${t("Odkryj")} ${b.name}`}
                >
                  <span />
                  {b.name}
                </button>
              ))}
            </div>
            <div className="fallback-note">
              <span className="eyebrow">{t("ATLAS W WERSJI 2D")}</span>
              <h2>{t("Kosmos jest wciąż dostępny.")}</h2>
              <p>
                {t(
                  "Grafika 3D jest niedostępna w tej przeglądarce. Wybierz obiekt i odkrywaj jego historię.",
                )}
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setFallback(!canRender());
                  setNavigation((n) => n + 1);
                }}
              >
                {t("Spróbuj uruchomić 3D")}
                <Icon name="reset" />
              </button>
            </div>
          </div>
        )}
        <div className="scale-flight-label">{t("Zmiana skali")}</div>
      </div>
      <div className="vignette" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="/" aria-label={t("Orbita — strona główna")}>
          <Icon name="orbit" size={33} />
          <span>
            ORBITA
            <small>
              {mode === "galaxy"
                ? t("ATLAS DROGI MLECZNEJ")
                : t("ATLAS UKŁADU SŁONECZNEGO")}
            </small>
          </span>
        </a>
        <div className="top-actions">
          <select
            className="language-select"
            aria-label="Language / Język"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            <option value="en" lang="en">
              English
            </option>
            <option value="pl" lang="pl">
              Polski
            </option>
          </select>
          <span className="live-status">
            <i />
            {fallback ? t("WIDOK 2D") : t("OBSERWATORIUM 3D")}
          </span>
          <button
            className={`motion-button ${reduced ? "pressed" : ""}`}
            aria-label={t("Ogranicz animacje")}
            aria-pressed={reduced}
            onClick={toggleReduced}
          >
            <Icon name="motion" />
            <span>
              {reduced ? t("Ograniczony ruch") : t("Ogranicz animacje")}
            </span>
          </button>
          <button
            className="round-button"
            ref={aboutButton}
            onClick={() => setAbout(true)}
            aria-label={t("O atlasie")}
          >
            <Icon name="info" />
          </button>
        </div>
      </header>
      <nav className="mode-switch" aria-label={t("Skala eksploracji")}>
        <button
          aria-pressed={mode === "solar"}
          onClick={() => switchMode("solar")}
        >
          {t("Układ Słoneczny")}
        </button>
        <button
          aria-pressed={mode === "galaxy"}
          onClick={() => switchMode("galaxy")}
        >
          {t("Droga Mleczna")}
        </button>
      </nav>
      <nav className="object-nav" aria-label={t("Obiekty Układu Słonecznego")}>
        <span className="eyebrow nav-heading">{t("ODKRYWAJ")}</span>
        {bodies.map((b, i) => (
          <button
            key={b.id}
            data-body-id={b.id}
            aria-label={`${t("Wybierz")} ${b.name}`}
            aria-pressed={selected === b.id}
            onClick={() => {
              setTour(null);
              select(b.id);
            }}
          >
            <span
              className={`nav-planet ${b.id}`}
              style={{
                backgroundColor: b.color,
                backgroundImage: `url(/textures/${b.id}-low.webp)`,
              }}
            />
            <span>{b.name}</span>
            <small>{String(i).padStart(2, "0")}</small>
          </button>
        ))}
        <span className="nav-end">
          {t("JEDNA GWIAZDA.")}
          <br />
          {t("NIESKOŃCZONA CIEKAWOŚĆ.")}
        </span>
      </nav>
      {!body && mode === "solar" && (
        <section className="intro">
          <div className="eyebrow">
            <span className="tiny-cross">+</span>{" "}
            {t("TWOJE MIEJSCE WE WSZECHŚWIECIE")}
          </div>
          <h1>
            {t("Mały punkt.")}
            <br />
            <span>{t("Wielkie odkrycia.")}</span>
          </h1>
          <p>
            {t("Osiem planet. Jedna niezwykła podróż.")}
            <br />
            {t("Spójrz na nasz układ z nowej perspektywy.")}
          </p>
          <button className="journey-button" onClick={() => step(0)}>
            {t("Rozpocznij podróż")}
            <Icon name="arrow" />
          </button>
          <button
            className="galaxy-discover"
            onClick={() => switchMode("galaxy")}
          >
            {t("Gdzie jesteśmy w galaktyce?")}
            <Icon name="arrow" size={14} />
          </button>
        </section>
      )}
      {!body && mode === "solar" && (
        <aside className="overview-note">
          <span className="eyebrow">{t("UKŁAD SŁONECZNY")}</span>
          <p>
            {t("4,6")}
            <span>{t("mld lat historii")}</span>
          </p>
          <div className="note-line" />
          <span>
            {t("Wybierz świat, który Cię ciekawi.")}
            <br />
            {t("Resztą zajmie się grawitacja.")}
          </span>
        </aside>
      )}
      <div className="scene-tools">
        <button
          className="tool-button"
          onClick={mode === "galaxy" ? () => setNavigation((n) => n + 1) : home}
          aria-label={mode === "galaxy" ? t("Przywróć widok") : t("Cały układ")}
        >
          <Icon name="home" />
          <span>
            {mode === "galaxy" ? t("Przywróć widok") : t("Cały układ")}
          </span>
        </button>
        <button
          ref={settingsButton}
          className={`tool-button ${settings ? "active" : ""}`}
          onClick={() => setSettings(!settings)}
          aria-expanded={settings}
          aria-label={t("Ustawienia widoku")}
        >
          <Icon name="settings" />
          <span>{t("Widok")}</span>
        </button>
      </div>
      {settings && (
        <section className="settings-panel" aria-label={t("Ustawienia widoku")}>
          <div className="panel-top">
            <span className="eyebrow">{t("TWOJE OBSERWATORIUM")}</span>
            <button
              className="round-button"
              aria-label={t("Zamknij ustawienia")}
              onClick={() => {
                setSettings(false);
                settingsButton.current?.focus();
              }}
            >
              <Icon name="close" />
            </button>
          </div>
          {mode === "solar" && (
            <label className="switch-row">
              {t("Orbity")}
              <input
                type="checkbox"
                checked={orbits}
                onChange={(e) => setOrbits(e.target.checked)}
              />
            </label>
          )}
          <label className="switch-row">
            {t("Etykiety")}
            <input
              type="checkbox"
              checked={labels}
              onChange={(e) => setLabels(e.target.checked)}
            />
          </label>
          <label className="quality-label">
            {t("Jakość grafiki")}
            <select
              aria-label={t("Jakość grafiki")}
              value={quality}
              onChange={(e) => setQuality(e.target.value as Quality)}
            >
              <option value="auto">{t("Auto")}</option>
              <option value="low">{t("Niska")}</option>
              <option value="high">{t("Wysoka")}</option>
            </select>
          </label>
          <p>
            {t("Auto:")} {autoQuality === "low" ? t("oszczędna") : t("pełna")}{" "}
            {t(
              "jakość. Rozdzielczość obniża się przy utrzymujących się spadkach płynności.",
            )}
          </p>
        </section>
      )}
      {mode === "galaxy" && (
        <GalaxyPanel
          language={language}
          onEnter={enterSolar}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((v) => !v)}
        />
      )}
      {body && mode === "solar" && (
        <section
          className={`object-panel ${collapsed ? "collapsed" : ""}`}
          aria-label={t("Informacje o obiekcie")}
        >
          <div className="mobile-handle" />
          <div className="panel-top">
            <span className="eyebrow">
              {tour !== null
                ? `${t("PODRÓŻ")} · ${String(tour + 1).padStart(2, "0")} / 05`
                : `${t("KATALOG")} · ${String(bodies.indexOf(body)).padStart(2, "0")} / 08`}
            </span>
            <div className="panel-actions">
              <button
                className="round-button collapse-button"
                aria-label={
                  collapsed ? t("Rozwiń informacje") : t("Zwiń informacje")
                }
                aria-expanded={!collapsed}
                onClick={() => setCollapsed(!collapsed)}
              >
                <Icon name="expand" />
              </button>
              <button
                className="round-button"
                aria-label={t("Zamknij informacje")}
                onClick={home}
              >
                <Icon name="close" />
              </button>
            </div>
          </div>
          <span className="object-kind">{body.kind}</span>
          <h2 ref={panel} tabIndex={-1}>
            {body.name}
            <span style={{ background: body.color }} />
          </h2>
          <div className="panel-content">
            <p className="description">{body.description}</p>
            <dl>
              <div>
                <dt>{t("ŚREDNIA ŚREDNICA")}</dt>
                <dd>
                  {format(body.diameterKm)} <span>km</span>
                </dd>
              </div>
              {body.distanceMillionKm !== null && (
                <div>
                  <dt>{t("ODLEGŁOŚĆ OD SŁOŃCA · ŚREDNIA")}</dt>
                  <dd>
                    {format(body.distanceMillionKm)} <span>{t("mln km")}</span>
                  </dd>
                </div>
              )}
              {body.orbitalPeriodDays !== null && (
                <div>
                  <dt>{t("OKRES OBIEGU")}</dt>
                  <dd>
                    {body.orbitalPeriodDays > 700
                      ? format(body.orbitalPeriodDays / 365.25)
                      : format(body.orbitalPeriodDays)}{" "}
                    <span>
                      {body.orbitalPeriodDays > 700
                        ? t("lat ziemskich")
                        : t("dni ziemskich")}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
            <div className="fact">
              <span className="eyebrow">
                <Icon name="plus" size={14} /> {t("WARTO WIEDZIEĆ")}
              </span>
              <p>{body.fact}</p>
            </div>
            <a
              className="source"
              href={body.source}
              target="_blank"
              rel="noreferrer"
            >
              {t("Dane i odkrycia NASA")}
              <span>↗</span>
            </a>
            {tour !== null ? (
              <div className="tour">
                <h3>{stops[tour].title}</h3>
                <p>{stops[tour].text}</p>
                <div className="tour-buttons">
                  <button
                    className="round-button"
                    aria-label={t("Poprzedni przystanek")}
                    disabled={tour === 0}
                    onClick={() => step(tour - 1)}
                  >
                    <Icon name="back" />
                  </button>
                  {tour < stops.length - 1 ? (
                    <button
                      className="journey-button"
                      aria-label={t("Następny przystanek")}
                      onClick={() => step(tour + 1)}
                    >
                      {t("Dalej")}
                      <Icon name="arrow" />
                    </button>
                  ) : (
                    <button
                      className="journey-button"
                      onClick={() => {
                        setTour(null);
                        home();
                      }}
                    >
                      {t("Zakończ podróż")}
                      <Icon name="home" />
                    </button>
                  )}
                </div>
                {tour < stops.length - 1 && (
                  <button className="end-tour" onClick={() => setTour(null)}>
                    {t("Zakończ podróż")}
                  </button>
                )}
              </div>
            ) : (
              <button className="panel-journey" onClick={() => step(0)}>
                {t("Rozpocznij podróż")}
                <Icon name="arrow" />
              </button>
            )}
          </div>
        </section>
      )}
      {mode === "galaxy" ? (
        <footer className="galaxy-footer">
          <div className="control-hint">
            {t("Przeciągnij, aby obrócić")}
            <span>·</span>
            {t("Przewiń, aby przybliżyć")}
            <span>·</span>
            {t("Wybierz nasz Układ Słoneczny")}
          </div>
          <p>{t("Model galaktyki — położenia i struktura przybliżone")}</p>
          <small>
            {t(
              "Widok galaktyki jest statyczny. Czas symulacji planet jest zachowany do powrotu.",
            )}
          </small>
        </footer>
      ) : (
        <footer className="bottom-ui">
          <div className="control-hint">
            <span className="mouse-symbol" />
            {t("Przeciągnij, aby obrócić")}
            <span>·</span>
            {t("Przewiń, aby przybliżyć")}
            <span>·</span>
            {t("Kliknij planetę")}
          </div>
          <section
            className="simulation"
            aria-label={t("Sterowanie symulacją")}
          >
            <button
              className="play-button"
              onClick={togglePause}
              aria-label={
                paused ? t("Wznów symulację") : t("Wstrzymaj symulację")
              }
            >
              <Icon name={paused ? "play" : "pause"} size={19} />
            </button>
            <div className="sim-time">
              <span className="eyebrow">
                {paused ? t("CZAS WSTRZYMANY") : t("CZAS SYMULACJI")}
              </span>
              <output data-testid="simulation-time">
                {format(days)} <span>{t("dni")}</span>
              </output>
            </div>
            <div className="speed-control">
              <div>
                <label htmlFor="speed">{t("TEMPO PODRÓŻY")}</label>
                <output>
                  {speed} <span>{t("dni / s")}</span>
                </output>
              </div>
              <input
                id="speed"
                aria-label={t("Szybkość symulacji")}
                type="range"
                min="0"
                max="100"
                step="1"
                value={speed}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setSpeed(value);
                  simulation.current = control(simulation.current, {
                    type: "speed",
                    value,
                  });
                }}
              />
            </div>
            <button
              className="round-button reset"
              aria-label={t("Resetuj symulację")}
              title={t("Reset: dzień 0, 8 dni/s, widok całego układu")}
              onClick={reset}
            >
              <Icon name="reset" />
            </button>
          </section>
          <div className="bottom-caption">
            <span>
              <i /> {t("SYMULACJA POGLĄDOWA · ORBITY PRZYBLIŻONE")}
            </span>
            <span>
              {t(
                "Widok poglądowy — rozmiary i odległości nie zachowują wspólnej skali",
              )}
            </span>
            <span className="coordinates">SOL / 01</span>
          </div>
        </footer>
      )}
      {!fallback && !ready && (
        <div className="loading-badge" role="status">
          {mode === "galaxy"
            ? t("Przygotowywanie mapy galaktyki…")
            : t("Uruchamianie sceny 3D…")}
        </div>
      )}
      {textureErrors > 0 && (
        <div className="texture-notice" role="status">
          {t(
            "Nie udało się wczytać części tekstur. Widok uproszczony jest aktywny.",
          )}
          <button
            onClick={() => {
              setTextureErrors(0);
              setTextureVersion((v) => v + 1);
            }}
          >
            {t("Ponów")}
          </button>
        </div>
      )}
      <span className="sr-only" role="status">
        {ready ? t("Scena 3D gotowa.") : ""} {t("Wczytano")} {loaded}{" "}
        {t("map powierzchni.")}
      </span>
      <dialog
        ref={aboutDialog}
        className="about-dialog"
        onCancel={() => setAbout(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setAbout(false);
        }}
      >
        <div className="panel-top">
          <span className="eyebrow">{t("O ATLASIE")}</span>
          <button
            className="round-button"
            aria-label={t("Zamknij opis atlasu")}
            onClick={() => {
              setAbout(false);
              aboutButton.current?.focus();
            }}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2>{t("Przestrzeń do odkrywania.")}</h2>
        <p>
          {t(
            "Orbita to interaktywny atlas Słońca i ośmiu planet. Obracaj widok przeciągnięciem, przybliżaj kółkiem lub gestem dwóch palców. Na klawiaturze wybieraj obiekty tabulatorem i Enterem. Spacja wstrzymuje czas, Escape przywraca cały układ.",
          )}
        </p>
        <p>
          {t(
            "Widok Drogi Mlecznej pokazuje przybliżone położenie Układu Słonecznego. Galaktyka ma osobną skalę i jest statyczną rekonstrukcją; podczas jej oglądania czas symulacji planet jest zachowany.",
          )}
        </p>
        <p>
          {t(
            "To symulacja poglądowa, bez efemeryd. Pozycje początkowe są umowne. Orbity są kołowe i współpłaszczyznowe; rozmiary i odległości nie zachowują wspólnej skali. Względne okresy obiegu odpowiadają danym NASA, a obroty osiowe są wizualnie spowolnione.",
          )}
        </p>
        <p>
          {t(
            "Reset przywraca dzień 0, tempo 8 dni/s i cały układ. Przy ograniczonym ruchu czas jest domyślnie wstrzymany; możesz świadomie wznowić symulację przyciskiem odtwarzania. Przeloty i animacje dekoracyjne pozostają wyłączone.",
          )}
        </p>
        <a
          className="source"
          href="https://science.nasa.gov/solar-system/"
          target="_blank"
          rel="noreferrer"
        >
          {t("Odkrywaj dalej z NASA ↗")}
        </a>
        <p className="credits">
          {t(
            "Dane: NASA / JPL. Ziemia i chmury: NASA Visible Earth, Blue Marble (Reto Stöckli). Pozostałe powierzchnie: własne mapy proceduralne.",
          )}
        </p>
      </dialog>
    </main>
  );
}
