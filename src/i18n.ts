import { useCallback, useEffect, useState } from "react";
import { applySeo } from "./seo";
export type Language = "en" | "pl";
const storageKey = "orbita-language";
export function readLanguage(): Language {
  try {
    const value = localStorage.getItem(storageKey);
    return value === "pl" ? "pl" : "en";
  } catch {
    return "en";
  }
}
export function persistLanguage(language: Language) {
  try {
    localStorage.setItem(storageKey, language);
  } catch {
    /* Language switching also works when storage is unavailable. */
  }
}
export const english = {
  "Widok Drogi Mlecznej pokazuje przybliżone położenie Układu Słonecznego. Galaktyka ma osobną skalę i jest statyczną rekonstrukcją; podczas jej oglądania czas symulacji planet jest zachowany.":
    "The Milky Way view marks the approximate location of our Solar System. The galaxy uses its own scale and is a static reconstruction; your planetary simulation time is preserved while you explore it.",
  "Przygotowywanie mapy galaktyki…": "Preparing the galactic map…",
  "Droga Mleczna": "Milky Way",
  "Układ Słoneczny": "Solar System",
  "Skala eksploracji": "Exploration scale",
  "Gdzie jesteśmy w galaktyce?": "Find our place in the galaxy",
  "O Drodze Mlecznej": "About the Milky Way",
  "MAPA GALAKTYKI": "GALACTIC MAP",
  "ATLAS DROGI MLECZNEJ": "MILKY WAY ATLAS",
  "NASZE POŁOŻENIE": "OUR LOCATION",
  "Wejdź do Układu Słonecznego": "Enter Solar System",
  "ODLEGŁOŚĆ OD CENTRUM": "DISTANCE FROM THE CENTRE",
  "ŚREDNICA DYSKU": "DISK DIAMETER",
  "OBIEG WOKÓŁ CENTRUM": "ORBIT AROUND THE CENTRE",
  "OSOBNA SKALA": "INDEPENDENT SCALE",
  "Przywróć widok": "Reset view",
  "Zmiana skali": "Changing scale",
  "Model galaktyki — położenia i struktura przybliżone":
    "Galaxy model — approximate structure and locations",
  "Wybierz nasz Układ Słoneczny": "Select our Solar System",
  "Widok galaktyki jest statyczny. Czas symulacji planet jest zachowany do powrotu.":
    "The galaxy is a static reconstruction. Your planetary simulation time is preserved until you return.",

  "Przygotowywanie obserwatorium…": "Preparing the observatory…",
  "ATLAS W WERSJI 2D": "THE ATLAS IN 2D",
  "Kosmos jest wciąż dostępny.": "The cosmos is still within reach.",
  "Grafika 3D jest niedostępna w tej przeglądarce. Wybierz obiekt i odkrywaj jego historię.":
    "3D graphics are unavailable in this browser. Choose an object and discover its story.",
  "Spróbuj uruchomić 3D": "Try 3D again",
  "Orbita — strona główna": "Orbita — home",
  "ATLAS UKŁADU SŁONECZNEGO": "SOLAR SYSTEM ATLAS",
  "WIDOK 2D": "2D VIEW",
  "OBSERWATORIUM 3D": "3D OBSERVATORY",
  "Ogranicz animacje": "Reduce motion",
  "Ograniczony ruch": "Reduced motion",
  "O atlasie": "About the atlas",
  "Obiekty Układu Słonecznego": "Solar System objects",
  ODKRYWAJ: "EXPLORE",
  Odkryj: "Discover",
  Wybierz: "Select",
  "JEDNA GWIAZDA.": "ONE STAR.",
  "NIESKOŃCZONA CIEKAWOŚĆ.": "ENDLESS CURIOSITY.",
  "TWOJE MIEJSCE WE WSZECHŚWIECIE": "YOUR PLACE IN THE UNIVERSE",
  "Mały punkt.": "A tiny dot.",
  "Wielkie odkrycia.": "Infinite discoveries.",
  "Osiem planet. Jedna niezwykła podróż.":
    "Eight planets. One extraordinary journey.",
  "Spójrz na nasz układ z nowej perspektywy.":
    "See our Solar System from a new perspective.",
  "Rozpocznij podróż": "Start journey",
  "UKŁAD SŁONECZNY": "THE SOLAR SYSTEM",
  "4,6": "4.6",
  "mld lat historii": "billion years of history",
  "Wybierz świat, który Cię ciekawi.":
    "Choose a world that sparks your curiosity.",
  "Resztą zajmie się grawitacja.": "Let gravity take it from there.",
  "Cały układ": "Whole system",
  "Ustawienia widoku": "View settings",
  Widok: "View",
  "TWOJE OBSERWATORIUM": "YOUR OBSERVATORY",
  "Zamknij ustawienia": "Close settings",
  Orbity: "Orbits",
  Etykiety: "Labels",
  "Jakość grafiki": "Graphics quality",
  Auto: "Auto",
  Niska: "Low",
  Wysoka: "High",
  "Auto:": "Auto:",
  oszczędna: "low",
  pełna: "high",
  "jakość. Rozdzielczość obniża się przy utrzymujących się spadkach płynności.":
    "quality. Resolution decreases if frame rates remain low.",
  "Informacje o obiekcie": "Object information",
  PODRÓŻ: "JOURNEY",
  KATALOG: "CATALOGUE",
  "Rozwiń informacje": "Expand information",
  "Zwiń informacje": "Collapse information",
  "Zamknij informacje": "Close information",
  "ŚREDNIA ŚREDNICA": "MEAN DIAMETER",
  "ODLEGŁOŚĆ OD SŁOŃCA · ŚREDNIA": "MEAN DISTANCE FROM THE SUN",
  "mln km": "million km",
  "OKRES OBIEGU": "ORBITAL PERIOD",
  "lat ziemskich": "Earth years",
  "dni ziemskich": "Earth days",
  "WARTO WIEDZIEĆ": "DID YOU KNOW?",
  "Dane i odkrycia NASA": "NASA data and discoveries",
  "Poprzedni przystanek": "Previous stop",
  "Następny przystanek": "Next stop",
  Dalej: "Next",
  "Zakończ podróż": "End journey",
  "Przeciągnij, aby obrócić": "Drag to orbit",
  "Przewiń, aby przybliżyć": "Scroll to zoom",
  "Kliknij planetę": "Select a planet",
  "Sterowanie symulacją": "Simulation controls",
  "Wznów symulację": "Resume simulation",
  "Wstrzymaj symulację": "Pause simulation",
  "CZAS WSTRZYMANY": "TIME PAUSED",
  "CZAS SYMULACJI": "SIMULATION TIME",
  dni: "days",
  "TEMPO PODRÓŻY": "SIMULATION SPEED",
  "dni / s": "days / s",
  "Szybkość symulacji": "Simulation speed",
  "Resetuj symulację": "Reset simulation",
  "Reset: dzień 0, 8 dni/s, widok całego układu":
    "Reset: day 0, 8 days/s, whole system view",
  "SYMULACJA POGLĄDOWA · ORBITY PRZYBLIŻONE":
    "ILLUSTRATIVE SIMULATION · APPROXIMATE ORBITS",
  "Widok poglądowy — rozmiary i odległości nie zachowują wspólnej skali":
    "Illustrative view — sizes and distances do not share a common scale",
  "Uruchamianie sceny 3D…": "Starting the 3D scene…",
  "Nie udało się wczytać części tekstur. Widok uproszczony jest aktywny.":
    "Some textures could not be loaded. The simplified view is still available.",
  Ponów: "Retry",
  "Scena 3D gotowa.": "3D scene ready.",
  Wczytano: "Loaded",
  "map powierzchni.": "surface maps.",
  "O ATLASIE": "ABOUT THE ATLAS",
  "Zamknij opis atlasu": "Close atlas description",
  "Przestrzeń do odkrywania.": "A space for discovery.",
  "Orbita to interaktywny atlas Słońca i ośmiu planet. Obracaj widok przeciągnięciem, przybliżaj kółkiem lub gestem dwóch palców. Na klawiaturze wybieraj obiekty tabulatorem i Enterem. Spacja wstrzymuje czas, Escape przywraca cały układ.":
    "Orbita is an interactive atlas of the Sun and eight planets. Drag to orbit, and zoom with the scroll wheel or a two-finger gesture. Use Tab and Enter to choose objects with your keyboard. Space pauses time; Escape returns to the whole system.",
  "To symulacja poglądowa, bez efemeryd. Pozycje początkowe są umowne. Orbity są kołowe i współpłaszczyznowe; rozmiary i odległości nie zachowują wspólnej skali. Względne okresy obiegu odpowiadają danym NASA, a obroty osiowe są wizualnie spowolnione.":
    "This is an illustrative simulation without ephemerides. Starting positions are arbitrary. Orbits are circular and lie in one plane; sizes and distances do not share a common scale. Relative orbital periods follow NASA data, while axial rotation is visually slowed down.",
  "Reset przywraca dzień 0, tempo 8 dni/s i cały układ. Przy ograniczonym ruchu czas jest domyślnie wstrzymany; możesz świadomie wznowić symulację przyciskiem odtwarzania. Przeloty i animacje dekoracyjne pozostają wyłączone.":
    "Reset restores day 0, a speed of 8 days/s and the whole system view. With reduced motion, time starts paused; you can choose to resume it with the play button. Camera flights and decorative animations remain disabled.",
  "Odkrywaj dalej z NASA ↗": "Keep exploring with NASA ↗",
  "Dane: NASA / JPL. Ziemia i chmury: NASA Visible Earth, Blue Marble (Reto Stöckli). Pozostałe powierzchnie: własne mapy proceduralne.":
    "Data: NASA / JPL. Earth and clouds: NASA Visible Earth, Blue Marble (Reto Stöckli). Other surfaces: original procedural maps.",
  "Interaktywny Układ Słoneczny 3D": "Interactive 3D Solar System",
  "Renderer 3D jest niedostępny.": "The 3D renderer is unavailable.",
} as const;
export type TranslationKey = keyof typeof english;
export function translate(language: Language, key: TranslationKey): string {
  return language === "en" ? english[key] : key;
}
export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(readLanguage);
  const setLanguage = useCallback((value: Language) => {
    setLanguageState(value);
    persistLanguage(value);
  }, []);
  const t = useCallback(
    (key: TranslationKey) => translate(language, key),
    [language],
  );
  useEffect(() => {
    applySeo(language);
  }, [language]);
  return { language, setLanguage, t };
}
