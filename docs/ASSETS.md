# Zasoby graficzne Orbity

Wszystkie zasoby są przechowywane lokalnie w `public/textures`. Aplikacja nie pobiera map z zewnętrznych serwerów. Stan źródeł i zasad użycia sprawdzono 28 października 2026.

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
