# Zasoby graficzne Orbity

Mapy planet są przechowywane lokalnie w `public/textures`, a fonty w `public/fonts`. Aplikacja nie pobiera tekstur ani shaderów z zewnętrznych serwerów lub CDN. Stan źródeł bitmap i zasad użycia sprawdzono 28 października 2026 r.; poniższy opis własnych shaderów i dodatkowych trybów uzupełniono 30 października.

## Ziemia i chmury — NASA Blue Marble (2002)

- `earth-low.webp` (256 × 128), `earth.webp` (1024 × 512), `earth-high.webp` (2048 × 1024): mapa powierzchni, koloru oceanów i lodu; przeskalowana i przekodowana bez retuszu.
- Oryginał: <https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.png>.
- `earth-clouds-low.webp` (256 × 128), `earth-clouds.webp` (1024 × 512): jasność chmur, do zastosowania jako osobna mapa przezroczystości (`alphaMap`, bez przestrzeni sRGB).
- Oryginał: <https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg>.
- Autorstwo: NASA Goddard Space Flight Center. Obrazy: Reto Stöckli (powierzchnia lądów, płytkie wody i chmury); Robert Simmon (kolor oceanów i kompozycja). Dane MODIS i podmioty współpracujące wymienione w publikacji NASA.
- Opis i atrybucja: [The Blue Marble (2002): True-color global imagery at 1km resolution](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/).
- Warunki: [NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) oraz [NASA Earth Science FAQ](https://science.nasa.gov/earth/faq/). NASA udostępnia te materiały do ponownego użycia edukacyjnego i informacyjnego; materiały NASA co do zasady nie podlegają ochronie autorskiej w USA. Nie jest to licencja Creative Commons. Należy zachować atrybucję i nie sugerować poparcia NASA. Wymieniona publikacja udostępnia obrazy do swobodnego wykorzystania przez edukatorów, naukowców, muzea i odbiorców publicznych; nie wskazuje odrębnego zastrzeżenia praw osoby trzeciej dla wykorzystanych map.

To historyczna mozaika satelitarna, a nie aktualna pogoda. Osobny obrót chmur jest efektem poglądowym. Orbita ani jej wygenerowane treści nie są zatwierdzone przez NASA; odsyłacze służą wskazaniu materiału źródłowego.

## Pozostałe mapy — oryginalne tekstury proceduralne

`mercury`, `venus`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`, `sun`: dla każdej mapy dostępne są `-low.webp` (256 × 128) i `.webp` (1024 × 512). `saturn-ring.png` (1024 × 16, RGBA) zawiera radialną zmienność gęstości pierścieni; współrzędna U powinna oznaczać promień od wewnętrznej do zewnętrznej krawędzi.

Mapy stworzone dla tego projektu za pomocą deterministycznego skryptu `scripts/generate-textures.py` (ziarno `20261028`), bez zapożyczonych obrazów. Wykorzystują szum wieloskalowy, pasma zależne od szerokości geograficznej, schematyczne kratery i plamę Jowisza. Można je wykorzystywać i modyfikować w ramach tego projektu. Autor projektu udostępnia te własne tekstury na warunkach CC0 1.0: <https://creativecommons.org/publicdomain/zero/1.0/>. To interpretacje wizualne, nie naukowe mapy powierzchni, aktualne układy chmur ani fotografie.

## Odtworzenie

Wymagane wyłącznie podczas generowania: Python 3, Pillow i NumPy. Nie są to zależności aplikacji.

```sh
python3 -m venv /tmp/orbita-textures-env
/tmp/orbita-textures-env/bin/pip install pillow numpy
/tmp/orbita-textures-env/bin/python scripts/generate-textures.py
```

Skrypt pobiera dwa oryginały NASA do katalogu tymczasowego systemu, po czym generuje pliki WebP. Uruchomienie aplikacji nie wymaga Pythona ani dostępu do NASA. Mapy kolorów należy oznaczyć w Three.js jako sRGB, mapę alfa chmur pozostawić w `NoColorSpace`. Wszystkie kolory są pozbawione dodatkowego oświetlenia kierunkowego.

Cały katalog tekstur zajmuje 555 454 bajty (około 555 kB dziesiętnych). Warianty niskiej rozdzielczości, łącznie z chmurami, zajmują około 28 kB. Dokładniejsze mapy należy wczytywać dopiero po pierwszej użytecznej scenie.

## Lokalne fonty

DM Sans i Manrope: pliki zmienne TTF z oficjalnego repozytorium Google Fonts,
https://github.com/google/fonts/tree/main/ofl/dmsans oraz
https://github.com/google/fonts/tree/main/ofl/manrope. Licencja SIL Open Font License 1.1;
pełne teksty w `public/fonts/*-OFL.txt`. Fonty są serwowane lokalnie, bez Google Fonts API.

## Obraz podglądu linku

`public/og-image.png` (1200×630) to zrzut własnej aplikacji Orbita w angielskiej
wersji, przedstawiający proceduralną Drogę Mleczną i znacznik naszego Układu
Słonecznego. Używa lokalnych fontów i oryginalnej chmury punktów; nie pobiera
cudzych ilustracji ani katalogu gwiazd. Służy jako obraz Open Graph / Twitter.
Regeneracja: uruchom produkcyjny podgląd na porcie 4174, a następnie
`ORBITA_SOCIAL_MODE=galaxy node scripts/capture-social-preview.mjs`. Pominięcie
zmiennej generuje wariant z planetami.

## Powierzchnie egzoplanet

`src/scene/ExoplanetSurface.tsx`: oryginalny shader GLSL autora projektu,
proceduralne minerały, kratery i pasy chmur. Brak zewnętrznych obrazów i dodatkowego
transferu tekstur. Palety i relief są artystyczną interpretacją; nie stanowią
pomiarów powierzchni lub atmosfer. Parametry fizyczne w osobnej strukturze danych
pochodzą z NASA Exoplanet Archive, z odnośnikami opisanymi w EXOPLANETS.md.

## Powierzchnie księżyców

`src/scene/MoonSurface.tsx` zawiera oryginalny shader GLSL napisany dla Orbity. Deterministyczny szum, relief i schematyczne kratery tworzą rozpoznawalne interpretacje Księżyca, Io, Europy, Ganimedesa, Kallisto i Tytana. Palety nawiązują do opisów i wyglądu obiektów: siarkowe barwy Io, jasny lód i szczeliny Europy, starszy teren kraterowy oraz nieprzezroczysta ochrowa atmosfera Tytana.

To **interpretacje artystyczne**, nie fotografie, mapy obserwacyjne ani rekonstrukcje konkretnych kraterów i struktur. Nie użyto obrazów pobranych z NASA, innych atlasów ani wygenerowanych usługą obrazową. Shader nie wymaga dodatkowego transferu tekstur. Stanowi własny kod źródłowy aplikacji, objęty deklarowaną licencją kodu projektu (ISC, `package.json`); odrębna deklaracja CC0 wyżej dotyczy własnych bitmap proceduralnych. Dane fizyczne i źródła NASA są opisane w [MOONS.md](MOONS.md).

## Grafika dodatkowych trybów odkrywania

- **Porównanie średnic** ponownie wykorzystuje lokalne mapy planet, oryginalne shadery księżyców i egzoplanet oraz geometrię sfer. Nie dodaje nowych zdjęć. Dwie bryły zachowują wspólną skalę średnic; pierścienie Saturna są świadomie pominięte w tym trybie.
- **Podróż światła** używa własnej geometrii diagramu i impulsu oraz już dostępnych materiałów obiektów. Rysunek nie jest zdjęciem ani nagraniem ruchu światła. Wspólna skala odległości i powiększenie brył są opisane w interfejsie.
- **Sąsiedztwo Słońca i markery układów w Galaktyce** powstają z geometrii, punktów i etykiet HTML. Ich położenia pochodzą z katalogowych kierunków i dystansów, po transformacji ESA Gaia; nie dodano rastrowej mapy gwiazd. Powiększone markery i przesunięte etykiety służą wyborowi obiektów. Podkład ramion Galaktyki pozostaje własną, proceduralną chmurą punktów, a nie kompletnym katalogiem gwiazd.
- **Fazy Księżyca i zaćmienia** wykorzystują istniejącą mapę `earth-low.webp`, shader `MoonSurface`, własną tarczę SVG oraz oryginalny shader analitycznego zacienienia w `MoonPhases.tsx`. Półprzezroczyste stożki są objaśniającym rysunkiem cienia; ich widoczność w przestrzeni i proporcje są umowne. Nie zapożyczono ilustracji zaćmień ani kalendarzy.

Żaden z tych trybów nie dodaje pobieranych podczas działania bitmap, katalogów lub zewnętrznych bibliotek graficznych. Źródła liczbowe i rozróżnienie danych od umownej prezentacji: [SOURCES.md](SOURCES.md) oraz [DISCOVERY-DATA.md](DISCOVERY-DATA.md).
