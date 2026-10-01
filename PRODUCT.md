# Product

## Register

brand

## Users

Dwie równorzędne grupy odbiorców:

- **Osoba w kryzysie**: zatrzymanie, przeszukanie, wezwanie na przesłuchanie (własne albo kogoś bliskiego). Często jest na telefonie, pod stresem, czasem w nocy. Potrzebuje w kilka sekund zrozumieć, że trafiła we właściwe miejsce, i od razu zadzwonić.
- **Firmy i zarządy**: prawo karne gospodarcze, criminal compliance, AML, kary administracyjne (UODO, UOKiK, KNF, GIIF, URE, UKE, PIP), zwalczanie nieuczciwej konkurencji. Czytają spokojnie, zwykle na desktopie, oceniają kompetencje (bio, publikacje, zakres) i umawiają konsultację z wyprzedzeniem.

## Product Purpose

Strona-wizytówka Kancelarii Adwokackiej Arkadiusza Górskiego (Warszawa, ul. Mokotowska 57). Jedna strona główna z sekcjami: intro, hero, model pracy, specjalizacje, sprawa pilna, adwokat, publikacje, rezerwacja, stopka. Docelowo ma zostać przeniesiona na Webflow.

Sukces mierzymy dwiema akcjami:
1. **Telefon**: w sprawach pilnych natychmiastowy kontakt pod numerem +48 792 892 457 (Pomoc 24/7).
2. **Konsultacja**: w pozostałych sprawach wizyta umówiona przez Calendesk albo formularz kontaktowy.

## Brand Personality

**Opanowany, bezpośredni, klasyczny.**

- Opanowany, pewny i dyskretny: spokój w cudzym kryzysie, autorytet bez pozy, zero krzyku.
- Bezpośredni, szybki i konkretny: mówi wprost („Zanim cokolwiek powiesz.”), bez prawniczego żargonu tam, gdzie liczy się czas.
- Klasyczny, elegancki i rzemieślniczy: kierunek „Atrament i mosiądz”, typografia z tradycji druku, jakość wykonania widoczna w szczegółach.

Emocja docelowa: ulga i zaufanie („ktoś kompetentny już się tym zajmuje”), bez teatralnej dramaturgii. Jedynym celowo głośnym momentem jest czerwony ekran intro.

## Anti-references

- **Typowa kancelaria**: granat ze złotem, wagi Temidy, młotek sędziowski, kolumny, stockowe zdjęcia uścisków dłoni.
- **Korporacyjny SaaS**: siatki identycznych kart z ikonkami, gradienty, wielkie liczby z podpisami („hero metrics”).
- **Tani marketing i clickbait**: krzykliwe obietnice, liczniki wygranych spraw, pop-upy, sztuczna presja.
- **Szablon WordPress**: generyczny motyw dla kancelarii, slider w hero, układ dwóch kolumn z sidebarem.

## Design Principles

1. **Najpierw telefon, potem cała reszta.** Z każdego miejsca strony, zwłaszcza na telefonie, do numeru jest jeden ruch. Osoba w kryzysie niczego nie szuka.
2. **Spokój jest usługą.** Forma ma obniżać napięcie: jasna hierarchia, krótkie zdania, żadnych rozpraszaczy. Głośność zarezerwowana dla jednego, świadomie wybranego momentu.
3. **Kompetencję pokazujemy, nie deklarujemy.** Konkretny zakres, publikacje, nazwy organów i procedur zamiast przymiotników w rodzaju „skuteczny” czy „doświadczony”.
4. **Dyskrecja w samej formie.** Zamiast opinii klientów anonimowe treści, a przy formularzu ostrzeżenie o braku poufności. Strona sama zachowuje się tak, jak obiecuje kancelaria.
5. **Rzemiosło zamiast ozdobników.** Elegancja bierze się z typografii, proporcji i detalu, a nie z dekoracji czy efektów dla efektu.

## Accessibility & Inclusion

- Cel: **WCAG 2.2 AA**.
- Kontrast tekstu ≥ 4.5:1 (duży tekst ≥ 3:1) w obu motywach, jasnym i ciemnym.
- Pełna obsługa klawiaturą i widoczny focus, szczególnie na ścieżkach telefonu, rezerwacji i formularza.
- `prefers-reduced-motion`: wszystkie animacje (intro, poświata „syreny”) mają wersję statyczną.
- Czytelność pod stresem na małym ekranie: duże cele dotyku, numer telefonu jako klikalny `tel:`, brak treści ukrytej za interakcją.
