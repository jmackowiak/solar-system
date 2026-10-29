# Orbita

**Wersja produkcyjna: https://solar-system-six-opal.vercel.app**

Polski, interaktywny atlas Układu Słonecznego w 3D. React 19, TypeScript, Vite 8,
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

Bez WebGL 2 lub po utracie kontekstu dostępny jest atlas 2D z pełnymi opisami.
Adres `/?fallback=1` pozwala obejrzeć ten wariant. Przycisk ponowienia tekstur
zachowuje funkcjonalną scenę podczas błędu wczytywania.

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
nie od aktualnej daty astronomicznej. Orbity to okręgi we wspólnej płaszczyźnie;
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

Pomiary, warunki i znane ograniczenia: [docs/VERIFICATION.md](docs/VERIFICATION.md).
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
