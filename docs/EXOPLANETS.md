# Egzoplanety: źródła, migawka danych i ograniczenia

Dane pobrano **29 października 2026 r.** bezpośrednio z NASA Exoplanet Archive przez TAP, z tabeli **`pscomppars` (Planetary Systems Composite Parameters)**. Aplikacja korzysta z zapisanej lokalnie migawki w `src/data/systems.ts`; nie odpytuje serwisu podczas działania. Ten plik przechowuje wartości w jednostkach archiwum, dolne i górne błędy oraz odnośniki do publikacji osobno dla okresu, półosi wielkiej i promienia.

## Odtworzenie pobrania

- [Opis usługi TAP](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html).
- [Aktualne definicje kolumn PS/PSCompPars](https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html).
- [Dokładne zapytanie migawki w formacie JSON](https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+pl_name%2Chostname%2Cpl_letter%2Cpl_orbper%2Cpl_orbpererr1%2Cpl_orbpererr2%2Cpl_orbsmax%2Cpl_orbsmaxerr1%2Cpl_orbsmaxerr2%2Cpl_rade%2Cpl_radeerr1%2Cpl_radeerr2%2Cst_rad%2Cst_raderr1%2Cst_raderr2%2Cst_teff%2Cra%2Cdec%2Csy_dist%2Csy_disterr1%2Csy_disterr2%2Cpl_orbper_reflink%2Cpl_orbsmax_reflink%2Cpl_rade_reflink%2Cst_rad_reflink%2Csy_dist_reflink+from+pscomppars+where+hostname+in+%28%27TRAPPIST-1%27%2C%27KOI-351%27%2C%27TOI-700%27%29+order+by+hostname%2Cpl_orbper&format=json).

```sql
select pl_name, hostname, pl_letter,
       pl_orbper, pl_orbpererr1, pl_orbpererr2,
       pl_orbsmax, pl_orbsmaxerr1, pl_orbsmaxerr2,
       pl_rade, pl_radeerr1, pl_radeerr2,
       st_rad, st_raderr1, st_raderr2, st_teff,
       ra, dec, sy_dist, sy_disterr1, sy_disterr2,
       pl_orbper_reflink, pl_orbsmax_reflink,
       pl_rade_reflink, st_rad_reflink, sy_dist_reflink
from pscomppars
where hostname in ('TRAPPIST-1', 'KOI-351', 'TOI-700')
order by hostname, pl_orbper
```

Zapytanie zwróciło **19 planet: 7 + 8 + 4**. `pscomppars` zestawia preferowane parametry z różnych publikacji; nie jest jednym wspólnym dopasowaniem orbit. „Aktualna migawka archiwum” nie oznacza, że każda liczba pochodzi z publikacji z 2026 r. Ani precyzja zapisu, ani liczba miejsc po przecinku nie oznacza dokładności fizycznej. Brak błędu jest zapisany jako `null`, nie jako zerowa niepewność.

**Alias Keplera:** archiwum używa nazwy gwiazdy `KOI-351` oraz nazw `KOI-351 b`–`h`, a dla planety i nazwy `Kepler-90 i`. Interfejs konsekwentnie używa rozpoznawalnego oznaczenia **Kepler-90**, zachowując oryginalne `archiveName` i źródła. Kolejność orbitalna to **b, c, i, d, e, f, g, h**. W TOI-700 kolejność to **b, c, e, d**. Litery nie są numerami kolejnych orbit.

## Parametry planet zapisane w migawce

Kolumny: okres w dniach ziemskich, półoś wielka w au, promień w promieniach Ziemi. Błędy są podane jako dolny / górny offset względem wartości centralnej, zgodnie z archiwum. Nazwy w tabeli odpowiadają nazwom w interfejsie.

| Planeta | Okres [d] | Błąd okresu | Półoś [au] | Błąd półosi | Promień [R⊕] | Błąd promienia |
| --- | ---: | --- | ---: | --- | ---: | --- |
| Kepler-90 b | 7.008151 | -1.9e-05 / +1.9e-05 | 0.074 | -0.016 / +0.016 | 1.31 | -0.17 / +0.17 |
| Kepler-90 c | 8.719375 | -2.7e-05 / +2.7e-05 | 0.089 | -0.012 / +0.012 | 1.19 | -0.14 / +0.14 |
| Kepler-90 i | 14.44912 | -0.0002 / +0.0002 | 0.1201380843 | nie podano | 1.32 | -0.21 / +0.21 |
| Kepler-90 d | 59.73667 | -0.00038 / +0.00038 | 0.32 | -0.05 / +0.05 | 2.87 | -0.3 / +0.3 |
| Kepler-90 e | 91.93913 | -0.00073 / +0.00073 | 0.42 | -0.06 / +0.06 | 2.66 | -0.29 / +0.29 |
| Kepler-90 f | 124.9144 | -0.0019 / +0.0019 | 0.48 | -0.09 / +0.09 | 2.88 | -0.52 / +0.52 |
| Kepler-90 g | 210.73514 | -0.00017 / +0.00017 | 0.71704 | -0.00729 / +0.00729 | 7.718 | -0.206 / +0.206 |
| Kepler-90 h | 331.60296 | -0.00034 / +0.00034 | 0.97062 | -0.00986 / +0.00986 | 11.252 | -0.306 / +0.306 |
| TOI-700 b | 9.97722 | -1.2e-05 / +1.2e-05 | 0.0678 | -0.0011 / +0.0011 | 0.963 | -0.034 / +0.037 |
| TOI-700 c | 16.0511039 | -5.5e-06 / +5.6e-06 | 0.0931 | -0.0015 / +0.0015 | 2.535 | -0.073 / +0.084 |
| TOI-700 e | 27.810124 | -8.7e-05 / +7.1e-05 | 0.1336 | -0.002 / +0.002 | 0.919 | -0.024 / +0.028 |
| TOI-700 d | 37.423457 | -1.7e-05 / +1.8e-05 | 0.1642 | -0.0027 / +0.0025 | 1.145 | -0.026 / +0.032 |
| TRAPPIST-1 b | 1.510826 | -6e-06 / +6e-06 | 0.01154 | -0.0001 / +0.0001 | 1.116 | -0.012 / +0.014 |
| TRAPPIST-1 c | 2.421937 | -1.8e-05 / +1.8e-05 | 0.0158 | -0.00013 / +0.00013 | 1.097 | -0.012 / +0.014 |
| TRAPPIST-1 d | 4.049219 | -2.6e-05 / +2.6e-05 | 0.02227 | -0.00019 / +0.00019 | 0.788 | -0.01 / +0.011 |
| TRAPPIST-1 e | 6.101013 | -3.5e-05 / +3.5e-05 | 0.02925 | -0.0025 / +0.0025 | 0.92 | -0.012 / +0.013 |
| TRAPPIST-1 f | 9.20754 | -3.2e-05 / +3.2e-05 | 0.03849 | -0.00033 / +0.00033 | 1.045 | -0.012 / +0.013 |
| TRAPPIST-1 g | 12.352446 | -5.4e-05 / +5.4e-05 | 0.04683 | -0.0004 / +0.0004 | 1.129 | -0.013 / +0.015 |
| TRAPPIST-1 h | 18.772866 | -0.000214 / +0.000214 | 0.06189 | -0.00053 / +0.00053 | 0.755 | -0.014 / +0.014 |

## Parametry gwiazd i położenie na niebie

RA i Dec to katalogowe współrzędne kierunku w stopniach dziesiętnych, w układzie ICRS. To nie bieżące pozycje planet. Nie propagujemy ruchu własnego ani paralaksy do konkretnej daty. Odległość odnosi się do obserwatora w Układzie Słonecznym. Zerowa odległość oraz RA/Dec = 0/0 dla wpisu `solar` są oznaczeniem lokalnego początku, nie fizycznymi współrzędnymi Słońca.

| Gwiazda | Promień [R☉] | Błąd promienia | RA [°] | Dec [°] | Odległość [pc] | Błąd odległości [pc] |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| TRAPPIST-1 | 0.1192 | -0.0013 / +0.0013 | 346.6263919 | -5.0434618 | 12.42988881 | -0.01870661 / +0.01870661 |
| Kepler-90 | 1.185 | -0.03 / +0.031 | 284.4334642 | 49.3051239 | 848.254 | -10.8185 / +10.8185 |
| TOI-700 | 0.4104 | -0.0069 / +0.0093 | 97.0957165 | -65.5786149 | 31.1265 | -0.0206 / +0.0206 |

Dla TRAPPIST-1 przyjęliśmy promień gwiazdy z Agol et al. 2021; dla TOI-700 z Pass et al. 2026. W przypadku Kepler-90 wiersze różnych planet mają różne oszacowania promienia tej samej gwiazdy: 1,2 R☉, 1,29 R☉ i 1,185 R☉. Do pojedynczej gwiazdy w scenie wybraliśmy **1,185 R☉**, z wierszy g/h i źródła Fulton & Petigura 2018, zamiast udawać zgodność wszystkich literaturowych rozwiązań. Wybrany promień nie służy do ponownego przeliczania opublikowanych promieni planet.

### Literatura wskazana przez archiwum

- [Agol et al. 2021](https://ui.adsabs.harvard.edu/abs/2021PSJ.....2....1A/abstract).
- [Cabrera et al. 2014](https://ui.adsabs.harvard.edu/abs/2014ApJ...781...18C/abstract).
- [Fulton & Petigura 2018](https://ui.adsabs.harvard.edu/abs/2018AJ....156..264F/abstract).
- [Gaia DR2](https://ui.adsabs.harvard.edu/abs/2018A&A...616A...1G/abstract).
- [Pass et al. 2026](https://ui.adsabs.harvard.edu/abs/2026AJ....172..175P/abstract).
- [Shallue & Vanderburg 2018](https://ui.adsabs.harvard.edu/abs/2018AJ....155...94S/abstract).
- [Shaw et al. 2025](https://ui.adsabs.harvard.edu/abs/2025AJ....170..146S/abstract).
- [TICv8](https://ui.adsabs.harvard.edu/abs/2019AJ....158..138S/abstract).
- [Weiss et al. 2024](https://ui.adsabs.harvard.edu/abs/2024ApJS..270....8W/abstract).

Wartości TOI-700 pochodzą z nowego rozwiązania Pass et al. 2026. Na przykład promień TOI-700 e wynosi w tej migawce **0,919 R⊕**, a nie 0,953 R⊕ z opisu odkrycia z 2023 r. Starsze komunikaty NASA służą kontekstowi odkrycia, nie zastępują tabeli liczbowej.

## Konwersje do danych panelu

- `diameterKm = round(2 × pl_rade × 6378,1 km)`. Użyto nominalnego promienia ziemskiego, podanego m.in. w [NASA ExEP Science Gap List 2026](https://assets.science.nasa.gov/content/dam/science/astro/programs/exep/science/documents/ExEP_Science_Gap_List_2026.pdf), przypis 38. To **oszacowanie średnicy z promienia tranzytowego**, nie bezpośrednio zmierzona średnia średnica bryły. Dane planet Układu Słonecznego pozostają bez zmian i mają własną definicję średnicy.
- `diameterKm` gwiazdy to `round(2 × st_rad × 695700 km)`. Wartość odniesienia pochodzi z [NASA Sun Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html).
- `distanceMillionKm = pl_orbsmax × 149,5978707`. [NASA/JPL definiuje au](https://cneos.jpl.nasa.gov/glossary/au.html) jako dokładnie 149 597 870 700 m. To **półoś wielka orbity**, używana jako przybliżenie odległości od gwiazdy w modelu kołowym, a nie aktualna separacja ani ścisła czasowa średnia dla orbity eliptycznej.
- `distanceLightYears = round(sy_dist × 3,26156, 2 miejsca)`. Przeliczenie parseków na lata świetlne jest przybliżone. Kontekst jednostek: [NASA — Cosmic Distances](https://science.nasa.gov/universe/cosmic-distances/).
- `orbitalPeriodDays` zachowuje okres z archiwum. Nie wyznaczamy go ponownie ze sztucznej odległości widocznej na ekranie.

## Opisy, klasyfikacja i granice wiedzy

- [NASA/Webb — What is Webb Revealing About the TRAPPIST-1 System?](https://science.nasa.gov/mission/webb/science-overview/science-explainers/what-is-webb-revealing-about-the-trappist-1-system/): siedem planet o rozmiarach zbliżonych do Ziemi, prawdopodobnie skalistych, przy ultrachłodnym czerwonym karle; wszystkie orbity leżą bliżej gwiazdy niż orbita Merkurego od Słońca. Atmosfery pozostają przedmiotem badań. Nie kopiujemy historycznych obrazów przedstawiających hipotetyczne oceany.
- [NASA — Discovery of eight planets makes alien system the first to tie with our solar system](https://science.nasa.gov/universe/exoplanets/discovery-of-eight-planets-makes-alien-system-the-first-to-tie-with-our-solar-system/): architektura Kepler-90, mniejsze wewnętrzne planety i dalsze gazowe olbrzymy, odkrycie i z pomocą uczenia maszynowego. W aplikacji b/c/i oznaczamy ostrożnie jako prawdopodobnie skaliste, g/h jako gazowe olbrzymy, a d/e/f jako planety o niepewnym składzie — sama wielkość nie dowodzi budowy ani atmosfery.
- [NASA — TESS Discovers Planetary System’s Second Earth-Size World](https://www.nasa.gov/universe/nasas-tess-discovers-planetary-systems-second-earth-size-world/): cztery planety TOI-700; e i d w obszarach ekosfery. [Katalog NASA dla TOI-700 c](https://science.nasa.gov/exoplanet-catalog/toi-700-c/) określa c jako planetę typu Neptuna. Pozostałe małe planety oznaczamy jako prawdopodobnie skaliste.
- [NASA — How do exoplanets get their names?](https://science.nasa.gov/exoplanets/how-do-exoplanets-get-their-names/): znaczenie liter w nazwach. Przy równoczesnym odkryciu grupy planet litery mogą odpowiadać odległościom; późniejsza planeta dostaje kolejną wolną literę.

Ekosfera oznacza zakres warunków rozważanych w modelach możliwości występowania ciekłej wody na powierzchni. **Nie dowodzi istnienia oceanów, atmosfery, życia ani warunków nadających się dla człowieka.** Tekstury i barwy egzoplanet są interpretacją artystyczną, nie fotografiami ich powierzchni. Nie twierdzimy, że plamy na modelu są zaobserwowanymi kontynentami, chmurami lub oceanami.

## Uproszczenia symulacji

Wszystkie układy zachowują poprawną kolejność orbit i względne okresy obiegu z migawki. Orbity są kołowe i współpłaszczyznowe, a położenia początkowe wynikają z deterministycznej kompozycji (`index × 2,399963… + 0,35` radiana), **nie z efemeryd**. Nie pokazujemy aktualnej konfiguracji astronomicznej i nie odtwarzamy czasów tranzytów, rezonansów ani wzajemnych oddziaływań grawitacyjnych.

Wizualne odległości rozłożono od 7 do 51 jednostek sceny, a promienie planet skompresowano potęgowo z minimum 0,55 i maksimum 2. Gwiazdy mają osobną skalę. Te wartości służą wyborowi i eksploracji, a nie porównywaniu rzeczywistych rozmiarów i odległości.

Nie dodajemy niepotwierdzonych okresów obrotu osiowego. Nowe obiekty mają `rotationPeriodDays = 0`, co jest **znacznikiem braku obsługiwanego pomiaru**, a nie stwierdzeniem, że obiekt fizycznie się nie obraca. Nie utożsamiamy przypuszczalnego związania pływowego z pewnym pomiarem okresu. Kod renderera musi traktować ten znacznik jako brak animacji osiowej i nie dzielić przez zero.

Katalogowe RA i Dec zachowujemy w metadanych do ewentualnego przyszłego mapowania. W obecnym widoku galaktyki nie pokazujemy osobnych znaczników tych trzech gwiazd: przy tej skali nakładałyby się na lokalne otoczenie Słońca. Układy wybiera się z listy, a panel podaje ich odległość katalogową; widok Drogi Mlecznej zachowuje jeden schematyczny znacznik Układu Słonecznego. Skala lokalnych orbit jest oddzielna od skali galaktycznej.
