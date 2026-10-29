import type { Language } from "../i18n";

export interface GalaxyCopy {
  title: string;
  subtitle: string;
  description: string;
  location: string;
  diameter: string;
  distance: string;
  orbit: string;
  approximation: string;
  sourceLabel: string;
  source: string;
}

/** NASA sources and the limits of this reconstruction: docs/GALAXY.md. */
export const galaxyCopy: Record<Language, GalaxyCopy> = {
  en: {
    title: "Milky Way",
    subtitle: "Our galactic home",
    description:
      "Step back from the planets and find our place in a barred spiral galaxy. Our entire Solar System is a tiny part of this vast sweep of stars, gas and dust.",
    location: "Orion Spur, between the Sagittarius and Perseus arms",
    diameter: "≈100,000 light-years",
    distance: "≈26,000 light-years",
    orbit: "≈230 million years",
    approximation:
      "Schematic reconstruction, not a map of individual stars. The Sun’s position and the spiral arms are approximate; their structure remains uncertain. This view has its own scale, separate from the Solar System, and uses no ephemerides. The stars stay still; the simulation’s day counter does not represent galactic time.",
    sourceLabel: "Our place in the galaxy · NASA",
    source: "https://science.nasa.gov/solar-system/solar-system-facts/",
  },
  pl: {
    title: "Droga Mleczna",
    subtitle: "Nasz galaktyczny dom",
    description:
      "Oddal się od planet i odnajdź nasze miejsce w galaktyce spiralnej z poprzeczką. Cały Układ Słoneczny jest maleńkim fragmentem tej rozległej przestrzeni gwiazd, gazu i pyłu.",
    location: "Ostroga Oriona, między ramionami Strzelca i Perseusza",
    diameter: "≈100 000 lat świetlnych",
    distance: "≈26 000 lat świetlnych",
    orbit: "≈230 mln lat",
    approximation:
      "Schematyczna rekonstrukcja, nie mapa pojedynczych gwiazd. Położenie Słońca i przebieg ramion są przybliżone; ich struktura wciąż jest badana. Ten widok ma własną skalę, odrębną od Układu Słonecznego, i nie korzysta z efemeryd. Gwiazdy pozostają nieruchome; licznik dni symulacji nie przedstawia czasu galaktycznego.",
    sourceLabel: "Nasze miejsce w galaktyce · NASA",
    source: "https://science.nasa.gov/solar-system/solar-system-facts/",
  },
};
