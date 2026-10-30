# Dane i geometria kolejnych trybów odkrywania

Moduł `src/lib/discovery.ts` zawiera niezależną od renderera matematykę. Nie dodaje efemeryd ani zapytań sieciowych wykonywanych w aplikacji.

## Podróż światła

- [NASA/JPL: Astrodynamic Parameters](https://ssd.jpl.nasa.gov/astro_par.html): prędkość światła w próżni **299 792 458 m/s**, dokładnie; jednostka astronomiczna **149 597 870 700 m**, dokładnie; czas przelotu jednej au **499,004783836 s**.
- `lightTravelSeconds(distanceMillionKm)` przyjmuje odległość w milionach kilometrów i zwraca czas w sekundach: `distanceMillionKm × 1 000 000 / 299 792,458`.
- Odległości planet w katalogu są wartościami średnimi/półosiami wielkimi. Pokazują orientacyjny czas od Słońca, a nie od Ziemi. Rzeczywisty czas zmienia się z położeniem na elipsie. Ruch sygnału na ekranie może być przyspieszony, co musi zostać opisane oddzielnie od wskazywanego fizycznego czasu.

## Fazy Księżyca

- [NASA: Moon Phases](https://science.nasa.gov/moon/moon-phases/): fazy wynikają ze zmiany kąta obserwacji oświetlonej połowy Księżyca. Nów, obie kwadry i pełnia odpowiadają w przybliżeniu 0%, 50%, 100% i 50% oświetlonej tarczy.
- [US Naval Observatory: Phases and Percent Illuminated](https://aa.usno.navy.mil/faq/moon_phases) rozróżnia nazwane fazy od ciągłego procentu oświetlenia.
- `illuminatedFraction(elongationRadians)` stosuje `(1 − cos(elongation)) / 2`: kąt 0 w nowiu, π w pełni. Jest to geometria sferycznego Księżyca i równoległych promieni Słońca, bez libracji ani małej poprawki wynikającej ze skończonej odległości Słońca. Ułamek oznacza część **widocznej tarczy**, nie całej powierzchni globu. Kąt fazowy przy Księżycu i elongacja widziana z Ziemi nie są ściśle tym samym kątem.
- Sam procent nie określa zaćmienia. Potrzebna jest także geometria cienia i ustawienie węzłów nachylonej orbity. To nie prognoza bieżących faz ani dat zaćmień. Scenariusz dydaktyczny musi mieć takie oznaczenie.
- [NASA: Eclipses and the Moon](https://science.nasa.gov/moon/eclipses/) potwierdza porządek Słońce–Księżyc–Ziemia dla zaćmienia Słońca i Słońce–Ziemia–Księżyc dla zaćmienia Księżyca oraz rolę nachylenia orbity. Moduł `MoonPhases.tsx` w scenariuszu faz przyjmuje nachylenie 5,14° i linię węzłów odwróconą o 45° od osi światła. W scenariuszach zaćmień celowo ustawia model współpłaszczyznowo, aby można było zbadać wymagane ustawienie.
- Scena zachowuje stosunek średnic Księżyca i Ziemi (3475/12742), lecz skraca odległość do 5 promieni Ziemi. Oświetlenie jest kierunkowe; przedstawione półprzezroczyste stożki są objaśniającą ilustracją cienia, którego samodzielnie nie widać w próżni. Umowne długości stożków to 6,5 promienia Ziemi dla cienia Księżyca i 9,5 dla ziemskiego. Nakładka shaderowa zaciemnia tylko fragment odbiorczej sfery przecinający ten sam stożek. To nie fizycznie skalibrowana projekcja ani prognoza kontaktów czy widoczności zaćmienia.
- Osobna tarcza SVG w panelu pokazuje geometryczną fazę obserwowaną z Ziemi, z oświetleniem po prawej stronie podczas przybywania (orientacja północnej półkuli). Jej pole oświetlone wynika z rzutu terminatora, a nie z wycinka koła. Procent i obraz fazy są liczone przed dodatkowym zacienieniem podczas zaćmienia Księżyca.

## Układy gwiazdowe w Drodze Mlecznej

- [ESA Gaia EDR3: transformacje danych astrometrycznych, równanie 4.62](https://gea.esac.esa.int/archive/documentation/GEDR3/Data_processing/chap_cu3ast/sec_cu3ast_intro/ssec_cu3ast_intro_tansforms.html) podaje zastosowaną macierz ICRS → współrzędne galaktyczne. Przyjęta konwencja Hipparcos ma biegun północny RA = 192,85948°, Dec = +27,12825° i długość węzła 32,93192°. ESA zaznacza, że nie istnieje precyzyjna transformacja ICRS → układ galaktyczny zatwierdzona przez IAU; nie nazywamy tej macierzy „oficjalną macierzą IAU”.
- `equatorialToGalactic(raDegrees, decDegrees, distanceLy)` zwraca `{x,y,z}` w **latach świetlnych** i ze Słońcem w początku: x w kierunku l=0°,b=0°, y w kierunku l=90°,b=0°, z ku północnemu biegunowi galaktycznemu. Pozycje nie są jeszcze przesunięte do środka Galaktyki ani obrócone do osi sceny Three.js.
- [NASA Exoplanet Archive: definicje kolumn `ra`, `dec`, `sy_dist`](https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html). Migawkę `systems.ts` opisuje [EXOPLANETS.md](./EXOPLANETS.md). Współrzędne i dystanse zostały ponownie odczytane z TAP 30 października 2026 r. i odpowiadają zapisanym wartościom:

| Gwiazda w archiwum | RA (°) | Dec (°) | Dystans (pc) |
| --- | ---: | ---: | ---: |
| TRAPPIST-1 | 346,6263919 | −5,0434618 | 12,42988881 |
| KOI-351 / Kepler-90 | 284,4334642 | +49,3051239 | 848,254 |
| TOI-700 | 97,0957165 | −65,5786149 | 31,1265 |

[Powtarzalne zapytanie TAP](https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+distinct+hostname%2Cra%2Cdec%2Csy_dist+from+pscomppars+where+hostname+in+%28%27TRAPPIST-1%27%2C%27KOI-351%27%2C%27TOI-700%27%29&format=json).

- Kierunki katalogowe i odległości wystarczają do mapy dydaktycznej, ale nie są pozycjami propagowanymi do aktualnej daty: pomijamy ruch własny, precesję aparatu obserwacyjnego, paralaksę i niepewności w wizualnym znaczniku. Wielkość markera nie jest średnicą gwiazdy. Podkład ramion Drogi Mlecznej pozostaje schematem, a nie mapą pomiarową pojedynczych gwiazd.
- [SIMBAD: Kepler-90](https://simbad.u-strasbg.fr/simbad/sim-basic?Ident=Kepler-90) podaje niezależnie l≈79,2694904°, b≈19,2556547°; test sprawdza ten kierunek, zachowanie odległości oraz biegun i kierunek l=0°,b=0°.
