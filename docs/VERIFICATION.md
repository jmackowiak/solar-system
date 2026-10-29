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
