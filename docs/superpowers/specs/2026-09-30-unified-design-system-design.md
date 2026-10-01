# Jednolity system wizualny i dwa tryby strony

Data: 2026-09-30. Status: zatwierdzony przez Pawła w rozmowie. Dotyczy: `index.html`, `css/tokens.css`, `css/style.css`, `js/main.js`, `js/design-system.js`.

## Cel

Strona ma dziś niespójny język wizualny (pomiar computed styles w Chrome, 1440px):

- H3 ma cztery różne wykonania: Plex 18/600 zielony `#3B5D45` (kontrast 2.5:1), Plex 18/600 mosiądz, Bodoni 17/500 jasny, Plex 17/600 jasny. H3 „Formularz kontaktowy” używa rozmiaru domyślnego przeglądarki (18.72px).
- H2 ma dwa rozmiary (`1.875rem` w sekcjach, `2.875rem` w rezerwacji).
- Tekst pomocniczy ma pięć rozmiarów (0.875, 0.9375, 0.95, 1, 1.125rem).
- Jasny motyw: `--text-muted` ma kontrast 2.8–3.4:1, a mosiądz jako tekst 3.76:1 na powierzchni (wymagane 4.5:1). Ciemny motyw: `--text-muted` na `--surface` 4.17:1.
- Uwaga metodyczna: pierwszy pomiar headless zrobiono na wąskim oknie, więc rozmiary z `clamp()` i media queries (np. H1 „36px”) były mobilne. Wartości z CSS i audyt iframe o zadanej szerokości są źródłem prawdy.
- Małe etykiety wersalikami w trzech sekcjach, w stopce i w intro.

Cel: jeden system (typografia, kolor, odstępy) i dwa świadome tryby: **telefon = tryb kryzysowy**, **desktop = tryb elegancki**.

## Zasady (decyzje)

### Kolor
- Nagłówki zawsze w `--text`.
- Mosiądz (`--accent-brass`) tylko dla elementów klikalnych: przyciski, linki, focus.
- Zieleń znika całkowicie (tekst, obramowania, kropka dostępności, tint w hero). Token `--accent-green` usunięty. Kropka dostępności przy „Pomoc 24/7” używa mosiądzu.
- Bez bocznych pasków akcentowych (`.form-warning` dostaje pełną ramkę).
- Nowe wartości (policzone): ciemny `--text-muted` `#A39A86` (≥5.39:1 na wszystkich tłach); jasny `--text-muted` `#675E4C` (≥5.00:1), jasny `--accent-brass` `#75592F` (≥5.09:1), jasny `--accent-brass-hover` `#5E4727`.
- Czerwień (`--accent-alert`, `--intro-red`) wyłącznie dla Pomocy 24/7, poświaty „syreny” i intro.
- `--text-muted` rozjaśniony tak, by miał ≥4.5:1 na `--background`, `--surface`, `--background-deep` w obu motywach (wartość liczona, nie szacowana).

### Typografia
- Bodoni Moda: H1 i H2, plus dwa świadome wyjątki wyświetlne: wordmark w nawigacji (`.site-nav__logo`) i duży numer telefonu (`.rezerwacja-tel`). Nazwisko na karcie intro też Bodoni (to wielkość H2). Plex Sans: wszystko inne, w tym akapit wstępny bio. Boldonse usunięty (intro nie używa już rotatora), więc znika też z linku Google Fonts.
- Rozmiary jako tokeny o wartościach w `rem`, zmieniane media queries w `tokens.css` (panel design-systemu edytuje je jako zwykłe `rem`; nadpisanie dotyczy wtedy wszystkich szerokości).
- Skala: H1 (największy na stronie) > H2 (jeden rozmiar w każdej sekcji, także rezerwacja) > H3/H4 (Plex 600, jeden rozmiar na poziom, bez wersalików) > tekst 16px (lh 1.6) > lead 18px > drobny 14px. Znikają 15 i 15.2px.
- Etykiety wersalikami („Adwokat”, „Rezerwacja”, „Kancelaria Adwokacka · Adwokat karnista”) usuwane. Wersaliki zostają na przyciskach i w intro.
- Numeracja 01/02/03 w „Sprawie pilnej” zostaje (to realna sekwencja).
- Rozmiary w tokenach (`clamp()`), wspólne reguły nagłówków zamiast rozsianych.

### Odstępy i tryby
- Tokeny odstępów: ciaśniej na telefonie, wyraźnie luźniej na desktopie.
- Telefon: numer zawsze o jeden ruch, duże cele dotyku (≥44px), brak animacji opóźniających dojście do przycisku.
- Desktop: spokojne pojawianie się tekstu przy scrollu, tylko tam, gdzie wnosi sens. Treść widoczna domyślnie (animacja nie może jej ukrywać). Alternatywa dla `prefers-reduced-motion`.

### Intro
- Czerwona karta połączenia: zdjęcie, „Adw. Arkadiusz Górski”, „Adwokat karny · Warszawa”, status 24/7, duży okrągły przycisk „Zadzwoń” (`tel:+48792892457`).
- Pod spodem cicha linia: „Zatrzymanie? Przeszukanie? Wezwanie? Zanim cokolwiek powiesz.” (bez gigantycznego Boldonse).
- Mechanika wycofania bez zmian (`--intro-progress`, `.intro-stage`, `#page-content` w normalnym przepływie, bez GSAP).
- Desktop: ta sama karta, wyśrodkowana, spokojniej.

### Treść i dostępność
- H1 zawiera frazę „Adwokat karny w Warszawie” (SEO i rozpoznanie w wynikach wyszukiwania).
- Zdanie „To, kto odbiera telefon…” w „Modelu pracy” staje się `<h2>`, żeby po H1 nie było od razu H3.
- Przyciski „Pomoc 24/7” prowadzą do `tel:+48792892457` (plik `pomoc-w-zatrzymaniach.html` nie istnieje). Treści prawnej nie wymyślamy.
- Cel: WCAG 2.2 AA w obu motywach.

## Poza zakresem
Układ sekcji, poświata „syreny”, wiersze „Model pracy”, treści poza H1 i usuniętymi etykietami, Webflow (port po zatwierdzeniu wersji lokalnej).

## Weryfikacja
1. Ponowny pomiar computed styles (skrypt jak w audycie): oczekiwane 4 style nagłówków (H1–H4) i 4 rozmiary tekstu.
2. Kontrast policzony z realnych wartości dla obu motywów.
3. Zrzuty desktop i mobile w jasnym i ciemnym motywie: jedna seria poprawek plus jedna kontrolna.
4. Detektor Impeccable na zmienionych plikach.
5. Podbicie `?v=` w linkach do `css/` i `js/` oraz sprawdzenie, że panel `design-system.js` widzi nowe tokeny.

## Zmiana (później tego samego dnia): scena „karta kontaktu → hero”

Sekcja „Intro” powyżej (czerwona karta połączenia + rotator) jest **zastąpiona**. Nowe intro to ciemna karta kontaktu w stylu iPhone'a, która przy scrollu otwiera się w hero ze zdjęciem (opis w `CONTEXT.md`, wpis 0.2). Zielony `--call-green` (#1F9D55, biała ikona 3.49:1) jest jedynym miejscem użycia zieleni (przycisk Zadzwoń). Czerwone tokeny intro i pasek `.intro-floating-cta` usunięte.
