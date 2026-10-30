import type { Body } from "./bodies";

export type MoonId = "moon" | "io" | "europa" | "ganymede" | "callisto" | "titan";
export interface Moon extends Body {
  id: MoonId;
  parentId: "earth" | "jupiter" | "saturn";
  /** Approximate orbital distance from the parent centre, not its visible surface. */
  distanceFromParentKm: number;
}
type Language = "en" | "pl";
type MoonCopy = Pick<Body, "name" | "kind" | "description" | "fact">;

export const MOON_DATA_CHECKED = "2026-10-30";
const radiiSource = "https://ssd.jpl.nasa.gov/sats/phys_par/";
const moonOrbitSource = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html";
const jovianOrbitSource = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html";
const titanOrbitSource = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html";

// Diameters are twice JPL's volumetric mean radius, rounded to the nearest km.
// Orbital distances are the NASA fact sheets' semi-major axes, not ephemerides.
const measurements: Omit<Moon, keyof MoonCopy>[] = [
  {
    id: "moon", parentId: "earth", diameterKm: 3475,
    distanceFromParentKm: 384400, orbitalPeriodDays: 27.3217,
    rotationPeriodDays: 27.3217, distanceMillionKm: null,
    source: "https://science.nasa.gov/moon/facts/",
    dataSources: [radiiSource, moonOrbitSource, "https://science.nasa.gov/moon/facts/"],
    displayRadius: 0.25, orbitRadius: 3.4, phase: 0.6, color: "#b4b0a8",
    eccentricity: 0, periapsisAngle: 0,
  },
  {
    id: "io", parentId: "jupiter", diameterKm: 3643,
    distanceFromParentKm: 421800, orbitalPeriodDays: 1.769138,
    rotationPeriodDays: 1.769138, distanceMillionKm: null,
    source: "https://science.nasa.gov/jupiter/jupiter-moons/io/facts/",
    dataSources: [radiiSource, jovianOrbitSource, "https://science.nasa.gov/jupiter/jupiter-moons/io/facts/"],
    displayRadius: 0.28, orbitRadius: 4, phase: 0.35, color: "#d5bb75",
    eccentricity: 0, periapsisAngle: 0,
  },
  {
    id: "europa", parentId: "jupiter", diameterKm: 3122,
    distanceFromParentKm: 671100, orbitalPeriodDays: 3.551181,
    rotationPeriodDays: 3.551181, distanceMillionKm: null,
    source: "https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/",
    dataSources: [radiiSource, jovianOrbitSource, "https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/"],
    displayRadius: 0.28, orbitRadius: 5.5, phase: 2.15, color: "#d3c7af",
    eccentricity: 0, periapsisAngle: 0,
  },
  {
    id: "ganymede", parentId: "jupiter", diameterKm: 5262,
    distanceFromParentKm: 1070400, orbitalPeriodDays: 7.154553,
    rotationPeriodDays: 7.154553, distanceMillionKm: null,
    source: "https://science.nasa.gov/jupiter/jupiter-moons/ganymede/facts/",
    dataSources: [radiiSource, jovianOrbitSource, "https://science.nasa.gov/jupiter/jupiter-moons/ganymede/facts/"],
    displayRadius: 0.4, orbitRadius: 7.3, phase: 4.1, color: "#aaa194",
    eccentricity: 0, periapsisAngle: 0,
  },
  {
    id: "callisto", parentId: "jupiter", diameterKm: 4821,
    distanceFromParentKm: 1882700, orbitalPeriodDays: 16.689017,
    rotationPeriodDays: 16.689017, distanceMillionKm: null,
    source: "https://science.nasa.gov/jupiter/jupiter-moons/callisto/facts/",
    dataSources: [radiiSource, jovianOrbitSource, "https://science.nasa.gov/jupiter/jupiter-moons/callisto/facts/"],
    displayRadius: 0.37, orbitRadius: 9, phase: 5.4, color: "#8c8980",
    eccentricity: 0, periapsisAngle: 0,
  },
  {
    id: "titan", parentId: "saturn", diameterKm: 5150,
    distanceFromParentKm: 1221870, orbitalPeriodDays: 15.945421,
    rotationPeriodDays: 15.945421, distanceMillionKm: null,
    source: "https://science.nasa.gov/saturn/moons/titan/facts/",
    dataSources: [radiiSource, titanOrbitSource, "https://science.nasa.gov/saturn/moons/titan/facts/"],
    displayRadius: 0.38, orbitRadius: 5.8, phase: 1.4, color: "#c7a36a",
    eccentricity: 0, periapsisAngle: 0,
  },
];

const copy: Record<Language, Record<MoonId, MoonCopy>> = {
  en: {
    moon: {
      name: "Moon", kind: "Earth’s natural satellite",
      description: "Our nearest celestial companion preserves a long record of impacts and ancient lava flows. Its familiar dark plains and bright cratered highlands tell the story of a world very different from Earth.",
      fact: "The Moon turns once in the time it takes to orbit Earth. Its far side still receives sunlight: ‘far’ does not mean permanently dark.",
    },
    io: {
      name: "Io", kind: "Jupiter’s moon · volcanic world",
      description: "The innermost Galilean moon is a restless world of volcanoes and lava. Jupiter’s gravity, together with the pull of neighbouring moons, flexes Io and supplies the heat driving its activity.",
      fact: "Io is the most volcanically active world in the Solar System. Tidal forces can deform its solid surface by about 100 metres.",
    },
    europa: {
      name: "Europa", kind: "Jupiter’s moon · icy world",
      description: "Dark fractures cross Europa’s bright shell of water ice. Strong evidence points to a salty ocean beneath it, making this small moon a major target for investigating whether habitable environments exist beyond Earth.",
      fact: "Europa is slightly smaller than our Moon. Evidence for a subsurface ocean does not establish that life exists there.",
    },
    ganymede: {
      name: "Ganymede", kind: "Jupiter’s moon · largest moon",
      description: "Larger than Mercury, Ganymede is the biggest moon in the Solar System. Grooved bright terrain cuts across older dark regions, recording a complex history beneath Jupiter’s immense presence.",
      fact: "Ganymede is the only moon known to generate its own intrinsic magnetic field, discovered by NASA’s Galileo spacecraft.",
    },
    callisto: {
      name: "Callisto", kind: "Jupiter’s moon · cratered world",
      description: "The outermost Galilean moon keeps an ancient surface crowded with impact craters. Its subdued landscape offers a different chapter of Jupiter’s history from the restless worlds farther in.",
      fact: "Callisto is nearly as wide as Mercury. Its surface is one of the most heavily cratered in the Solar System.",
    },
    titan: {
      name: "Titan", kind: "Saturn’s moon · dense atmosphere",
      description: "Saturn’s largest moon hides beneath a thick atmospheric haze. On its icy surface, methane and ethane collect in lakes and seas: a liquid cycle involving very different substances from Earth’s water.",
      fact: "Titan is the only moon in the Solar System with a dense atmosphere. It always keeps the same face turned towards Saturn.",
    },
  },
  pl: {
    moon: {
      name: "Księżyc", kind: "Naturalny satelita Ziemi",
      description: "Nasz najbliższy kosmiczny towarzysz przechowuje długą historię uderzeń i dawnych wylewów lawy. Znajome ciemne równiny i jasne wyżyny pełne kraterów opowiadają o świecie bardzo różnym od Ziemi.",
      fact: "Księżyc wykonuje jeden obrót w czasie jednego obiegu Ziemi. Jego niewidoczna strona także otrzymuje światło Słońca — nie jest wiecznie ciemna.",
    },
    io: {
      name: "Io", kind: "Księżyc Jowisza · świat wulkanów",
      description: "Najbliższy Jowiszowi księżyc galileuszowy jest niespokojnym światem wulkanów i lawy. Grawitacja Jowisza wraz z przyciąganiem sąsiednich księżyców odkształca Io i dostarcza ciepła napędzającego tę aktywność.",
      fact: "Io jest najbardziej aktywnym wulkanicznie światem Układu Słonecznego. Siły pływowe mogą odkształcać jego stałą powierzchnię o około 100 metrów.",
    },
    europa: {
      name: "Europa", kind: "Księżyc Jowisza · lodowy świat",
      description: "Ciemne szczeliny przecinają jasną skorupę Europy zbudowaną z wodnego lodu. Mocne dowody wskazują na słony ocean pod jej powierzchnią, dlatego ten mały księżyc jest ważnym celem badań warunków sprzyjających życiu poza Ziemią.",
      fact: "Europa jest nieco mniejsza od naszego Księżyca. Dowody na podpowierzchniowy ocean nie oznaczają potwierdzenia istnienia tam życia.",
    },
    ganymede: {
      name: "Ganimedes", kind: "Księżyc Jowisza · największy księżyc",
      description: "Większy od Merkurego Ganimedes jest największym księżycem Układu Słonecznego. Jasne, pobrużdżone obszary przecinają starsze ciemne tereny, zapisując złożoną historię w sąsiedztwie potężnego Jowisza.",
      fact: "Ganimedes jest jedynym znanym księżycem wytwarzającym własne wewnętrzne pole magnetyczne. Odkryła je sonda NASA Galileo.",
    },
    callisto: {
      name: "Kallisto", kind: "Księżyc Jowisza · świat kraterów",
      description: "Najdalszy księżyc galileuszowy zachował starą powierzchnię gęsto pokrytą kraterami uderzeniowymi. Jego spokojny krajobraz pokazuje inny rozdział historii Jowisza niż bardziej niespokojne światy bliżej planety.",
      fact: "Kallisto ma średnicę zbliżoną do Merkurego. Jej powierzchnia należy do najgęściej pokrytych kraterami w Układzie Słonecznym.",
    },
    titan: {
      name: "Tytan", kind: "Księżyc Saturna · gęsta atmosfera",
      description: "Największy księżyc Saturna skrywa się pod grubą atmosferyczną mgłą. Na jego lodowej powierzchni metan i etan tworzą jeziora i morza — obieg cieczy złożonych z zupełnie innych substancji niż ziemska woda.",
      fact: "Tytan jest jedynym księżycem Układu Słonecznego z gęstą atmosferą. Zawsze zwraca tę samą stronę ku Saturnowi.",
    },
  },
};

export const moonParentById: Readonly<Partial<Record<string, Moon["parentId"]>>> =
  Object.freeze(Object.fromEntries(measurements.map((moon) => [moon.id, moon.parentId])));

/** Values are independent copies so UI state cannot mutate the source measurements. */
export function getMoons(language: Language): Moon[] {
  return measurements.map((moon) => ({
    ...moon,
    ...copy[language][moon.id],
    dataSources: [...moon.dataSources],
  }));
}

export function getMoon(id: string, language: Language): Moon | undefined {
  return getMoons(language).find((moon) => moon.id === id);
}
