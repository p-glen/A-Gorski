/* REVIEW ONLY: switches the page text between the original wording and the
   lawyer's edits, the photo set (home page) and the colour tone. Three
   dropdowns next to the theme toggle. Text versions:
     original  the prototype text
     client    25 Oct 2026, docx "TC_Teksty na stronie" (tracked changes)
     gdoc      28 Oct 2026, Google Doc "Teksty na stronie" (suggestions by the lawyer)
   It exists so the versions can be compared on the live design; delete this
   file, its <script> tags and the two lines in build-content.mjs once the
   wording is agreed.

   How it works: every rule below names an element and what it becomes in that
   version. Choosing a version undoes the current one and applies the new
   rules; the original is remembered. Nothing else on the page is touched.
   Each version is independent (the 28 Oct edits are not built on the 25 Oct
   ones). The choice is kept in localStorage ("kag-copy") across pages.

   Photo sets ("kag-photos", home page only): which portrait is the hero /
   contact card and which one sits in the About section. A set also carries
   the face crop for the round avatar, which main.js reads from the scene's
   data-img / data-crop.

   Tone ("kag-tone"): warm (shipped) or steel, set as data-tone on <html>;
   the values live in css/tokens.css and a few overrides in css/style.css. */
(function () {
  var KEY = 'kag-copy';
  var root = document.documentElement;
  var path = location.pathname;
  var undo = [];

  var CARD = '.carousel__track .specjalizacje-card:nth-of-type(';
  var BIO = '.bio-content .bio-panel:nth-child(';

  var LIST_FOUR = '<ul class="copy-list">' +
    '<li>obrona w postępowaniach karnych związanych z zarzutami m.in. oszustwa, działania na szkodę spółki, przekroczenia uprawnień, przywłaszczenia, wyłudzenia podatku VAT, nieuprawnionego uzyskania dostępu do informacji, łapownictwa menadżerskiego, prania brudnych pieniędzy, udziału w zorganizowanej grupie przestępczej;</li>' +
    '<li>obrona w wielopodmiotowym postępowaniu karnym dotyczącym oszustwa i działania na szkodę spółki na rynku kapitałowym o wartości szkody kilkuset milionów złotych;</li>' +
    '<li>reprezentacja pokrzywdzonego z siedzibą w Niemczech w związku z kradzieżą i przywłaszczeniem o wartości kilkudziesięciu milionów złotych;</li>' +
    '<li>reprezentacja pokrzywdzonych w sprawach działania na szkodę spółki o wartości kilkuset milionów złotych;</li></ul>';

  // kinds: text (textContent), html (innerHTML), sub (replace a substring of
  // innerHTML), node (first text node, keeps child markup), hide, outer
  // (swap the element), before / after (insert new markup next to it),
  // moveBefore (move the element in front of the element named by the selector).
  var RULES_CLIENT = [
    // Contact card and hero
    { s: '.scene__line strong', text: 'Zadzwoń.' },
    { s: '.scene__hero h1', html: '<span>Twój adwokat</span> <span>w sprawie karnej.</span> <span class="copy-h1-sub">Obrona podejrzanych i reprezentacja pokrzywdzonych.</span>' },
    { s: '.hero__lead', html: '<span>Prowadzę sprawy karne gospodarcze, sankcyjne, dotyczące zwalczania nieuczciwej konkurencji,</span> <span>doradzam w obszarze compliance, AML.</span>' },
    { s: '.free-note', text: 'Wstępna konsultacja jest bezpłatna.' },

    // The "who answers the phone" statement is dropped
    { s: '#claim', hide: true },

    // Working principles
    { s: '.reason-head h2', html: '<span>Jak pracuję – cztery zasady,</span> <span class="reason-head__soft">które stosuję w każdej sprawie.</span>' },
    { s: '.reason-head p', hide: true },

    // Specializations
    { s: '.specjalizacje-section .section-intro', text: 'Prowadzona przeze mnie praktyka jest zawężona świadomie. Sprawy karne gospodarcze, postępowania sankcyjne i compliance opierają się na tej samej wiedzy o tym, jak działają organy. W przypadku nieuczciwej konkurencji, ten sam stan faktyczny bywa podstawą roszczeń cywilnych i karnych.' },
    { s: CARD + '1) p', text: 'Obrona podejrzanych i pomoc pokrzywdzonym na każdym etapie postępowania, w każdej sprawie karnej.' },
    { s: CARD + '2) h3', text: 'Prawo karne gospodarcze i karno-skarbowe' },
    { s: CARD + '3) h3', text: 'Compliance' },
    { s: CARD + '3) p', text: 'Systemy zgodności i procedury, które ograniczają ryzyko, w tym ryzyko karne w firmie.' },

    // Detention section
    { s: '#sprawa-pilna .section-intro', text: 'Zatrzymanie lub przeszukanie to zdarzenia silnie stresogenne i nadzwyczajne w życiu każdego człowieka. Dobrze jest rozumieć procedurę, znać swoje uprawnienia, a także przewidywać dalsze kroki. To także moment na kontakt z adwokatem.' },
    { s: '#sprawa-pilna .steps-grid', before: '<h3 class="copy-sub">Jakie podstawowe działania podjąć?</h3>' },
    { s: '#sprawa-pilna .step:nth-child(1) p', html: 'Dowiedz się, kto zarządził zatrzymanie/przeszukanie i <mark class="marker">jaka jest sygnatura sprawy</mark>. Zażądaj przedstawienia postanowienia o zatrzymaniu i przymusowym doprowadzeniu lub/oraz postanowienia o żądaniu wydania rzeczy i przeszukaniu. Te dane są niezbędne obrońcy, aby mógł szybko podjąć działania.' },
    { s: '#sprawa-pilna .guide-cta .button-alert', node: 'Co robić podczas zatrzymania?' },

    // About me
    { s: BIO + '1) h2', text: 'Kim jestem?' },
    { s: BIO + '1) .credentials div:nth-child(1) dd', sub: ['w szczególności spółek.', 'w szczególności spółek (w tym zagranicznych). Przeprowadzam postępowania wyjaśniające w spółkach, w związku z przestępstwami menadżerów. Bronię przedsiębiorców w sprawach karnych skarbowych, a także w sprawach dotyczących czynów nieuczciwej konkurencji.'] },
    { s: BIO + '1) .credentials div:nth-child(2) dt', hide: true },
    { s: BIO + '1) .credentials div:nth-child(2) dd', sub: ['Mam doświadczenie w sprawach z rynku kapitałowego i w compliance.', 'Mam doświadczenie w sprawach karnych dot. rynku kapitałowego, a także w projektowaniu i audytowaniu systemów compliance.'] },
    { s: BIO + '1) .credentials div:nth-child(3) dd', sub: ['Prowadziłem zajęcia', 'Prowadzę zajęcia'] },

    { s: BIO + '2) .bio-group', text: 'Przykładowe sprawy' },
    { s: BIO + '2) .bio-group__desc', text: 'Sprawy, w których występowałem jako obrońca, pełnomocnik lub doradca prawny.' },
    { s: BIO + '2) .credentials > div:nth-child(1)', hide: true },
    { s: BIO + '2) .credentials > div:nth-child(2)', hide: true },
    { s: BIO + '2) .credentials > div:nth-child(4) dt', text: 'Kary administracyjne' },
    { s: BIO + '2) .credentials > div:nth-child(4) dd', html: '<ul class="copy-list"><li>Reprezentacja emitentów i firm inwestycyjnych w sprawach o administracyjne kary pieniężne.</li><li>Reprezentacja spółki z branży transportowej w sprawach o administracyjne kary pieniężne.</li></ul>' },
    // Inserted last: it shifts the :nth-child positions the rules above rely on.
    { s: BIO + '2) .credentials > div:nth-child(1)', before: '<div><dt>Prawo karne gospodarcze i karno-skarbowe</dt><dd>' + LIST_FOUR + '</dd></div>' },

    { s: BIO + '3) .bio-group', hide: true },
    { s: BIO + '3) .bio-group__desc', hide: true },
    { s: BIO + '3) .credentials > div:nth-child(1)', hide: true },
    { s: BIO + '3) .credentials > div:nth-child(2)', hide: true },
    { s: BIO + '3) .credentials > div:nth-child(3) dt', text: 'Doświadczenie i wykształcenie' },

    // Blog teaser
    { s: '#publikacje .section-intro', text: 'Wybrane teksty o praktyce karnej gospodarczej, compliance i postępowaniach sankcyjnych.' },

    // Booking: Signal sentence shortened, the anonymous form is dropped
    { s: '.rezerwacja-signal', text: 'Możesz też napisać przez Signal, na ten sam numer.' },
    { s: '.contact-switch__tabs', hide: true },

    // Shared footer and closing block
    { s: '.site-footer a[href^="tel:"]', text: '+48 792 892 457' },
    { s: '.cta-block__text', text: 'Pierwsza rozmowa jest bezpłatna i służy ustaleniu, czy jestem w stanie pomóc.' },
    { s: '.cta-block__phone', text: '+48 792 892 457' },
    { s: '.cta-block__note', text: 'W sprawach zatrzymań i przeszukań telefon dostępny całą dobę.' },

    // Specializations page and the two practice pages the lawyer edited
    { p: /\/praktyki\/$/, s: '.page-head__lead', text: 'Praktyka jest zawężona świadomie. Sprawy karne gospodarcze, postępowania sankcyjne i compliance opierają się na tej samej wiedzy o tym, jak działają organy. W przypadku nieuczciwej konkurencji, ten sam stan faktyczny bywa podstawą roszczeń cywilnych i karnych.' },
    { p: /prawo-karne-gospodarcze/, s: '#doswiadczenie + p', outer: '<ul class="copy-list">' +
      '<li>obrona w postępowaniach karnych związanych z zarzutami m.in. oszustwa, działania na szkodę spółki, przekroczenia uprawnień, przywłaszczenia, wyłudzenia podatku VAT, nieuprawnionego uzyskania dostępu do informacji, łapownictwa menadżerskiego, prania brudnych pieniędzy, udziału w zorganizowanej grupie przestępczej;</li>' +
      '<li>obrona w wielopodmiotowym postępowaniu karnym dotyczącym oszustwa i działania na szkodę spółki na rynku kapitałowym o wartości szkody kilkuset milionów złotych;</li>' +
      '<li>reprezentacja pokrzywdzonych w sprawach działania na szkodę spółki o wartości kilkuset milionów złotych;</li></ul>' },
    { p: /\/praktyki\/prawo-karne\/$/, s: '#doswiadczenie + p', outer: '<ul class="copy-list">' +
      '<li>reprezentacja pokrzywdzonego z siedzibą w Niemczech w związku z kradzieżą i przywłaszczeniem o wartości kilkudziesięciu milionów złotych;</li>' +
      '<li>obrona w sprawie o zabójstwo w związku z obroną konieczną.</li></ul>' }
  ];

  // 28 Oct 2026: suggestions in the Google Doc (author: the lawyer). The doc
  // lists four alternatives for the hero headline; the first one is shown.
  var CARDS = '.carousel__track .specjalizacje-card';
  var BIO2 = BIO + '2) .credentials > div:nth-child(';
  function cases(list) {
    return list.map(function (c) {
      return '<p class="copy-case"><strong>' + c[0] + '</strong><span>' + c[1] + '</span></p>';
    }).join('');
  }

  var RULES_GDOC = [
    // Contact card and hero
    { s: '.scene__hero h1', html: '<span>Bronię tam, gdzie biznes</span> <span>zderza się z prawem karnym.</span>' },
    { s: '.hero__lead', html: '<span>Bronię podejrzanych i reprezentuję pokrzywdzonych.</span> <span>Sprawy karne gospodarcze, karne skarbowe, zwalczanie nieuczciwej konkurencji.</span>' },
    { s: '.free-note', text: 'Wstępna konsultacja jest bezpłatna.' },

    // Claim: new wording, Signal line shortened
    { s: '.claim__text', text: 'Im wcześniej porozmawiamy, tym więcej możemy zrobić. Ustalimy, jak chronić Ciebie i Twoją firmę już podczas pierwszej rozmowy' },
    { s: '.claim__alt', sub: [', wiadomości są szyfrowane.', '.'] },

    // Working principles: the line under the headline is dropped
    { s: '.reason-head p', hide: true },

    // Specializations: intro dropped, cards renamed (the order is fixed in index.html)
    { s: '.specjalizacje-section .section-intro', hide: true },
    { s: CARD + '1) p', text: 'Obrona podejrzanych i pomoc pokrzywdzonym na każdym etapie postępowania, w każdej sprawie karnej.' },
    { s: CARD + '2) h3', text: 'Prawo karne gospodarcze i karno skarbowe' },

    // Detention section
    { s: '#sprawa-pilna .section-intro', text: 'Zatrzymanie lub przeszukanie to zdarzenia silnie stresogenne i nadzwyczajne w życiu każdego człowieka. Dobrze jest rozumieć procedurę, znać swoje uprawnienia, a także przewidywać dalsze kroki. To także moment na kontakt z adwokatem.' },
    { s: '#sprawa-pilna .step:nth-child(3) h3', text: 'Dalsze kroki ustal z obrońcą' },
    { s: '#sprawa-pilna .guide-cta .button-alert', node: 'Co robić na wypadek zatrzymania?' },

    // About me
    { s: BIO + '1) .credentials div:nth-child(1) dd', text: 'Jestem adwokatem specjalizującym się przede wszystkim w prawie karnym gospodarczym. Od dekady występuję jako obrońca podejrzanych i oskarżonych, ale także jako pełnomocnik pokrzywdzonych, w szczególności spółek (w tym zagranicznych). Prowadzę postępowania wyjaśniające w spółkach w związku z nadużyciami menadżerów. Bronię przedsiębiorców w sprawach karno skarbowych, a także dotyczących czynów nieuczciwej konkurencji.' },
    { s: BIO + '1) .credentials div:nth-child(2) dt', hide: true },
    { s: BIO + '1) .credentials div:nth-child(3) dt', hide: true },
    { s: BIO + '1) .credentials div:nth-child(4)', hide: true },

    { s: BIO + '2) .bio-group__desc', text: 'Sprawy, w których występowałem jako obrońca, pełnomocnik lub doradca.' },
    { s: BIO2 + '1) dt', text: 'Obrona karna gospodarcza' },
    { s: BIO2 + '1) dd', html: cases([
      ['Obligacje warte setki milionów złotych', 'Byłem jednym z dwóch głównych obrońców oskarżonego w sprawie dotyczącej zarzutu „oszustwa rynkowego” związanego z emisją obligacji o wartości setek milionów złotych i brakiem ich spłaty na szkodę inwestorów.'],
      ['Karuzela VAT na dziesiątki milionów złotych', 'Broniłem podejrzanego w postępowaniu dotyczącym wyłudzeń podatku VAT w mechanizmie tzw. karuzeli podatkowej, o wartości dziesiątek milionów złotych.']
    ]) + '<p class="copy-case"><span>Bronię przedsiębiorców, członków zarządu i menedżerów, gdy ich decyzje stają się przedmiotem zarzutów, w szczególności w sprawach dotyczących:</span></p>' +
      '<ul class="copy-list">' +
      '<li>zarządzania spółką: działania na szkodę spółki, przekroczenia uprawnień, łapownictwa menedżerskiego,</li>' +
      '<li>mienia i obrotu gospodarczego: oszustwa, przywłaszczenia,</li>' +
      '<li>podatków i przepływów finansowych: wyłudzeń VAT, prania pieniędzy,</li>' +
      '<li>informacji: nieuprawnionego uzyskania dostępu do informacji,</li>' +
      '<li>przestępczości zorganizowanej: udziału w zorganizowanej grupie przestępczej.</li></ul>' },
    { s: BIO2 + '2) dd', html: cases([
      ['Kilkanaście milionów euro w skradzionym towarze', 'Reprezentowałem międzynarodową spółkę e-commerce z siedzibą w Niemczech w sprawie kradzieży towarów z transportów realizowanych w Polsce. We współpracy z detektywem i prokuraturą ustaliliśmy sprawców i uzyskaliśmy zabezpieczenia majątkowe dla Klienta.'],
      ['Ponad 200 mln zł szkody wyrządzonej spółce', 'Reprezentowałem pokrzywdzonego akcjonariusza w sprawie dotyczącej działania na szkodę spółki poprzez zawieranie pozornych umów i ugód przez jej zarząd.'],
      ['Wewnętrzne postępowanie wyjaśniające w międzynarodowej spółce', 'Przeprowadziłem postępowanie wyjaśniające w polskim oddziale spółki austriackiej. Ustaliłem, że kluczowy menedżer działał na szkodę spółki, i skierowałem zawiadomienie o możliwości popełnienia przestępstwa. Ustalenia potwierdziły działanie na szkodę spółki przez kluczowego menedżera i stały się podstawą zawiadomienia do prokuratury.']
    ]) },
    { s: BIO2 + '3) dd', html: cases([
      ['Manipulacja, insider trading, działalność bez zezwolenia', 'Broniłem w sprawie łączącej trzy najpoważniejsze zarzuty z zakresu prawa rynku kapitałowego. Takie postępowania wymagają poruszania się na styku prawa karnego, regulacji finansowych i praktyki obrotu.']
    ]) },
    { s: BIO2 + '4)', hide: true },
    { s: BIO2 + '5)', hide: true },
    // Inserted last: it shifts the :nth-child positions the rules above rely on.
    { s: BIO2 + '1)', after: '<div><dt>Obrona karna</dt><dd>' + cases([
      ['Prokurator żądał 25 lat. Postępowanie prawomocnie umorzone.', 'Broniłem z urzędu kobiety oskarżonej o zabójstwo. W pierwszej instancji prokurator domagał się kary 25 lat pozbawienia wolności. Po kilku latach procesu i wielomiesięcznym areszcie sąd prawomocnie umorzył postępowanie z uwagi na obronę konieczną.']
    ]) + '</dd></div>' },

    // Professional data panel: everything but languages is deleted
    { s: BIO + '3) .bio-group', hide: true },
    { s: BIO + '3) .bio-group__desc', hide: true },
    { s: BIO + '3) .credentials > div:nth-child(1)', hide: true },
    { s: BIO + '3) .credentials > div:nth-child(2)', hide: true },
    { s: BIO + '3) .credentials > div:nth-child(3)', hide: true },
    { s: BIO + '3) .credentials > div:nth-child(4)', hide: true },

    // Booking: Signal sentence shortened, the anonymous form is dropped
    { s: '.rezerwacja-signal', text: 'Możesz też napisać przez Signal, na ten sam numer.' },
    { s: '.contact-switch__tabs', hide: true },

    // Specializations page and the two practice pages the lawyer edited
    { p: /\/praktyki\/$/, s: '.page-head__lead', text: 'Praktyka jest zawężona świadomie. Sprawy karne gospodarcze, postępowania sankcyjne i compliance opierają się na tej samej wiedzy o tym, jak działają organy. W przypadku nieuczciwej konkurencji ten sam stan faktyczny bywa podstawą roszczeń cywilnych i karnych.' },
    { p: /prawo-karne-gospodarcze/, s: '#doswiadczenie + p', after: '<ul class="copy-list">' +
      '<li>obrona w postępowaniach karnych związanych z zarzutami m.in. oszustwa, przekroczenia uprawnień, przywłaszczenia, nieuprawnionego uzyskania dostępu do informacji, prania brudnych pieniędzy, udziału w zorganizowanej grupie przestępczej;</li>' +
      '<li>obrona w wielopodmiotowym postępowaniu karnym dotyczącym oszustwa i działania na szkodę spółki na rynku kapitałowym o wartości szkody kilkuset milionów złotych;</li>' +
      '<li>reprezentacja pokrzywdzonych w sprawach działania na szkodę spółki o wartości kilkuset milionów złotych;</li></ul>' },
    { p: /\/praktyki\/prawo-karne\/$/, s: '#doswiadczenie + p', before: '<ul class="copy-list"><li>obrona w sprawie o zabójstwo w związku z obroną konieczną.</li></ul>' }
  ];

  // 3 Nov 2026: the lawyer's next round of remarks. It builds on the 28 Oct
  // version (nothing from it is lost) and the rules below win where they overlap.
  // The figure is plain text, right-aligned in its column, so each row reads
  // like a bullet point for the text beside it. A row with no figure leaves it empty.
  function caseRow(metric, title, text) {
    return '<li class="case"><span class="case__metric">' + metric + '</span>' +
      '<span class="case__body"><strong>' + title + '</strong> ' + text + '</span></li>';
  }
  function caseGroup(name, rows) {
    return '<div class="cases__group"><h4>' + name + '</h4><ul>' + rows.join('') + '</ul></div>';
  }

  var RULES_NEXT = RULES_GDOC.filter(function (r) {
    // the publications row is back (shortened below), and Dydaktyka keeps its header
    return r.s !== BIO + '1) .credentials div:nth-child(4)' && r.s !== BIO + '1) .credentials div:nth-child(3) dt';
  }).concat([
    // Hero: "Działam" instead of "Bronię"
    { s: '.scene__hero h1', html: '<span>Działam tam, gdzie biznes</span> <span>zderza się z prawem karnym.</span>' },

    // Claim: the second sentence becomes secondary text under the headline
    { s: '.claim__text', text: 'Im wcześniej porozmawiamy, tym więcej możemy zrobić.' },
    { s: '.claim__text', after: '<p class="claim__sub">Ustalimy, jak chronić Ciebie i Twoją firmę już podczas pierwszej rozmowy.</p>' },

    // About me: a short lead under the heading, so the block does not read like a data sheet
    { s: BIO + '1) .heading-condensed', after: '<p class="bio-lede">Sprawę przyjmuję, czytam akta i prowadzę osobiście. Dzwonisz bezpośrednio do mnie, bez sekretariatu.</p>' },

    // About me: the specialisation in the lawyer's words, publications folded
    { s: BIO + '1) .credentials div:nth-child(1) dd', text: 'Moją specjalizacją są sprawy karne gospodarcze, karne skarbowe oraz zwalczanie nieuczciwej konkurencji.' },
    { s: BIO + '1) .credentials div:nth-child(4) dd', html: 'Współautor komentarza do ustawy AML (C.H. Beck, 2021 i 2024). Moje teksty publikowały m.in. <cite class="pub">Parkiet</cite>, <cite class="pub">Monitor Prawniczy</cite> i <cite class="pub">Przegląd Sądowy</cite>.' },

    // The compliance paragraph goes
    { s: BIO + '1) .credentials div:nth-child(2)', hide: true },

    // Selected cases: the figure first, then a title and one short sentence
    { s: BIO + '2)', html: '<h3 class="bio-group">Wybrane sprawy</h3><div class="cases">' +
      caseGroup('Obrona karna', [
        caseRow('25 lat', 'Obrona w sprawie o zabójstwo.', 'Prokurator żądał 25 lat, <span class="case__key">postępowanie prawomocnie umorzono</span>.')
      ]) +
      caseGroup('Obrona karna gospodarcza', [
        caseRow('+ 100 mln zł', 'Oszustwo rynkowe przy emisji obligacji.', 'Byłem <span class="case__key">jednym z dwóch głównych obrońców</span> oskarżonego.'),
        caseRow('+ 10 mln zł', 'Karuzela VAT.', 'Obrona podejrzanego w mechanizmie <span class="case__key">karuzeli podatkowej</span>.'),
        caseRow('3 zarzuty', 'Rynek kapitałowy.', 'Manipulacja, insider trading i działalność bez zezwolenia: <span class="case__key">trzy najpoważniejsze zarzuty w jednej sprawie</span>.')
      ]) +
      caseGroup('Reprezentacja pokrzywdzonych', [
        caseRow('+ 10 mln €', 'Kradzież towarów z transportów.', 'Spółka e-commerce z Niemiec, <span class="case__key">sprawcy ustaleni, zabezpieczenia majątkowe uzyskane</span>.'),
        caseRow('+ 200 mln zł', 'Działanie na szkodę spółki.', 'Reprezentacja akcjonariusza wobec <span class="case__key">pozornych umów i ugód zawieranych przez zarząd</span>.'),
        caseRow('', 'Postępowanie wyjaśniające w spółce.', 'Ustaliłem nadużycia menedżera i <span class="case__key">skierowałem zawiadomienie do prokuratury</span>.')
      ]) + '</div>' },

    // Professional data: the whole panel goes (the booking call below it stays)
    { s: BIO + '3)', hide: true }
  ]);

  var VERSIONS = [
    { id: 'original', label: 'Wersja pierwotna', note: 'tekst z prototypu', rules: [] },
    { id: 'client', label: '25.10.2026', note: 'uwagi w pliku Word', rules: RULES_CLIENT },
    { id: 'gdoc', label: '28.10.2026', note: 'uwagi w Dokumencie Google', rules: RULES_GDOC },
    { id: 'nov3', label: '03.11.2026', note: 'kolejne uwagi (najnowsza)', rules: RULES_NEXT }
  ];

  function make(html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content.firstElementChild;
  }

  function firstText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.nodeValue.trim()) return n;
    }
    return null;
  }

  function applyRule(r) {
    var el = document.querySelector(r.s);
    if (!el) return;
    if (r.hide) {
      el.setAttribute('data-copy-hidden', '');
      undo.push(function () { el.removeAttribute('data-copy-hidden'); });
    } else if (r.text != null) {
      var t0 = el.textContent;
      el.textContent = r.text;
      undo.push(function () { el.textContent = t0; });
    } else if (r.html != null) {
      var h0 = el.innerHTML;
      el.innerHTML = r.html;
      undo.push(function () { el.innerHTML = h0; });
    } else if (r.sub) {
      var s0 = el.innerHTML;
      el.innerHTML = s0.replace(r.sub[0], r.sub[1]);
      undo.push(function () { el.innerHTML = s0; });
    } else if (r.node != null) {
      var n = firstText(el);
      if (!n) return;
      var v0 = n.nodeValue;
      n.nodeValue = r.node;
      undo.push(function () { n.nodeValue = v0; });
    } else if (r.outer) {
      var fresh = make(r.outer);
      el.replaceWith(fresh);
      undo.push(function () { fresh.replaceWith(el); });
    } else if (r.before) {
      var add = make(r.before);
      el.parentNode.insertBefore(add, el);
      undo.push(function () { add.remove(); });
    } else if (r.after) {
      var tail = make(r.after);
      el.parentNode.insertBefore(tail, el.nextSibling);
      undo.push(function () { tail.remove(); });
    } else if (r.moveBefore) {
      var target = document.querySelector(r.moveBefore);
      if (!target || target === el) return;
      var home = el.parentNode;
      var next = el.nextSibling;
      target.parentNode.insertBefore(el, target);
      undo.push(function () { home.insertBefore(el, next); });
    }
  }

  var PHOTO_VERSIONS = [
    { id: 'p1', label: 'Wersja 1', note: 'hero: kanapa, trampki · O mnie: stojąco',
      hero: { src: 'img/arkadiusz-gorski-portret.webp?v=2', w: 1000, h: 1500, crop: [430, 265, 190] },
      bio: { src: 'img/arkadiusz-gorski-fotel.webp?v=2', alt: 'Adwokat Arkadiusz Górski, portret' } },
    { id: 'p2', label: 'Wersja 2', note: 'hero: hoker · O mnie: kanapa, trampki',
      hero: { src: 'img/arkadiusz-gorski-hoker.webp', w: 1000, h: 1500, crop: [520, 225, 190] },
      bio: { src: 'img/arkadiusz-gorski-kanapa-bok.webp', alt: 'Adwokat Arkadiusz Górski siedzący na oparciu kanapy, portret' } },
    { id: 'p3', label: 'Wersja 3', note: 'hero: szare tło, stojąco · O mnie: kanapa, trampki',
      hero: { src: 'img/arkadiusz-gorski-stoi.webp', w: 1000, h: 1500, crop: [480, 225, 190] },
      bio: { src: 'img/arkadiusz-gorski-kanapa-trampki.webp', alt: 'Adwokat Arkadiusz Górski siedzący na kanapie, portret' } }
  ];

  var TONE_VERSIONS = [
    { id: 'warm', label: 'Ciepła', note: 'espresso i mosiądz (obecna)', meta: { dark: '#1C1A17', light: '#F3EFE6' } },
    { id: 'steel', label: 'Stalowa', note: 'granat i koniak, jak na zdjęciach', meta: { dark: '#161A21', light: '#EEF0F4' } }
  ];

  var AREAS_VERSIONS = [
    { id: 'carousel', label: 'Karuzela', note: 'przewijany rząd kart' },
    { id: 'bento', label: 'Bento', note: 'matryca z rysunkami (od 900 px)' }
  ];

  function versionOf(kind, id) {
    var list = kind.versions;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

  function setCopy(mode) {
    var v = versionOf(KINDS.copy, mode);
    while (undo.length) undo.pop()();
    v.rules.forEach(function (r) { if (!r.p || r.p.test(path)) applyRule(r); });
    root.setAttribute('data-copy', v.id);
    try { localStorage.setItem(KINDS.copy.key, v.id); } catch (e) {}
    switches.forEach(sync);
  }

  function setTone(mode) {
    var v = versionOf(KINDS.tone, mode);
    if (v.id === 'warm') root.removeAttribute('data-tone'); else root.setAttribute('data-tone', v.id);
    var light = root.getAttribute('data-theme') === 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? v.meta.light : v.meta.dark);
    try { localStorage.setItem(KINDS.tone.key, v.id); } catch (e) {}
    switches.forEach(sync);
  }

  function setAreas(mode) {
    var v = versionOf(KINDS.areas, mode);
    root.setAttribute('data-areas', v.id);
    try { localStorage.setItem(KINDS.areas.key, v.id); } catch (e) {}
    switches.forEach(sync);
    // the carousel measures its cards: tell it the layout changed
    window.dispatchEvent(new Event('resize'));
  }

  function setPhotos(mode) {
    var v = versionOf(KINDS.photos, mode);
    var scene = document.querySelector('.scene');
    if (scene) {
      var h = v.hero;
      scene.setAttribute('data-img', h.w + 'x' + h.h);
      scene.setAttribute('data-crop', h.crop.join(','));
      document.querySelectorAll('.scene__photo img, .scene__avatar').forEach(function (img) {
        img.setAttribute('src', h.src);
        img.setAttribute('width', h.w);
        img.setAttribute('height', h.h);
      });
      // The square window of the photo shown in the round avatar
      // (same maths as the comment above .scene__avatar in style.css).
      var half = h.crop[2] * 2;
      var av = document.querySelector('.scene__avatar');
      if (av) {
        av.style.left = (-(h.crop[0] - h.crop[2]) / half * 100) + '%';
        av.style.top = (-(h.crop[1] - h.crop[2]) / half * 100) + '%';
        av.style.width = (h.w / half * 100) + '%';
      }
      root.style.setProperty('--hero-img', 'url("' + new URL(h.src, document.baseURI).href + '")');
      window.dispatchEvent(new CustomEvent('kag:photos'));
    }
    var portrait = document.querySelector('.bio-grid .portrait');
    if (portrait) {
      portrait.setAttribute('src', v.bio.src);
      portrait.setAttribute('alt', v.bio.alt);
    }
    root.setAttribute('data-photos', v.id);
    try { localStorage.setItem(KINDS.photos.key, v.id); } catch (e) {}
    switches.forEach(sync);
  }

  var ICON_COPY = '<svg class="copy-toggle__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" /><path d="M14.487 7.858A1 1 0 0 1 14 7V2" /><path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" /><path d="M8 18h1" /></svg>';

  var ICON_PHOTO = '<svg class="copy-toggle__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>';

  var ICON_TONE = '<svg class="copy-toggle__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" /><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /></svg>';

  var ICON_AREAS = '<svg class="copy-toggle__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>';

  // One dropdown per kind of review choice; the first version is the shipped one.
  var KINDS = {
    copy: { key: 'kag-copy', attr: 'data-copy', versions: VERSIONS, set: setCopy, icon: ICON_COPY,
      noun: 'tekstów', word: 'Teksty', first: 'wersja pierwotna', menu: 'Wersja tekstów na stronie' },
    photos: { key: 'kag-photos', attr: 'data-photos', versions: PHOTO_VERSIONS, set: setPhotos, icon: ICON_PHOTO,
      noun: 'zdjęć', word: 'Zdjęcia', first: 'Wersja 1', menu: 'Zestaw zdjęć na stronie' },
    areas: { key: 'kag-areas', attr: 'data-areas', versions: AREAS_VERSIONS, set: setAreas, icon: ICON_AREAS,
      noun: 'układu obszarów', word: 'Obszary', first: 'karuzela', menu: 'Układ sekcji obszarów praktyki' },
    tone: { key: 'kag-tone', attr: 'data-tone', versions: TONE_VERSIONS, set: setTone, icon: ICON_TONE,
      noun: 'tonacji', word: 'Tonacja', first: 'ciepła', menu: 'Tonacja kolorystyczna strony' }
  };

  var switches = [];

  function sync(sw) {
    var k = sw.kind;
    var v = versionOf(k, root.getAttribute(k.attr));
    var on = v.id !== k.versions[0].id;
    var name = on ? v.label + ', ' + v.note : k.first;
    sw.btn.setAttribute('data-on', on ? 'true' : 'false');
    sw.btn.setAttribute('aria-label', 'Wersja ' + k.noun + ': ' + name + '. Zmień wersję.');
    sw.btn.setAttribute('title', 'Wersja ' + k.noun + ': ' + name);
    var text = sw.btn.querySelector('.copy-toggle__label');
    if (text) text.textContent = k.word + ': ' + (on ? v.label : k.first);
    sw.items.forEach(function (it) {
      it.el.setAttribute('aria-checked', it.id === v.id ? 'true' : 'false');
    });
  }

  function closeMenu(sw, refocus) {
    if (sw.list.hidden) return;
    sw.list.hidden = true;
    sw.btn.setAttribute('aria-expanded', 'false');
    if (refocus) sw.btn.focus();
  }

  function openMenu(sw, focusItem) {
    switches.forEach(function (o) { if (o !== sw) closeMenu(o, false); });
    sw.list.hidden = false;
    sw.btn.setAttribute('aria-expanded', 'true');
    if (focusItem) {
      var cur = sw.items.filter(function (it) { return it.el.getAttribute('aria-checked') === 'true'; })[0] || sw.items[0];
      cur.el.focus();
    }
  }

  function addSwitch(kind, parent, before, menu) {
    var wrap = document.createElement('div');
    wrap.className = 'copy-switch' + (menu ? ' copy-switch--menu' : '');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-toggle' + (menu ? ' copy-toggle--menu' : '');
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = kind.icon + (menu ? '<span class="copy-toggle__label"></span>' : '');
    var list = document.createElement('div');
    list.className = 'copy-menu';
    list.setAttribute('role', 'menu');
    list.setAttribute('aria-label', kind.menu);
    list.hidden = true;
    var sw = { kind: kind, btn: btn, list: list, items: [] };
    kind.versions.forEach(function (v) {
      var el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('role', 'menuitemradio');
      el.setAttribute('aria-checked', 'false');
      el.innerHTML = '<strong></strong><span></span>';
      el.firstChild.textContent = v.label;
      el.lastChild.textContent = v.note;
      el.addEventListener('click', function () {
        kind.set(v.id);
        closeMenu(sw, true);
      });
      list.appendChild(el);
      sw.items.push({ id: v.id, el: el });
    });
    btn.addEventListener('click', function () {
      if (list.hidden) openMenu(sw, false); else closeMenu(sw, false);
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openMenu(sw, true); }
    });
    list.addEventListener('keydown', function (e) {
      var els = sw.items.map(function (it) { return it.el; });
      var i = els.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(sw, true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); els[(i + els.length - 1) % els.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); els[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); els[els.length - 1].focus(); }
      else if (e.key === 'Tab') closeMenu(sw, false);
    });
    wrap.appendChild(btn);
    wrap.appendChild(list);
    parent.insertBefore(wrap, before);
    switches.push(sw);
  }

  document.addEventListener('click', function (e) {
    switches.forEach(function (sw) {
      if (!sw.list.hidden && !sw.btn.parentNode.contains(e.target)) closeMenu(sw, false);
    });
  });

  var style = document.createElement('style');
  style.textContent =
    '[data-copy-hidden]{display:none !important}' +
    '.copy-switch{position:relative;display:inline-flex;flex-shrink:0}' +
    '.copy-toggle{position:relative;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:2rem;height:2rem;padding:0;border:0;border-radius:50%;background:transparent;color:var(--text);cursor:pointer;transition:transform .16s cubic-bezier(.23,1,.32,1),color .2s ease}' +
    '.copy-toggle__icon{width:1.125rem;height:1.125rem}' +
    '.copy-toggle:active{transform:scale(.94)}' +
    '.copy-toggle[data-on="true"]{color:var(--accent-brass-text)}' +
    '.copy-toggle[data-on="true"]::after{content:"";position:absolute;top:.3125rem;right:.3125rem;width:.375rem;height:.375rem;border-radius:50%;background:var(--accent-brass)}' +
    '@media (hover:hover) and (pointer:fine){.copy-toggle:hover{color:var(--accent-brass-text)}}' +
    '.copy-toggle:focus-visible,.copy-menu button:focus-visible{outline:2px solid var(--accent-brass);outline-offset:2px}' +
    '.copy-menu{position:absolute;top:calc(100% + .5rem);right:0;z-index:300;min-width:16rem;padding:.375rem;background:var(--background);border:1px solid var(--border);box-shadow:0 14px 36px rgb(0 0 0 / .3)}' +
    '.copy-menu[hidden]{display:none}' +
    '.copy-menu button{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:.125rem;width:100%;padding:.625rem .75rem .625rem 1.5rem;border:0;background:transparent;color:var(--text);font:inherit;text-align:left;cursor:pointer}' +
    '.copy-menu button strong{font-weight:600;font-size:.9375rem;line-height:1.3}' +
    '.copy-menu button span{font-size:.8125rem;line-height:1.3;color:var(--text-muted)}' +
    '.copy-menu button[aria-checked="true"]{color:var(--accent-brass-text)}' +
    '.copy-menu button[aria-checked="true"]::before{content:"";position:absolute;left:.625rem;top:50%;width:.375rem;height:.375rem;margin-top:-.1875rem;border-radius:50%;background:var(--accent-brass)}' +
    '@media (hover:hover) and (pointer:fine){.copy-menu button:hover{background:color-mix(in srgb,var(--text) 8%,transparent)}}' +
    '.copy-switch--menu{display:none}' +
    '@media (max-width:1023px){.site-nav__actions .copy-switch{display:none}}' +
    'body.nav-open .copy-switch--menu{display:block;width:100%}' +
    'body.nav-open .copy-toggle--menu{display:flex;align-items:center;justify-content:flex-start;gap:.875rem;width:100%;height:auto;min-height:3.5rem;padding:0;border-radius:0;border-bottom:1px solid var(--border);font-size:1.1875rem;font-weight:500;color:var(--text-secondary)}' +
    'body.nav-open .copy-toggle--menu .copy-toggle__icon{width:1.25rem;height:1.25rem}' +
    'body.nav-open .copy-toggle--menu[data-on="true"]{color:var(--accent-brass-text)}' +
    'body.nav-open .copy-toggle--menu[data-on="true"]::after{display:none}' +
    'body.nav-open .copy-switch--menu .copy-menu{position:static;min-width:0;padding:.25rem 0 .5rem;border:0;border-bottom:1px solid var(--border);box-shadow:none}' +
    '.copy-sub{margin:0 auto 2rem;text-align:center;font-family:var(--font-body);font-weight:500;font-size:var(--size-lead);color:var(--text)}' +
    '.scene__hero h1 .copy-h1-sub{white-space:normal;font-size:.5em;line-height:1.2;margin-top:.625rem;max-width:30ch}' +
    '.copy-list{margin:0;padding-left:1.1em;list-style:disc}' +
    '.copy-list li+li{margin-top:.5rem}' +
    '.claim__sub{margin:-1.75rem 0 1.75rem;max-width:none;font-size:1.25rem;line-height:1.5;font-weight:400;color:var(--text-secondary)}@media (min-width:768px){.claim__sub{white-space:nowrap}}' +
    '.bio-lede{margin:0 0 1.75rem;max-width:46ch;font-size:var(--size-card);line-height:1.65;color:var(--text-secondary)}' +
    '.cases{display:grid;gap:3.25rem;margin-top:1.5rem}' +
    '.cases__group h4{display:flex;align-items:center;gap:.625rem;margin:0;padding:.875rem 0;border-bottom:1px solid var(--border);font-family:var(--font-mono);font-size:var(--size-note);font-weight:400;line-height:1.75;letter-spacing:var(--ls-note);text-transform:uppercase;color:var(--text-secondary)}' +
    '.cases__group ul{list-style:none;margin:0;padding:0}' +
    '.case{display:grid;grid-template-columns:10.5rem 1fr;gap:1rem;padding:0}' +
    '.cases__group ul{display:grid;gap:2.5rem;padding:2rem 0 .5rem}' +
    '.case__metric{text-align:right;font-size:var(--size-card);line-height:1.6;font-weight:500;color:var(--text);font-variant-numeric:tabular-nums;white-space:nowrap}' +
    '.case__body{font-size:var(--size-card);color:var(--text-secondary);line-height:1.6}' +
    '.case__key{color:var(--text);background:linear-gradient(var(--accent-brass),var(--accent-brass)) no-repeat 0 100%/100% 1px;padding-bottom:.125rem;-webkit-box-decoration-break:clone;box-decoration-break:clone}' +
    '@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){.case__key{background-size:0% 1px;animation:case-key linear both;animation-timeline:view();animation-range:cover 5% cover 28%}}}' +
    '@keyframes case-key{to{background-size:100% 1px}}' +
    '.case__body strong{display:block;font-weight:500;color:var(--text)}' +
    '@media (max-width:900px){.case{grid-template-columns:1fr;gap:.25rem}.case__metric{text-align:left}}' +
    '.copy-case{margin:0}' +
    '.copy-case+.copy-case,.copy-case+.copy-list{margin-top:.75rem}' +
    '.copy-case strong{display:block;font-weight:600;color:var(--text)}' +
    '.bio-content .bio-panel:nth-child(3) .credentials>[data-copy-hidden]+div:not([data-copy-hidden]){border-top:0;padding-top:0}';
  document.head.appendChild(style);

  var hasPhotos = !!document.querySelector('.scene');
  var hasAreas = !!document.querySelector('.carousel');
  // the dropdowns are hidden and stored choices ignored; set true to review variants again
  var SHOW_SWITCHES = false;
  var themeBar = document.querySelector('.site-nav__actions .theme-toggle');
  if (SHOW_SWITCHES && themeBar) {
    addSwitch(KINDS.copy, themeBar.parentNode, themeBar, false);
    if (hasPhotos) addSwitch(KINDS.photos, themeBar.parentNode, themeBar, false);
    if (hasAreas) addSwitch(KINDS.areas, themeBar.parentNode, themeBar, false);
    addSwitch(KINDS.tone, themeBar.parentNode, themeBar, false);
  }
  var themeMenu = document.querySelector('.site-nav__links .theme-toggle--menu');
  if (SHOW_SWITCHES && themeMenu) {
    var afterTheme = themeMenu.nextSibling;
    addSwitch(KINDS.copy, themeMenu.parentNode, afterTheme, true);
    if (hasPhotos) addSwitch(KINDS.photos, themeMenu.parentNode, afterTheme, true);
    if (hasAreas) addSwitch(KINDS.areas, themeMenu.parentNode, afterTheme, true);
    addSwitch(KINDS.tone, themeMenu.parentNode, afterTheme, true);
  }

  // shipped defaults: newest text, first photo set, steel tone (a stored choice wins)
  var DEFAULTS = { 'kag-copy': 'nov3', 'kag-tone': 'steel', 'kag-photos': 'p2' };
  function saved(kind) {
    var d = DEFAULTS[kind.key] || kind.versions[0].id;
    if (!SHOW_SWITCHES) return d;
    try {
      var s = localStorage.getItem(kind.key);
      return s ? versionOf(kind, s).id : d;
    } catch (e) { return d; }
  }
  root.setAttribute('data-copy', 'original');
  setCopy(saved(KINDS.copy));
  setTone(saved(KINDS.tone));
  if (hasAreas) setAreas(saved(KINDS.areas));
  if (hasPhotos) {
    root.setAttribute('data-photos', 'p1');
    setPhotos(saved(KINDS.photos));
  }
})();
