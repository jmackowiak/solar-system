import { bodies } from "./bodies";
import type { Body } from "./bodies";
import { englishBodyCopy } from "./body-translations";

export type SystemId = "solar" | "trappist-1" | "kepler-90" | "toi-700";
type ExoplanetSystemId = Exclude<SystemId, "solar">;
type Language = "en" | "pl";
export interface PlanetarySystem {
  id: SystemId;
  name: string;
  /** Distance from the Solar System. Solar's 0 is a local origin, not a measured star distance. */
  distanceLightYears: number;
  /** ICRS sky direction in decimal degrees; solar's 0/0 is a sentinel. */
  ra: number;
  dec: number;
  starColor: string;
  source: string;
  copy: Record<Language, { subtitle: string; description: string }>;
}

export const EXOPLANET_SNAPSHOT_DATE = "2026-10-29";
export const AU_MILLION_KM = 149.5978707;
export const EARTH_RADIUS_KM = 6378.1;
export const SOLAR_RADIUS_KM = 695700;
export const PARSEC_LIGHT_YEARS = 3.26156;
const archive = "https://exoplanetarchive.ipac.caltech.edu";
const constantsSources = [
  "https://cneos.jpl.nasa.gov/glossary/au.html",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html",
  "https://assets.science.nasa.gov/content/dam/science/astro/programs/exep/science/documents/ExEP_Science_Gap_List_2026.pdf",
];
const trappistSource = "https://science.nasa.gov/mission/webb/science-overview/science-explainers/what-is-webb-revealing-about-the-trappist-1-system/";
const keplerSource = "https://science.nasa.gov/universe/exoplanets/discovery-of-eight-planets-makes-alien-system-the-first-to-tie-with-our-solar-system/";
const toiSource = "https://www.nasa.gov/universe/nasas-tess-discovers-planetary-systems-second-earth-size-world/";

interface PlanetMeasurement {
  system: ExoplanetSystemId;
  archiveName: string;
  letter: string;
  periodDays: number;
  /** Published lower and upper offsets; null means not supplied by the composite table. */
  periodError: [number | null, number | null];
  semiMajorAu: number;
  semiMajorError: [number | null, number | null];
  radiusEarth: number;
  radiusError: [number | null, number | null];
  references: { period: string; semiMajor: string; radius: string };
}

/** Offline pscomppars snapshot. Scientific columns are retained before display conversion. */
export const exoplanetSnapshot: PlanetMeasurement[] = [
  {
    "system": "kepler-90",
    "archiveName": "KOI-351 b",
    "letter": "b",
    "periodDays": 7.008151,
    "periodError": [
      -1.9e-05,
      1.9e-05
    ],
    "semiMajorAu": 0.074,
    "semiMajorError": [
      -0.016,
      0.016
    ],
    "radiusEarth": 1.31,
    "radiusError": [
      -0.17,
      0.17
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract"
    }
  },
  {
    "system": "kepler-90",
    "archiveName": "KOI-351 c",
    "letter": "c",
    "periodDays": 8.719375,
    "periodError": [
      -2.7e-05,
      2.7e-05
    ],
    "semiMajorAu": 0.089,
    "semiMajorError": [
      -0.012,
      0.012
    ],
    "radiusEarth": 1.19,
    "radiusError": [
      -0.14,
      0.14
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract"
    }
  },
  {
    "system": "kepler-90",
    "archiveName": "Kepler-90 i",
    "letter": "i",
    "periodDays": 14.44912,
    "periodError": [
      -0.0002,
      0.0002
    ],
    "semiMajorAu": 0.1201380843,
    "semiMajorError": [
      null,
      null
    ],
    "radiusEarth": 1.32,
    "radiusError": [
      -0.21,
      0.21
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2018AJ....155...94S/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2024ApJS..270....8W/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2018AJ....155...94S/abstract"
    }
  },
  {
    "system": "kepler-90",
    "archiveName": "KOI-351 d",
    "letter": "d",
    "periodDays": 59.73667,
    "periodError": [
      -0.00038,
      0.00038
    ],
    "semiMajorAu": 0.32,
    "semiMajorError": [
      -0.05,
      0.05
    ],
    "radiusEarth": 2.87,
    "radiusError": [
      -0.3,
      0.3
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract"
    }
  },
  {
    "system": "kepler-90",
    "archiveName": "KOI-351 e",
    "letter": "e",
    "periodDays": 91.93913,
    "periodError": [
      -0.00073,
      0.00073
    ],
    "semiMajorAu": 0.42,
    "semiMajorError": [
      -0.06,
      0.06
    ],
    "radiusEarth": 2.66,
    "radiusError": [
      -0.29,
      0.29
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract"
    }
  },
  {
    "system": "kepler-90",
    "archiveName": "KOI-351 f",
    "letter": "f",
    "periodDays": 124.9144,
    "periodError": [
      -0.0019,
      0.0019
    ],
    "semiMajorAu": 0.48,
    "semiMajorError": [
      -0.09,
      0.09
    ],
    "radiusEarth": 2.88,
    "radiusError": [
      -0.52,
      0.52
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract"
    }
  },
  {
    "system": "kepler-90",
    "archiveName": "KOI-351 g",
    "letter": "g",
    "periodDays": 210.73514,
    "periodError": [
      -0.00017,
      0.00017
    ],
    "semiMajorAu": 0.71704,
    "semiMajorError": [
      -0.00729,
      0.00729
    ],
    "radiusEarth": 7.718,
    "radiusError": [
      -0.206,
      0.206
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2025AJ....170..146S/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2018AJ....156..264F/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2024ApJS..270....8W/abstract"
    }
  },
  {
    "system": "kepler-90",
    "archiveName": "KOI-351 h",
    "letter": "h",
    "periodDays": 331.60296,
    "periodError": [
      -0.00034,
      0.00034
    ],
    "semiMajorAu": 0.97062,
    "semiMajorError": [
      -0.00986,
      0.00986
    ],
    "radiusEarth": 11.252,
    "radiusError": [
      -0.306,
      0.306
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2025AJ....170..146S/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2018AJ....156..264F/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2024ApJS..270....8W/abstract"
    }
  },
  {
    "system": "toi-700",
    "archiveName": "TOI-700 b",
    "letter": "b",
    "periodDays": 9.97722,
    "periodError": [
      -1.2e-05,
      1.2e-05
    ],
    "semiMajorAu": 0.0678,
    "semiMajorError": [
      -0.0011,
      0.0011
    ],
    "radiusEarth": 0.963,
    "radiusError": [
      -0.034,
      0.037
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract"
    }
  },
  {
    "system": "toi-700",
    "archiveName": "TOI-700 c",
    "letter": "c",
    "periodDays": 16.0511039,
    "periodError": [
      -5.5e-06,
      5.6e-06
    ],
    "semiMajorAu": 0.0931,
    "semiMajorError": [
      -0.0015,
      0.0015
    ],
    "radiusEarth": 2.535,
    "radiusError": [
      -0.073,
      0.084
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract"
    }
  },
  {
    "system": "toi-700",
    "archiveName": "TOI-700 e",
    "letter": "e",
    "periodDays": 27.810124,
    "periodError": [
      -8.7e-05,
      7.1e-05
    ],
    "semiMajorAu": 0.1336,
    "semiMajorError": [
      -0.002,
      0.002
    ],
    "radiusEarth": 0.919,
    "radiusError": [
      -0.024,
      0.028
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract"
    }
  },
  {
    "system": "toi-700",
    "archiveName": "TOI-700 d",
    "letter": "d",
    "periodDays": 37.423457,
    "periodError": [
      -1.7e-05,
      1.8e-05
    ],
    "semiMajorAu": 0.1642,
    "semiMajorError": [
      -0.0027,
      0.0025
    ],
    "radiusEarth": 1.145,
    "radiusError": [
      -0.026,
      0.032
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract"
    }
  },
  {
    "system": "trappist-1",
    "archiveName": "TRAPPIST-1 b",
    "letter": "b",
    "periodDays": 1.510826,
    "periodError": [
      -6e-06,
      6e-06
    ],
    "semiMajorAu": 0.01154,
    "semiMajorError": [
      -0.0001,
      0.0001
    ],
    "radiusEarth": 1.116,
    "radiusError": [
      -0.012,
      0.014
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract"
    }
  },
  {
    "system": "trappist-1",
    "archiveName": "TRAPPIST-1 c",
    "letter": "c",
    "periodDays": 2.421937,
    "periodError": [
      -1.8e-05,
      1.8e-05
    ],
    "semiMajorAu": 0.0158,
    "semiMajorError": [
      -0.00013,
      0.00013
    ],
    "radiusEarth": 1.097,
    "radiusError": [
      -0.012,
      0.014
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract"
    }
  },
  {
    "system": "trappist-1",
    "archiveName": "TRAPPIST-1 d",
    "letter": "d",
    "periodDays": 4.049219,
    "periodError": [
      -2.6e-05,
      2.6e-05
    ],
    "semiMajorAu": 0.02227,
    "semiMajorError": [
      -0.00019,
      0.00019
    ],
    "radiusEarth": 0.788,
    "radiusError": [
      -0.01,
      0.011
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract"
    }
  },
  {
    "system": "trappist-1",
    "archiveName": "TRAPPIST-1 e",
    "letter": "e",
    "periodDays": 6.101013,
    "periodError": [
      -3.5e-05,
      3.5e-05
    ],
    "semiMajorAu": 0.02925,
    "semiMajorError": [
      -0.0025,
      0.0025
    ],
    "radiusEarth": 0.92,
    "radiusError": [
      -0.012,
      0.013
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract"
    }
  },
  {
    "system": "trappist-1",
    "archiveName": "TRAPPIST-1 f",
    "letter": "f",
    "periodDays": 9.20754,
    "periodError": [
      -3.2e-05,
      3.2e-05
    ],
    "semiMajorAu": 0.03849,
    "semiMajorError": [
      -0.00033,
      0.00033
    ],
    "radiusEarth": 1.045,
    "radiusError": [
      -0.012,
      0.013
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract"
    }
  },
  {
    "system": "trappist-1",
    "archiveName": "TRAPPIST-1 g",
    "letter": "g",
    "periodDays": 12.352446,
    "periodError": [
      -5.4e-05,
      5.4e-05
    ],
    "semiMajorAu": 0.04683,
    "semiMajorError": [
      -0.0004,
      0.0004
    ],
    "radiusEarth": 1.129,
    "radiusError": [
      -0.013,
      0.015
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract"
    }
  },
  {
    "system": "trappist-1",
    "archiveName": "TRAPPIST-1 h",
    "letter": "h",
    "periodDays": 18.772866,
    "periodError": [
      -0.000214,
      0.000214
    ],
    "semiMajorAu": 0.06189,
    "semiMajorError": [
      -0.00053,
      0.00053
    ],
    "radiusEarth": 0.755,
    "radiusError": [
      -0.014,
      0.014
    ],
    "references": {
      "period": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "semiMajor": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
      "radius": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract"
    }
  }
];

/** Host measurements, using one explicitly selected literature radius per star. */
export const stellarSnapshot = {
  "trappist-1": {
    "radiusSolar": 0.1192,
    "radiusError": [
      -0.0013,
      0.0013
    ],
    "ra": 346.6263919,
    "dec": -5.0434618,
    "distanceParsecs": 12.42988881,
    "distanceError": [
      -0.01870661,
      0.01870661
    ],
    "radiusSource": "https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract",
    "distanceSource": "https://ui.adsabs.harvard.edu/abs/2018A&A...616A...1G/abstract"
  },
  "kepler-90": {
    "radiusSolar": 1.185,
    "radiusError": [
      -0.03,
      0.031
    ],
    "ra": 284.4334642,
    "dec": 49.3051239,
    "distanceParsecs": 848.254,
    "distanceError": [
      -10.8185,
      10.8185
    ],
    "radiusSource": "https://ui.adsabs.harvard.edu/abs/2018AJ....156..264F/abstract",
    "distanceSource": "https://ui.adsabs.harvard.edu/abs/2019AJ....158..138S/abstract"
  },
  "toi-700": {
    "radiusSolar": 0.4104,
    "radiusError": [
      -0.0069,
      0.0093
    ],
    "ra": 97.0957165,
    "dec": -65.5786149,
    "distanceParsecs": 31.1265,
    "distanceError": [
      -0.0206,
      0.0206
    ],
    "radiusSource": "https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract",
    "distanceSource": "https://ui.adsabs.harvard.edu/abs/2019AJ....158..138S/abstract"
  }
} satisfies Record<ExoplanetSystemId, {
  radiusSolar: number; radiusError: [number, number]; ra: number; dec: number;
  distanceParsecs: number; distanceError: [number, number];
  radiusSource: string; distanceSource: string;
}>;

const distanceLightYears = (id: ExoplanetSystemId) =>
  Math.round(stellarSnapshot[id].distanceParsecs * PARSEC_LIGHT_YEARS * 100) / 100;

export const planetarySystems: PlanetarySystem[] = [
  {
    id: "solar", name: "Solar System", distanceLightYears: 0, ra: 0, dec: 0,
    starColor: "#ffc76a", source: "https://science.nasa.gov/solar-system/solar-system-facts/",
    copy: {
      en: { subtitle: "Our home among the stars", description: "One star, eight planets and the place we call home. Explore the worlds orbiting our Sun before travelling to other planetary systems." },
      pl: { subtitle: "Nasz dom wśród gwiazd", description: "Jedna gwiazda, osiem planet i miejsce, które nazywamy domem. Odkryj światy krążące wokół Słońca, zanim wyruszysz do innych układów planetarnych." },
    },
  },
  {
    id: "trappist-1", name: "TRAPPIST-1", distanceLightYears: distanceLightYears("trappist-1"),
    ra: stellarSnapshot["trappist-1"].ra, dec: stellarSnapshot["trappist-1"].dec,
    starColor: "#f59b6b", source: trappistSource,
    copy: {
      en: { subtitle: "Seven worlds around a tiny star", description: "Seven roughly Earth-sized planets circle an ultracool red dwarf. All seven orbits fit inside Mercury’s path around the Sun — a compact family whose atmospheres are still being investigated." },
      pl: { subtitle: "Siedem światów przy maleńkiej gwieździe", description: "Siedem planet o rozmiarach zbliżonych do Ziemi obiega ultrachłodnego czerwonego karła. Wszystkie orbity mieszczą się wewnątrz orbity Merkurego — to zwarta rodzina światów, których atmosfery nadal badamy." },
    },
  },
  {
    id: "kepler-90", name: "Kepler-90", distanceLightYears: distanceLightYears("kepler-90"),
    ra: stellarSnapshot["kepler-90"].ra, dec: stellarSnapshot["kepler-90"].dec,
    starColor: "#ffe0a7", source: keplerSource,
    copy: {
      en: { subtitle: "Eight planets, a much tighter arrangement", description: "A Sun-like star hosts eight confirmed planets: smaller worlds inside and giants farther out. The whole known family fits within roughly the distance from Earth to the Sun." },
      pl: { subtitle: "Osiem planet, znacznie ciaśniejszy układ", description: "Gwiazdę podobną do Słońca obiega osiem potwierdzonych planet: mniejsze światy bliżej i olbrzymy dalej. Cała znana rodzina mieści się w odległości zbliżonej do tej, która dzieli Ziemię od Słońca." },
    },
  },
  {
    id: "toi-700", name: "TOI-700", distanceLightYears: distanceLightYears("toi-700"),
    ra: stellarSnapshot["toi-700"].ra, dec: stellarSnapshot["toi-700"].dec,
    starColor: "#ffb386", source: toiSource,
    copy: {
      en: { subtitle: "Four planets discovered with TESS", description: "A cool red dwarf hosts four known worlds. Two small planets occupy regions studied for possible surface liquid water, but their atmospheres, oceans and habitability are not established." },
      pl: { subtitle: "Cztery planety odkryte dzięki TESS", description: "Chłodnego czerwonego karła obiegają cztery znane światy. Dwie małe planety leżą w obszarach badanych pod kątem możliwości istnienia ciekłej wody na powierzchni, ale nie potwierdzono ich atmosfer, oceanów ani warunków do życia." },
    },
  },
];

export const systemById = Object.fromEntries(
  planetarySystems.map((system) => [system.id, system]),
) as Record<SystemId, PlanetarySystem>;

const palettes: Record<ExoplanetSystemId, string[]> = {
  "trappist-1": ["#af7962", "#b99a76", "#a38878", "#84918d", "#a6ada8", "#aeb9b6", "#a6acb4"],
  "kepler-90": ["#ac7b66", "#b9987d", "#c89573", "#b6a18c", "#9aafb2", "#b7b5a5", "#cbb595", "#bba681"],
  "toi-700": ["#bd886e", "#a7bec5", "#9da7a1", "#afada0"],
};
const likelyRocky = (id: ExoplanetSystemId, letter: string) =>
  id === "trappist-1" || (id === "kepler-90" ? ["b", "c", "i"].includes(letter) : letter !== "c");

/** Individual narratives use the snapshot above; surface conditions are not inferred from size. */
const planetNarratives: Record<ExoplanetSystemId, Record<string, Record<Language, { description: string; fact: string }>>> = {
  "trappist-1": {
    "b": {
      en: { description: "The closest planet to this tiny red star races around it in just a day and a half. Its slightly larger-than-Earth size opens a very different window onto the family of rocky worlds.", fact: "During one Earth week, this planet completes more than four full orbits." },
      pl: { description: "Najbliższa planeta tej maleńkiej czerwonej gwiazdy obiega ją w zaledwie półtora dnia. Jest nieco większa od Ziemi i pokazuje, jak odmienna może być rodzina skalistych światów.", fact: "W ciągu jednego ziemskiego tygodnia ta planeta wykonuje ponad cztery pełne obiegi." },
    },
    "c": {
      en: { description: "The second world in the system follows close behind b. Its radius is only about a tenth larger than Earth’s, yet its entire year fits comfortably into a long weekend.", fact: "One orbit of c takes about 1.6 times as long as an orbit of its inner neighbour b." },
      pl: { description: "Drugi świat układu podąża tuż za planetą b. Jego promień jest tylko o około jedną dziesiątą większy od ziemskiego, a cały rok mieści się w długości długiego weekendu.", fact: "Jeden obieg planety c trwa około 1,6 razy dłużej niż obieg jej wewnętrznej sąsiadki b." },
    },
    "d": {
      en: { description: "One of the smaller members of this crowded family, d is noticeably smaller than Earth. It sits between c and e, completing a circuit of the star in roughly four days.", fact: "Its estimated radius is about 79% of Earth’s; only h has a smaller central radius estimate in this system." },
      pl: { description: "Jedna z mniejszych planet tej ciasnej rodziny jest wyraźnie mniejsza od Ziemi. Krąży między c i e, zamykając obieg gwiazdy w około cztery dni.", fact: "Jej szacowany promień to około 79% ziemskiego; spośród planet tego układu tylko h ma mniejsze centralne oszacowanie promienia." },
    },
    "e": {
      en: { description: "Close to Earth in size, e lies near the middle of this compact system. It is a compelling world to investigate, but a familiar size alone tells us little about the conditions at its surface.", fact: "Its estimated radius is about 8% smaller than Earth’s. A year here lasts just over six Earth days." },
      pl: { description: "Rozmiarami bliska Ziemi planeta e leży w środkowej części tego zwartego układu. Zachęca do badań, ale znajoma wielkość niewiele mówi o rzeczywistych warunkach na jej powierzchni.", fact: "Jej szacowany promień jest o około 8% mniejszy od ziemskiego. Rok trwa tu nieco ponad sześć ziemskich dni." },
    },
    "f": {
      en: { description: "Almost Earth-sized, f takes a little over nine days to circle its star. From here outward, the family remains remarkably compact even as the orbital pace begins to ease.", fact: "Its central radius estimate is only about 4.5% larger than Earth’s, while its year is about one and a half times as long as e’s." },
      pl: { description: "Planeta f, niemal wielkości Ziemi, potrzebuje nieco ponad dziewięciu dni na obieg gwiazdy. Dalej tempo orbitalnej podróży maleje, ale rodzina światów nadal pozostaje wyjątkowo zwarta.", fact: "Jej centralne oszacowanie promienia jest tylko o około 4,5% większe od ziemskiego, a rok trwa około półtora razy dłużej niż na e." },
    },
    "g": {
      en: { description: "The largest planet in this family by its central radius estimate is still only modestly larger than Earth. It occupies the penultimate orbit, between f and the smaller outer world h.", fact: "Its orbital distance is about four times that of b, despite both planets belonging to a system far smaller than Mercury’s orbit." },
      pl: { description: "Największa planeta tej rodziny według centralnego oszacowania promienia wciąż jest tylko nieznacznie większa od Ziemi. Zajmuje przedostatnią orbitę, między f i mniejszym zewnętrznym światem h.", fact: "Jej odległość orbitalna jest około cztery razy większa niż planety b, choć obie należą do układu znacznie mniejszego od orbity Merkurego." },
    },
    "h": {
      en: { description: "The smallest known member also marks the outer edge of this seven-planet family. Even here, a full journey around the star takes less than nineteen Earth days.", fact: "While h completes one orbit, b makes about twelve and a half. These are orbital years, not measured rotation periods." },
      pl: { description: "Najmniejsza znana planeta wyznacza zarazem zewnętrzny skraj tej siedmioplanetarnej rodziny. Nawet tutaj pełna podróż wokół gwiazdy trwa krócej niż dziewiętnaście ziemskich dni.", fact: "Gdy h wykonuje jeden obieg, b zdąży okrążyć gwiazdę około dwanaście i pół razy. To lata orbitalne, nie zmierzone okresy obrotu osiowego." },
    },
  },
  "kepler-90": {
    "b": {
      en: { description: "The innermost known world in this eight-planet system completes its year in a single Earth week. Larger than Earth but much smaller than the outer giants, it anchors the compact inner family.", fact: "The neighbouring planet c takes only about 1.7 Earth days longer to complete an orbit." },
      pl: { description: "Najbliższy znany świat tego ośmioplanetarnego układu zamyka swój rok w jednym ziemskim tygodniu. Większy od Ziemi, ale znacznie mniejszy od zewnętrznych olbrzymów, otwiera zwartą rodzinę wewnętrznych planet.", fact: "Sąsiednia planeta c potrzebuje na pełny obieg tylko około 1,7 ziemskiego dnia więcej." },
    },
    "c": {
      en: { description: "Small by this system’s standards, c is the second planet from the star. Its estimated radius is only about a fifth larger than Earth’s, smaller than both its immediate neighbours.", fact: "Being farther from a star does not necessarily mean being larger: c is smaller than the closer planet b." },
      pl: { description: "Niewielka na tle tego układu planeta c krąży jako druga od gwiazdy. Jej szacowany promień jest tylko o około jedną piątą większy od ziemskiego i mniejszy niż u obu najbliższych sąsiadek.", fact: "Większa odległość od gwiazdy nie musi oznaczać większego rozmiaru: c jest mniejsza od bliższej planety b." },
    },
    "i": {
      en: { description: "A late discovery tucked into an early orbit. This small world circles between c and d, showing why the letters in planet names do not always follow their distance from the star.", fact: "The system’s eighth planet to be discovered was identified in archived Kepler data with machine learning. It is third in orbital order." },
      pl: { description: "Późno odkryta planeta na jednej z pierwszych orbit. Ten niewielki świat krąży między c i d, pokazując, dlaczego litery w nazwach planet nie zawsze odpowiadają odległościom od gwiazdy.", fact: "Ósmą odkrytą planetę układu rozpoznano w archiwalnych danych Keplera z pomocą uczenia maszynowego. W kolejności orbit jest trzecia." },
    },
    "d": {
      en: { description: "After the tightly packed inner trio comes a larger world with nearly three times Earth’s radius. Its size places it between familiar categories, and its detailed composition remains uncertain.", fact: "A year on d lasts more than four times as long as a year on its inner neighbour i." },
      pl: { description: "Za ciasną wewnętrzną trójką pojawia się większy świat o promieniu niemal trzykrotnie większym od ziemskiego. Rozmiar stawia go między znanymi kategoriami planet, a szczegółowy skład pozostaje niepewny.", fact: "Rok na d trwa ponad cztery razy dłużej niż rok na wewnętrznej sąsiadce i." },
    },
    "e": {
      en: { description: "The middle planet of the larger inner group circles its star in about ninety-two days. It is slightly smaller than d and f, another reminder that planetary families are not sorted by size.", fact: "For every orbit completed by e, the innermost planet b completes about thirteen." },
      pl: { description: "Środkowa planeta grupy większych wewnętrznych światów obiega gwiazdę w około dziewięćdziesiąt dwa dni. Jest nieco mniejsza od d i f — kolejne przypomnienie, że planetarne rodziny nie są uporządkowane według rozmiarów.", fact: "Na każdy pełny obieg e przypada około trzynastu obiegów najbliższej gwieździe planety b." },
    },
    "f": {
      en: { description: "The last world before the two outer giants has a radius close to that of d. A much longer orbit sets its rhythm: a year lasts roughly a third of an Earth year.", fact: "Although d and f have almost the same central radius estimate, f takes a little over twice as long to orbit the star." },
      pl: { description: "Ostatni świat przed parą zewnętrznych olbrzymów ma promień zbliżony do planety d. Rytm wyznacza jednak znacznie dłuższa orbita: rok trwa około jednej trzeciej ziemskiego roku.", fact: "Choć d i f mają niemal takie same centralne oszacowania promienia, f potrzebuje na obieg gwiazdy nieco ponad dwa razy więcej czasu." },
    },
    "g": {
      en: { description: "The inner of the two outer giants is a clear step up in size, with almost eight times Earth’s radius. Its broad orbit takes about two hundred and eleven days to complete.", fact: "Even this outer giant orbits at only about 72% of the Earth–Sun distance." },
      pl: { description: "Wewnętrzny z dwóch zewnętrznych olbrzymów przynosi wyraźny skok rozmiarów: ma promień niemal osiem razy większy od ziemskiego. Rozległy obieg zamyka w około dwieście jedenaście dni.", fact: "Nawet ten zewnętrzny olbrzym krąży w odległości wynoszącej tylko około 72% odległości Ziemi od Słońca." },
    },
    "h": {
      en: { description: "A roughly Jupiter-sized giant closes the known family. Its orbit reaches nearly the Earth–Sun distance, yet contains an entire eight-planet system inside it.", fact: "The longest year in this system still ends before an Earth year: about 332 days rather than 365." },
      pl: { description: "Olbrzym o rozmiarach zbliżonych do Jowisza zamyka znaną rodzinę. Jego orbita sięga niemal odległości Ziemi od Słońca, mieszcząc w swoim obrębie cały ośmioplanetarny układ.", fact: "Najdłuższy rok tego układu wciąż kończy się przed ziemskim: trwa około 332 dni zamiast 365." },
    },
  },
  "toi-700": {
    "b": {
      en: { description: "The innermost of four known planets is close to Earth in size. Its ten-day year sets the fastest pace in this small family around a cool red dwarf.", fact: "This planet completes almost four orbits in the time the outermost planet d completes one." },
      pl: { description: "Najbliższa gwieździe z czterech znanych planet ma rozmiary zbliżone do Ziemi. Jej dziesięciodniowy rok wyznacza najszybszy rytm w tej małej rodzinie przy chłodnym czerwonym karle.", fact: "Ta planeta wykonuje niemal cztery obiegi w czasie, w którym zewnętrzna planeta d zamyka jeden." },
    },
    "c": {
      en: { description: "The largest world in the system stands out between its smaller neighbours. NASA classifies it as Neptune-like; a radius more than twice Earth’s sets it apart from the other three planets.", fact: "Its estimated radius is about 2.6 times that of its inner neighbour b." },
      pl: { description: "Największy świat układu wyraźnie wyróżnia się między mniejszymi sąsiadkami. NASA klasyfikuje go jako planetę typu Neptuna; promień ponad dwukrotnie większy od ziemskiego odróżnia go od pozostałej trójki.", fact: "Jej szacowany promień jest około 2,6 razy większy niż u wewnętrznej sąsiadki b." },
    },
    "e": {
      en: { description: "Announced in 2023, the fourth planet discovered here slipped into the gap between c and d. It is slightly smaller than Earth and lies in the star’s optimistic habitable zone; water has not been confirmed.", fact: "Finding e required an additional year of TESS observations. Its faint transit signal had escaped the first year’s search." },
      pl: { description: "Ogłoszona w 2023 roku czwarta odkryta planeta układu zajęła miejsce między c i d. Jest nieco mniejsza od Ziemi i leży w optymistycznym obszarze ekosfery gwiazdy; nie potwierdzono na niej wody.", fact: "Odkrycie e wymagało dodatkowego roku obserwacji TESS. Jej słaby sygnał tranzytu umknął poszukiwaniom w pierwszym roku." },
    },
    "d": {
      en: { description: "The outermost known planet brought this system into focus in 2020. Slightly larger than Earth, it orbits in the conservative habitable zone, a promising location for study rather than evidence of a living world.", fact: "Its roughly thirty-seven-day year is longer than those of b, c and e, even though d was discovered before e." },
      pl: { description: "Najdalsza znana planeta zwróciła uwagę na ten układ w 2020 roku. Nieco większa od Ziemi, krąży w konserwatywnym obszarze ekosfery — obiecującym miejscu do badań, nie dowodzie istnienia żywego świata.", fact: "Jej rok, trwający około trzydziestu siedmiu dni, jest dłuższy niż na b, c i e, choć planetę d odkryto przed e." },
    },
  },
};

function planetCopy(id: ExoplanetSystemId, measurement: PlanetMeasurement, language: Language) {
  const giant = id === "kepler-90" && ["g", "h"].includes(measurement.letter);
  const neptune = id === "toi-700" && measurement.letter === "c";
  const rocky = likelyRocky(id, measurement.letter);
  const kind = language === "en"
    ? giant ? "Gas giant exoplanet" : neptune ? "Neptune-like exoplanet" : rocky ? "Likely rocky exoplanet" : "Exoplanet · composition uncertain"
    : giant ? "Egzoplaneta · gazowy olbrzym" : neptune ? "Egzoplaneta typu Neptuna" : rocky ? "Egzoplaneta · prawdopodobnie skalista" : "Egzoplaneta · niepewny skład";
  return { kind, ...planetNarratives[id][measurement.letter][language] };
}

/** Every return value is independent; changing UI copy must not mutate the scientific snapshot. */
export function getSystemBodies(id: SystemId, language: Language): Body[] {
  if (id === "solar") return bodies.map((body) => ({
    ...body,
    ...(language === "en" ? englishBodyCopy[body.id] : {}),
    dataSources: [...body.dataSources],
  }));
  const system = systemById[id];
  const host = stellarSnapshot[id];
  const overview = `${archive}/overview/${id === "kepler-90" ? "KOI-351" : system.name}`;
  const measurements = exoplanetSnapshot.filter((planet) => planet.system === id);
  const star: Body = {
    id, name: system.name,
    kind: language === "en"
      ? id === "kepler-90" ? "Sun-like star" : "Red dwarf star"
      : id === "kepler-90" ? "Gwiazda podobna do Słońca" : "Czerwony karzeł",
    description: system.copy[language].description,
    diameterKm: Math.round(host.radiusSolar * SOLAR_RADIUS_KM * 2),
    distanceMillionKm: null, orbitalPeriodDays: null,
    // No unsupported axial period or assumed tidal locking is animated.
    rotationPeriodDays: 0,
    fact: language === "en"
      ? "The planets were detected through transits: small dips in the star’s brightness when a planet passes in front of it from our viewpoint."
      : "Planety wykryto metodą tranzytów: niewielkich spadków jasności gwiazdy, gdy planeta przechodzi przed nią z naszego punktu widzenia.",
    source: system.source,
    dataSources: [overview, host.radiusSource, host.distanceSource, ...constantsSources],
    displayRadius: id === "trappist-1" ? 2.8 : id === "toi-700" ? 3 : 3.4,
    orbitRadius: 0, phase: 0, color: system.starColor,
  };
  return [star, ...measurements.map((planet, index): Body => ({
    id: `${id}-${planet.letter}`, name: `${system.name} ${planet.letter}`,
    ...planetCopy(id, planet, language),
    diameterKm: Math.round(planet.radiusEarth * EARTH_RADIUS_KM * 2),
    // Semi-major axis, an orbital distance proxy; see docs/EXOPLANETS.md.
    distanceMillionKm: planet.semiMajorAu * AU_MILLION_KM,
    orbitalPeriodDays: planet.periodDays,
    rotationPeriodDays: 0,
    source: `${archive}/overview/${encodeURIComponent(planet.archiveName)}`,
    dataSources: [overview, ...Object.values(planet.references), system.source, "https://science.nasa.gov/exoplanets/how-do-exoplanets-get-their-names/", ...(id === "toi-700" && planet.letter === "c" ? ["https://science.nasa.gov/exoplanet-catalog/toi-700-c/"] : []), ...constantsSources],
    displayRadius: Math.max(0.55, Math.min(2, 0.82 * Math.pow(planet.radiusEarth, 0.38))),
    orbitRadius: 7 + index * (44 / (measurements.length - 1)),
    // Deterministic composition, deliberately unrelated to observed transit epochs.
    phase: ((index * 2.399963229728653) + 0.35) % (Math.PI * 2),
    color: palettes[id][index],
  }))];
}
