/** The public canonical origin. Language selection is a UI preference on this URL. */
export const siteUrl = "https://solar-system-six-opal.vercel.app/";
export const socialImage = new URL("og-image.png", siteUrl).href;
export const seo = {
  en: {
    title: "Orbita — Interactive 3D Solar System",
    description:
      "Explore the Sun and all eight planets in an interactive 3D Solar System. Fly between worlds, control the simulation and discover facts from NASA.",
    locale: "en_GB",
    imageAlt:
      "Orbita interactive 3D Solar System with the Sun, eight planets and their orbits.",
  },
  pl: {
    title: "Orbita — interaktywny Układ Słoneczny 3D",
    description:
      "Odkrywaj Słońce i osiem planet w interaktywnym Układzie Słonecznym 3D. Podróżuj między światami, steruj symulacją i poznawaj fakty ze źródeł NASA.",
    locale: "pl_PL",
    imageAlt:
      "Interaktywny Układ Słoneczny 3D w Orbicie: Słońce, osiem planet i ich orbity.",
  },
} as const;
export function applySeo(language: keyof typeof seo) {
  const copy = seo[language];
  document.documentElement.lang = language;
  document.title = copy.title;
  for (const [selector, value] of [
    ['meta[name="description"]', copy.description],
    ['meta[property="og:title"]', copy.title],
    ['meta[property="og:description"]', copy.description],
    ['meta[property="og:locale"]', copy.locale],
    [
      'meta[property="og:locale:alternate"]',
      seo[language === "en" ? "pl" : "en"].locale,
    ],
    ['meta[property="og:image:alt"]', copy.imageAlt],
    ['meta[name="twitter:title"]', copy.title],
    ['meta[name="twitter:description"]', copy.description],
    ['meta[name="twitter:image:alt"]', copy.imageAlt],
  ])
    document.querySelector(selector)?.setAttribute("content", value);
}
