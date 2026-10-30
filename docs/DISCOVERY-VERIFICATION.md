# Orbita: rozszerzona eksploracja — 30 października 2026

## Co sprawdzono

Księżyc, Io, Europa, Ganimedes, Kallisto i Tytan: wybór, rzeczywista pozycja
względem poruszającego się rodzica, przeloty, zmiana celu, chwilowe tempo,
pauza, reset i powrót fokusu. Porównanie: wspólna skala średnic planet,
egzoplanet i księżyców, wariant 2D oraz wybór klawiaturą.

Podróż światła: rzeczywista siatka impulsu przemieszcza się zgodnie z fizycznym
czasem lotu; osiem czasów dotarcia, transport, przewijanie i niezależny zegar.
Mapa: katalogowe kierunki i dystanse przeliczono na galaktyczne XYZ, a testy
porównują faktyczne pozycje grup Three.js ze współrzędnymi źródłowymi,
w pełnej Galaktyce i zakresach 100/3000 lat świetlnych. Markery zachowują
wspólną skalę; odsuwane są wyłącznie etykiety z liniami prowadzącymi.

Fazy: ciągły suwak, cztery fazy, scenariusze zaćmień, faktyczna pozycja Księżyca,
widoczny stożek cienia, statyczne renderowanie na żądanie i 2D. Udostępnianie:
odtworzenie kamery, czasu, ustawień, księżyców i każdego trybu; język z linku,
niepoprawne adresy, pomyślne/odrzucone operacje schowka i fokus dialogu.

Sprawdzono widoki 1440×900, 390×844, 360×640, 640×360 i 844×390.
Natywne zrzuty ANGLE Metal obejmują rodziny księżyców, porównania, podróż
światła, oba zakresy mapy i fazy/zaćmienia. Usunięto wykryte nakładanie
etykiet oraz kolizje interfejsu. Błąd aliasu `threeLine` w zainstalowanym
Fiber 9.8.2 zastąpiono własnym `THREE.Line`/`primitive` ze zwalnianiem zasobów;
przykład ze skilla nie był poprawny w działającym rendererze tej wersji.
Nie zmieniano bibliotek wyłącznie dla obejścia problemu.

## Pomiary wydajności

Apple M2, 16 GB RAM; macOS 27.0.1 (Darwin 27.0.0), headed Chromium
156.0.8078.4 / UA 156.0.0.0, WebGL renderer
`ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)`.
Produkcyjny Vite preview na localhost, bez throttlingu, świeże konteksty,
DPR urządzenia i renderera 1. Auto: wysoka jakość 1440×900, niska 390×844.
Przeglądarki i benchmarki uruchamiano kolejno, bez równoległych testów WebGL.
390×844 oznacza emulację rozmiaru/dotyku na tym samym komputerze.

Skrypty: `HEADED=1 node scripts/measure-performance.mjs` oraz
`HEADED=1 node scripts/measure-discovery.mjs`; serwer preview na porcie 4174.
Liczone są rzeczywiste przyrosty klatek Engine przez rAF i odstępy między
nimi, nie wynik Lighthouse ani czas GPU z timer queries. Próbki ruchu: 5 s;
przelot: 1,7 s. Przed pomiarami jest rozgrzewka. To pojedyncze lokalne próby.

| Scenariusz | 1440×900 FPS / P95 | 390×844 emulacja FPS / P95 |
|---|---:|---:|
| Cały Układ Słoneczny, 8 dni/s | 60,10 / 18,1 ms | 60,05 / 18,0 ms |
| Przelot do Saturna | 60,55 / 17,9 ms | 60,40 / 18,1 ms |
| Saturn z bliska | 60,11 / 18,2 ms | 56,12 / 18,2 ms |
| Księżyc z bliska, 0,1 dnia/s | 60,07 / 18,0 ms | 60,08 / 17,7 ms |
| Impuls światła, 600 s/s | 56,89 / 18,0 ms | 57,07 / 17,7 ms |

Mediana wszystkich próbek: 16,7 ms. Wyniki nieznacznie powyżej 60 wynikają
z granic okna pomiarowego. Średnie około 56–57 przy podobnym P95 oznaczają
rzadsze dłuższe odstępy; ten pomiar nie identyfikuje ich przyczyny. Nie należy
przedstawiać ich jako stałych 60 FPS ani przypisywać wyłącznie GPU.

Statyczne porównanie, mapa 3000 ly i fazy: **0 dodatkowych renderów / 1 s**
po ustaleniu kadru, w obu rozdzielczościach. Mapa 100 ly: 1 desktop / 0 emulacja;
pojedynczy późniejszy render, bez ciągłej pętli. Zasoby i damping mogą żądać
kolejnej klatki. Reakcja na zmianę pary: 15,1 / 13,8 ms; zakresu mapy:
30,1 / 30,4 ms; fazy: 30,2 / 30,1 ms — zdarzenie wejścia do następnej
wyrenderowanej klatki w tych próbach.

Pierwsza użyteczna scena: **483,1 / 492,8 ms**, transfer do tego momentu
**813 315 B ≈ 0,813 MB** w obu próbach. Uwzględnia dokument i zakończone
zasoby według Navigation/Resource Timing. Podstawowa scena, wybór i kamera
już działają; dokładniejsze tekstury doczytywane są po wyborze. Limit 5 MB
spełniony w tych warunkach; czas localhost nie prognozuje sieci mobilnej.

## Ograniczenia weryfikacji

Nie testowano fizycznego telefonu ani celu 30 FPS na takim urządzeniu.
Brak osobnych pomiarów Safari, Firefox, DPR 2–3, słabszego GPU, długich sesji
lub throttlingu termicznego. Pomiary nie są gwarancją płynności na każdym
sprzęcie. Sąsiedztwo nie jest pełnym katalogiem gwiazd, wyglądy księżyców
oraz egzoplanet są artystyczne, a zaćmienia schematyczne. Link przechowuje
współrzędne kamery; proporcje innego ekranu mogą zmienić widoczny kadr.

Dodatkowy przegląd kodu wykrył trzy przypadki brzegowe: przywrócone granice
zoomu, fokus po zamknięciu widoku otwartego z linku i ponawianie tekstur
porównania/faz. Dodano regresje obejmujące rzeczywisty zoom oraz mapę podpiętą
do materiału po kontrolowanym błędzie sieci. Globalne „Ponów” uruchamia te
loadery ponownie; jednolite bryły pozostają dostępne podczas błędu.

## Wyniki kontroli automatycznych

- TypeScript, ESLint (bez ostrzeżeń), produkcyjny build: zaliczone.
- Vitest / React Testing Library: **76/76**, 12 plików.
- Pełny Playwright przed końcowymi poprawkami przeglądu: **156 zaliczonych,
  2 celowo pominięte testy dotykowe na desktopie**, 13 plików, 12,2 min.
  Te dwa scenariusze wykonują się na projekcie mobilnym.
- Po przeglądzie: **28/28** na ostatecznym buildzie — porównanie, fazy,
  granice zoomu przywróconej kamery, fokus oraz ponowienie tekstur. Osobno
  **12/12** udostępniania na buildzie z poprawionymi granicami i fokusem.
- Końcowy katalog CI obejmuje 164 uruchomienia w 14 plikach (162 mają
  zastosowanie; te same dwa desktopowe pominięcia). Nie przedstawiamy tej
  liczby jako wyniku jednego lokalnego pełnego przebiegu po ostatniej poprawce.

E2E używa rzeczywistego WebGL/SwiftShader w produkcyjnym podglądzie, sprawdzając
render, pozycje, materiały i skutki interakcji. Testy schowka kontrolują wyłącznie
API schowka, a testy awarii kontrolują odpowiedź wskazanej tekstury; canvas ani
rendering nie są zamockowane. Testy funkcjonalne nie są pomiarem FPS telefonu.

## Ponowny pomiar końcowego kodu (`ddda2c8`)

Po wszystkich poprawkach uruchomiono oba benchmarki ponownie, kolejno na tym
samym sprzęcie, bez równoległych testów. Powyższe pierwsze pomiary pozostają
zapisane dla pokazania zmienności; poniżej druga próba, a nie średnia obu.

| Scenariusz | 1440×900 FPS / P95 | 390×844 emulacja FPS / P95 |
|---|---:|---:|
| Cały układ | 60,08 / 18,2 ms | 60,09 / 17,8 ms |
| Przelot do Saturna | 60,13 / 17,2 ms | 60,47 / 18,3 ms |
| Saturn z bliska | 60,09 / 18,3 ms | 60,09 / 17,9 ms |
| Księżyc z bliska | 60,08 / 18,3 ms | 60,08 / 18,2 ms |
| Impuls światła, 600 s/s | 60,05 / 18,2 ms | 60,06 / 17,6 ms |

Mediana: 16,7 ms. Pierwsza użyteczna scena: **536,4 / 504,3 ms**;
transfer **813 728 B ≈ 0,814 MB**. Reakcje pary/mapy/fazy: 13,5/30,3/29,6 ms
desktop i 16,3/29,0/28,5 ms emulacja. Statyczne okna ponownie: 0 renderów
porównania/mapy3000/faz; mapa100 — 1 desktop / 0 emulacja. Brak błędów
aplikacji i zasobów w obu kontekstach. To nadal krótkie próby na komputerze;
nie zastępują testu fizycznego telefonu ani nie wyjaśniają rzadszych dłuższych
odstępów w pierwszej sekwencji.
