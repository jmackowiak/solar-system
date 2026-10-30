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
import { getSystemBodies, planetarySystems, systemById } from "./data/systems";
import type { SystemId } from "./data/systems";
import { getMoons, moonParentById } from "./data/moons";
import type { Simulation } from "./lib/simulation";
import { englishTourStops } from "./data/body-translations";
import { useLanguage } from "./i18n";
import type { Language } from "./i18n";
import { control, initialSimulation } from "./lib/simulation";
import type { Quality } from "./scene/types";
import Icon from "./Icon";
import ComparisonPanel from "./ComparisonPanel";
import LightPanel from "./LightPanel";
import LightFallback from "./LightFallback";
import { advanceLight, type LightClock } from "./lib/light-clock";
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
function compactView() {
  return window.innerWidth <= 760 || window.innerHeight <= 500;
}
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
  const [systemId, setSystemId] = useState<SystemId>("solar");
  const bodies = useMemo(() => getSystemBodies(systemId, language), [systemId, language]);
  const system = systemById[systemId];
  const systemCopy = system.copy[language];
  const isSolar = systemId === "solar";
  const initialSpeed = isSolar ? 8 : 0.25;
  const moonBodies = useMemo(() => isSolar ? getMoons(language) : [], [isSolar, language]);
  const [moonParent, setMoonParent] = useState<string | null>(null);
  const moonContext = useRef<{ parent: string; speed: number } | null>(null);
  const sceneBodies = useMemo(() => [...bodies, ...moonBodies.filter(m => m.parentId === moonParent)], [bodies, moonBodies, moonParent]);
  const [mode, setMode] = useState<ViewMode>("solar");
  const [explore, setExplore] = useState(false);
  const lightClock=useRef<LightClock>({seconds:0,playing:false,speed:60});
  const [lightVersion,setLightVersion]=useState(0);
  const [lightTarget,setLightTarget]=useState("earth");
  const solarBodies=useMemo(()=>getSystemBodies("solar",language),[language]);
  const [pair, setPair] = useState<[string,string]>(["earth","jupiter"]);
  const comparisonCatalog = useMemo(()=>[...planetarySystems.flatMap(s=>getSystemBodies(s.id,language).slice(1)),...getMoons(language)], [language]);
  const comparison = {left:comparisonCatalog.find(b=>b.id===pair[0])!,right:comparisonCatalog.find(b=>b.id===pair[1])!};
  const stops = language === "en" ? englishTourStops : polishStops;
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const simulation = useRef(initialSimulation(reduced));
  const savedSimulations = useRef<Partial<Record<SystemId, Simulation>>>({});
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
    [collapsed, setCollapsed] = useState(() => compactView());
  const [fallback, setFallback] = useState(() => !canRender()),
    [ready, setReady] = useState(false),
    [textureErrors, setTextureErrors] = useState(0),
    [loaded, setLoaded] = useState(0),
    [textureVersion, setTextureVersion] = useState(0),
    [hidden, setHidden] = useState(document.hidden);
  const systemPicker = useRef<HTMLSelectElement>(null);
  const panel = useRef<HTMLHeadingElement>(null),
    lastTrigger = useRef<HTMLElement | null>(null),
    settingsButton = useRef<HTMLButtonElement>(null),
    aboutButton = useRef<HTMLButtonElement>(null),
    aboutDialog = useRef<HTMLDialogElement>(null);
  const restoreFocus = useRef(false);
  const body = bodies.find((b) => b.id === selected) || moonBodies.find((b) => b.id === selected);
  const navParent = body?.parentId || body?.id;
  const parentMoons = moonBodies.filter((moon) => moon.parentId === navParent);
  const leaveMoons = useCallback((restore = true) => {
    if (moonContext.current && restore) {
      simulation.current = control(simulation.current, { type: "speed", value: moonContext.current.speed });
      setSpeed(simulation.current.speed);
    }
    moonContext.current = null;
    setMoonParent(null);
  }, []);
  const enterMoons = useCallback((parent: string) => {
    if (!moonContext.current) {
      moonContext.current = { parent, speed: simulation.current.speed };
      simulation.current = control(simulation.current, { type: "speed", value: 0.1 });
      setSpeed(0.1);
    } else moonContext.current.parent = parent;
    setMoonParent(parent);
    setTour(null);
  }, []);
  const changeSystem = useCallback((next: SystemId) => {
    leaveMoons();
    systemPicker.current?.focus({ preventScroll: true });
    if (next !== systemId) {
      savedSimulations.current[systemId] = simulation.current;
      const restored = savedSimulations.current[next] || initialSimulation(reduced, next === "solar" ? 8 : 0.25);
      simulation.current = restored;
      setDays(simulation.current.days);
      setSpeed(simulation.current.speed);
      setPaused(simulation.current.paused);
      setSystemId(next);
    }
    if (!fallback) setReady(false);
    setMode("solar");
    setExplore(false);
    setSelected(null);
    setTour(null);
    setSettings(false);
    setCollapsed(compactView());
    setNavigation((n) => n + 1);
  }, [systemId, reduced, fallback, leaveMoons]);
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      if (fallback && mode === "solar" && !hidden && !document.hidden && !simulation.current.paused)
        simulation.current.days +=
          ((now - last) / 1000) * simulation.current.speed;
      if (fallback && mode === "light" && !hidden && !document.hidden) advanceLight(lightClock.current,(now-last)/1000);
      last = now;
      setDays(simulation.current.days);
    }, 200);
    return () => clearInterval(id);
  }, [fallback, hidden, mode, systemId]);
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(m.matches);
      if (m.matches) lightClock.current.playing=false;
      if (m.matches) {
        simulation.current = control(simulation.current, { type: "pause" });
        for (const saved of Object.values(savedSimulations.current)) saved.paused = true;
        setPaused(true);
      }
    };
    m.addEventListener("change", change);
    return () => m.removeEventListener("change", change);
  }, []);
  const select = useCallback((id: string) => {
    const parent = moonParentById[id];
    if (parent) enterMoons(parent);
    else leaveMoons();
    setMode("solar");
    lastTrigger.current = document.querySelector<HTMLElement>(
      `.object-nav button[data-body-id="${parent || id}"]`,
    );
    setSelected(id);
    setNavigation((n) => n + 1);
    setCollapsed(compactView());
  }, [enterMoons, leaveMoons]);
  const home = useCallback(() => {
    leaveMoons();
    lightClock.current.playing=false;
    setMode("solar");
    setExplore(false);
    setSelected(null);
    setNavigation((n) => n + 1);
    setTour(null);
    restoreFocus.current = true;
  }, [leaveMoons]);
  useEffect(() => {
    if (selected) panel.current?.focus({ preventScroll: true });
    else if (restoreFocus.current) {
      restoreFocus.current = false;
      lastTrigger.current?.focus({ preventScroll: true });
    }
  }, [selected, mode]);
  useEffect(() => {
    const query = matchMedia("(max-width: 760px), (max-height: 500px)");
    const change = (event: MediaQueryListEvent) => setCollapsed(event.matches && tour === null);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, [tour]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (about) {
          setAbout(false);
          aboutButton.current?.focus();
        } else if (explore) {
          setExplore(false);
          document.querySelector<HTMLButtonElement>(".discovery-trigger")?.focus();
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
  }, [about, settings, explore, home, mode]);
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
    if (r) lightClock.current.playing=false;
    if (r) {
      simulation.current = control(simulation.current, { type: "pause" });
      for (const saved of Object.values(savedSimulations.current)) saved.paused = true;
      setPaused(true);
    }
  };
  const switchMode = (next: ViewMode) => {
    leaveMoons();
    if (next !== "solar" && next !== "galaxy") lastTrigger.current = document.querySelector<HTMLButtonElement>(".discovery-trigger");
    if (mode !== next && !fallback) setReady(false);
    lightClock.current.playing=false;
    setMode(next);
    setExplore(false);
    setSelected(null);
    setTour(null);
    setSettings(false);
    setCollapsed(compactView());
    setNavigation((n) => n + 1);
  };
  const enterSolar = useCallback(() => changeSystem("solar"), [changeSystem]);
  const reset = () => {
    leaveMoons(false);
    simulation.current = initialSimulation(reduced, initialSpeed);
    setDays(0);
    setSpeed(initialSpeed);
    setPaused(reduced);
    home();
  };
  const step = (index: number) => {
    setTour(index);
    select(stops[index].id);
    setCollapsed(false);
  };
  const format = (n: number) =>
    new Intl.NumberFormat(language === "en" ? "en-GB" : "pl-PL", {
      maximumFractionDigits: 2,
    }).format(n);
  return (
    <main
      className={`app ${body || mode === "galaxy" ? "has-selection" : ""} ${mode === "galaxy" ? "galaxy-mode" : "solar-mode"} ${!isSolar ? "exoplanet-mode" : ""} ${moonParent ? "moon-mode" : ""} ${mode !== "solar" && mode !== "galaxy" ? `discovery-mode ${mode}-mode` : ""} ${reduced ? "reduced" : ""}`}
    >
      <div
        className="space"
        data-testid="scene"
        data-ready={ready ? "true" : "false"}
        data-mode={mode}
        data-system={systemId}
        data-target={mode !== "solar" ? mode : selected || "overview"}
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
                systemId={systemId}
                bodies={sceneBodies}
                moonParent={moonParent}
                comparison={comparison}
                lightClock={lightClock}
                lightVersion={lightVersion}
                lightTarget={lightTarget}
                solarBodies={solarBodies}
                starColor={system.starColor}
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
        ) : mode !== "solar" && mode !== "galaxy" ? null : mode === "galaxy" ? (
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
                : isSolar ? t("ATLAS UKŁADU SŁONECZNEGO") : t("ATLAS UKŁADÓW PLANETARNYCH")}
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
          aria-pressed={mode === "solar" && isSolar}
          onClick={enterSolar}
        >
          {t("Układ Słoneczny")}
        </button>
        <button
          aria-pressed={mode === "galaxy"}
          onClick={() => switchMode("galaxy")}
        >
          {t("Droga Mleczna")}
        </button>
        <label className="system-picker">
          <span className="sr-only">{t("Układ planetarny")}</span>
          <select ref={systemPicker} aria-label={t("Układ planetarny")} value={systemId} onChange={(e) => changeSystem(e.target.value as SystemId)}>
            {planetarySystems.map((entry) => <option key={entry.id} value={entry.id}>{entry.id === "solar" ? t("Układ Słoneczny") : entry.name}</option>)}
          </select>
        </label>
      </nav>
      <nav className="object-nav" aria-label={isSolar ? t("Obiekty Układu Słonecznego") : t("Obiekty układu planetarnego")}>
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
                backgroundImage: isSolar && b.orbitRadius > 0 ? `url(/textures/${b.id}-low.webp)` : undefined,
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
      {!body && mode === "solar" && isSolar && (
        <section className="intro">
          <div className="eyebrow">
            <span className="tiny-cross">+</span>{" "}
            {t("TWOJE MIEJSCE WE WSZECHŚWIECIE")}
          </div>
          <h1 className="mobile-title">{t("Układ Słoneczny")}</h1>
          <h1 className="desktop-title">
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
      {!body && mode === "solar" && isSolar && (
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
      {!body && mode === "solar" && !isSolar && (
        <section className="intro system-intro" aria-label={system.name}>
          <div className="eyebrow">{t("ZA GRANICĄ NASZEGO UKŁADU")}</div>
          <h1>{system.name}</h1>
          <span className="system-subtitle">{systemCopy.subtitle}</span>
          <p>{systemCopy.description}</p>
          <button className="journey-button" onClick={() => select(bodies[1].id)}>
            {t("Odkrywaj planety")} <Icon name="arrow" />
          </button>
          <div className="system-evidence">
            <span>{bodies.length - 1} {t("potwierdzonych planet")}</span><span>·</span>
            <span>{format(system.distanceLightYears)} {t("lat świetlnych od nas")}</span>
          </div>
          <p className="artistic-notice">{t("Wygląd planet jest wizualizacją artystyczną.")}</p>
        </section>
      )}
      {moonParent && mode === "solar" && (
        <nav className="moon-nav" aria-label={t("Księżyce")}>
          <button onClick={() => { leaveMoons(); select(moonParent); }}><Icon name="back" size={14} />{t("Powrót do planety")}</button>
          <button aria-pressed={selected === moonParent} onClick={() => {setSelected(moonParent); setNavigation(n=>n+1); setCollapsed(compactView());}}>{t("Planeta i księżyce")}</button>
          {moonBodies.filter(m=>m.parentId===moonParent).map(m=><button key={m.id} aria-label={`${t("Wybierz")} ${m.name}`} aria-pressed={selected===m.id} onClick={()=>select(m.id)}><span style={{background:m.color}} />{m.name}</button>)}
        </nav>
      )}
      {mode === "light" && fallback && <LightFallback clock={lightClock} bodies={solarBodies} target={lightTarget} language={language}/>}
      {mode === "light" && <LightPanel language={language} clock={lightClock} bodies={solarBodies} target={lightTarget} onTarget={setLightTarget} onChange={()=>setLightVersion(v=>v+1)} onClose={home} />}
      {mode === "compare" && <ComparisonPanel language={language} left={comparison.left} right={comparison.right} catalog={comparisonCatalog} onLeft={id=>setPair(p=>[id,p[1]])} onRight={id=>setPair(p=>[p[0],id])} onClose={home} fallback={fallback} />}
      <div className="scene-tools">
        <button className="tool-button discovery-trigger" aria-label={language === "en" ? "Explore tools" : "Narzędzia odkrywania"} aria-expanded={explore} onClick={()=>{setExplore(v=>!v);setSettings(false);}}><Icon name="plus"/><span>{language === "en" ? "Discover" : "Odkrywaj"}</span></button>
        {parentMoons.length > 0 && !moonParent && mode === "solar" && <button className="tool-button moon-entry" aria-label={t("Odkrywaj księżyce")} onClick={()=>{enterMoons(navParent!);setNavigation(n=>n+1);}}><Icon name="moon"/><span>{t("Księżyce")}</span></button>}
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
          onClick={() => {
            setSettings(!settings);
            if (!settings && compactView()) setCollapsed(true);
          }}
          aria-expanded={settings}
          aria-label={t("Ustawienia widoku")}
        >
          <Icon name="settings" />
          <span>{t("Widok")}</span>
        </button>
      </div>
      {explore && <nav className="discovery-menu" aria-label={language === "en" ? "Discovery tools" : "Narzędzia odkrywania"}><button onClick={()=>switchMode("compare")}>{language === "en" ? "Size comparison" : "Porównanie rozmiarów"}<Icon name="arrow" size={15}/></button><button onClick={()=>switchMode("light")}>{language === "en" ? "Light journey" : "Podróż światła"}<Icon name="arrow" size={15}/></button></nav>}
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
          onSystem={changeSystem}
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
                : body.parentId ? t("KSIĘŻYC") : `${t("KATALOG")} · ${String(bodies.indexOf(body)).padStart(2, "0")} / ${String(bodies.length - 1).padStart(2, "0")}`}
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
                <span className="collapse-label">{collapsed ? t("Szczegóły") : t("Zwiń")}</span>
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
            {!isSolar && <p className="artistic-notice">{t("Wygląd planet jest wizualizacją artystyczną.")}</p>}
            {body.parentId && <p className="artistic-notice">{t("Powierzchnie księżyców są interpretacją artystyczną.")}</p>}
            <dl>
              <div>
                <dt>{isSolar ? t("ŚREDNIA ŚREDNICA") : t("SZACOWANA ŚREDNICA")}</dt>
                <dd>
                  {format(body.diameterKm)} <span>km</span>
                </dd>
              </div>
              {body.distanceFromParentKm != null && <div><dt>{t("ODLEGŁOŚĆ OD PLANETY")}</dt><dd>{format(body.distanceFromParentKm)} <span>km</span></dd></div>}
              {body.distanceMillionKm !== null && (
                <div>
                  <dt>{isSolar ? t("ODLEGŁOŚĆ OD SŁOŃCA · ŚREDNIA") : t("ODLEGŁOŚĆ OD GWIAZDY")}</dt>
                  <dd>
                    {format(body.distanceMillionKm)} <span>{t("mln km")}</span>
                  </dd>
                </div>
              )}
              {body.orbitalPeriodDays !== null && (
                <div>
                  <dt>{body.parentId ? t("OBIEG WOKÓŁ PLANETY") : t("OKRES OBIEGU")}</dt>
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
            ) : isSolar && !body.parentId ? (
              <button className="panel-journey" onClick={() => step(0)}>
                {t("Rozpocznij podróż")}
                <Icon name="arrow" />
              </button>
            ) : !isSolar ? <button className="panel-journey" onClick={home}>{t("Cały układ")} <Icon name="home" /></button> : null}
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
                  {format(speed)} <span>{t("dni / s")}</span>
                </output>
              </div>
              <input
                id="speed"
                aria-label={t("Szybkość symulacji")}
                type="range"
                min="0"
                max={isSolar && !moonParent ? 100 : 5}
                step={isSolar && !moonParent ? 1 : 0.05}
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
              title={isSolar ? t("Reset: dzień 0, 8 dni/s, widok całego układu") : t("Reset: dzień 0, 0,25 dnia/s, widok całego układu")}
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
            <span className="coordinates">{isSolar ? "SOL / 01" : system.name.toUpperCase()}</span>
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
        <p>{t("Nowe układy mają osobne zegary. Reset przywraca wybrany układ do dnia 0; domyślne tempo egzoplanet to 0,25 dnia/s. Ich wygląd jest interpretacją artystyczną, a obrót osiowy pozostaje nieruchomy, gdy nie znamy jego okresu.")}</p>
        <p>
          {t(
            "Orbita to interaktywny atlas Układu Słonecznego, egzoplanet i Drogi Mlecznej. Obracaj widok przeciągnięciem, przybliżaj kółkiem lub gestem dwóch palców. Na klawiaturze wybieraj obiekty tabulatorem i Enterem. Spacja wstrzymuje czas, Escape przywraca cały układ.",
          )}
        </p>
        <p>
          {t(
            "Widok Drogi Mlecznej pokazuje przybliżone położenie Układu Słonecznego. Galaktyka ma osobną skalę i jest statyczną rekonstrukcją; podczas jej oglądania czas symulacji planet jest zachowany.",
          )}
        </p>
        <p>
          {t(
            "To symulacja poglądowa, bez efemeryd. Pozycje początkowe są umowne. Orbity planet Układu Słonecznego są elipsami opartymi na parametrach NASA/JPL dla J2000; orbity egzoplanet pozostają kołowym przybliżeniem. Płaszczyzny orbit są uproszczone; rozmiary i odległości nie zachowują wspólnej skali. Względne okresy obiegu odpowiadają danym NASA, a obroty osiowe są wizualnie spowolnione.",
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
