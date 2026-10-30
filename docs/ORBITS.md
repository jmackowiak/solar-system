# Orbity eliptyczne

Od tej zmiany osiem planet Układu Słonecznego porusza się po elipsach ze Słońcem w jednym z ognisk. Większość tych elips jest bardzo bliska okręgowi; największy mimośród w tej ósemce ma Merkury. Egzoplanety bez przypisanych parametrów kształtu zachowują kołowe przybliżenie.

## Źródło kształtu

[NASA/JPL Solar System Dynamics — Approximate Positions of the Planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html), **tabela 1**, sprawdzona 30 października 2026 r. Przyjęto stałe wartości mimośrodu `e` i długości peryhelium `long.peri.` z epoki **J2000**, bez ich współczynników zmian w czasie:

| Planeta | Mimośród e | Kierunek peryhelium [°] |
| --- | ---: | ---: |
| Merkury | 0,20563593 | 77,45779628 |
| Wenus | 0,00677672 | 131,60246718 |
| Ziemia — przybliżenie EM Bary | 0,01671123 | 102,93768193 |
| Mars | 0,09339410 | −23,94362959 |
| Jowisz | 0,04838624 | 14,72847983 |
| Saturn | 0,05386179 | 92,59887831 |
| Uran | 0,04725744 | 170,95427630 |
| Neptun | 0,00859048 | 44,96476227 |

Mimośród jest bezwymiarowy. `EM Bary` w tabeli NASA oznacza barycentrum Ziemia–Księżyc; użycie jego elementów dla pojedynczej Ziemi jest dodatkowym uproszczeniem. W `src/data/bodies.ts` kierunki przeliczamy ze stopni na radiany do pola `periapsisAngle`. Wszystkie orbity pozostają we wspólnej płaszczyźnie X/Z: ignorujemy inklinacje i węzły. Kierunek peryhelium określa orientację uproszczonej elipsy w tej płaszczyźnie.

## Geometria i ruch

`orbitRadius` jest teraz wizualną półosią wielką `a`, nie stałą odległością planety od Słońca. `orbitPoint(body, E)` zwraca współrzędne `[x, 0, z]` dla anomalii mimośrodowej `E` w radianach:

```text
x = a(cos E − e)
z = a√(1 − e²)sin E
```

Wynik obracamy o `periapsisAngle`. Ognisko ze Słońcem leży w początku układu. W peryhelium odległość wynosi `a(1−e)`, a w aphelium `a(1+e)`. Środek elipsy jest przesunięty względem Słońca; narysowanie spłaszczonego okręgu wycentrowanego na gwieździe nie dawałoby tego modelu.

`orbitalPosition(body, days)` oblicza anomalię średnią z arbitralnej fazy początkowej i czasu symulacji, a następnie rozwiązuje równanie Keplera `M = E − e sin E`. Planeta dzięki temu pokonuje większą drogę w takim samym czasie blisko peryhelium niż blisko aphelium. Nie przyspieszamy jej ręcznie w zależności od klatki.

Rysunek linii orbity powinien próbkuć **`orbitPoint`** równomiernie po `E` od 0 do `2π`; pozycja planety korzysta z tej samej geometrii, ale z anomalii wynikającej z równania Keplera. Przy braku `eccentricity` i `periapsisAngle` domyślne wartości wynoszą zero, zachowując dotychczasowe kołowe orbity egzoplanet.

Czas jest redukowany modulo okres przed pomnożeniem przez `2π`, a kąty normalizowane do zakresu od `−π` do `π`. Ogranicza to utratę precyzji przy wielu obiegach, choć nie usuwa ograniczeń reprezentacji liczb zmiennoprzecinkowych. Solver ma ograniczoną liczbę iteracji: do 12 kroków Newtona zabezpieczonych przed wyjściem z przedziału i maksymalnie 36 dodatkowych kroków bisekcji. Niepoprawne parametry elipsy powodują jawny błąd zamiast współrzędnych `NaN`.

## Granice modelu

To nadal **symulacja poglądowa bez efemeryd**. J2000 określa źródło kształtów, nie datę widocznej konfiguracji. Pole `phase` jest umowną anomalią średnią służącą początkowej kompozycji. Nie pobieramy z tabeli NASA aktualnych faz, nie propagujemy elementów do dzisiejszej daty i nie deklarujemy dokładności pełnego algorytmu JPL.

Wizualne półosie wielkie i promienie planet pozostają umowne; nie zachowują wspólnej skali. Zachowujemy dotychczasowe przybliżone okresy obiegu z NASA Fact Sheet. Pomijamy precesję, oddziaływania planet i ruch barycentrum Słońca. Zaokrąglone dane panelu odległości nie przedstawiają zmiennej, chwilowej odległości w tej animacji.

Testy jednostkowe sprawdzają ognisko, peryhelium i aphelium, orientację elipsy, zgodność linii z ruchem, szybszy ruch przy peryhelium, powtarzalność po okresie, niezależność od podziału czasu na klatki, zgodność wsteczną okręgów oraz stabilność dużych i ujemnych argumentów.
