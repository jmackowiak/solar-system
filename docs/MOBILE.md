# Mobilna eksploracja — 30 października 2026

Scena ma pierwszeństwo przed tekstem i sterowaniem. Na telefonie początkowy
wstęp to pojedynczy wiersz z nazwą układu i przyciskiem podróży. Informacja o
artystycznym wyglądzie egzoplanet pozostaje widoczna. Pełne opisy są dostępne
w panelach obiektów i opisie atlasu.

- Player ma **56 px wysokości**, z działającą pauzą, czasem, suwakiem i resetem.
- Po ręcznym wyborze obiektu karta informacji jest domyślnie zwinięta:
  **82 px w pionie**, **44 px na krótkim ekranie poziomym**.
- Przycisk **Szczegóły / Details** otwiera przewijany opis i dane NASA.
- Wycieczka celowo otwiera pełny opis; jej nawigacja pozostaje dostępna.
- Ustawienia widoku zwijają mobilny opis, aby nie nakładać dwóch dużych paneli.
- W pionie katalog jest niskim przewijanym paskiem; poziomo zajmuje lewy bok.
- Canvas ma rzeczywiste granice oddzielone od odtwarzacza i panelu. Kamera
  dopasowuje początkowy widok ogólny do proporcji tego obszaru.
- Na desktopie o normalnej wysokości pełne opisy pozostają otwarte.

## Kontrola geometrii

Chromium 156 na Macu, natywny ANGLE Metal, DPR 1. To zmiany rozmiaru i emulacja
telefonu, **nie test fizycznego smartfona**. Zweryfikowano również EN/PL,
sterowanie dotykowe w Playwright i ograniczony ruch.

| Widok po wyborze Ziemi | Canvas (x, y, szerokość, wysokość) | Karta | Player |
| --- | --- | ---: | ---: |
| 390×844 | 0, 112, 390, 510 | 82 px | 56 px |
| 360×640 | 0, 112, 360, 306 | 82 px | 56 px |
| 640×360 | 132, 56, 508, 224 | 44 px | 56 px |
| 844×390 | 132, 56, 712, 254 | 44 px | 56 px |

Nie porównujemy samej wysokości Canvas ze starszą wersją: poprzednio część
renderera znajdowała się za nagłówkiem i sterowaniem. Testy mierzą wolny obszar
oraz sprawdzają, czy projekcja centrum planety z marginesem 35 px nie przecina
odtwarzacza, katalogu, panelu ani nagłówka. Sprawdzają też zgodność wymiarów
Canvas z jego kontenerem po zmianie układu.

## Testy

Typy, lint, produkcyjny build i **30 testów jednostkowych** przeszły.
Pełny przebieg Playwright: **81 zaliczonych, 1 stare oczekiwanie UI, 2 celowe
pominięcia desktopowych wariantów testów dotykowych**. Po dodaniu rozwinięcia
opisu w teście źródła NASA oba jego warianty przeszły **2/2**. Wszystkie 82
właściwe scenariusze mają pozytywny wynik, lecz nie jest to jeden ponowny pełny
przebieg. Sprawdzono oryginalny układ, egzoplanety, galaktykę, tekstury,
orientację, źródła, pauzę/tempo/reset, wycieczkę, klawiaturę, brak renderera,
ponowne wczytanie tekstur i powrót z nieaktywnej karty.

Późniejsza korekta samego CSS zapobiega nachodzeniu wyboru układu na wybór
języka w niskim widoku poziomym. Kod sceny i symulacji pozostaje identyczny.

Po ostatniej korekcie nagłówka ponowiono cały zestaw mobilny: **10/10** oraz
oba warianty fallbacku: **2/2**. Sprawdzono również brak nakładania sześciu
kontrolek nagłówka, trafienie w ich środek oraz wybór TRAPPIST-1 z potwierdzeniem
nowej wyrenderowanej klatki. Brak błędów aplikacji, shaderów i zasobów.

## Płynność końcowej sceny

`HEADED=1 node scripts/measure-performance.mjs`, produkcyjny podgląd lokalny na
porcie 4174. Apple M2, 16 GB, macOS 27.0.1, Chromium 156.0.0.0, ANGLE Metal Renderer:
Apple M2, DPR 1, bez throttlingu, ruch włączony. Auto: wysoka jakość przy 1440×900,
niska przy 390×844. Rozmiar telefonu i dotyk emulowano na tym samym Macu.

| Scenariusz | 1440×900 FPS / P95| 390×844 (emulacja) FPS / P95|
| --- | ---: | ---: |
| Widok ogólny, 5 s | 60,07 / 18,0 ms | 60,05 / 18,2 ms |
| Przelot do Saturna, 1,7 s | 60,19 / 18,1 ms | 60,47 / 18,1 ms |
| Zbliżenie Saturna, 5 s | 60,11 / 18,1 ms | 60,10 / 18,3 ms |

Mediana 16,7 ms. Wartości nieznacznie ponad 60 FPS wynikają z granic próbkowania
na ekranie 60 Hz. Mierzono dostarczone klatki WebGL, nie wynik Lighthouse.
Pierwsza użyteczna scena: 569,7 ms / 496,3 ms i **788 956 B ≈ 0,79 MB** transferu
przed gotowością. To krótkie pomiary lokalne, nie szybkość publicznego łącza.
Fizyczny telefon i długotrwała praca termiczna pozostają niezweryfikowane.
Surowe wyniki: `artifacts/performance.json` (ignorowane przez Git).
