# Weryfikacja Orbity — 28 października 2026

## Środowisko i sposób pomiaru

Mac z Apple M2, 16 GB RAM; macOS 27.0.1. Zwykłe (headed) Chromium 156.0.0.0,
Playwright 1.64.1. Renderer zgłoszony przez WebGL:
`ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)`.

Produkcyjny build Vite, lokalny serwer preview, bez throttlingu sieci.
Każdy rozmiar miał nowy kontekst przeglądarki, DPR urządzenia ustawiony na 1.
Tryb Auto: wysoka jakość przy 1440×900, niska przy 390×844. Drugi przypadek to
**emulacja rozmiaru i dotyku na tym samym M2**, nie fizyczny telefon.

Skrypt `scripts/measure-performance.mjs` próbuje rzeczywiste przyrosty licznika
klatek sceny przez rAF. Zlicza wyłącznie klatki, w których Engine był wywołany;
liczba draw calls i trójkątów pochodzi z `WebGLRenderer.info` po renderze.
To pomiar odstępów dostarczanych klatek, **nie GPU timer queries ani Lighthouse**.
Nie obejmuje płynności podczas termicznego ograniczenia GPU ani długiej sesji.
Przed próbką widoku ogólnego czekamy ponad 120 klatek rozgrzewki.
Widok ogólny i zbliżenie: po 5 s; przelot do Saturna: 1,7 s, razem z doczytaniem
jego dokładniejszej mapy. Symulacja działa z szybkością 8 dni/s.

## Wyniki ostatniego izolowanego pomiaru

| Widok / rozdzielczość | FPS | Mediana klatki | P95 klatki | Próbki |
| --- | ---: | ---: | ---: | ---: |
| Cały układ, 1440×900 | 60,08 | 16,7 ms | 18,7 ms | 301 |
| Przelot, 1440×900 | 59,94 | 16,7 ms | 18,7 ms | 102 |
| Saturn z bliska, 1440×900 | 60,12 | 16,7 ms | 18,6 ms | 301 |
| Cały układ, 390×844 (emulacja) | 60,02 | 16,7 ms | 18,6 ms | 301 |
| Przelot, 390×844 (emulacja) | 59,96 | 16,7 ms | 18,6 ms | 102 |
| Saturn z bliska, 390×844 (emulacja) | 60,09 | 16,7 ms | 18,6 ms | 301 |

Niewielkie wyniki ponad 60 FPS wynikają z granic próbkowania; ekran dostarcza
około 60 klatek/s. Widok ogólny: 31 draw calls, 41 888 trójkątów (wysoka)
lub 14 816 (niska). Saturn: 10 draw calls, 7712 / 4704 trójkątów.

Pierwsza użyteczna scena (widoczne obiekty, kamera i wybór działają):
**591,1 ms** desktop / **506,3 ms** emulacja; **765 262 B ≈ 0,765 MB** transferu
zakończonego przed gotowością, z dokumentem HTML, JS, CSS, fontami i mapami.
Zmierzono przez Navigation/Resource Timing. Dokładniejsze mapy wybranego obiektu
są pobierane później. To pojedyncze lokalne próby, nie prognoza czasu ładowania
w internecie ani percentyl z wielu urządzeń. Limit 5 MB jest spełniony w tych próbach.

Cel około 60 FPS na testowanym komputerze osiągnięty w podanych warunkach.
**Cel co najmniej 30 FPS na fizycznym telefonie pozostaje niezweryfikowany** —
nie było dostępnego urządzenia. Wynik emulacji go nie potwierdza. DPR 1,5 na
ekranie Retina oraz Safari/Firefox nie mają osobnych pomiarów w tym raporcie.

## Testy funkcjonalne

- TypeScript: sprawdzanie typów.
- ESLint: bez błędów ani ostrzeżeń.
- Vitest / React Testing Library: **7/7**. Pozycje, niezależność od podziału czasu,
  pauza, wznowienie, szybkość, reset, niepoprawne argumenty, fokus i atlas 2D.
- Playwright: **32/32 przechodzące scenariusze**, plus dwa scenariusze dotykowe
  pomijane wyłącznie na desktopie (na emulowanym telefonie przechodzą).
  Po ostatniej kosmetycznej zmianie shadera Słońca i etykiet dodatkowo
  ponowiono dwa testy gotowości sceny: **2/2**. Rzeczywisty WebGL, produkcyjny build, Chromium 156 (SwiftShader
  wyłącznie dla testów funkcjonalnych). Liczniki klatek i wywołań renderowania
  potwierdzają uruchomienie sceny; sama obecność canvasu nie wystarcza.
- Weryfikacja ręczna obrazów: widok ogólny, kadry wszystkich dziewięciu obiektów, telefon,
  proporcje interfejsu, oświetlenie, źródła i czytelność etykiet.
- Sprawdzone zachowania: 9 obiektów i dane NASA, reset i cały układ, szybka zmiana
  celu, ręczne przerwanie lotu, pauza, szybkość, wycieczka w obu kierunkach
  i jej zakończenie, ustawienia, fokus/klawiatura, reduced motion i świadome
  wznowienie, brak WebGL, błąd tekstury i ponowienie, resize/orientacja,
  brak dalszych renderów po pauzie, kontynuacja renderowania podczas sterowania.
  Gesty: emulowany obrót jednym palcem i pinch dwoma palcami (CDP touch events);
  sprawdzono rzeczywistą zmianę pozycji kamery przy zatrzymanym czasie.
- Osobny test pierwszego kroku lotu do Merkurego chroni przed gwałtownym
  przybliżeniem przez limity OrbitControls.
- Osobny test wznowienia chroni przed doliczaniem czasu spędzonego w pauzie.
- `document.hidden` / `visibilitychange` są **symulowane deterministycznie**:
  test potwierdza zatrzymanie klatek i czasu, a potem brak nadrobienia przerwy.
  Próba automatycznego przełączenia prawdziwych kart nie zmieniła `document.hidden`
  w tej sesji Chromium; nie zaliczamy jej jako potwierdzenia rzeczywistego
  usypiania karty lub aplikacji przez system.

## Kontrola przeglądarkowa i ograniczenia

Podgląd narzędzia T3 dwukrotnie zwrócił timeout snapshotu. Zgodnie z regułą
przełączenia użyto lokalnego Chromium przez Playwright; obejrzano rzeczywiste
zrzuty WebGL, także z natywnym GPU Metal. Tymczasowe przeglądarki zamknięto.

Brak nieoczekiwanych błędów aplikacji i zasobów w przechodzących scenariuszach.
Fiber 9.8.2 używa wewnętrznie `THREE.Clock`; w deweloperskim Three r186 pojawia
się znane ostrzeżenie deprecjacji tej zależności. Aplikacja używa własnej bazy
czasu i nie tworzy kolejnego Clock ani dodatkowej pętli renderowania.

Przy zastosowaniu skillsów sprawdzono dostępne wersje w npm i deklaracje
peerDependencies. Lokalny skill Fiber celuje w tę samą generację bibliotek,
jednak jego alias `threeLine` wywoływał błąd przy aktualizacji w Fiber 9.8.2.
Orbity zrealizowano jako jawne `THREE.Line` ze sprzątaniem geometrii i materiałów.

## Wdrożenie produkcyjne — 29 października 2026

https://solar-system-six-opal.vercel.app — publiczny adres produkcyjny Vercel.
Pierwszy deploy: `dpl_AK9QWmcnihLDKf146oeYCKc8X33t`, stan `READY`.
Adres bez uwierzytelnienia zwraca HTTP 200 i dokument Orbity. Projekt jest
połączony z `jmackowiak/solar-system`; kolejne pushe na `main` uruchamiają
wdrożenie. Konfiguracja `vercel.json` zachowuje Vite, wymusza typowany build
`npm run build` i publikuje `dist`.
Stan GitHub Actions jest informacją z bieżącego sprawdzenia w raporcie końcowym;
nie wpisujemy zmiennego stanu CI do dokumentacji jako gwarancji.

## Wersje językowe — 29 października 2026

Dodano pełny wariant angielski jako domyślny oraz przełącznik English / Polski.
Obejmuje on interfejs, etykiety 3D, nazwy i opisy dziewięciu obiektów, ciekawostki,
pięć przystanków wycieczki, jednostki i liczby, komunikaty, nazwy dostępności,
`html.lang`, tytuł i opis strony. Wielkości astronomiczne pozostają wspólne.
Wybór jest zapamiętywany w `localStorage`; przy zablokowanym dostępie nadal
można przełączać język w bieżącej sesji. Nowa wizyta domyślnie używa angielskiego,
także przy polskim języku przeglądarki. Język nie resetuje kamery ani symulacji.

Dodano testy preferencji i kompletności tłumaczeń oraz osiem scenariuszy E2E
na desktopie i emulowanym telefonie: domyślny angielski, zapamiętanie wyboru,
przełączanie otwartego panelu i etykiet 3D, zachowanie czasu/kamery, aktywna
wycieczka, ustawienia i opis atlasu oraz brak WebGL/zablokowany magazyn.
Obejrzano wariant angielski przy 1440, 390 i 320 px oraz oba języki z panelem Ziemi.
Wyniki FPS powyżej dotyczą wcześniejszego, wyraźnie datowanego pomiaru;
nie powtarzano pomiaru wydajności GPU dla samej zmiany językowej.

Weryfikacja lokalna zmiany językowej: typy, lint i build bez błędów;
**11/11** testów Vitest/RTL oraz **40/40** scenariuszy Playwright przeszło.
Dwa scenariusze dotykowe są pomijane wyłącznie w projekcie desktopowym;
w projekcie mobilnym przechodzą. Konfiguracja Playwright obsługuje
`PLAYWRIGHT_BASE_URL`, aby te same scenariusze językowe uruchamiać na live.

## Metadane wyszukiwarki — 29 października 2026

W `src/seo.ts` ujednolicono tytuły i opisy EN/PL. Angielski opis zawiera
145 znaków, polski 146; jest to wybór redakcyjny, nie gwarantowany limit Google.
Metadane są wpisywane podczas budowania do HTML, a przełącznik języka aktualizuje
również Open Graph i Twitter. Główny canonical pozostaje niezmienny, także dla
`?fallback=1`. Dodano `WebSite` JSON-LD, robots.txt, sitemap.xml (jeden rzeczywisty
adres) i własny obraz 1200×630. Nie deklarujemy fikcyjnych stron językowych,
ocen ani afiliacji z NASA. Bez JavaScriptu dostępny jest krótki opis atlasu.

Typy, lint, produkcyjny build i 11 testów jednostkowych przeszły. Osiem testów
językowych sprawdziło nowy tytuł/opis i zachowanie aplikacji. Sześć dodatkowych
scenariuszy SEO sprawdza gotowy HTML bez JS, canonical, robots, sitemapę,
strukturalną nazwę witryny, wymiary/dostępność obrazu i przełączanie metadanych.
Weryfikacja dotyczy technicznej poprawności. Nie stanowi potwierdzenia indeksacji,
pozycji ani ostatecznego fragmentu wybranego przez Google.

Podstawa decyzji: dokumentacja Google Search Central:
[opisy wyników](https://developers.google.com/search/docs/appearance/snippet),
[tytuły](https://developers.google.com/search/docs/appearance/title-link),
[nazwa witryny](https://developers.google.com/search/docs/appearance/site-names),
[JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Widok Drogi Mlecznej — 29 października 2026

Model proceduralny i teksty NASA opisuje [GALAXY.md](GALAXY.md). Galaktyka
współdzieli Canvas i kamerę z planetami. Zmiana skali kurczy/rozszerza układ
planet i wygasza/odsłania galaktykę. Gwiazdy są statyczne; powrót zachowuje czas,
tempo i pauzę symulacji planet. Języki EN/PL, mapa zastępcza 2D i ograniczenie
ruchu obejmują oba poziomy. Moduł galaktyki jest ładowany na żądanie.

Sprawdzanie typów, lint i build przeszły. Vitest/RTL: **14/14**. Pełny Playwright
na produkcyjnym podglądzie: **58/58**, plus dwa scenariusze dotykowe pomijane
wyłącznie na desktopie, przechodzące w projekcie mobilnym. Nowe scenariusze
obejmują tożsamość Canvas przy zmianie skali, zachowanie czasu i ustawień,
przerwanie lotu, szybkie zmiany celu, klawiaturę, reduced motion, tłumaczenia,
rzeczywiste liczby punktów przy zmianie jakości, etykietę położenia i atlas 2D.
Dodatkowo przechwycono początkowy moduł 3D w sieci i wybrano galaktykę przed
jego wczytaniem — interfejs i scena wracają do poprawnego stanu.

Kontrola obrazów wykryła skopiowany przez Fiber uniform przezroczystości:
wartość źródłowa wynosiła 1, a materiał pozostawał przy 0,0305. Naprawiono
synchronizację rzeczywistego uniformu w pętli Fiber. Samo zliczanie draw calls
nie wykryło takiego błędu; gotowy obraz obejrzano ponownie na natywnym GPU.

### Pomiary galaktyki

Izolowany pomiar `HEADED=1 node scripts/measure-galaxy.mjs`: Apple M2, 16 GB,
macOS 27.0.1, Chromium 156.0.0.0, ANGLE Metal Renderer: Apple M2. Produkcyjny
podgląd na localhost, bez throttlingu, nowe konteksty przeglądarki, DPR 1.
Tryb Auto: wysoka jakość przy 1440×900, niska przy 390×844. Ten drugi wariant
jest emulacją rozmiaru/dotyku na M2, **nie fizycznym telefonem**.

| Scenariusz | 1440×900 FPS / P95 | 390×844 (emulacja) FPS / P95 |
| --- | ---: | ---: |
| Wejście do galaktyki (~1,69 s) | 60,43 / 18,5 ms | 60,40 / 18,6 ms |
| Obracanie kamerą przez 5 s | 60,09 / 18,6 ms | 60,11 / 18,6 ms |
| Powrót do planet (~1,66 s) | 60,25 / 18,7 ms | 60,25 / 18,6 ms |

Mediana klatki 16,7 ms. Drobne wartości ponad 60 FPS wynikają z granic próbek.
W spoczynku: **0 dodatkowych klatek przez 120 odświeżeń przeglądarki**, czas
symulacji bez zmian. Galaktyka: **8 draw calls**, 904 trójkąty znaczników oraz
38 600 / 13 100 punktów przy wysokiej / niskiej jakości. Mierzymy dostarczone
klatki sceny podczas rzeczywistych zdarzeń myszy, nie wynik Lighthouse ani czas
samego shadera. Interakcje na fizycznym telefonie i długotrwałe ograniczenie
termiczne GPU pozostają niezmierzone.

Pierwsza użyteczna scena planet: 496,8 ms / 498,0 ms oraz **775 309 B transferu**
przed gotowością (HTML, JS, CSS, fonty, podstawowe mapy). Galaktyka jest dodatkowym
modułem około 3,9 kB przed kompresją, doczytywanym po wybraniu; bufory gwiazd
powstają lokalnie. To pojedyncze próby lokalne, nie pomiar łącza internetowego.

Pomiar galaktyki wykonano przed końcową aktualizacją obrazu Open Graph i jego
tekstów alternatywnych. Ten obraz nie jest pobierany podczas uruchamiania sceny.

## Trzy układy egzoplanet — 29 października 2026

Dodano TRAPPIST-1 (7 planet), Kepler-90 (8) i TOI-700 (4), wybór układu,
katalog w panelu galaktyki, osobne zegary/tempo/pauzę oraz opisy EN/PL. Dane,
niepewności i rozróżnienie pomiarów od wizualizacji opisuje [EXOPLANETS.md](EXOPLANETS.md).
Nowe układy i Solar System współdzielą kamerę, kontrolki i jeden Canvas.
Wygląd egzoplanet jest interpretacją artystyczną, a nieznany obrót osiowy
pozostaje nieruchomy. Dane nie służą do odtwarzania bieżących efemeryd.

Typy, lint i produkcyjny build przeszły; Vitest/RTL **23/23**. Pełny Playwright:
74 zaplanowane przypadki, **68 zaliczonych, 4 błędy nieaktualnych oczekiwań
metadanych, 2 celowe pominięcia desktopowych wariantów testów dotykowych**.
Po dopasowaniu oczekiwań do opisu SEO zawierającego egzoplanety ponowiono
wszystkie cztery błędne przypadki: **4/4**. Nie pominięto błędów aplikacji.
Wszystkie 72 właściwe scenariusze mają zatem wynik pozytywny, lecz nie jest
to wynik jednego ponownego pełnego przebiegu. Testy obejmują między innymi
rzeczywisty render i wycentrowany kadr każdej z 19 planet, reset tylko bieżącego
układu, powrót do zachowanego czasu i tempa, szybkie zmiany celu/układu,
klawiaturę, tłumaczenia, ekrany wąskie i orientację poziomą oraz brak WebGL.

Oglądano obrazy z natywnego renderera na 1440×900 i 390×844. Poprawiono
pierścień zaznaczenia, mobilny kadr i rozmieszczenie etykiet. Przegląd kodu
wykrył także oświetlenie egzoplanety względem globalnego początku zamiast
przesuwanej gwiazdy podczas zmiany skali. Shader pobiera teraz rzeczywiste
położenie gwiazdy przed renderem materiału. Natywny WebGL po tej poprawce:
bez błędów shaderów, aplikacji i zasobów podczas pomiaru.

### Pomiar nowych układów

`HEADED=1 node scripts/measure-exoplanets.mjs`, lokalny produkcyjny podgląd na porcie 4174.
Apple M2, 16 GB RAM, macOS 27.0.1, Chromium 156.0.0.0, ANGLE Metal Renderer:
Apple M2. Bez throttlingu, DPR 1, nowy kontekst na każdy rozmiar. Auto wybiera
wysoką jakość przy 1440×900 i niską przy 390×844. Ten drugi pomiar wykonano
na tym samym Macu z emulacją rozmiaru i dotyku; **nie na fizycznym telefonie**.

| Układ | Widok ogólny FPS / P95 | Przelot FPS / P95 | Zbliżenie FPS / P95 |
| --- | ---: | ---: | ---: |
| TRAPPIST-1 · 1440×900 | 60,14 / 18,1 ms | 60,57 / 18,0 ms | 60,08 / 17,9 ms |
| Kepler-90 · 1440×900 | 60,05 / 18,2 ms | 60,20 / 18,1 ms | 60,16 / 17,9 ms |
| TOI-700 · 1440×900 | 60,10 / 17,8 ms | 60,19 / 17,8 ms | 60,13 / 17,5 ms |
| TRAPPIST-1 · 390×844 (emulacja) | 60,14 / 17,8 ms | 59,73 / 17,7 ms | 60,16 / 17,6 ms |
| Kepler-90 · 390×844 (emulacja) | 60,06 / 17,9 ms | 60,25 / 17,9 ms | 60,10 / 18,3 ms |
| TOI-700 · 390×844 (emulacja) | 60,11 / 17,6 ms | 60,24 / 18,1 ms | 60,15 / 18,1 ms |

Widok ogólny i zbliżenie: pojedyncze próbki po 3 s; przelot około 1,62–1,64 s.
Mediana 16,7 ms. Najdłuższa klatka 33,4 ms wystąpiła przy mobilnym przelocie
TRAPPIST-1 w emulacji. Drobne wartości ponad 60 FPS wynikają z granic próbkowania
na ekranie 60 Hz. Są to dostarczone klatki sceny, nie wynik Lighthouse ani pomiar
samego shadera. Dłuższa praca termiczna i fizyczne urządzenia mobilne pozostają
niezweryfikowane.

Po pauzie czas pozostał bez zmian przez 120 odświeżeń przeglądarki. Desktop
zarejestrował jeszcze 1 dodatkową klatkę po zatrzymaniu, emulacja 0; nie utrzymywała
się ciągła pętla renderowania. Widok ogólny: 16–28 draw calls; bez dodatkowego
transferu map powierzchni egzoplanet.

Pierwsza użyteczna scena planet: **536,0 ms / 505,8 ms**, **785 430 B ≈ 0,79 MB**
transferu przed gotowością. Pomiar wykonano przed ostatnią, niewielką zmianą
samego CSS wygaszającą etykiety nad mobilnym wstępem; kod sceny GPU jest
identyczny. To krótkie, lokalne pomiary, nie pomiar szybkości publicznego łącza.
Surowe wyniki lokalne: `artifacts/exoplanet-performance.json` (ignorowane przez Git).

Po końcowej poprawce położenia źródła światła i mobilnego CSS przebudowano
aplikację i uruchomiono ponownie zestaw obejmujący nowe układy, galaktykę oraz
SEO: **32/32**, bez pominięć, w 2,6 min. Obejmuje obie konfiguracje ekranu i każdy
z 19 wariantów powierzchni. Nie wystąpiły nieoczekiwane błędy aplikacji, shaderów
lub zasobów. Ta regresja obejmuje końcowy kod funkcjonalny po poprawce oświetlenia; wcześniejszy
pełny przebieg został opisany osobno powyżej. Następnie wygładzono samą maskę
etykiet i zawijanie jednostki szybkości w mobilnym CSS. Obraz obejrzano ponownie
w natywnym WebGL; dodatkowy mobilny scenariusz wyboru trzech układów przeszedł 1/1.
