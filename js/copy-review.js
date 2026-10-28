/* REVIEW ONLY: switches the page text between the original wording and the
   client's edits (docx "TC_Teksty na stronie", tracked changes by the lawyer,
   25 Oct 2026). It exists so both versions can be compared on the live design;
   delete this file, its <script> tags and the two lines in build-content.mjs
   once the wording is agreed.

   How it works: every rule below names an element and what it becomes in the
   client's version. Turning the version on applies the rules and remembers the
   original; turning it off undoes them. Nothing else on the page is touched.
   The choice is kept in localStorage ("kag-copy") so it survives navigation. */
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
  // (swap the element), before (insert new markup in front of it).
  var RULES = [
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
    }
  }

  function setCopy(mode) {
    while (undo.length) undo.pop()();
    if (mode === 'client') {
      RULES.forEach(function (r) { if (!r.p || r.p.test(path)) applyRule(r); });
    }
    root.setAttribute('data-copy', mode);
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    buttons.forEach(sync);
  }

  var ICON = '<svg class="copy-toggle__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" /><path d="M14.487 7.858A1 1 0 0 1 14 7V2" /><path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" /><path d="M8 18h1" /></svg>';

  var buttons = [];

  function sync(btn) {
    var on = root.getAttribute('data-copy') === 'client';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var label = on ? 'Teksty: wersja po uwagach klienta. Kliknij, by wrócić do pierwotnej.' : 'Teksty: wersja pierwotna. Kliknij, by pokazać wersję po uwagach klienta.';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    var text = btn.querySelector('.copy-toggle__label');
    if (text) text.textContent = on ? 'Teksty: po uwagach klienta' : 'Teksty: wersja pierwotna';
  }

  function addButton(parent, before, menu) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-toggle' + (menu ? ' copy-toggle--menu' : '');
    btn.innerHTML = ICON + (menu ? '<span class="copy-toggle__label"></span>' : '');
    btn.addEventListener('click', function () {
      setCopy(root.getAttribute('data-copy') === 'client' ? 'original' : 'client');
    });
    parent.insertBefore(btn, before);
    buttons.push(btn);
  }

  var style = document.createElement('style');
  style.textContent =
    '[data-copy-hidden]{display:none !important}' +
    '.copy-toggle{position:relative;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:2rem;height:2rem;padding:0;border:0;border-radius:50%;background:transparent;color:var(--text);cursor:pointer;transition:transform .16s cubic-bezier(.23,1,.32,1),color .2s ease}' +
    '.copy-toggle__icon{width:1.125rem;height:1.125rem}' +
    '.copy-toggle:active{transform:scale(.94)}' +
    '.copy-toggle[aria-pressed="true"]{color:var(--accent-brass-text)}' +
    '.copy-toggle[aria-pressed="true"]::after{content:"";position:absolute;top:.3125rem;right:.3125rem;width:.375rem;height:.375rem;border-radius:50%;background:var(--accent-brass)}' +
    '@media (hover:hover) and (pointer:fine){.copy-toggle:hover{color:var(--accent-brass-text)}}' +
    '.copy-toggle:focus-visible{outline:2px solid var(--accent-brass);outline-offset:2px}' +
    '.copy-toggle--menu{display:none}' +
    '@media (max-width:1023px){.site-nav__actions .copy-toggle{display:none}}' +
    'body.nav-open .copy-toggle--menu{display:flex;align-items:center;justify-content:flex-start;gap:.75rem;width:auto;height:auto;padding:.5rem 0;border-radius:0;font-size:1rem;font-weight:500;color:var(--text-secondary)}' +
    'body.nav-open .copy-toggle--menu[aria-pressed="true"]{color:var(--accent-brass-text)}' +
    'body.nav-open .copy-toggle--menu[aria-pressed="true"]::after{display:none}' +
    '.copy-sub{margin:0 auto 2rem;text-align:center;font-family:var(--font-body);font-weight:500;font-size:var(--size-lead);color:var(--text)}' +
    '.scene__hero h1 .copy-h1-sub{white-space:normal;font-size:.5em;line-height:1.2;margin-top:.625rem;max-width:30ch}' +
    '.copy-list{margin:0;padding-left:1.1em;list-style:disc}' +
    '.copy-list li+li{margin-top:.5rem}' +
    '.bio-content .bio-panel:nth-child(3) .credentials>[data-copy-hidden]+div:not([data-copy-hidden]){border-top:0;padding-top:0}';
  document.head.appendChild(style);

  var themeBar = document.querySelector('.site-nav__actions .theme-toggle');
  if (themeBar) addButton(themeBar.parentNode, themeBar, false);
  var themeMenu = document.querySelector('.site-nav__links .theme-toggle--menu');
  if (themeMenu) addButton(themeMenu.parentNode, themeMenu.nextSibling, true);

  var saved = 'original';
  try { if (localStorage.getItem(KEY) === 'client') saved = 'client'; } catch (e) {}
  root.setAttribute('data-copy', 'original');
  setCopy(saved);
})();
