# Dane, pochodzenie i uproszczenia

Podstawowe dane Układu Słonecznego sprawdzono w źródłach NASA 28 października 2026 r.; dane sześciu księżyców i źródła dodatkowych trybów — 30 października. Zbiory znajdują się w `src/data/bodies.ts`, `src/data/moons.ts` oraz `src/data/systems.ts`. Każdy obiekt ma adres opisu (`source`) i źródła liczbowe (`dataSources`). Własne teksty EN/PL opracowano na podstawie wskazanych materiałów. Dane są zapisane lokalnie; odsyłacze NASA i ESA nie są zależnościami sieciowymi działającej sceny.

## Wartości liczbowe

- [NASA/JPL — Planetary Physical Parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html): średnie promienie objętościowe i gwiazdowe okresy obrotu planet. Średnica w aplikacji to **dwukrotność średniego promienia objętościowego**, zaokrąglona do kilometra; nie średnica równikowa. To istotne zwłaszcza dla spłaszczonych planet olbrzymów.
- [NASA NSSDCA — Planetary Fact Sheet, Metric](https://nssdc.gsfc.nasa.gov/planetary/factsheet/): średnie odległości od Słońca i przybliżone okresy obiegu w dniach ziemskich. Stosujemy wartości tej tabeli konsekwentnie; nie łączymy ich z chwilową odległością wyświetlaną na niektórych stronach NASA Science.
- [NASA NSSDCA — Sun Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html): średni promień Słońca 695 700 km; przyjęty okres obrotu 609,12 godziny (25,38 dnia), dla szerokości heliograficznej 16°. Rzeczywiste Słońce obraca się różnicowo.

Ujemny okres obrotu Wenus i Urana oznacza obrót wsteczny. Okres obrotu odnosi się do gwiazd i nie jest długością doby słonecznej. W szczególności obrót Wenus trwa około 243 dni, lecz jej doba słoneczna około 117 dni. Różne tabele NASA zawierają zaokrąglenia i nieco inne definicje okresów; wizualizacja edukacyjna nie służy do obliczeń nawigacyjnych.

## Opisy i ciekawostki

- [Słońce](https://science.nasa.gov/sun/facts/): synteza jądrowa i obrót różnicowy.
- [Merkury](https://science.nasa.gov/mercury/facts/): kratery, egzosfera i doba słoneczna 176 dni.
- [Wenus](https://science.nasa.gov/venus/venus-facts/): gęsta atmosfera, wysoka temperatura i obrót wsteczny.
- [Ziemia](https://science.nasa.gov/earth/facts/): oceany, życie i około osiem minut drogi światła.
- [Mars](https://science.nasa.gov/mars/facts/): ślady dawnej wody i Olympus Mons.
- [Jowisz](https://science.nasa.gov/jupiter/jupiter-facts/): pasy atmosferyczne i Wielka Czerwona Plama.
- [Saturn](https://science.nasa.gov/saturn/facts/): pierścienie i średnia gęstość mniejsza od wody.
- [Uran](https://science.nasa.gov/uranus/facts/): nachylenie osi i wieloletnia noc polarna.
- [Neptun](https://science.nasa.gov/neptune/neptune-facts/): wiatry ponad 2000 km/h. NASA wyjaśnia także, że mocno nasycony błękit popularnych obrazów Voyagera był wynikiem obróbki obrazu. Kolory aplikacji są interpretacją artystyczną, nie pomiarem fotometrycznym.

## Model astronomiczny

W podstawowym trybie eksploracji planet i księżyców obowiązuje oznaczenie: **Widok poglądowy — rozmiary i odległości nie zachowują wspólnej skali.** Osobne tryby porównania średnic, podróży światła i mapy sąsiedztwa mają własne, opisane niżej reguły skali.

Orbity ośmiu planet Układu Słonecznego są elipsami opartymi na mimośrodach i długościach peryhelium NASA/JPL dla J2000. Równanie Keplera wyznacza ruch szybszy przy peryhelium i wolniejszy przy aphelium. Egzoplanety zachowują kołowe przybliżenie. Pomijamy nachylenia orbit, precesję i wzajemne oddziaływania grawitacyjne; dla Ziemi stosujemy przybliżenie parametrami barycentrum Ziemia–Księżyc. Szczegóły: [ORBITS.md](ORBITS.md). Zachowujemy kolejność planet oraz względne okresy obiegu. Promienie wizualne, odległości wizualne i początkowe fazy orbitalne są umowne. Nie korzystamy z efemeryd: pozycje **nie są aktualnymi pozycjami astronomicznymi**, a licznik pokazuje czas od początku symulacji poglądowej.

## Sześć księżyców

Katalog obejmuje Księżyc Ziemi, Io, Europę, Ganimedesa, Kallisto i Tytana. Średnice są podwojonymi średnimi promieniami objętościowymi z [NASA/JPL — Planetary Satellite Physical Parameters](https://ssd.jpl.nasa.gov/sats/phys_par/), zaokrąglonymi do kilometra. Półosie wielkie orbit i okresy obiegu pochodzą z tabel NSSDCA: [Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html), [Jovian Satellite Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html) i [Saturnian Satellite Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html).

Odległość księżyca jest mierzona od **środka planety macierzystej**, nie od Słońca ani od powierzchni planety. Okres obiegu odnosi się do tej planety; dla ziemskiego Księżyca jest to miesiąc gwiazdowy, nie cykl faz. W eksploracji stosujemy kołowe orbity poglądowe, rzeczywiste względne okresy i obrót synchroniczny. To wybór sześciu obiektów, nie pełny katalog satelitów. Tabele, odnośniki do opisów i wszystkie uproszczenia: [MOONS.md](MOONS.md).

## Porównanie średnic i podróż światła

**Porównanie rozmiarów** zachowuje jeden przelicznik kilometrów na jednostki sceny dla obu brył. Mały obiekt nie jest dodatkowo powiększany. Korzysta z tych samych źródłowych średnic planet, księżyców i egzoplanet co katalog; promienie egzoplanet pozostają oszacowaniami z niepewnościami opisanymi w [EXOPLANETS.md](EXOPLANETS.md). Porównujemy średnice brył, dlatego **pierścienie Saturna są w tym trybie pominięte**. Zasada i geometria kadrowania: [COMPARISON.md](COMPARISON.md).

**Podróż światła** używa dokładnej prędkości światła w próżni **299 792,458 km/s** z [NASA/JPL — Astrodynamic Parameters](https://ssd.jpl.nasa.gov/astro_par.html). Czas to odległość podzielona przez tę prędkość. Odległości od Słońca pochodzą z lokalnego katalogu planet i reprezentują wartości średnie/półosie wielkie; nie są chwilowymi odległościami z efemeryd. W tym liniowym diagramie dystanse zachowują wspólną skalę, a bryły są powiększone. Tempo odtwarzania impulsu jest podane oddzielnie od fizycznego czasu podróży. Wzory i jednostki: [DISCOVERY-DATA.md](DISCOVERY-DATA.md).

## Egzoplanety i położenia układów w Galaktyce

Dane TRAPPIST-1, Kepler-90 i TOI-700 stanowią lokalną migawkę NASA Exoplanet Archive z **29 października 2026 r.** Kierunki ICRS (`ra`, `dec`) i dystanse (`sy_dist`) przeliczamy zgodnie z macierzą opisaną w [dokumentacji ESA Gaia EDR3, równanie 4.62](https://gea.esac.esa.int/archive/documentation/GEDR3/Data_processing/chap_cu3ast/sec_cu3ast_intro/ssec_cu3ast_intro_tansforms.html). Jest to konwencja Gaia/Hipparcos; ESA nie określa jej jako precyzyjnej transformacji ICRS zatwierdzonej przez IAU.

Te same kierunki i dystanse wyznaczają markery układów w widoku całej Drogi Mlecznej i mapie sąsiedztwa Słońca. Mapa lokalna zachowuje jedną skalę odległości; rozmiary markerów są umowne, a etykiety mogą być odsunięte z linią prowadzącą do rzeczywistego położenia. Dostępne zakresy obejmują 100 lub 3000 lat świetlnych. **To wybór układów dostępnych w Orbicie, nie kompletny katalog pobliskich gwiazd**: puste miejsce nie oznacza braku innych gwiazd. Nie propagujemy ruchów własnych ani pozycji do bieżącej daty. Tło ramion Galaktyki jest proceduralnym schematem, nie katalogiem pomiarowym pojedynczych gwiazd.

Źródła pomiarów, niepewności i zapytanie archiwalne: [EXOPLANETS.md](EXOPLANETS.md). Orientacja osi, transformacja oraz ograniczenia mapy: [DISCOVERY-DATA.md](DISCOVERY-DATA.md).

## Fazy Księżyca i zaćmienia

Scenariusze opierają się na [NASA — Moon Phases](https://science.nasa.gov/moon/moon-phases/) oraz [NASA — Eclipses and the Moon](https://science.nasa.gov/moon/eclipses/). Użytkownik zmienia ustawienie obiektów; nie jest to kalendarz faz ani prognoza dat, czasu trwania czy miejsca widoczności zaćmień. Widoczna część oświetlonej tarczy jest obliczana z geometrii sfery i równoległego światła. Nie należy jej mylić z procentem oświetlonej powierzchni całego globu.

Model faz uwzględnia nachylenie orbity około 5,14°. Scenariusze zaćmień celowo ustawiają węzły w kierunku Słońca, aby pokazać wymagane wyrównanie. Odległość Ziemia–Księżyc i stożki cienia są umowne dla czytelności; stożki i ich przecięcia ze sferami stanowią **ilustrację dydaktyczną**. Zachowany jest stosunek średnic Księżyca i Ziemi. Tarcza fazy w panelu pokazuje geometrię przed dodatkowym pociemnieniem podczas zaćmienia Księżyca. Dokładny opis założeń: [DISCOVERY-DATA.md](DISCOVERY-DATA.md).

## Inspiracje interakcji

Obejrzane w przeglądarce: [NASA Eyes](https://science.nasa.gov/eyes/), [Solar System Scope](https://www.solarsystemscope.com/) oraz [If the Moon Were Only 1 Pixel — Josh Worth](https://www.joshworth.com/dev/pixelspace/pixelspace_solarsystem.html). Inspiracją są eksploracja obiektów, płynne podróże i wyraźne komunikowanie skali. Orbita ma własną kompozycję i treści; nie skopiowano interfejsów, kodu ani zasobów tych stron.

Pochodzenie plików graficznych i ich warunki użycia dokumentujemy oddzielnie przy zasobach. Same strony inspiracji nie stanowią zezwolenia na kopiowanie ich tekstur.
