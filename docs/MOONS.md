# Sześć księżyców: dane i model

Źródła NASA sprawdzono **30 października 2026 r.** Moduł `src/data/moons.ts` zawiera sześć wybranych obiektów; nie jest pełnym katalogiem księżyców Ziemi, Jowisza i Saturna.

## Pomiary

Średnica to dwukrotność **średniego promienia objętościowego** z [NASA/JPL — Planetary Satellite Physical Parameters](https://ssd.jpl.nasa.gov/sats/phys_par/), zaokrąglona do kilometra. W poniższej tabeli zachowano także źródłowy promień, aby przeliczenie było jawne.

| Księżyc | Planeta macierzysta | Promień [km] | Średnica w aplikacji [km] | Odległość orbitalna od środka planety [km] | Okres obiegu [dni ziemskie] |
| --- | --- | ---: | ---: | ---: | ---: |
| Księżyc | Ziemia | 1737,4 | 3475 | 384 400 | 27,3217 |
| Io | Jowisz | 1821,49 | 3643 | 421 800 | 1,769138 |
| Europa | Jowisz | 1560,80 | 3122 | 671 100 | 3,551181 |
| Ganimedes | Jowisz | 2631,20 | 5262 | 1 070 400 | 7,154553 |
| Kallisto | Jowisz | 2410,30 | 4821 | 1 882 700 | 16,689017 |
| Tytan | Saturn | 2574,76 | 5150 | 1 221 870 | 15,945421 |

Odległości i okresy pochodzą z tabel NASA NSSDCA:

- [Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html).
- [Jovian Satellite Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html).
- [Saturnian Satellite Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/saturniansatfact.html).

Podane odległości są półosiami wielkimi orbit, stosowanymi tutaj jako przybliżenie średniej odległości od **środka planety**, nie wysokością nad jej powierzchnią ani aktualną separacją. Dokładniejsze i nowsze rozwiązania efemerydalne mogą podawać nieco inne wartości. Nie przedstawiamy precyzji zapisu jako dokładności modelu.

`orbitalPeriodDays` oznacza obieg **planety macierzystej**, nie Słońca. Dla ziemskiego Księżyca używamy okresu gwiazdowego 27,3217 dnia, nie miesiąca synodycznego około 29,53 dnia między powtarzającymi się fazami widzianymi z Ziemi. `distanceMillionKm` jest celowo `null`; poprawną odległość przechowuje `distanceFromParentKm`.

## Opisy i obrót synchroniczny

Teksty EN/PL opracowano na podstawie:

- [NASA — Moon Facts](https://science.nasa.gov/moon/facts/): kratery, dawne wylewy lawy, obrót synchroniczny i oświetlanie obu stron Księżyca.
- [NASA — Io Facts](https://science.nasa.gov/jupiter/jupiter-moons/io/facts/): aktywność wulkaniczna, ogrzewanie pływowe i odkształcenia powierzchni do około 100 m.
- [NASA — Europa Facts](https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/): lodowa powierzchnia i mocne dowody na ocean pod lodem. Nie oznacza to potwierdzenia życia.
- [NASA — Ganymede Facts](https://science.nasa.gov/jupiter/jupiter-moons/ganymede/facts/): największy księżyc, różne rodzaje terenu i własne wewnętrzne pole magnetyczne.
- [NASA — Callisto Facts](https://science.nasa.gov/jupiter/jupiter-moons/callisto/facts/): stara, silnie pokryta kraterami powierzchnia i rozmiary zbliżone do Merkurego.
- [NASA — Titan Facts](https://science.nasa.gov/saturn/moons/titan/facts/): gęsta atmosfera oraz ciekły metan i etan na powierzchni.

NASA opisuje wszystkie te księżyce jako obracające się synchronicznie względem ich planet. Dlatego `rotationPeriodDays = orbitalPeriodDays` z dokładnością do przyjętego zaokrąglenia; nie jest to zmyślona prędkość dekoracyjna. W renderowaniu ten sam bok powinien być zwrócony ku planecie, więc ogólna wizualnie spowolniona animacja obrotu planet nie wystarczy do odtworzenia tej własności.

## Przybliżenie wizualne i API

Księżyce mają **kołowe, współpłaszczyznowe orbity poglądowe** (`eccentricity = 0`). Ich rzeczywiste orbity mają niezerowe mimośrody i zmienne orientacje; nie modelujemy libracji, precesji, nachyleń, wzajemnych perturbacji ani zaćmień. Zachowujemy rzeczywiste względne okresy obiegu. Nie dopasowujemy umownych faz początkowych do dat ani obserwacji.

`orbitRadius` opisuje odległość wizualną **od planety macierzystej** w jednostkach sceny. Pozycję lokalną należy dodać do bieżącej pozycji rodzica; bez tego księżyc obiegałby błędnie Słońce. Promienie i odległości są dobrane dla czytelnego wyboru, bez wspólnej skali z planetami. Orbita Tytana znajduje się w modelu poza pierścieniami Saturna.

- `getMoons(language)` zwraca sześć niezależnych obiektów `Moon`, w kolejności: Księżyc, Io, Europa, Ganimedes, Kallisto, Tytan.
- `getMoon(id, language)` zwraca wybrany księżyc lub `undefined` dla nieznanego identyfikatora.
- `moonParentById` pozwala rozpoznać rodzica, również bez tworzenia tekstów w wybranym języku.

Każdy obiekt ma odnośnik do opisu NASA i tablicę źródeł danych liczbowych. Barwy służą rozpoznawaniu obiektów; nie są deklaracją fotometrycznej zgodności z obserwacją.
