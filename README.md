# Orbita

**Wersja produkcyjna: https://solar-system-six-opal.vercel.app**

Interaktywny atlas Układu Słonecznego, egzoplanet i Drogi Mlecznej w 3D, po angielsku i po polsku. React 19, TypeScript, Vite 8,
Three.js r186, React Three Fiber 9 i Drei 10. Bez backendu i runtime CDN.

## Uruchomienie

Wymagany Node.js **22.22+** (lub wspierana nowsza wersja) i npm.

```sh
npm ci
npm run dev
```

Vite poda adres lokalny, domyślnie http://localhost:5173.

```sh
npm run build
npm run preview -- --port 4173
```

Lokalny podgląd produkcyjny: http://localhost:4173.

Publiczny hosting: [Vercel](https://solar-system-six-opal.vercel.app). Projekt
`solar-system` jest połączony z repozytorium GitHub; push na `main` uruchamia
produkcyjne wdrożenie. `vercel.json` wymusza `npm run build` i katalog `dist`.
Sam push nie potwierdza udanego wdrożenia — sprawdź status Vercel oraz publiczny adres.

## Język

Domyślny język to angielski, niezależnie od języka przeglądarki. Przełącznik
**English / Polski** w nagłówku zmienia interfejs, etykiety planet, opisy, wycieczkę,
jednostki i metadane strony. Wybór jest zapamiętywany lokalnie. Gdy przeglądarka
blokuje zapis, przełącznik nadal działa w bieżącej sesji. Zmiana języka zachowuje
wybraną planetę, kamerę, czas i ustawienia symulacji.

## Sterowanie

- Przeciągnięcie myszą lub jednym palcem obraca widok; kółko lub gest dwóch palców przybliża.
- Kliknięcie planety, etykiety lub elementu katalogu wybiera obiekt i rozpoczyna przelot.
- Przeciągnięcie lub gest w trakcie lotu natychmiast oddaje kamerę użytkownikowi.
- **Cały układ** lub **Escape** wraca do widoku ogólnego. Zmiana celu zastępuje poprzedni lot.
- Tab i Enter obsługują katalog i kontrolki. Spacja poza polami i przyciskami wstrzymuje/wznawia czas.
- Pauza zatrzymuje orbity, obroty, chmury i Słońce; kamera oraz informacje nadal działają.
- Suwak: 0–100 dni symulacji na sekundę. Reset: dzień 0, **8 dni/s**, cały układ;
  czas uruchomiony, chyba że włączono ograniczenie animacji.
- Ustawienia widoku: orbity, etykiety, Auto / Niska / Wysoka jakość.
- **Ogranicz animacje** wstrzymuje czas, wyłącza dekoracyjne animacje i zastępuje loty
  natychmiastową zmianą kadru. Czas można następnie świadomie wznowić.
  Preferencja systemowa `prefers-reduced-motion` jest respektowana od pierwszego widoku.
- Wycieczka: Słońce → Ziemia → Jowisz → Saturn → Neptun. Przystanki zmienia użytkownik.
- Na telefonie informacje są przewijanym, zwijanym panelem dolnym. Gesty panelu nie obracają sceny.
- Przy Ziemi, Jowiszu i Saturnie wybierz **Moons / Księżyce**, aby zobaczyć układ
  planety i jej satelitów: Księżyc, Io, Europę, Ganimedesa, Kallisto oraz Tytana.
  Każdy satelita ma własny wybór, zbliżenie i opis NASA. Tempo zmienia się na
  0,1 dnia/s; po wyjściu wraca poprzednia wartość, z zachowaniem czasu i pauzy.
  Orbity księżyców są kołowym przybliżeniem, a ich powierzchnie interpretacją
  artystyczną. Szczegóły danych i uproszczeń: [docs/MOONS.md](docs/MOONS.md).

Bez WebGL 2 lub po utracie kontekstu dostępny jest atlas 2D z pełnymi opisami.
Adres `/?fallback=1` pozwala obejrzeć ten wariant. Przycisk ponowienia tekstur
zachowuje funkcjonalną scenę podczas błędu wczytywania.

**Discover / Odkrywaj → Size comparison / Porównanie rozmiarów** otwiera dwa
obiekty w jednej skali średnic. Do wyboru są planety, egzoplanety oraz księżyce.
Pierścienie nie są wliczane do średnicy bryły; rozmiary egzoplanet pozostają
oszacowaniami obserwacyjnymi. Widok zatrzymuje zegar orbit do powrotu, działa
również w 2D i nie tworzy drugiego Canvas. [Założenia](docs/COMPARISON.md).

**Discover → Light journey / Podróż światła** pokazuje impuls od Słońca przy
wspólnej skali średnich odległości. Rozmiary planet są powiększone; planety
ustawiono w linii dla czytelności, bez związku z aktualną datą. Odtwarzaj,
wstrzymuj, przewijaj i przechodź do chwili dotarcia do wybranej planety.
Osobny zegar ma tempo 1 lub 10 minut lotu na sekundę; reset wraca do emisji
i pauzuje. Główny zegar układu pozostaje zachowany. Prędkość światła i
przeliczenia: [źródła oraz matematyka](docs/DISCOVERY-DATA.md).

**Discover → Solar neighborhood / Sąsiedztwo Słońca** jest pośrednią mapą
między układem a Galaktyką. Zakres **100 lat świetlnych** obejmuje Słońce
i TRAPPIST-1, a **3000 lat świetlnych** także TOI-700 i Kepler-90. Punkty mają
wspólną skalę odległości i kierunki z NASA Exoplanet Archive, przeliczone do
współrzędnych galaktycznych według ESA Gaia. Te same układy są zaznaczone
w pełnej Drodze Mlecznej; pobliskie gwiazdy nakładają się w jej ogromnej skali.
To wybór czterech dostępnych układów, a nie kompletny katalog gwiazd.

**Discover → Moon phases & eclipses / Fazy Księżyca i zaćmienia** pozwala
ustawiać położenie Księżyca suwakiem oraz przechodzić między czterema fazami.
Tarcza pokazuje widok z Ziemi, a scena geometrię orbity. Scenariusze zaćmień
ustawiają węzły w kierunku Słońca i pokazują ilustracyjne stożki cienia.
Model nie prognozuje dat, widoczności ani czasu trwania zaćmień; zachowuje
stosunek średnic Ziemi i Księżyca, z umowną skalą odległości i cieni.

**Discover → Share view / Udostępnij widok** tworzy link do bieżącego obiektu,
układu i kamery. Zachowuje też czas, szybkość, orbity, etykiety, język oraz
ustawienia porównania, mapy, faz i podróży światła. Odbiorca zaczyna z pauzą.
Link nie wymaga konta ani serwera; gdy schowek jest niedostępny, można skopiować
zaznaczony adres ręcznie. Adresy są wersjonowane i walidowane; błędne parametry
otwierają zwykły atlas. Ten sam kadr 3D może wyglądać inaczej przy innej proporcji
ekranu. Nie zapisujemy daty rzeczywistej ani efemeryd.

## Testy

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Vitest sprawdza pozycje, podział czasu na klatki, pauzę, szybkość, reset oraz dostępny
interfejs zastępczy (React Testing Library). Te testy DOM **nie potwierdzają WebGL**.
Playwright uruchamia rzeczywiste WebGL w Chromium na produkcyjnym podglądzie,
w widoku 1440×900 i emulacji dotykowej 390×844. CI używa programowego SwiftShader.
Testy sprawdzają wyrenderowane klatki i draw calls, dane wszystkich obiektów,
zmiany celu, ręczne przerwanie lotu, czas, wycieczkę, ustawienia, klawiaturę,
reduced motion, brak renderera, uszkodzone tekstury, resize i renderowanie na żądanie.
Raport: `playwright-report/`; ślady i obrazy błędów: `test-results/` (pliki ignorowane przez Git).

GitHub Actions wykonuje typy, lint, jednostkowe, build i E2E przy pushu oraz PR.
Raporty/ślady z nieudanego przebiegu są zachowywane przez 14 dni.

## Model i źródła

**Widok poglądowy — rozmiary i odległości nie zachowują wspólnej skali.**
To symulacja poglądowa, bez efemeryd. Czas liczony jest od jej początku,
nie od aktualnej daty astronomicznej. Orbity ośmiu planet są elipsami z mimośrodami i kierunkami peryhelium NASA/JPL J2000;
wspólna płaszczyzna pozostaje uproszczeniem. Egzoplanety zachowują kołowe przybliżenie;
względne okresy obiegu odpowiadają danym NASA. Obroty osiowe są spowolnione
wizualnie (z zachowaniem kierunku). Nachylenia osi poza wskazanymi detalami
są uproszczone. Pas planetoid jest ilustracją, a nie katalogiem obiektów.

- [Dane NASA/JPL, definicje i inspiracje](docs/SOURCES.md)
- [Pochodzenie i licencje lokalnych tekstur oraz fontów](docs/ASSETS.md)
- Dane aplikacji: `src/data/bodies.ts` (osobne źródła dla każdego obiektu).
- Ziemia i chmury: NASA Visible Earth, Blue Marble, Reto Stöckli.
  Pozostałe mapy: własne, deterministyczne tekstury proceduralne, CC0.
- Regeneracja map: `python3 scripts/generate-textures.py` (Pillow, NumPy;
  narzędzia autora zasobów, niewymagane do instalacji aplikacji).

Nie skopiowano interfejsów ani tekstur stron inspiracji.

## Architektura i wydajność

Jeden Canvas; scena w `src/scene`, dane w `src/data`, czysta logika w `src/lib`,
interfejs HTML w `src/App.tsx`. Czas i ruch używają refs i `useFrame`.
Jedna funkcja zarządza kamerą i OrbitControls; podczas lotu nie aktualizują jej
równolegle dwie pętle. Gwiazdy i planetoidy to dwa obiekty Points.

Scena jest interaktywna przed mapami wysokiej jakości. Mapy podstawowe 256×128
są lokalne; wybrany obiekt doczytuje dokładniejszą mapę i chmury Ziemi.
Cały zestaw tekstur zajmuje około 555 kB. DPR jest ograniczony do 1,5 (wysoka)
lub 1 (niska). Auto zaczyna od niskiej jakości na wąskim ekranie i obniża jakość
po dwóch kolejnych dwusekundowych próbkach poniżej 42 FPS; nie oscyluje w górę.
Po ukryciu karty Canvas przechodzi w `never`, a po powrocie zerowana jest baza
czasu. Gdy czas stoi, pozostaje `demand`; kontrolki i loty żądają potrzebnych klatek.

Pomiary, warunki i znane ograniczenia: [aktualna weryfikacja rozszerzeń](docs/DISCOVERY-VERIFICATION.md) oraz [raport historyczny](docs/VERIFICATION.md).
Powtarzalny pomiar (po buildzie, osobny terminal z podglądem na 4174):

```sh
npm run preview -- --port 4174
HEADED=1 node scripts/measure-performance.mjs
```

`HEADED=1` na macOS używa ANGLE Metal. Sprawdź raportowane GPU; bez tej opcji
Chromium headless może używać SwiftShader. Wyniki w `artifacts/performance.json`
dotyczą komputera wykonującego pomiar. Emulacja telefonu **nie jest pomiarem
fizycznego telefonu**. Skrypt mierzy dostarczone klatki sceny, także w czasie lotu,
a nie wynik Lighthouse.

Weryfikacja samych wersji językowych na wdrożonej stronie:

```sh
PLAYWRIGHT_BASE_URL=https://solar-system-six-opal.vercel.app npx playwright test tests/language.spec.ts
```

## Metadane i indeksowanie

Tytuły i opisy EN/PL oraz główny adres są w `src/seo.ts`. Plugin Vite
`scripts/seo-plugin.ts` wpisuje angielskie metadane do gotowego HTML bez
uruchamiania JavaScriptu oraz generuje `robots.txt` i `sitemap.xml`.
Jeden publiczny adres ma jeden canonical. Polski to preferencja interfejsu,
nie oddzielny adres językowy, dlatego nie deklarujemy fikcyjnych `hreflang`.
Open Graph i Twitter używają własnego obrazu `public/og-image.png`; JSON-LD
`WebSite` podaje nazwę Orbita. Wersja bez JavaScriptu zawiera opis i instrukcję
uruchomienia atlasu. Google sam wybiera ostateczny tytuł i fragment wyniku;
metadane nie gwarantują indeksacji ani konkretnego wyglądu wyniku.

## Droga Mleczna

Przełącznik **Solar System / Milky Way** (po polsku **Układ Słoneczny / Droga
Mleczna**) zmienia skalę eksploracji. Znacznik **You are here / Jesteś tutaj**
pokazuje przybliżone położenie Słońca w Ostrodze Oriona. Kliknięcie znacznika
lub **Enter Solar System** przywraca widok planet. Oba poziomy używają jednego
Canvas i wspólnego sterowania kamerą; przeciągnięcie przerywa przelot kamery.

Galaktyka jest statyczną rekonstrukcją — podczas jej oglądania licznik dni planet
nie biegnie. Powrót zachowuje szybkość i stan pauzy. Osobne skale są jawnie
opisane; nie traktujemy modelu jako katalogu rzeczywistych pozycji gwiazd.
Źródła i uproszczenia: [docs/GALAXY.md](docs/GALAXY.md). Przy braku WebGL dostępna
jest także mapa galaktyki 2D. Ograniczenie ruchu zastępuje przejście zmianą widoku.

Wysoka jakość: 35 000 punktów gwiazd i 3600 poświaty; niska: 12 000 i 1100.
Rozkład jest deterministyczny, bez pobierania zewnętrznych katalogów/tekstur.
Moduł galaktyki wczytuje się dopiero po jego wybraniu. Po zakończeniu przejścia
scena renderuje tylko podczas interakcji. W pamięci zachowujemy oba poziomy,
żeby kolejne zmiany skali nie wczytywały ponownie tekstur planet.

Pomiar interakcji (lokalny produkcyjny podgląd na 4174):

```sh
HEADED=1 node scripts/measure-galaxy.mjs
```

Skrypt mierzy obrót i przejścia, a w spoczynku sprawdza brak zbędnych klatek.
Emulacja 390×844 na komputerze nie potwierdza wydajności fizycznego telefonu.

## Układy innych gwiazd

Przełącznik **Planetary system / Układ planetarny** obok skali eksploracji pozwala
wybrać Układ Słoneczny, **TRAPPIST-1** (7 potwierdzonych planet), **Kepler-90** (8)
lub **TOI-700** (4). W panelu Drogi Mlecznej znajduje się również katalog tych
układów z odległościami od nas. Scena, wybór obiektu, przeloty, jakość, etykiety,
orbity i wariant 2D obejmują wszystkie cztery układy i współdzielą jeden Canvas.

Każdy układ ma osobny zegar, tempo i pauzę, zachowane do powrotu w tej samej sesji.
Egzoplanety startują z tempem **0,25 dnia/s**, z zakresem 0–5 i krokiem 0,05;
Układ Słoneczny zachowuje 8 dni/s i zakres 0–100. Reset dotyczy bieżącego układu:
dzień 0, jego domyślne tempo, widok ogólny. Wycieczka z przewodnikiem pozostaje
wycieczką po Układzie Słonecznym. Znacznik „You are here” zawsze prowadzi do niego.

Promienie, okresy obiegu, półosie wielkie i położenia gwiazd pochodzą z lokalnej
migawki NASA Exoplanet Archive z 29 października 2026. Zachowano niepewności i
odnośniki do publikacji w `src/data/systems.ts`. [Opis źródeł i uproszczeń](docs/EXOPLANETS.md).
Powierzchnie to własne proceduralne interpretacje artystyczne; nie przedstawiają
zmierzonych map, oceanów ani znanego składu atmosfer. Nieznany obrót osiowy jest
nieruchomy. Obserwowane okresy obiegu są zachowane, a orbity i skala uproszczone.

```sh
npx playwright test tests/exoplanets.spec.ts
```

Pomiary nowych układów na natywnym GPU (warunki i ograniczenia w `docs/VERIFICATION.md`):

```sh
npm run preview -- --port 4174
HEADED=1 node scripts/measure-exoplanets.mjs
```

## Kompaktowy widok mobilny

Na telefonie player ma 56 px wysokości, a karta wybranego obiektu zaczyna się
od krótkiego podsumowania. **Szczegóły / Details** rozwijają opis; wycieczka
z przewodnikiem otwiera go automatycznie. Na krótkich ekranach poziomych katalog
przechodzi na lewy bok. Pełne kontrolki pauzy, tempa i resetu pozostają dostępne.
[Zweryfikowane rozmiary i scenariusze mobilne](docs/MOBILE.md).

[Model eliptycznych orbit NASA/JPL i jego uproszczenia](docs/ORBITS.md).

Pomiar nowych trybów (po buildzie, przy działającym preview na porcie 4174):
`HEADED=1 node scripts/measure-discovery.mjs`. Nie uruchamiaj go równolegle
z innym benchmarkiem lub testami WebGL. Wynik zapisuje lokalny, ignorowany plik
`artifacts/discovery-performance.json`; szeroki i wąski widok korzystają z tego samego komputera.
