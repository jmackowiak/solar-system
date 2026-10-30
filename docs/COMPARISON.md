# Porównanie rzeczywistych rozmiarów

`src/lib/comparison.ts` udostępnia czystą funkcję:

```ts
comparisonLayout(leftDiameterKm, rightDiameterKm)
// { leftRadius, rightRadius, leftX, rightX, width, height, ratio }
```

Obie dodatnie, skończone średnice muszą mieć tę samą jednostkę, w aplikacji kilometry. Niepoprawna wartość powoduje `RangeError`. Funkcja nie zmienia danych astronomicznych i nie korzysta z sieci ani stanu Reacta.

Promień większej kuli wynosi **3,5 jednostki sceny**. Drugi promień wynika wyłącznie ze stosunku średnic. Nie stosujemy minimalnego promienia, powiększania małego obiektu ani niezależnej skali dla każdej strony. Bardzo mały księżyc przy olbrzymie może być prawie niewidoczny — to prawidłowa konsekwencja wspólnej skali. Do porównania trzeba przekazać `diameterKm`, nie `displayRadius` z widoku eksploracyjnego.

Środki kul leżą na tej samej wysokości `y = 0`. Odstęp między ich krawędziami wynosi 0,8 jednostki. Układ jest wycentrowany według całego obrysu, a nie według średniej pozycji środków:

```text
leftX  = −0,4 − rightRadius
rightX =  0,4 + leftRadius
width  = 2(leftRadius + rightRadius) + 0,8
height = 7
ratio  = rightDiameterKm / leftDiameterKm
```

`width` i `height` opisują ciasny obrys dwóch kul. Kamera i interfejs powinny dodać margines kadrowania. Model porównuje średnice brył, bez pierścieni, koron, atmosferycznej poświaty i odległości orbitalnych. Matematyka wspólnej skali nie nadaje danym większej dokładności niż mają źródłowe średnice; w szczególności średnice egzoplanet są oszacowaniami z promieni katalogowych.

Dzielenie przez większą średnicę następuje przed mnożeniem przez 3,5, dzięki czemu same promienie sceny nie przepełniają się dla bardzo dużych wejść. Nadal obowiązują ograniczenia typu JavaScript `number`: skrajny iloraz poza jego zakresem może dać zerowy promień lub nieskończony `ratio`. Zakresy astronomicznych danych dostarczanych przez aplikację pozostają daleko od tych granic.

Testy sprawdzają zachowanie rzeczywistych proporcji, brak minimalnego rozmiaru, odstęp między krawędziami, wycentrowanie obrysu, zamianę stron, wartości skrajne i odrzucanie błędnych danych.
