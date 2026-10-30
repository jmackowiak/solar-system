/** NASA/JPL physical data checked 2026-10-28; J2000 orbit shapes checked 2026-10-30. */
export interface Body {
  /** Satellites use local orbits around this parent; planets omit it. */
  parentId?: string;
  distanceFromParentKm?: number;
  id: string;
  name: string;
  kind: string;
  description: string;
  /** Twice the volumetric mean radius, rounded to the nearest kilometre. */
  diameterKm: number;
  distanceMillionKm: number | null;
  orbitalPeriodDays: number | null;
  /** Sidereal rotation, in Earth days; negative means retrograde. */
  rotationPeriodDays: number;
  fact: string;
  source: string;
  dataSources: readonly string[];
  displayRadius: number;
  /** Visual semi-major axis, deliberately not a shared astronomical scale. */
  orbitRadius: number;
  /** Elliptical eccentricity; omitted values use the circular approximation. */
  eccentricity?: number;
  /** Periapsis direction in the shared X/Z plane, radians from +X towards +Z. */
  periapsisAngle?: number;
  /** Arbitrary initial mean anomaly, radians; these are not ephemerides. */
  phase: number;
  color: string;
}

const physical = "https://ssd.jpl.nasa.gov/planets/phys_par.html";
const orbital = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/";
const orbitShapes = "https://ssd.jpl.nasa.gov/planets/approx_pos.html";

export const bodies: Body[] = [
  {
    id: "sun",
    name: "Słońce",
    kind: "Gwiazda · żółty karzeł",
    description:
      "Wszystko zaczyna się tutaj. W jądrze naszej gwiazdy wodór przemienia się w hel, uwalniając energię, która ogrzewa planety i podtrzymuje życie na Ziemi.",
    diameterKm: 1391400,
    distanceMillionKm: null,
    orbitalPeriodDays: null,
    rotationPeriodDays: 25.38,
    fact: "Słońce nie obraca się jak sztywna kula: okolice równika wykonują obrót szybciej niż obszary przy biegunach.",
    source: "https://science.nasa.gov/sun/facts/",
    dataSources: [
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html",
    ],
    displayRadius: 3.4,
    orbitRadius: 0,
    eccentricity: 0,
    periapsisAngle: (0 * Math.PI) / 180,
    phase: 0,
    color: "#ffc76a",
  },
  {
    id: "mercury",
    name: "Merkury",
    kind: "Planeta skalista",
    description:
      "Mały, skalisty świat tuż przy Słońcu. Jego szarą powierzchnię pokrywają kratery, a niemal całkowity brak atmosfery oznacza ogromne różnice temperatur między dniem a nocą.",
    diameterKm: 4879,
    distanceMillionKm: 57.9,
    orbitalPeriodDays: 88,
    rotationPeriodDays: 58.6462,
    fact: "Od jednego wschodu Słońca do następnego mijają tutaj 176 ziemskich dni — dwa merkuryjskie lata.",
    source: "https://science.nasa.gov/mercury/facts/",
    dataSources: [physical, orbital, orbitShapes],
    displayRadius: 0.5,
    orbitRadius: 7,
    eccentricity: 0.20563593,
    periapsisAngle: (77.45779628 * Math.PI) / 180,
    phase: -0.5,
    color: "#a6a09a",
  },
  {
    id: "venus",
    name: "Wenus",
    kind: "Planeta skalista",
    description:
      "Jasna z daleka, nieprzyjazna z bliska. Pod grubą zasłoną chmur kryje się gorąca powierzchnia i gęsta atmosfera, w której dominuje dwutlenek węgla.",
    diameterKm: 12104,
    distanceMillionKm: 108.2,
    orbitalPeriodDays: 224.7,
    rotationPeriodDays: -243.018,
    fact: "Jeden pełny obrót Wenus względem gwiazd trwa dłużej niż jej obieg wokół Słońca. Obraca się też w przeciwną stronę niż Ziemia.",
    source: "https://science.nasa.gov/venus/venus-facts/",
    dataSources: [physical, orbital, orbitShapes],
    displayRadius: 0.85,
    orbitRadius: 10,
    eccentricity: 0.00677672,
    periapsisAngle: (131.60246718 * Math.PI) / 180,
    phase: 2.5,
    color: "#d7bd8a",
  },
  {
    id: "earth",
    name: "Ziemia",
    kind: "Planeta skalista · nasz dom",
    description:
      "Nasz błękitny punkt w kosmosie. Oceany, wędrujące chmury i cienka atmosfera tworzą jedyny znany nam świat, na którym istnieje życie.",
    diameterKm: 12742,
    distanceMillionKm: 149.6,
    orbitalPeriodDays: 365.2,
    rotationPeriodDays: 0.99726968,
    fact: "Światło Słońca dociera do Ziemi po około ośmiu minutach. Patrząc na naszą gwiazdę, widzimy jej niedawną przeszłość.",
    source: "https://science.nasa.gov/earth/facts/",
    dataSources: [physical, orbital, orbitShapes],
    displayRadius: 0.92,
    orbitRadius: 14,
    eccentricity: 0.01671123,
    periapsisAngle: (102.93768193 * Math.PI) / 180,
    phase: 0.8,
    color: "#81b6d4",
  },
  {
    id: "mars",
    name: "Mars",
    kind: "Planeta skalista",
    description:
      "Rdzawoczerwone pustynie, polarne czapy i ślady dawnych rzek. Ten chłodny sąsiad Ziemi przechowuje historię świata, który kiedyś miał na powierzchni ciekłą wodę.",
    diameterKm: 6779,
    distanceMillionKm: 228,
    orbitalPeriodDays: 687,
    rotationPeriodDays: 1.02595676,
    fact: "Na Marsie znajduje się Olympus Mons — największy wulkan Układu Słonecznego.",
    source: "https://science.nasa.gov/mars/facts/",
    dataSources: [physical, orbital, orbitShapes],
    displayRadius: 0.68,
    orbitRadius: 18,
    eccentricity: 0.0933941,
    periapsisAngle: (-23.94362959 * Math.PI) / 180,
    phase: 3.5,
    color: "#cc8064",
  },
  {
    id: "jupiter",
    name: "Jowisz",
    kind: "Gazowy olbrzym",
    description:
      "Największa z planet. Jasne strefy i ciemne pasy to chmury pędzące w przeciwnych kierunkach nad głęboką atmosferą wodoru i helu.",
    diameterKm: 139822,
    distanceMillionKm: 778.5,
    orbitalPeriodDays: 4331,
    rotationPeriodDays: 0.41354,
    fact: "Wielka Czerwona Plama jest potężną burzą większą od Ziemi, obserwowaną od setek lat.",
    source: "https://science.nasa.gov/jupiter/jupiter-facts/",
    dataSources: [physical, orbital, orbitShapes],
    displayRadius: 2.1,
    orbitRadius: 26,
    eccentricity: 0.04838624,
    periapsisAngle: (14.72847983 * Math.PI) / 180,
    phase: -0.3,
    color: "#cfb69c",
  },
  {
    id: "saturn",
    name: "Saturn",
    kind: "Gazowy olbrzym",
    description:
      "Otoczony rozległymi pierścieniami z lodu i skał, Saturn jest jednym z najbardziej rozpoznawalnych światów. Pod łagodnymi barwami chmur kryją się potężne wiatry.",
    diameterKm: 116464,
    distanceMillionKm: 1432,
    orbitalPeriodDays: 10747,
    rotationPeriodDays: 0.44401,
    fact: "Średnia gęstość Saturna jest mniejsza od gęstości wody. To jedyna planeta Układu Słonecznego o tej właściwości.",
    source: "https://science.nasa.gov/saturn/facts/",
    dataSources: [physical, orbital, orbitShapes],
    displayRadius: 1.75,
    orbitRadius: 35,
    eccentricity: 0.05386179,
    periapsisAngle: (92.59887831 * Math.PI) / 180,
    phase: 2,
    color: "#d5c39d",
  },
  {
    id: "uranus",
    name: "Uran",
    kind: "Lodowy olbrzym",
    description:
      "Spokojny z pozoru, błękitnozielony olbrzym. Metan w atmosferze pochłania czerwone światło, a niezwykle nachylona oś sprawia, że planeta wygląda, jakby toczyła się po orbicie.",
    diameterKm: 50724,
    distanceMillionKm: 2867,
    orbitalPeriodDays: 30589,
    rotationPeriodDays: -0.71833,
    fact: "Oś Urana jest nachylona o około 98°. W okolicach biegunów noc może trwać około 21 ziemskich lat.",
    source: "https://science.nasa.gov/uranus/facts/",
    dataSources: [physical, orbital, orbitShapes],
    displayRadius: 1.3,
    orbitRadius: 43,
    eccentricity: 0.04725744,
    periapsisAngle: (170.9542763 * Math.PI) / 180,
    phase: 4.4,
    color: "#a4cfd0",
  },
  {
    id: "neptune",
    name: "Neptun",
    kind: "Lodowy olbrzym",
    description:
      "Ostatnia z ośmiu planet, daleko od ciepła Słońca. Pod chłodnymi chmurami tego błękitnego świata szaleją najszybsze wiatry znane w Układzie Słonecznym.",
    diameterKm: 49244,
    distanceMillionKm: 4515,
    orbitalPeriodDays: 59800,
    rotationPeriodDays: 0.67125,
    fact: "Wiatry Neptuna potrafią przekraczać 2000 km/h, mimo że dociera tu tak niewiele energii słonecznej.",
    source: "https://science.nasa.gov/neptune/neptune-facts/",
    dataSources: [physical, orbital, orbitShapes],
    displayRadius: 1.25,
    orbitRadius: 51,
    eccentricity: 0.00859048,
    periapsisAngle: (44.96476227 * Math.PI) / 180,
    phase: 0.5,
    color: "#6b9fbf",
  },
];

export const bodyById = Object.fromEntries(
  bodies.map((body) => [body.id, body]),
) as Record<string, Body>;
