/* REVIEW ONLY: switches the page text between the original wording and the
   lawyer's edits. Versions (pick one in the dropdown next to the theme toggle):
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
   ones). The choice is kept in localStorage ("kag-copy") across pages. */
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

    // Specializations: intro dropped, cards renamed and reordered
    { s: '.specjalizacje-section .section-intro', hide: true },
    { s: CARD + '1) p', text: 'Obrona podejrzanych i pomoc pokrzywdzonym na każdym etapie postępowania, w każdej sprawie karnej.' },
    { s: CARD + '2) h3', text: 'Prawo karne gospodarcze i karno skarbowe' },
    // Moves go last: they change the :nth-of-type positions used above.
    { s: CARDS + ':has(a[href*="prawo-karne-gospodarcze"])', moveBefore: CARDS + ':has(a[href$="praktyki/prawo-karne/"])' },
    { s: CARDS + ':has(a[href*="zwalczanie-nieuczciwej"])', moveBefore: CARDS + ':has(a[href*="compliance"])' },

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

  var VERSIONS = [
    { id: 'original', label: 'Wersja pierwotna', note: 'tekst z prototypu', rules: [] },
    { id: 'client', label: '25.10.2026', note: 'uwagi w pliku Word', rules: RULES_CLIENT },
    { id: 'gdoc', label: '28.10.2026', note: 'uwagi w Dokumencie Google', rules: RULES_GDOC }
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

  function versionOf(id) {
    for (var i = 0; i < VERSIONS.length; i++) if (VERSIONS[i].id === id) return VERSIONS[i];
    return VERSIONS[0];
  }

  function setCopy(mode) {
    var v = versionOf(mode);
    while (undo.length) undo.pop()();
    v.rules.forEach(function (r) { if (!r.p || r.p.test(path)) applyRule(r); });
    root.setAttribute('data-copy', v.id);
    try { localStorage.setItem(KEY, v.id); } catch (e) {}
    switches.forEach(sync);
  }

  var ICON = '<svg class="copy-toggle__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" /><path d="M14.487 7.858A1 1 0 0 1 14 7V2" /><path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" /><path d="M8 18h1" /></svg>';

  var switches = [];

  function sync(sw) {
    var v = versionOf(root.getAttribute('data-copy'));
    var on = v.id !== 'original';
    var name = on ? v.label + ', ' + v.note : 'wersja pierwotna';
    sw.btn.setAttribute('data-on', on ? 'true' : 'false');
    sw.btn.setAttribute('aria-label', 'Wersja tekstów: ' + name + '. Zmień wersję.');
    sw.btn.setAttribute('title', 'Wersja tekstów: ' + name);
    var text = sw.btn.querySelector('.copy-toggle__label');
    if (text) text.textContent = 'Teksty: ' + (on ? v.label : 'wersja pierwotna');
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

  function addSwitch(parent, before, menu) {
    var wrap = document.createElement('div');
    wrap.className = 'copy-switch' + (menu ? ' copy-switch--menu' : '');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-toggle' + (menu ? ' copy-toggle--menu' : '');
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = ICON + (menu ? '<span class="copy-toggle__label"></span>' : '');
    var list = document.createElement('div');
    list.className = 'copy-menu';
    list.setAttribute('role', 'menu');
    list.setAttribute('aria-label', 'Wersja tekstów na stronie');
    list.hidden = true;
    var sw = { btn: btn, list: list, items: [] };
    VERSIONS.forEach(function (v) {
      var el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('role', 'menuitemradio');
      el.setAttribute('aria-checked', 'false');
      el.innerHTML = '<strong></strong><span></span>';
      el.firstChild.textContent = v.label;
      el.lastChild.textContent = v.note;
      el.addEventListener('click', function () {
        setCopy(v.id);
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
    '.copy-case{margin:0}' +
    '.copy-case+.copy-case,.copy-case+.copy-list{margin-top:.75rem}' +
    '.copy-case strong{display:block;font-weight:600;color:var(--text)}' +
    '.bio-content .bio-panel:nth-child(3) .credentials>[data-copy-hidden]+div:not([data-copy-hidden]){border-top:0;padding-top:0}';
  document.head.appendChild(style);

  var themeBar = document.querySelector('.site-nav__actions .theme-toggle');
  if (themeBar) addSwitch(themeBar.parentNode, themeBar, false);
  var themeMenu = document.querySelector('.site-nav__links .theme-toggle--menu');
  if (themeMenu) addSwitch(themeMenu.parentNode, themeMenu.nextSibling, true);

  var saved = 'original';
  try { saved = versionOf(localStorage.getItem(KEY)).id; } catch (e) {}
  root.setAttribute('data-copy', 'original');
  setCopy(saved);
})();
