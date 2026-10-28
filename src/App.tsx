import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { bodies } from "./data/bodies";
import { control, initialSimulation } from "./lib/simulation";
import type { Quality } from "./scene/types";
import Icon from "./Icon";
const SolarScene = lazy(() => import("./scene/SolarScene"));
const stops = [
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
      if (fallback && !hidden && !simulation.current.paused)
        simulation.current.days +=
          ((now - last) / 1000) * simulation.current.speed;
      last = now;
      setDays(simulation.current.days);
    }, 200);
    return () => clearInterval(id);
  }, [fallback, hidden]);
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
    lastTrigger.current = document.querySelector<HTMLElement>(
      `.object-nav button[aria-label="Wybierz ${bodies.find((b) => b.id === id)?.name}"]`,
    );
    setSelected(id);
    setNavigation((n) => n + 1);
    setCollapsed(false);
  }, []);
  const home = useCallback(() => {
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
  }, [about, settings, home]);
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
    new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(n);
  return (
    <main
      className={`app ${body ? "has-selection" : ""} ${reduced ? "reduced" : ""}`}
    >
      <div
        className="space"
        data-testid="scene"
        data-ready={ready ? "true" : "false"}
        data-target={selected || "overview"}
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
                  Przygotowywanie obserwatorium…
                </div>
              }
            >
              <SolarScene
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
                  aria-label={`Odkryj ${b.name}`}
                >
                  <span />
                  {b.name}
                </button>
              ))}
            </div>
            <div className="fallback-note">
              <span className="eyebrow">ATLAS W WERSJI 2D</span>
              <h2>Kosmos jest wciąż dostępny.</h2>
              <p>
                Grafika 3D jest niedostępna w tej przeglądarce. Wybierz obiekt i
                odkrywaj jego historię.
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setFallback(!canRender());
                  setNavigation((n) => n + 1);
                }}
              >
                Spróbuj uruchomić 3D <Icon name="reset" />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="vignette" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="/" aria-label="Orbita — strona główna">
          <Icon name="orbit" size={33} />
          <span>
            ORBITA<small>ATLAS UKŁADU SŁONECZNEGO</small>
          </span>
        </a>
        <div className="top-actions">
          <span className="live-status">
            <i />
            {fallback ? "WIDOK 2D" : "OBSERWATORIUM 3D"}
          </span>
          <button
            className={`motion-button ${reduced ? "pressed" : ""}`}
            aria-label="Ogranicz animacje"
            aria-pressed={reduced}
            onClick={toggleReduced}
          >
            <Icon name="motion" />
            <span>{reduced ? "Ograniczony ruch" : "Ogranicz animacje"}</span>
          </button>
          <button
            className="round-button"
            ref={aboutButton}
            onClick={() => setAbout(true)}
            aria-label="O atlasie"
          >
            <Icon name="info" />
          </button>
        </div>
      </header>
      <nav className="object-nav" aria-label="Obiekty Układu Słonecznego">
        <span className="eyebrow nav-heading">ODKRYWAJ</span>
        {bodies.map((b, i) => (
          <button
            key={b.id}
            aria-label={`Wybierz ${b.name}`}
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
          JEDNA GWIAZDA.
          <br />
          NIESKOŃCZONA CIEKAWOŚĆ.
        </span>
      </nav>
      {!body && (
        <section className="intro">
          <div className="eyebrow">
            <span className="tiny-cross">+</span> TWOJE MIEJSCE WE WSZECHŚWIECIE
          </div>
          <h1>
            Mały punkt.
            <br />
            <span>Wielkie odkrycia.</span>
          </h1>
          <p>
            Osiem planet. Jedna niezwykła podróż.
            <br />
            Spójrz na nasz układ z nowej perspektywy.
          </p>
          <button className="journey-button" onClick={() => step(0)}>
            Rozpocznij podróż <Icon name="arrow" />
          </button>
        </section>
      )}
      {!body && (
        <aside className="overview-note">
          <span className="eyebrow">UKŁAD SŁONECZNY</span>
          <p>
            4,6 <span>mld lat historii</span>
          </p>
          <div className="note-line" />
          <span>
            Wybierz świat, który Cię ciekawi.
            <br />
            Resztą zajmie się grawitacja.
          </span>
        </aside>
      )}
      <div className="scene-tools">
        <button className="tool-button" onClick={home} aria-label="Cały układ">
          <Icon name="home" />
          <span>Cały układ</span>
        </button>
        <button
          ref={settingsButton}
          className={`tool-button ${settings ? "active" : ""}`}
          onClick={() => setSettings(!settings)}
          aria-expanded={settings}
          aria-label="Ustawienia widoku"
        >
          <Icon name="settings" />
          <span>Widok</span>
        </button>
      </div>
      {settings && (
        <section className="settings-panel" aria-label="Ustawienia widoku">
          <div className="panel-top">
            <span className="eyebrow">TWOJE OBSERWATORIUM</span>
            <button
              className="round-button"
              aria-label="Zamknij ustawienia"
              onClick={() => {
                setSettings(false);
                settingsButton.current?.focus();
              }}
            >
              <Icon name="close" />
            </button>
          </div>
          <label className="switch-row">
            Orbity
            <input
              type="checkbox"
              checked={orbits}
              onChange={(e) => setOrbits(e.target.checked)}
            />
          </label>
          <label className="switch-row">
            Etykiety
            <input
              type="checkbox"
              checked={labels}
              onChange={(e) => setLabels(e.target.checked)}
            />
          </label>
          <label className="quality-label">
            Jakość grafiki
            <select
              aria-label="Jakość grafiki"
              value={quality}
              onChange={(e) => setQuality(e.target.value as Quality)}
            >
              <option value="auto">Auto</option>
              <option value="low">Niska</option>
              <option value="high">Wysoka</option>
            </select>
          </label>
          <p>
            Auto: {autoQuality === "low" ? "oszczędna" : "pełna"} jakość.
            Rozdzielczość obniża się przy utrzymujących się spadkach płynności.
          </p>
        </section>
      )}
      {body && (
        <section
          className={`object-panel ${collapsed ? "collapsed" : ""}`}
          aria-label="Informacje o obiekcie"
        >
          <div className="mobile-handle" />
          <div className="panel-top">
            <span className="eyebrow">
              {tour !== null
                ? `PODRÓŻ · ${String(tour + 1).padStart(2, "0")} / 05`
                : `KATALOG · ${String(bodies.indexOf(body)).padStart(2, "0")} / 08`}
            </span>
            <div className="panel-actions">
              <button
                className="round-button collapse-button"
                aria-label={collapsed ? "Rozwiń informacje" : "Zwiń informacje"}
                aria-expanded={!collapsed}
                onClick={() => setCollapsed(!collapsed)}
              >
                <Icon name="expand" />
              </button>
              <button
                className="round-button"
                aria-label="Zamknij informacje"
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
                <dt>ŚREDNIA ŚREDNICA</dt>
                <dd>
                  {format(body.diameterKm)} <span>km</span>
                </dd>
              </div>
              {body.distanceMillionKm !== null && (
                <div>
                  <dt>ODLEGŁOŚĆ OD SŁOŃCA · ŚREDNIA</dt>
                  <dd>
                    {format(body.distanceMillionKm)} <span>mln km</span>
                  </dd>
                </div>
              )}
              {body.orbitalPeriodDays !== null && (
                <div>
                  <dt>OKRES OBIEGU</dt>
                  <dd>
                    {body.orbitalPeriodDays > 700
                      ? format(body.orbitalPeriodDays / 365.25)
                      : format(body.orbitalPeriodDays)}{" "}
                    <span>
                      {body.orbitalPeriodDays > 700
                        ? "lat ziemskich"
                        : "dni ziemskich"}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
            <div className="fact">
              <span className="eyebrow">
                <Icon name="plus" size={14} /> WARTO WIEDZIEĆ
              </span>
              <p>{body.fact}</p>
            </div>
            <a
              className="source"
              href={body.source}
              target="_blank"
              rel="noreferrer"
            >
              Dane i odkrycia NASA <span>↗</span>
            </a>
            {tour !== null ? (
              <div className="tour">
                <h3>{stops[tour].title}</h3>
                <p>{stops[tour].text}</p>
                <div className="tour-buttons">
                  <button
                    className="round-button"
                    aria-label="Poprzedni przystanek"
                    disabled={tour === 0}
                    onClick={() => step(tour - 1)}
                  >
                    <Icon name="back" />
                  </button>
                  {tour < stops.length - 1 ? (
                    <button
                      className="journey-button"
                      aria-label="Następny przystanek"
                      onClick={() => step(tour + 1)}
                    >
                      Dalej <Icon name="arrow" />
                    </button>
                  ) : (
                    <button
                      className="journey-button"
                      onClick={() => {
                        setTour(null);
                        home();
                      }}
                    >
                      Zakończ podróż <Icon name="home" />
                    </button>
                  )}
                </div>
                {tour < stops.length - 1 && (
                  <button className="end-tour" onClick={() => setTour(null)}>
                    Zakończ podróż
                  </button>
                )}
              </div>
            ) : (
              <button className="panel-journey" onClick={() => step(0)}>
                Rozpocznij podróż <Icon name="arrow" />
              </button>
            )}
          </div>
        </section>
      )}
      <footer className="bottom-ui">
        <div className="control-hint">
          <span className="mouse-symbol" />
          Przeciągnij, aby obrócić<span>·</span>Przewiń, aby przybliżyć
          <span>·</span>Kliknij planetę
        </div>
        <section className="simulation" aria-label="Sterowanie symulacją">
          <button
            className="play-button"
            onClick={togglePause}
            aria-label={paused ? "Wznów symulację" : "Wstrzymaj symulację"}
          >
            <Icon name={paused ? "play" : "pause"} size={19} />
          </button>
          <div className="sim-time">
            <span className="eyebrow">
              {paused ? "CZAS WSTRZYMANY" : "CZAS SYMULACJI"}
            </span>
            <output data-testid="simulation-time">
              {format(days)} <span>dni</span>
            </output>
          </div>
          <div className="speed-control">
            <div>
              <label htmlFor="speed">TEMPO PODRÓŻY</label>
              <output>
                {speed} <span>dni / s</span>
              </output>
            </div>
            <input
              id="speed"
              aria-label="Szybkość symulacji"
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
            aria-label="Resetuj symulację"
            title="Reset: dzień 0, 8 dni/s, widok całego układu"
            onClick={reset}
          >
            <Icon name="reset" />
          </button>
        </section>
        <div className="bottom-caption">
          <span>
            <i /> SYMULACJA POGLĄDOWA · ORBITY PRZYBLIŻONE
          </span>
          <span>
            Widok poglądowy — rozmiary i odległości nie zachowują wspólnej skali
          </span>
          <span className="coordinates">SOL / 01</span>
        </div>
      </footer>
      {!fallback && !ready && (
        <div className="loading-badge" role="status">
          Uruchamianie sceny 3D…
        </div>
      )}
      {textureErrors > 0 && (
        <div className="texture-notice" role="status">
          Nie udało się wczytać części tekstur. Widok uproszczony jest aktywny.
          <button
            onClick={() => {
              setTextureErrors(0);
              setTextureVersion((v) => v + 1);
            }}
          >
            Ponów
          </button>
        </div>
      )}
      <span className="sr-only" role="status">
        {ready ? "Scena 3D gotowa." : ""} Wczytano {loaded} map powierzchni.
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
          <span className="eyebrow">O ATLASIE</span>
          <button
            className="round-button"
            aria-label="Zamknij opis atlasu"
            onClick={() => {
              setAbout(false);
              aboutButton.current?.focus();
            }}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2>Przestrzeń do odkrywania.</h2>
        <p>
          Orbita to interaktywny atlas Słońca i ośmiu planet. Obracaj widok
          przeciągnięciem, przybliżaj kółkiem lub gestem dwóch palców. Na
          klawiaturze wybieraj obiekty tabulatorem i Enterem. Spacja wstrzymuje
          czas, Escape przywraca cały układ.
        </p>
        <p>
          To symulacja poglądowa, bez efemeryd. Pozycje początkowe są umowne.
          Orbity są kołowe i współpłaszczyznowe; rozmiary i odległości nie
          zachowują wspólnej skali. Względne okresy obiegu odpowiadają danym
          NASA, a obroty osiowe są wizualnie spowolnione.
        </p>
        <p>
          Reset przywraca dzień 0, tempo 8 dni/s i cały układ. Przy ograniczonym
          ruchu czas jest domyślnie wstrzymany; możesz świadomie wznowić
          symulację przyciskiem odtwarzania. Przeloty i animacje dekoracyjne
          pozostają wyłączone.
        </p>
        <a
          className="source"
          href="https://science.nasa.gov/solar-system/"
          target="_blank"
          rel="noreferrer"
        >
          Odkrywaj dalej z NASA ↗
        </a>
        <p className="credits">
          Dane: NASA / JPL. Ziemia i chmury: NASA Visible Earth, Blue Marble
          (Reto Stöckli). Pozostałe powierzchnie: własne mapy proceduralne.
        </p>
      </dialog>
    </main>
  );
}
