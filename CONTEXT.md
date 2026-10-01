# PROJEKT: Strona WWW — Kancelaria Adwokacka Arka Górskiego (prawo karne)

## 0.2 JEDNOLITY SYSTEM WIZUALNY + DWA TRYBY (2026-09-30)

Zastępuje plan stylowania sekcji z §5 (każda sekcja miała „kolor tożsamości”: zielony, mosiądz, biały). Spec: `docs/superpowers/specs/2026-09-30-unified-design-system-design.md`, plan: `docs/superpowers/plans/2026-09-30-unified-design-system.md`.

- **Kolor:** nagłówki zawsze `--text`. Mosiądz wyłącznie dla tego, co klikalne (przyciski, linki, focus, kropka przy „Pomoc 24/7”). Zieleń usunięta (token też). Czerwień tylko: Pomoc 24/7, „syrena”, intro, ramka ostrzeżenia formularza.
- **Typografia:** Bodoni Moda dla H1/H2 (+ wordmark nawigacji, numer telefonu w rezerwacji, nazwisko na karcie intro), IBM Plex Sans reszta. Boldonse usunięty. Skala w tokenach `--size-h1..h4`, `--size-lead/body/small`; w tekście tylko 14/16/18px. Bez etykiet „eyebrow”.
- **Dwa tryby:** telefon = tryb kryzysowy (ciaśniejsze odstępy; numer pod kciukiem w karcie i w nagłówku); desktop = elegancki (odstępy rosną w tokenach przy 768px i 1100px, odsłanianie treści przez `animation-timeline: view()` od 992px, bez JS, z `prefers-reduced-motion`).
- **Sekcja Adwokat (2026-09-30, wariant A „Gdy zadzwonisz, odbiorę ja.”):** nowe zdjęcie (studyjne, w fotelu) jest **tylko** w sekcji Adwokat (`img/arkadiusz-gorski-fotel.webp`); karta kontaktu i hero dalej używają `img/arkadiusz-gorski-portret.webp` (kadr twarzy: `CROP = { x: 450, y: 285, half: 150 }` w `main.js` i odpowiadające liczby w `.scene__avatar`). Treść pisana tylko z faktów ze strony (bezpośredni numer, brak sekretariatu, pisemne ustalenie wynagrodzenia, obszary praktyki); **życiorys (wykształcenie, doświadczenie) i języki to oznaczone `.bio-todo` wiersze do uzupełnienia przez Adwokata: nie wolno ich zmyślać.** Wiersz „Obszary praktyki” zamiast „Specjalizacja” (adwokat nie ma formalnego tytułu specjalisty; reklama adwokacka bez superlatyw, porównań i gwarancji wyniku: do potwierdzenia przez Adwokata).
- **Poświata „syreny” w „Sprawie pilnej” (przebudowana dwa razy 2026-09-30; zastępuje obracający się gradient conic opisany niżej w §0):** silnik w `js/siren.js` (CSS tylko definiuje dwa okrągłe światła, czerwone i niebieskie, `.siren-rim__light`, 560px, domyślnie `opacity: 0`). Światła siedzą **na obwodzie** sekcji (połowa wchodzi w kartę), zapalają się w nieregularnych seriach (1–5 błysków, losowe przerwy, w tym długie ciszy), **światła „odpowiadają” sobie** (po niebieskim zwykle zaraz czerwony, w ok. połowie przypadków w ciągu 0,7 s, często po drugiej stronie sekcji, czasem tuż obok), każdy błysk ma własną siłę, zasięg (płytko lub głęboko; ok. 12% to „mocne” błyski nawet w bezruchu) i rozciągnięcie wzdłuż krawędzi, którą oświetla; z każdą serią światło wędruje dalej **zgodnie z ruchem zegara po całym obwodzie** i lekko dryfuje w trakcie błysku. „Energia” zależy od prędkości scrolla: w bezruchu spokojnie i słabo (seria co ~4 s), przy przewijaniu mocniej, głębiej i częściej (co ~1 s). Między błyskami **dokładnie zero** (obwiednia dochodzi do zera, bez ogona). Odstęp między początkami błysków ≥ 360 ms (≤ 3 błyski/s, WCAG 2.3.1; test sprawdza to na 10 losowaniach: `SEED=n node scripts/test-siren.mjs`). Animowane są tylko `transform` i `opacity` dwóch elementów; pętla chodzi tylko gdy sekcja jest widoczna (`IntersectionObserver`, z fallbackiem), a przy `prefers-reduced-motion` nie uruchamia się wcale (brak poświaty). Siła ogólna: `--siren-peak` (1 ciemny, 0,6 jasny motyw). Stałe do strojenia na górze `siren.js` (`MIN_GAP`, `IDLE`, zakresy w `planBurst`). Czerwona kreska `border-top` sekcji usunięta. **Testy i lekcje:** `node scripts/test-siren.mjs` odpala prawdziwy `siren.js` na atrapie DOM z symulowanym zegarem (częstość, odstępy, limit błysków, pauzy, różnorodność zasięgu, wpływ scrolla); headless Chrome nie przyspiesza ciągłej pętli `requestAnimationFrame`, więc czasu animacji nie da się tam przewinąć: wygląd oglądamy na zrzutach ze stanem wymuszonym w `scripts/shot.html?lights=red:x,y,s,o,stretch;blue:...` (albo `lights=rest`). Test wyłapał realny błąd (błysk kasowany w pierwszej klatce).
- **Sekcja „Sześć obszarów…” jako karuzela (2026-10-01):** zamiast siatki 3×2 pozioma karuzela w stylu stron produktowych Apple: tor `.carousel__track` na całą szerokość ekranu (pierwsza karta równo z kontenerem, następna wystaje z prawej), natywny `scroll-snap` (dotyk, gładzik i klawiatura działają bez JS; tor jest fokusowalny). Karta = duże zdjęcie (`aspect-ratio: 6 / 5`, do 36rem szerokości) + H3 + zdanie + **zakres zawsze wypisany**, jako zwykłe kropki (`list-style: disc`), bez rozwijanego „Zakres”, bez numerów na zdjęciach i bez martwych linków „Zobacz zakres”. Pod spodem: kropki (lewo) i strzałki (prawo) wyrównane do kontenera. `js/carousel.js` tylko spina strzałki i kropki ze stanem toru (ostatnia karta liczy się jako bieżąca na końcu toru, strzałki się wyłączają na krańcach); test: `node scripts/test-carousel.mjs`. **Zdjęcia są (2026-10-01):** sześć ujęć wygenerowanych w ciepłej, brązowej palecie (espresso, mosiądz, kremowy papier), pionowych 896×1200, w `img/obszar-*.webp` (`prawo-karne`, `karne-gospodarcze`, `criminal-compliance`, `aml`, `kary-administracyjne`, `nieuczciwa-konkurencja`). Zdjęcia są pionowe, ale okno w karcie jest poziome: `aspect-ratio: 4 / 3`, szerokość karty `min(84vw, 28rem)`, tak żeby zdjęcie, tytuł, opis, cztery punkty i kontrolki mieściły się w jednym ekranie (wersja z kadrem pionowym 3:4 była zbyt wysoka, opis wypadał poza viewport). Kadr dobrany **osobno dla każdego zdjęcia** przez `object-position` (inline na `<img>`, % ukrytej wysokości): korytarz 44% (drzwi i plama światła), karne gospodarcze 68% (lampa i akta), compliance 72% (lampa, papiery, dłoń), AML 55% (kolumny liczb), kary administracyjne 64% (długopis i pieczęć), nieuczciwa konkurencja 55% (oba kartony i szczelina między nimi). Pliki zostają pełnymi pionowymi oryginałami, więc zmianę kadru robi się jedną liczbą. Zdjęcia dekoracyjne (`alt=""`, `loading="lazy"`), wspólny ciepły grading z CSS (`.specjalizacje-card__media img`). Wymiana zdjęcia = podmiana pliku o tej samej nazwie. Prompty użyte do generowania: wspólny dopisek `warm palette: dark espresso brown, warm charcoal, aged brass and amber highlights, cream paper tones, soft warm tungsten light, gentle film grain, muted and earthy, no blue or teal cast, no pure black, no neon, editorial photography, shallow depth of field, no text, no logos, no people's faces, aspect ratio 6:5` plus opis ujęcia; negatywny: `blue, teal, cold light, neon, pure black, high contrast black and white, glossy plastic`. Uwaga: na zdjęciu AML generator narysował pseudo-liczby (nieczytelne, dekoracyjne).
- **Scena startowa (karta kontaktu → hero), zastępuje czerwone intro:** jedna sekcja `.scene#hero` (`position: sticky`, 220svh: 100svh sceny + 100svh ruchu + krótki „hold”). Karta jak z iPhone'a: okrągły kadr twarzy (głowa i ramiona), linia „ADWOKAT KARNY • WARSZAWA”, status „24/7 w sprawach zatrzymań i przeszukań”, „Arkadiusz Górski”, cztery przyciski (Wiadomość = `sms:`, **Zadzwoń = zielony `--call-green`**, Umów = `#rezerwacja`, Napisz = `#formularz`; pozostałe „szkło” z białą ikoną; ikony Phosphor, inline). Scroll → jedna zmienna `--p` (0..1) na `.scene` i `.site-nav` (`js/main.js`, jeden odczyt na klatkę); całą choreografię liczy CSS: przyciski znikają (p 0–0.25), tekst karty (0.04–0.26), koło rozszerza się w pełne zdjęcie przez `clip-path: inset(... round ...)` z jednoczesnym „zoom out” obrazu (0.05–0.8), hero i nawigacja wjeżdżają (0.55–0.85). Geometria kadru liczona w JS z pozycji avatara (`--top0..--z`) tylko przy zmianie układu. Zdjęcie: telefon = `cover`, ≥900px = `contain` po prawej w swoich proporcjach, ciemne tło i tekst po lewej; **po dostarczeniu szerokiego ujęcia podmienić `img/arkadiusz-gorski-portret.webp` i stałe `IMG_W/IMG_H/CROP` w `main.js` (oraz `896 / 1200` w `--photo-w`, `.scene__avatar`)**. Bez JS / `prefers-reduced-motion`: brak atrybutu `data-scene`, sekcja to dwa zwykłe bloki (karta, potem hero). Elementy niewidoczne nie łapią fokusa (`tabindex=-1`). Na telefonie hero zawsze jako jasny tekst na ciemnej przesłonie (także w jasnym motywie). Usunięte: rotator Boldonse, `--intro-red/black/progress`, pasek `.intro-floating-cta`, tło z `picsum.photos`.
- **SEO:** H1 „Adwokat karny w Warszawie. Obrona i reprezentacja pokrzywdzonych.”. Zdanie „To, kto odbiera telefon…” jest teraz `<h2>`.
- **Kontrast (policzony):** ciemny `--text-muted` `#A39A86`; jasny `--text-muted` `#675E4C`, `--accent-brass` `#75592F`, hover `#5E4727`.
- **„Pomoc 24/7”** prowadzi do `tel:+48792892457`: strony `pomoc-w-zatrzymaniach.html` nie ma (nie ma też `obszary-praktyki.html`, `blog.html`, `polityka-prywatnosci.html`; `urgent-cta-link` nadal wskazuje na pierwszą z nich).
- **Weryfikacja:** `node scripts/check-contrast.mjs` (kontrast z tokenów) i `node scripts/audit-styles.mjs` (computed styles przez iframe o zadanej szerokości; potrzebny serwer na :4173). Zrzuty: `scripts/shot.html?w=390&h=844&y=<scroll>&theme=dark`.
- **Lekcje pomiarowe:** headless Chrome nie schodzi poniżej ok. 500px szerokości okna, więc „zrzut 390px” to przycięty układ 500px (i pomiary `clamp()`/media queries są mobilne/desktopowe przypadkiem). Mierzymy więc w iframe o jawnej szerokości. Dodatkowo `html { scroll-behavior: smooth }` i `body { transition: color }` zafałszowują zrzuty i pomiary tuż po przewinięciu/zmianie motywu: pomocniki wyłączają przejścia i skaczą natychmiast.

## 0.1 EKRAN STARTOWY / INTRO (2026-09-24)

Nowy pełnoekranowy ekran otwierający (`.intro-screen`, przed `<header>` w DOM),
zbudowany na wzór loveandmoney.com i GSAP "pinned panels with overscroll":

- Pełnoekranowy, jaskrawoczerwony (`--intro-red: #E82503`), z gigantycznym,
  wyśrodkowanym nagłówkiem w foncie **Boldonse**, który cyklicznie "wpisuje
  się" (efekt maszyny do pisania przez `clip-path` + `steps()`) między
  słowami Zatrzymanie / Przeszukanie / Wezwanie — wspólny rozmiar fontu
  liczony w JS wg najdłuższego słowa, więc nigdy się nie zmienia.
- Pod spodem: większy subheader "Zanim cokolwiek powiesz." + czarny,
  ostrokątny przycisk `tel:` "Zadzwoń teraz".
- **Efekt "wycofania" — bez żadnej zewnętrznej biblioteki.** GSAP +
  ScrollTrigger zostały usunięte (patrz opis buga niżej). Mechanika:
  - `.intro-stage` — pusty blok o wysokości `100dvh`. To **cały** budżet
    scrolla na intro; nic poza nim nie jest rezerwowane.
  - `.intro-screen` — `position: fixed; inset: 0`, więc wisi nieruchomo i
    nie zajmuje miejsca w przepływie. Zanika i skaluje się w dół przez
    `opacity`/`transform` liczone z `--intro-progress`.
  - `#page-content` — **nigdy nie opuszcza normalnego przepływu**. Leży
    zaraz za `.intro-stage`, więc zwykły scroll sam wynosi go z dołu na
    intro (przykrywa je dzięki `z-index: 2` i własnemu tłu). Nie ma
    momentu przełączania `fixed`→`static`, więc nie ma czego zgubić.
  - Nawigacja zjeżdża z góry: `translateY(calc((var(--intro-progress) - 1)
    * 100%))`.
  - Wszystko sterowane jedną zmienną `--intro-progress` (= `scrollY /
    wysokość sceny`, clamp 0–1), ustawianą w `js/main.js` w handlerze
    scrolla dławionym przez `requestAnimationFrame`.
  - Bonus dla docelowego portu: bez GSAP całość jest znacznie łatwiejsza do
    przeniesienia na Webflow, gdzie Custom Code jest zablokowany planem.
- **Pasek telefoniczny** (`.intro-floating-cta`) — ⚠️ **ODSTAWIONY
  (2026-09-24)**: znacznik w `index.html` jest zakomentowany, bo w tej
  formie nie spełniał oczekiwań wizualnie. CSS i JS zostają nietknięte,
  wszyscy konsumenci czytają zmienne z fallbackiem, więc bez znacznika
  rezerwacja zwija się do zera sama (sprawdzone: `padding-bottom` = 0,
  stopka sięga dokładnie dolnej krawędzi). Powrót = odkomentowanie bloku.
  Opis zachowania poniżej zostaje na wypadek powrotu:
  - **Pojawia się na scroll**, dokładnie jak wcześniejsza „metka”: siedzi
    poza ekranem przez pierwsze 45% zakresu intro, wysuwa się między 45%
    a 80% (`--tab-reveal` liczone z `--intro-progress` w tym samym
    handlerze) i zostaje do końca wizyty.
  - **Nie zasłania treści**: JS mierzy jego wysokość do `--cta-bar-height`,
    a `#page-content` rezerwuje ją jako `padding-bottom` **od startu** —
    dzięki temu pasek wsuwa się w miejsce, które i tak było jego, i nic
    się nie przesuwa w momencie ujawnienia. Sprawdzone: na dole strony dół
    stopki styka się z górą paska co do piksela. `.theme-toggle` unosi się
    razem z nim (`bottom` mnożone przez `--tab-reveal`).
  - `.intro-stage` i `.intro-screen` zostają na pełnym viewporcie — w
    trakcie intro paska nie ma na ekranie, więc nie ma dla czego robić
    miejsca.
  - Bez `box-shadow` i z `z-index: 90`, czyli **pod** nawigacją (100):
    to trwały element interfejsu, nie overlay. Wersja z cieniem i
    `z-index: 150` została odrzucona.
- **Uwaga na testowanie**: to środowisko podglądu (Browser pane) samo
  resetuje `scrollY` do 0 między osobnymi wywołaniami narzędzia — testowanie
  scrolla wymaga `browser_batch` (scroll + screenshot w jednej sekwencji),
  inaczej wygląda na to, że nic się nie dzieje.
- Kolor tła: `--intro-red: #EA0F0B` (zmienione z pierwotnego #E82503).
- **Bug "podwójny scroll przez Hero" — prawdziwa przyczyna i naprawa
  (2026-09-24)**. Objaw zgłaszany przez klienta: po przewinięciu czerwonego
  ekranu strona "doładowuje się od nowa", zmienia się długość scrolla i
  trzeba jeszcze raz pokonać dystans zarezerwowany na intro.

  Przyczyna — arytmetyka GSAP-owego pinu, nie `sticky` ani nie flash:
  `pinSpacing: true` rezerwuje **własną wysokość intro + czas trwania pinu**,
  czyli 2 viewporty. Ale `#page-content` był zwalniany z `position: fixed` do
  normalnego przepływu już przy `scrollY = 1 viewport`, a jego naturalna
  pozycja w dokumencie to 2 viewporty. W momencie zwolnienia treść
  przeskakiwała więc **dokładnie o jeden viewport w dół** i ten sam dystans
  trzeba było przescrollować drugi raz.

  Naprawa: rezygnacja z pinu i z trzymania `#page-content` w `fixed`
  (mechanika opisana wyżej). Pomiary po zmianie: naturalna pozycja
  `#page-content` = dokładnie 1 viewport, `pcTop` schodzi liniowo
  `vh → 0 → wartości ujemne` bez nieciągłości na granicy, Hero siada na
  `nav-height` (93px), a `maxScroll` spadł z 8933 do 6242 px — zniknął
  dokładnie ten jeden zbędny viewport.

  - `.site-nav` jest osobną warstwą poza `#page-content`: `position: fixed;
    z-index: 100`. `#page-content` dostaje `padding-top: var(--nav-height)`
    (liczone z `siteNav.offsetHeight`, odświeżane po `resize` i
    `document.fonts.ready`), żeby Hero zaczynał się pod nawigacją.
  - Po zakończeniu przejścia JS ustawia `data-intro-done` → intro dostaje
    `visibility: hidden`, żeby nie zostawała żywa, pełnoekranowa warstwa
    `fixed` pod całą stroną.
  - Fallback: animacje są bramkowane atrybutem `data-intro="on"`, który JS
    ustawia tylko gdy nie ma `prefers-reduced-motion`. Bez JS / przy
    reduced-motion nawigacja jest po prostu widoczna, a intro
    nieprzezroczyste — zweryfikowane.

  **Lekcja metodologiczna**: dwie wcześniejsze "naprawy" tego zgłoszenia były
  chybione, bo diagnozowałem z wyglądu zrzutów ekranu zamiast z geometrii.
  Rozstrzygający pomiar jest banalny i trzeba go było zrobić od razu:
  *offset `#page-content` w dokumencie* vs *`scrollY`, przy którym kończy się
  przejście*. Różnica ≠ 0 to właśnie ten bug.
- **Cache w podglądzie**: Browser pane potrafi serwować stary `style.css`
  mimo zmiany na dysku (`curl` pokazywał już nową treść). Dlatego linki do
  `css/` i `js/` w `index.html` mają `?v=2` — przy kolejnych zmianach warto
  podbić ten numer.

## 0. AKTUALIZACJA (2026-09-23) — materiał od Arka i poszerzenie zakresu

Arek dostarczył własny roboczy plik z tekstami i strukturą
(`strona-glowna_7.html`, kierunek wizualny "Atrament i mosiądz"). Po jego
przeanalizowaniu i konsultacji z Pawłem ustalono zmiany, które **nadpisują**
niektóre wcześniejsze ustalenia poniżej:

- **Dane rzeczywiste**: Arkadiusz Górski, ul. Mokotowska 57 lok. 4, 00-542
  Warszawa, tel. +48 792 892 457, nr wpisu ADW/WAW/8947, Okręgowa Izba
  Adwokacka w Warszawie. Kancelaria dzieli adres z kancelarią GPLF (prawo
  nieruchomości) — wzmiankowana jako partner w stopce.
- **Zakres praktyki poszerzony** z samej obrony karnej do: obrony i
  reprezentacji pokrzywdzonych/oskarżycieli posiłkowych, prawa karnego
  gospodarczego, criminal compliance, AML, kar administracyjnych (UODO,
  UOKiK, KNF, GIIF, URE, UKE, PIP) i zwalczania nieuczciwej konkurencji
  (cywilne). Odbiorca strony to teraz też firmy/przedsiębiorcy, nie tylko
  osoby zatrzymane. Sekcja Specjalizacje ma **6 kart** (było 5), każda z
  listą punktów i linkiem „Zobacz zakres”.
- **Case Studies usunięte ze strony głównej**, zastąpione sekcją
  **Publikacje** (`#publikacje`) — profesjonalne artykuły eksperckie
  (inny rejestr językowy niż konsumencka „Strefa wiedzy”, którą zastąpiła).
- **Nowa sekcja „Sprawa pilna”** (`#sprawa-pilna`) — 3 kroki tłumaczące, co
  dzieje się po telefonie w sprawie zatrzymania/przeszukania. Ma własny
  akcent kolorystyczny `--accent-alert` (`#B5424C` dark / `#9A3540`
  light) — semantycznie uzasadniony (sprawy pilne), zdefiniowany w
  `css/tokens.css`, osobny od brass/green.
  - **Poświata „syreny” (2026-09-24, ref. linearity.io)**: czerwono-błękitny
    gradient **krąży wokół ramki** (nie pulsuje w miejscu — pulsowanie było
    pierwszą, odrzuconą wersją).
    Docelowy efekt to **inner shadow / tinta przy krawędziach** (klient:
    „jak w Mission Control na macOS”), a nie rysowane koliste plamy.
    Dwie warstwy (`.siren-rim` > `.siren-rim__spin`), bo maska **nie może**
    obracać się razem z kolorem:
    - `.siren-rim` — maska z czterech `linear-gradient`, po jednym na
      krawędź, sumowanych (wiele warstw maski domyślnie składa się przez
      `add`). Każda wygasza się do środka na stałym dystansie, więc
      rozświetlona obwódka ma równą grubość i trzyma się **prostych
      krawędzi** sekcji. Grubość siedzi w `--rim-x` / `--rim-y` na
      `.siren-rim` (obecnie `min(52px, 6%)` i `36px`) — wartości
      powtarzają się w ośmiu miejscach, więc stroi się je w jednym.
      Płytko i to jest celowe: po porównaniu z referencją (obejrzaną na
      żywo) pasmo tam sięga jakieś 5–8% szerokości, a środek jest
      praktycznie czarny. Kolejne odrzucone wersje: `22%` na stronę
      (podbarwiało pół sekcji, tekst na washu) i `11%`. Cap procentowy
      jest konieczny, bo na stałych pikselach pasma nachodzą na siebie
      na telefonie.
    - `.siren-rim__spin` — `conic-gradient` (`--accent-alert` +
      `--siren-blue`), kwadratowy i przewymiarowany (`width: 150%;
      aspect-ratio: 1`), żeby narożniki pokrywały sekcję przy każdym
      kącie. Kolor conic zależy **wyłącznie od kąta**, więc zwykły
      `transform: rotate` przesuwa mieszankę dookoła obwódki i zostaje na
      GPU. Animowanie samego gradientu (kąt przez `@property`)
      przemalowywałoby rozmytą warstwę w każdej klatce — świadomie nie.
      Niebieski dostaje **szerokie plateau** (95°–200°), a nie pojedynczy
      punkt, i został rozjaśniony (`#4E77B0` dark / `#5583C0` light) —
      przy poprzednim `#3E5C82` ginął na tle sekcji. Conic musi zaczynać
      i kończyć tym samym kolorem, inaczej na zawinięciu widać szew.
    - Tempo: 12 s na pełny obrót, `linear` (zmierzone 30°/s). 22 s było
      za wolne — ruch ledwo się rejestrował. Krycie `0.55`, żeby kolor
      wtapiał się w tło sekcji, a nie leżał na nim paskiem. Clip przez
      `overflow: hidden` na sekcji, statyczne przy
      `prefers-reduced-motion`.
    - Odrzucone po drodze: wersja pulsująca (oddech `opacity`/`scale`) oraz
      wersja conic + eliptyczna winieta — ta druga czytała się jako
      obracające się koło, nie jako obwódka.
- **Nowa sekcja „Adwokat”** (`#adwokat`) — bio na stronie głównej (portret,
  2 akapity, credentials: Izba/Numer wpisu/Języki). Realizuje punkt z
  pierwotnego briefu („Doświadczenie → link do sekcji O mnie”), którego
  wcześniej nie zbudowano. **Treść bio to jawnie oznaczone placeholdery**
  (`.bio-placeholder`) — życiorys zawodowy musi dostarczyć sam Adwokat,
  nie wolno go zmyślać.
- **Rezerwacja rozbudowana**: Calendesk zostaje jako główny mechanizm
  umawiania (obok, nie zamiast), ale doszły: duży numer telefonu, wzmianka
  o kontakcie przez Signal, adres, godziny pracy, oraz **formularz
  kontaktowy** z ostrzeżeniem o braku poufności e-maila/formularza
  (`.form-warning`) — formularz nie ma jeszcze backendu (`action="#"`,
  tak jak w pliku Arka).
- Nawigacja: Specjalizacje / Adwokat / Publikacje + `Pomoc 24/7` (osobny
  przycisk `.button-alert`, nie link tekstowy) + `Umów konsultację`.

Reszta tego dokumentu (punkty 1–7 poniżej) to **historia pierwotnych
ustaleń** — część już nieaktualna po powyższej aktualizacji (zwłaszcza
zakres praktyki w §3 i §6). Zostawione dla kontekstu procesu, ale przy
sprzeczności wygrywa ten punkt 0.

## 1. KONTEKST I BRIEF KLIENTA (pierwsza wiadomość)

- Strona typu "wizytówka" — bez wielu podstron, menu odsyła głównie do sekcji na jednej stronie głównej (scroll do sekcji).
- Zaplanowane 3 podstrony:
  1. **Doświadczenie** — de facto link/przycisk odsyłający do sekcji "O mnie" na stronie głównej (nie osobna, głęboka podstrona).
  2. **Zakres pomocy prawnej** — osobna podstrona z pełnym zakresem praktyki.
  3. **Blog** — klient chce mieć możliwość SAMODZIELNEGO publikowania tekstów, bez pośrednictwa developera.
- Wymagania platformy:
  - Bezpieczeństwo + zgodność z RODO.
  - W miarę możliwości hosting/serwery w UE.
  - Formularz kontaktowy.
  - Narzędzie do zapisów na spotkanie online, w wybranych przez klienta przedziałach godzin, **bez płatności z góry**.
  - Możliwość samodzielnej edycji treści (blog) — to był argument decydujący za **Webflow** (zamiast strony statycznej).
- Klient sam eksperymentował z Cloud oraz WebWave, żeby zwizualizować, jak strona ma wyglądać (materiały referencyjne, nie finalne).
- Materiały (treści) były w trakcie tworzenia w momencie briefu.

## 2. DECYZJE PLATFORMOWE (wynik ustaleń)

- **Wybrana platforma: Webflow** (zbudowana od zera, projekt nazwany **"KAG"**, krótka nazwa `kag-e62476`, brak jeszcze własnej domeny).
- Wcześniej istniał statyczny prototyp HTML z treścią placeholder, formularzem kontaktowym i makietą grafiku rezerwacji — Webflow go zastąpił.
- Podział pracy: Paweł buduje wireframe'y/sekcje w Webflow Designerze (built-in layouty), Claude odpowiada za stylowanie design-tokenami, architekturę i dodatkową logikę (CMS, formularze, booking).
- System rezerwacji: **Calendesk** (polski odpowiednik Calendly/Google Calendar) — embed bezpośrednio na stronie głównej, bez płatności z góry.
- Ograniczenie planu Webflow: **Site Settings → Custom Code jest zablokowany** na obecnym planie (404 przy zapisie). Skrypt do przełącznika light/dark theme trzeba było wstawić via HTML Embed w komponencie Navigation, co może powodować krótki "flash" złego theme przy pierwszym ładowaniu. Do rewizji, jeśli/gdy plan zostanie podniesiony — brak pilności.
- Gallery Scroll (sticky interaktywny karusel z sidebarem nawigacyjnym, synchronizacja obrazu z aktywnym linkiem) — stylowanie ukończone; synchronizacja przez scroll wymaga Custom Code (niedostępny), synchronizacja przez klik da się zrobić na Webflow Interactions (IX3) bez Custom Code.

## 3. STRUKTURA STRONY GŁÓWNEJ (ustalona)

```
Hero
↓
Model Pracy (3 karty: Bezpośredni kontakt / Pełna dyskrecja / Dostępność)
↓
Specjalizacje (Sticky Scroll, karty tekstowe)
↓
Case Studies / Scenariusze Procesowe (anonimowe scenariusze — NIE opinie klientów)
↓
Strefa Wiedzy (3 karty blogowe)
↓
Rezerwacja Kalendarza (CTA + embed Calendesk)
↓
Footer
```

Podstrony (osobne, poza sekcjami strony głównej):
- **O Kancelarii** — bio założyciela, rozszerzalne pod przyszły zespół.
- **Obszary Praktyki** — pełny zakres praktyki.
- **Pomoc w Zatrzymaniach 24/7** — mobile-first, kontakt awaryjny.
- **Kontakt** — adres, mapa, informacje o parkingu.

### Decyzja strategiczna: Case Studies zamiast opinii klientów
Ze względu na charakter prawa karnego i wrażliwość na anonimowość, zamiast testimoniali klientów użyto anonimowych scenariuszy procesowych, np.:
> "Zarzut działania na szkodę spółki → Umorzenie na etapie prokuratorskim"

Każdy case study ma zawierać krótką notę prawną o poufności.

## 4. DESIGN SYSTEM — TOKENY I STYLE

### Typografia
- Nagłówki: **Bodoni Moda** (serif) — finalna decyzja stylistyczna (wariant klasyczny).
- Body: **IBM Plex Sans**.
- *(Uwaga: w wcześniejszej notatce ogólnej wspomniany był też Newsreader jako serif — Bodoni Moda jest wersją finalną wg planu stylowania sekcji, warto zweryfikować w samym Webflow, który font jest aktualnie podłączony.)*

### Kolorystyka
- Motyw ciemny jako **domyślny**, z analogicznym motywem jasnym (light mode) do wyboru.
- Ciepłe, ciemne tło bazowe.
- Akcenty:
  - `--accent-green`: `#3B5D45` (leśna zieleń)
  - `--accent-brass`: `#B08D57` (mosiądz)
  - `--surface` — powierzchnia kart (jaśniejsza niż tło bazowe)
  - `--background` — tło bazowe
  - `--background-deep` — głębsze, ciemniejsze tło (sekcja Rezerwacja)

### Styl nagłówków / rozmiary
- Hero Heading: `2.875rem`
- Section Heading: H3-style (używany w Strefie Wiedzy)
- Body / testimonial-quote style: `1.125rem`, line-height `1.5`

## 5. PLAN STYLOWANIA — 5 SEKCJI (szczegółowo)

### Sekcja 1: MODEL PRACY
- Tożsamość: zielona (`--accent-green`)
- Akcent: górny border 3px zielony + gradient underlay
- Karty: grid 3-kolumnowy, brak slidera
- Styl kart: tło `--surface`, lewy border zielony (4px), min-height 300px
- Tekst: body + styl cytatu (Bodoni Moda, 1.125rem, lh 1.5)
- Spacing: py-80 (sekcja), gap 2rem (karty)
- Interakcje: hover → przyciemnienie lewego borderu + shadow lift

### Sekcja 2: SPECJALIZACJE
- Tożsamość: mosiądz (`--accent-brass`)
- Akcent: subtelny mosiądzowy underline/divider między kartami, nagłówki w kolorze brass
- Karty: 5 kart (slider LUB grid 2–3 kolumny)
- Styl kart: przezroczyste tło, lewy pas mosiądzowy (5px), border-bottom 1px divider
- Tekst: nagłówek brass, body secondary 1rem
- Spacing: py-80, gap 1.5rem
- Interakcje: hover → intensywność brass ↑, lekki scale 1.02

### Sekcja 3: CASE STUDIES
- Tożsamość: ciemny mosiądz (hover) + subtelny gradient bg
- Akcent: tło sekcji odcień ciemniejszy niż `--surface`, brass underline na linkach
- Karty: grid 3 karty
- Styl kart: tło `--background`, layout centrowany, minimalny border
- Tekst: centrowany, nota poufności (styl muted label) na górze
- Spacing: py-80, gap 2.5rem, padding karty 2.5rem
- Interakcje: hover → animowany link "Read more" w brass, shadow depth ↑

### Sekcja 4: STREFA WIEDZY (Knowledge Hub)
- Tożsamość: minimalistyczna, tekstowa — subtelny zielony akcent
- Akcent: zielony divider (cienka linia) między artykułami
- Karty: 3 karty — ikona + tytuł + excerpt + link
- Styl kart: bez bordera, czysta typografia, zielony underline linku
- Tekst: H3 (Section Heading), body secondary, krótki intro
- Spacing: py-80, gap 2rem
- Interakcje: hover → animowany zielony underline (slide in), zmiana koloru tekstu

### Sekcja 5: REZERWACJA KALENDARZA (Booking CTA)
- Tożsamość: pełna szerokość, mosiądzowy akcent, wysoki kontrast
- Akcent: przycisk brass (`--accent-brass`), tło `--background-deep`
- Layout: split — heading/subheading po lewej, embed Calendesk po prawej
- Przycisk: `.button-primary` z hover brass-hover
- Tekst: Hero Heading (2.875rem), body secondary jako subtext
- Spacing: py-100 (wyższa sekcja), centrowany padding
- Interakcje: hover przycisku → zmiana koloru na brass-hover, focus inputu formularza → underline brass

### Style ID do stworzenia w Webflow
- `Model Pracy Section Wrapper` — zielony top border, zielony tint surface
- `Specjalizacje Section Wrapper` — wzór mosiądzowego akcentu
- `Case Studies Section Wrapper` — dark surface, layout centrowany
- `Strefa Wiedzy Section Wrapper` — minimalny, zielone dividery
- `Rezerwacja Section Wrapper` — wysoki kontrast brass + dark bg

### Cele combo-style
1. Sekcja 1 wrapper + karty → zielony border + style
2. Sekcja 2 wrapper + karty → mosiądzowy lewy border + kolor tekstu
3. Sekcja 3 wrapper + karty → dark surface + centrowanie
4. Sekcja 4 wrapper + artykuły → minimalizm + zielone dividery
5. Sekcja 5 wrapper + CTA → brass button + stylowanie formularza

## 6. TREŚCI — STATUS (do potwierdzenia z klientem)

Brakujące / niepotwierdzone treści:
1. Opisy specjalizacji (5 kart w sekcji Specjalizacje)
2. 2–3 anonimowe scenariusze case studies
3. 3 artykuły blogowe do Strefy Wiedzy — przykładowe propozycje tematów:
   - "Zatrzymanie przez Policję — Twoje prawa"
   - "Wezwanie na przesłuchanie"
   - "Przeszukanie mieszkania"
4. Zdjęcie founder-a do O Kancelarii — brak zdjęcia własnego, potrzebne generyczne/stockowe zdjęcie środowiskowe (prawnik w biurze), styl ważniejszy niż dokładność, może mieć watermark.

Bio founder-a (O Kancelarii) do napisania — narracyjne lub 1-osobowe, wyjaśniające model kancelarii butikowej.

## 7. OTWARTE PUNKTY / DO ROZSTRZYGNIĘCIA

- [x] System kalendarza: Calendesk, potwierdzony i **działa na żywo** w lokalnej wersji od 2026-09-23 (prawdziwy embed iframe + skrypt resize/scroll od Arka, konto `yjggztzhsz.calendesk.net`). Stylowanie widgetu (białe tło Calendesk vs. ciemny motyw strony) zostaje do dopracowania później, sam Arek to zaznaczył.
- [ ] Custom Code na Webflow — obecnie zablokowany planem; rozwiązanie tymczasowe (HTML Embed) może dawać flash złego theme przy pierwszym ładowaniu.
- [ ] Synchronizacja obrazu w Gallery Scroll ze scrollem strony wymaga Custom Code (niedostępny) — obecnie tylko wersja click-driven (IX3).
- [ ] Potwierdzenie fontu nagłówków — Bodoni Moda (finalne wg planu stylowania) vs. Newsreader (wspomniany wcześniej ogólnie).
- [ ] Kompletowanie treści (patrz punkt 6).
- [ ] Domena własna dla `kag-e62476`.
