# Dane, pochodzenie i uproszczenia

Dane sprawdzono w źródłach NASA 28 października 2026 r. Zbiór aplikacji znajduje się w `src/data/bodies.ts`. Każdy obiekt ma adres opisu NASA (`source`) oraz źródła liczbowe (`dataSources`). Teksty po polsku napisano na potrzeby Orbity na podstawie tych źródeł.

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

**Widok poglądowy — rozmiary i odległości nie zachowują wspólnej skali.**

Orbity ośmiu planet Układu Słonecznego są elipsami opartymi na mimośrodach i długościach peryhelium NASA/JPL dla J2000. Równanie Keplera wyznacza ruch szybszy przy peryhelium i wolniejszy przy aphelium. Egzoplanety zachowują kołowe przybliżenie. Pomijamy nachylenia orbit, precesję i wzajemne oddziaływania grawitacyjne; dla Ziemi stosujemy przybliżenie parametrami barycentrum Ziemia–Księżyc. Szczegóły: [ORBITS.md](ORBITS.md). Zachowujemy kolejność planet oraz względne okresy obiegu. Promienie wizualne, odległości wizualne i początkowe fazy orbitalne są umowne. Nie korzystamy z efemeryd: pozycje **nie są aktualnymi pozycjami astronomicznymi**, a licznik pokazuje czas od początku symulacji poglądowej.

## Inspiracje interakcji

Obejrzane w przeglądarce: [NASA Eyes](https://science.nasa.gov/eyes/), [Solar System Scope](https://www.solarsystemscope.com/) oraz [If the Moon Were Only 1 Pixel — Josh Worth](https://www.joshworth.com/dev/pixelspace/pixelspace_solarsystem.html). Inspiracją są eksploracja obiektów, płynne podróże i wyraźne komunikowanie skali. Orbita ma własną kompozycję i treści; nie skopiowano interfejsów, kodu ani zasobów tych stron.

Pochodzenie plików graficznych i ich warunki użycia dokumentujemy oddzielnie przy zasobach. Same strony inspiracji nie stanowią zezwolenia na kopiowanie ich tekstur.
