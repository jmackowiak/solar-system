/** The public canonical origin. Language selection is a UI preference on this URL. */
export const siteUrl = "https://solar-system-six-opal.vercel.app/";
export const socialImage = new URL("og-image.png", siteUrl).href;
export const seo = {
  en: {
    title: "Orbita — Solar System and Milky Way in 3D",
    description:
      "Explore the Solar System and Milky Way in 3D. Fly between planets, find our place in the galaxy and discover facts from NASA.",
    locale: "en_GB",
    imageAlt:
      "The Milky Way in Orbita’s 3D atlas, with our Solar System marked in the Orion Spur.",
  },
  pl: {
    title: "Orbita — Układ Słoneczny i Droga Mleczna 3D",
    description:
      "Odkrywaj Układ Słoneczny i Drogę Mleczną w 3D. Podróżuj między planetami, znajdź nasze miejsce w galaktyce i poznawaj fakty ze źródeł NASA.",
    locale: "pl_PL",
    imageAlt:
      "Droga Mleczna w atlasie 3D Orbita, z zaznaczonym położeniem Układu Słonecznego w Ostrodze Oriona.",
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
