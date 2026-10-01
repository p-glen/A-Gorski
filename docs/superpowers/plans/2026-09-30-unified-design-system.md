# Jednolity system wizualny i dwa tryby strony. Plan wdrożenia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ujednolicić typografię, kolory i odstępy całej strony (jedna skala, jedna mapa ról kolorów), dodać tryb telefon/desktop oraz zamienić intro na kartę połączenia.

**Architecture:** Wszystko przez tokeny w `css/tokens.css` (kolory, skala typografii, odstępy z media queries) i jedną wspólną definicję nagłówków w `css/style.css`. Bez nowych bibliotek. Weryfikacja dwoma skryptami w `scripts/` (kontrast z tokenów, audyt computed styles w Chrome headless przez iframe o zadanej szerokości).

**Tech Stack:** statyczny HTML/CSS/JS, Node (skrypty weryfikacyjne), Google Chrome headless, serwer `python3 -m http.server 4173` (już działa w katalogu projektu).

**Spec:** `docs/superpowers/specs/2026-09-30-unified-design-system-design.md`

## Global Constraints

- Nagłówki H1–H4 zawsze w `--text`. Mosiądz (`--accent-brass`) wyłącznie dla rzeczy klikalnych i focusu. Zielonego (`--accent-green`) nie ma nigdzie. Czerwień tylko: Pomoc 24/7, poświata „syreny”, `border-top` sekcji „Sprawa pilna”, intro, ramka ostrzeżenia formularza.
- Bodoni Moda: H1, H2 i wyjątki `.site-nav__logo`, `.rezerwacja-tel`, `.call-card__name`. Wszystko inne IBM Plex Sans. Boldonse usunięty.
- Rozmiary tekstu tylko z tokenów: `--size-lead` 1.125rem, `--size-body` 1rem, `--size-small` 0.875rem (oraz `--size-h1..h4`). Żadnych innych `font-size` w treści strony (panel `.ds-*` wyłączony z tej zasady).
- Brak tekstu wersalikami poza przyciskami i intro (`text-transform: uppercase`). Brak etykiet „eyebrow”.
- Kontrast tekstu ≥ 4.5:1 w obu motywach (na `--background`, `--surface`, `--background-deep`).
- `prefers-reduced-motion` i `prefers-reduced-transparency` muszą dalej działać. Animacja nie może ukrywać treści domyślnie.
- Nie commitujemy bez prośby Pawła. Zamiast kroku „Commit” jest „Checkpoint” (`git diff --stat`).
- Mechanika intro (`--intro-progress`, `.intro-stage`, `#page-content`) bez zmian.
- Podgląd: `http://127.0.0.1:4173/` (serwer już działa; jeśli nie: `cd /Users/pawelglen/Projects/AGorski && python3 -m http.server 4173 &`).

## Mapa plików

- Create: `scripts/check-contrast.mjs`: asercje kontrastu z `tokens.css` dla obu motywów.
- Create: `scripts/audit.html` + `scripts/audit-styles.mjs`: audyt computed styles (nagłówki, rozmiary tekstu, wersaliki) przy zadanej szerokości i motywie.
- Modify: `css/tokens.css`: kolory, skala typografii, odstępy.
- Modify: `css/style.css`: wspólne reguły nagłówków, role kolorów, intro, ruch.
- Modify: `index.html`: etykiety, H1, hook jako `<h2>`, karta intro, linki `tel:`, wersja `?v=17`.
- Modify: `js/main.js`: usunięcie rotatora intro.
- Modify: `js/design-system.js`: tokeny widoczne w panelu.
- Modify: `CONTEXT.md`: nowy wpis 0.2.

---

### Task 1: Bramka kontrastu i tokeny kolorów

**Files:**
- Create: `scripts/check-contrast.mjs`
- Modify: `css/tokens.css`
- Modify: `js/design-system.js:11-23` (lista `THEME_COLORS`)

**Interfaces:**
- Produces: `node scripts/check-contrast.mjs` (kod wyjścia 0 = wszystkie pary ≥ próg); w `tokens.css` tokeny `--text-muted`, `--accent-brass`, `--accent-brass-hover` w nowych wartościach, brak `--accent-green`.

- [ ] **Step 1: Napisz test (skrypt)**

Utwórz `scripts/check-contrast.mjs`:

```js
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8');

function grab(re) {
  const m = css.match(re);
  const out = {};
  if (m) {
    for (const [, key, value] of m[1].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
      out[key] = value;
    }
  }
  return out;
}

const dark = grab(/:root\s*\{([^}]*)\}/);
const light = { ...dark, ...grab(/:root\[data-theme="light"\]\s*\{([^}]*)\}/) };

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ['--background', '--surface', '--background-deep'];
const TEXTS = ['--text', '--text-secondary', '--text-muted', '--accent-brass', '--accent-brass-hover'];
const MIN = 4.5;

let failures = 0;
for (const [name, theme] of [['dark', dark], ['light', light]]) {
  for (const t of TEXTS) {
    for (const s of SURFACES) {
      const r = ratio(theme[t], theme[s]);
      const ok = r >= MIN;
      if (!ok) failures++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(5)} ${t} on ${s}: ${r.toFixed(2)}:1`);
    }
  }
  // Button label (--background-deep) on the brass fill.
  const r = ratio(theme['--background-deep'], theme['--accent-brass']);
  const ok = r >= MIN;
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(5)} button label on --accent-brass: ${r.toFixed(2)}:1`);
}

if (css.includes('--accent-green')) {
  failures++;
  console.log('FAIL --accent-green still defined in tokens.css');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall pairs pass');
process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Uruchom, potwierdź że pada**

Run: `cd /Users/pawelglen/Projects/AGorski && node scripts/check-contrast.mjs; echo "exit=$?"`
Expected: linie `FAIL` dla jasnego motywu (`--text-muted`, `--accent-brass`, `--accent-brass-hover` na powierzchniach), dla ciemnego `--text-muted on --surface: 4.17:1`, `FAIL --accent-green still defined`, `exit=1`.

- [ ] **Step 3: Zmień tokeny kolorów**

W `css/tokens.css` zmień w bloku `:root`:
- `--text-muted: #8F8672;` → `--text-muted: #A39A86;`
- usuń linię `--accent-green: #3B5D45;`

W bloku `:root[data-theme="light"]`:
- `--text-muted: #8F8672;` → `--text-muted: #675E4C;`
- `--accent-brass: #8C6D3F;` → `--accent-brass: #75592F;`
- `--accent-brass-hover: #6E5530;` → `--accent-brass-hover: #5E4727;`
- usuń linię `--accent-green: #3B5D45;`

W `js/design-system.js` usuń z `THEME_COLORS` linię:
```js
    { key: '--accent-green', label: 'Zieleń' },
```

- [ ] **Step 4: Uruchom, potwierdź że przechodzi**

Run: `node scripts/check-contrast.mjs; echo "exit=$?"`
Expected: same `ok`, `all pairs pass`, `exit=0`.

- [ ] **Step 5: Checkpoint**

Run: `git diff --stat css/tokens.css js/design-system.js`
Expected: dwa zmienione pliki. (Bez commita.)

---

### Task 2: Harness audytu computed styles (test, który najpierw pada)

**Files:**
- Create: `scripts/audit.html`
- Create: `scripts/audit-styles.mjs`

**Interfaces:**
- Produces: `node scripts/audit-styles.mjs` sprawdza szerokości 1440 i 390 w motywach dark i light; wyjście 0 = wszystkie asercje spełnione. `scripts/audit.html?w=<px>&theme=<dark|light>` wypisuje JSON w `<pre id="AUDIT">`.

- [ ] **Step 1: Napisz stronę audytu**

Utwórz `scripts/audit.html`:

```html
<!doctype html>
<meta charset="utf-8">
<title>audit</title>
<body style="margin:0">
<script>
(function () {
  var q = new URLSearchParams(location.search);
  var w = parseInt(q.get('w'), 10) || 1440;
  var theme = q.get('theme') || 'dark';
  var f = document.createElement('iframe');
  f.style.cssText = 'width:' + w + 'px;height:900px;border:0';
  f.src = '../index.html';
  document.body.appendChild(f);
  f.onload = function () {
    var win = f.contentWindow;
    var d = f.contentDocument;
    d.documentElement.setAttribute('data-theme', theme);
    win.document.fonts.ready.then(function () {
      setTimeout(function () {
        function style(el) {
          var cs = win.getComputedStyle(el);
          return {
            font: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
            size: cs.fontSize,
            weight: cs.fontWeight,
            color: cs.color
          };
        }
        function skip(el) {
          return el.closest('.ds-panel, .intro-screen, .site-tools');
        }
        var out = { width: w, theme: theme, bodyColor: win.getComputedStyle(d.body).color, headings: {}, textSizes: {}, upper: [] };
        ['h1', 'h2', 'h3', 'h4'].forEach(function (tag) {
          var seen = {};
          d.querySelectorAll(tag).forEach(function (el) {
            if (skip(el)) return;
            var s = style(el);
            seen[s.font + '|' + s.size + '|' + s.weight + '|' + s.color] = (el.textContent || '').trim().slice(0, 30);
          });
          out.headings[tag] = seen;
        });
        d.querySelectorAll('p, li, address, label, time').forEach(function (el) {
          if (skip(el)) return;
          var s = win.getComputedStyle(el).fontSize;
          (out.textSizes[s] = out.textSizes[s] || []).push((el.textContent || '').trim().slice(0, 24));
        });
        d.querySelectorAll('body *').forEach(function (el) {
          if (skip(el)) return;
          if (el.closest('.button-primary, .button-alert, button')) return;
          var cs = win.getComputedStyle(el);
          if (cs.textTransform === 'uppercase' && (el.textContent || '').trim()) {
            out.upper.push((el.className || el.tagName) + ': ' + (el.textContent || '').trim().slice(0, 24));
          }
        });
        var pre = document.createElement('pre');
        pre.id = 'AUDIT';
        pre.textContent = JSON.stringify(out);
        document.body.appendChild(pre);
      }, 400);
    });
  };
})();
</script>
```

- [ ] **Step 2: Napisz asercje**

Utwórz `scripts/audit-styles.mjs`:

```js
import { execFileSync } from 'node:child_process';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const ALLOWED_TEXT_PX = new Set(['14px', '16px', '18px']);

function run(w, theme) {
  const dom = execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--virtual-time-budget=10000', '--dump-dom',
    `${BASE}/scripts/audit.html?w=${w}&theme=${theme}`
  ], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const m = dom.match(/<pre id="AUDIT">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error(`no AUDIT output for ${w}/${theme}`);
  const json = m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return JSON.parse(json);
}

let failures = 0;
function check(label, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' :: ' + detail : ''}`);
}

for (const [w, theme] of [[1440, 'dark'], [1440, 'light'], [390, 'dark'], [390, 'light']]) {
  const a = run(w, theme);
  const tag = `${w}/${theme}`;
  const sizeOf = (h) => parseFloat(Object.keys(a.headings[h])[0]?.split('|')[1] ?? '0');

  for (const h of ['h1', 'h2', 'h3', 'h4']) {
    const keys = Object.keys(a.headings[h]);
    check(`${tag} ${h}: one style`, keys.length === 1, keys.join('  //  '));
    const fonts = keys.map((k) => k.split('|')[0]);
    const want = h === 'h1' || h === 'h2' ? 'Bodoni Moda' : 'IBM Plex Sans';
    check(`${tag} ${h}: font ${want}`, fonts.every((f) => f === want), fonts.join(','));
    check(`${tag} ${h}: colour = body text`, keys.every((k) => k.split('|')[3] === a.bodyColor), keys.map((k) => k.split('|')[3]).join(','));
  }
  check(`${tag} h1 larger than h2`, sizeOf('h1') > sizeOf('h2'), `${sizeOf('h1')} vs ${sizeOf('h2')}`);
  check(`${tag} h2 larger than h3`, sizeOf('h2') > sizeOf('h3'), `${sizeOf('h2')} vs ${sizeOf('h3')}`);

  const sizes = Object.keys(a.textSizes);
  const stray = sizes.filter((s) => !ALLOWED_TEXT_PX.has(s));
  check(`${tag} text sizes only 14/16/18px`, stray.length === 0, stray.map((s) => `${s} (${a.textSizes[s].slice(0, 2).join(' | ')})`).join('; '));
  check(`${tag} no uppercase text`, a.upper.length === 0, a.upper.slice(0, 4).join('; '));
}

console.log(failures ? `\n${failures} failure(s)` : '\nall checks pass');
process.exit(failures ? 1 : 0);
```

- [ ] **Step 3: Uruchom, potwierdź że pada na obecnym kodzie**

Run: `cd /Users/pawelglen/Projects/AGorski && curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4173/scripts/audit.html && node scripts/audit-styles.mjs; echo "exit=$?"`
Expected: `200`, potem wiele `FAIL` (h2/h3 więcej niż jeden styl, kolor nagłówków ≠ tekst, rozmiary 15px/15.2px itd., wersaliki), `exit=1`.
Jeśli `no AUDIT output`: sprawdź, czy serwer działa i czy ścieżka `scripts/audit.html` zwraca 200.

- [ ] **Step 4: Checkpoint**

Run: `git status --short scripts/`
Expected: dwa nowe pliki. (Bez commita.)

---

### Task 3: Skala typografii, odstępy i wspólne reguły nagłówków

**Files:**
- Modify: `css/tokens.css`
- Modify: `css/style.css` (bloki wymienione niżej)
- Modify: `index.html` (etykiety, H1, hook, klasy `section-heading`)

**Interfaces:**
- Consumes: tokeny z Task 1.
- Produces: tokeny `--size-h1`, `--size-h2`, `--size-h3`, `--size-h4`, `--size-lead`, `--size-body`, `--size-small`, `--space-section-y`, `--space-section-y-lg` (wartości w `rem`, zmieniane media queries). Nazwy używane w Task 4–7.

- [ ] **Step 1: Dodaj tokeny skali**

W `css/tokens.css` w bloku `:root` zastąp dwa bloki (`--size-hero-heading`/`--size-body` oraz `--space-section-y`/`--space-section-y-lg`) tym:

```css
  /* Type scale. Bodoni Moda for H1/H2 only, IBM Plex Sans below. */
  --size-h1: 2.25rem;
  --size-h2: 1.75rem;
  --size-h3: 1.125rem;
  --size-h4: 1rem;
  --size-lead: 1.125rem;
  --size-body: 1rem;
  --size-small: 0.875rem;

  /* Section rhythm: tight on a phone, generous on a desktop. */
  --space-section-y: 4rem;
  --space-section-y-lg: 5rem;
```

Na końcu `css/tokens.css` dodaj:

```css
@media (min-width: 768px) {
  :root {
    --size-h1: 3rem;
    --size-h2: 2.125rem;
    --space-section-y: 5rem;
    --space-section-y-lg: 6.25rem;
  }
}
@media (min-width: 1100px) {
  :root {
    --size-h1: 4rem;
    --size-h2: 2.5rem;
    --space-section-y: 7rem;
    --space-section-y-lg: 8.5rem;
  }
}
```

- [ ] **Step 2: Wspólna definicja nagłówków**

W `css/style.css` zastąp blok (linie 27–32):

```css
h1, h2, h3, h4 {
  font-family: var(--font-heading);
  font-weight: 500;
  margin: 0 0 1rem;
  line-height: 1.2;
}
```
przez:

```css
h1, h2, h3, h4 {
  margin: 0 0 1rem;
  font-weight: 500;
  line-height: 1.2;
  color: var(--text);
  text-wrap: balance;
}
h1, h2 {
  font-family: var(--font-heading);
  letter-spacing: 0;
}
h1 { font-size: var(--size-h1); line-height: 1.1; }
h2 { font-size: var(--size-h2); }
h3, h4 {
  font-family: var(--font-body);
  font-weight: 600;
  line-height: 1.3;
}
h3 { font-size: var(--size-h3); }
h4 { font-size: var(--size-h4); }
```

- [ ] **Step 3: Usuń rozsiane reguły nagłówków i etykiet**

W `css/style.css` usuń w całości:
1. Komentarz i blok zaczynający się od `/* Serif (Bodoni Moda) stays reserved for large display moments` aż do końca reguły `.specjalizacje-card h3, .knowledge-card h3, .reason-item h3 { ... }`.
2. Blok `.section-eyebrow { ... }`.
3. Blok `.section-heading { font-size: 1.875rem; }`.
4. Blok `.rezerwacja-content h2 { font-size: var(--size-hero-heading); }`.
5. W `.hero h1` usuń linię `font-size: clamp(2.75rem, 4vw + 1.25rem, 4.25rem);` (zostaje `max-width: 27ch;`).
6. W `@media (max-width: 767px)` usuń linię `.hero h1 { font-size: 2.25rem; }`.

- [ ] **Step 4: Rozmiary tekstu z tokenów**

W `css/style.css` wykonaj te zamiany (szukaj po selektorze):

- `.section-intro`: dodaj `font-size: var(--size-lead);`
- `.hero__lead`: `font-size: 1.125rem;` → `font-size: var(--size-lead);`
- `.free-note`: `font-size: 0.875rem;` → `font-size: var(--size-small);`
- `.reason-item__description`: `font-size: 0.95rem;` → `font-size: var(--size-body);`
- `.specjalizacje-card p`: `font-size: 1rem;` → `font-size: var(--size-body);`
- `.specjalizacje-card li`: `font-size: 0.875rem;` → `font-size: var(--size-small);`
- `.specjalizacje-card .more-link`: `font-size: 0.875rem;` → `font-size: var(--size-small);`
- `.step__num`: `font-size: 0.8125rem;` → `font-size: var(--size-small);` oraz usuń `letter-spacing: 0.12em;`
- `.step p`: `font-size: 0.9375rem;` → `font-size: var(--size-body);`
- `.urgent-cta-link__title`: `font-size: 1.0625rem;` → `font-size: var(--size-h3);`
- `.urgent-cta-link__go`: zastąp całą zawartość przez:
  ```css
  font-size: var(--size-small);
  color: var(--accent-brass);
  white-space: nowrap;
  ```
- `.bio-intro`: zastąp zawartość przez:
  ```css
  font-size: var(--size-lead);
  line-height: 1.5;
  margin-bottom: 1.25rem;
  ```
- `.bio-placeholder`: `font-size: 0.9375rem;` → `font-size: var(--size-body);`
- `.credentials`: `font-size: 0.875rem;` → `font-size: var(--size-small);`
- `.knowledge-card__date`: `font-size: 0.8125rem;` → `font-size: var(--size-small);` oraz usuń `letter-spacing: 0.04em;`
- `.knowledge-card h3`: usuń `font-size: 1.0625rem;` (zostaje `line-height: 1.4; margin-bottom: 0.875rem;`)
- `.knowledge-card__tag`: `font-size: 0.8125rem;` → `font-size: var(--size-small);`
- `.rezerwacja-signal`: `font-size: 0.875rem;` → `font-size: var(--size-small);`
- `.rezerwacja-address`: `font-size: 0.9375rem;` → `font-size: var(--size-body);`
- `.rezerwacja-hours`: `font-size: 0.9375rem;` → `font-size: var(--size-body);`
- `.form-warning`: `font-size: 0.875rem;` → `font-size: var(--size-small);`
- `.form-field label`: `font-size: 0.8125rem;` → `font-size: var(--size-small);` oraz usuń `letter-spacing: 0.04em;`
- `.form-consent`: `font-size: 0.8125rem;` → `font-size: var(--size-small);`
- `.footer-grid h4`: zastąp zawartość przez `margin-bottom: 1rem;`
- `.footer-grid p, .footer-grid a`: `font-size: 0.9375rem;` → `font-size: var(--size-body);`
- `.footer-assoc`: `font-size: 0.875rem;` → `font-size: var(--size-small);`
- `.footer-disclaimer`: `font-size: 0.8125rem;` → `font-size: var(--size-small);`
- `.footer-bottom`: `font-size: 0.8125rem;` → `font-size: var(--size-small);`
- `.reason-item h3`: zastąp zawartość przez `margin: 0;`
- `.step h3`: zastąp zawartość przez `margin-bottom: 0.5rem;`
- `.specjalizacje-card h3`: zastąp zawartość przez `margin-bottom: 0.5rem;`

- [ ] **Step 5: Hook „Modelu pracy” jako H2**

W `css/style.css` zastąp blok `.reason-band__hook`:

```css
.reason-band__hook {
  font-style: italic;
  line-height: 1.35;
  max-width: 40ch;
  margin: 0 0 4rem;
}
```

W `index.html` zamień:
```html
        <p class="reason-band__hook">To, kto odbiera telefon w pierwszych godzinach, często decyduje
          o dalszym przebiegu sprawy.</p>
```
na:
```html
        <h2 class="reason-band__hook">To, kto odbiera telefon w pierwszych godzinach, często decyduje
          o dalszym przebiegu sprawy.</h2>
```

- [ ] **Step 6: Markup: etykiety, H1, klasy**

W `index.html`:
1. Usuń linię `<span class="section-eyebrow">Kancelaria Adwokacka · Adwokat karnista</span>`.
2. Zmień H1 na: `<h1>Adwokat karny w Warszawie. Obrona i reprezentacja pokrzywdzonych.</h1>`
3. Usuń linię `<span class="section-eyebrow">Adwokat</span>` (sekcja `#adwokat`).
4. Usuń linię `<span class="section-eyebrow">Rezerwacja</span>`.
5. Trzy razy `<h2 class="section-heading">` → `<h2>` (Specjalizacje, Sprawa pilna, Publikacje).

- [ ] **Step 7: Uruchom audyt**

Run: `node scripts/audit-styles.mjs; echo "exit=$?"`
Expected: wszystkie asercje o H1–H4 (jeden styl, font, kolor = tekst), rozmiarach 14/16/18px i braku wersalików są `ok`. Jeśli coś pada, `detail` wskazuje element (np. `15px (Kancelaria Adw…)`): popraw odpowiednią regułę i uruchom ponownie. Celem jest `exit=0`.
Uwaga: jeśli w `upper` zostaje coś spoza przycisków/intro, usuń `text-transform: uppercase` z tej reguły.

- [ ] **Step 8: Checkpoint**

Run: `git diff --stat css/ index.html`
Expected: zmienione `css/style.css`, `css/tokens.css`, `index.html`. (Bez commita.)

---

### Task 4: Mapa ról kolorów w sekcjach (mosiądz = klikalne, zieleni brak)

**Files:**
- Modify: `css/style.css`

**Interfaces:**
- Consumes: tokeny z Task 1 i 3.

- [ ] **Step 1: Test: szukaj naruszeń**

Run: `grep -n "accent-green" css/style.css; grep -n "border-left: [2-9]" css/style.css; grep -n "border-right: [2-9]" css/style.css`
Expected (przed zmianą): kilka trafień `accent-green` (kropka przycisku, tint hero, border i tag kart publikacji) oraz `border-left: 2px solid var(--accent-alert)` w `.form-warning`.

- [ ] **Step 2: Usuń zieleń**

W `css/style.css`:
1. `.button-alert__dot`: `background-color: var(--accent-green);` → `background-color: var(--accent-brass);`. To samo w `.button-alert__dot::after`.
2. `.hero__media::after`: zastąp `background: ... ;` dwiema warstwami przez jedną:
   ```css
     background: linear-gradient(180deg, color-mix(in srgb, var(--background) 58%, transparent) 0%, color-mix(in srgb, var(--background) 88%, transparent) 100%);
   ```
3. `.knowledge-card`: zastąp zawartość przez:
   ```css
     display: block;
     border-top: 1px solid var(--border);
     padding-top: 1.5rem;
   ```
   Usuń reguły `.knowledge-card:hover { padding-left: 0.5rem; }`, `.knowledge-card:hover .knowledge-card__tag { ... }` i nagłówkowy komentarz „(minimal, green divider)” zmień na „(minimal)”.
4. `.knowledge-card__tag`: zastąp zawartość przez:
   ```css
     display: inline-block;
     font-size: var(--size-small);
     color: var(--text-muted);
   ```
   Dodaj po niej:
   ```css
   .knowledge-card:hover h3,
   .knowledge-card:focus-visible h3 {
     text-decoration: underline;
     text-decoration-color: var(--accent-brass);
     text-underline-offset: 0.25em;
   }
   ```
5. Komentarz nagłówkowy „Model Pracy / Reason to believe (green identity)” → „Model Pracy / Reason to believe”.

- [ ] **Step 3: Mosiądz tylko dla klikalnego**

W `css/style.css`:
1. `.specjalizacje-card`: zastąp zawartość przez:
   ```css
     border-top: 1px solid var(--border);
     padding-top: 1.5rem;
   ```
   Usuń w całości regułę `.specjalizacje-card:hover { ... }`.
2. `.specjalizacje-card li::before`: `background-color: var(--accent-brass);` → `background-color: var(--text-muted);`
3. `.specjalizacje-card:hover .more-link { border-color: var(--accent-brass); }` zostaje (link jest klikalny).
4. Komentarz „Specjalizacje (brass identity)” → „Specjalizacje”.
5. `.step__num`: `color: var(--accent-alert);` → `color: var(--text-muted);`

- [ ] **Step 4: Ramka ostrzeżenia bez bocznego paska**

W `css/style.css` zastąp `.form-warning`:

```css
.form-warning {
  border: 1px solid color-mix(in srgb, var(--accent-alert) 45%, var(--border));
  padding: 0.875rem 1.25rem;
  font-size: var(--size-small);
  color: var(--text-secondary);
  background-color: color-mix(in srgb, var(--accent-alert) 6%, transparent);
  margin-bottom: 1.5rem;
}
```

- [ ] **Step 5: Uruchom kontrole**

Run: `grep -c "accent-green" css/style.css; grep -c "border-left: [2-9]" css/style.css; node scripts/check-contrast.mjs | tail -1; node scripts/audit-styles.mjs | tail -1`
Expected: `0`, `0`, `all pairs pass`, `all checks pass`.

- [ ] **Step 6: Checkpoint**

Run: `git diff --stat css/style.css`
(Bez commita.)

---

### Task 5: Intro jako karta połączenia

**Files:**
- Modify: `index.html` (sekcja `.intro-screen`, link czcionek)
- Modify: `css/style.css` (blok intro)
- Modify: `js/main.js` (usunięcie rotatora)
- Modify: `js/design-system.js` (Boldonse, tokeny typografii)

**Interfaces:**
- Consumes: `--intro-red`, `--intro-black`, tokeny rozmiarów z Task 3. Zdjęcie: `img/arkadiusz-gorski-portret.webp` (istnieje).
- Produces: klasy `.call-card`, `.call-card__photo`, `.call-card__status`, `.call-card__dot`, `.call-card__name`, `.call-card__role`, `.call-card__call`, `.call-card__disc`, `.call-card__label`, `.call-card__number`, `.intro-screen__line`.

- [ ] **Step 1: Test: stary rotator jeszcze jest**

Run: `grep -c "intro-screen__rotator" index.html css/style.css js/main.js`
Expected (przed): niezerowe liczby w trzech plikach.

- [ ] **Step 2: Markup karty**

W `index.html` zastąp całą zawartość `<section class="intro-screen" id="intro-screen"> ... </section>` przez:

```html
  <section class="intro-screen" id="intro-screen">
    <span class="sr-only">Adwokat karny Arkadiusz Górski. Zatrzymanie, przeszukanie, wezwanie na przesłuchanie:
      zanim cokolwiek powiesz, zadzwoń.</span>
    <div class="intro-screen__body">
      <div class="call-card">
        <img class="call-card__photo" src="img/arkadiusz-gorski-portret.webp" alt="" width="144" height="144">
        <p class="call-card__status"><span class="call-card__dot" aria-hidden="true"></span>Dostępny 24/7</p>
        <p class="call-card__name">Adw. Arkadiusz Górski</p>
        <p class="call-card__role">Adwokat karny · Warszawa</p>
        <a class="call-card__call" href="tel:+48792892457" aria-label="Zadzwoń do adwokata: 792 892 457">
          <span class="call-card__disc">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z"/></svg>
          </span>
          <span class="call-card__label">Zadzwoń</span>
        </a>
        <p class="call-card__number">792 892 457</p>
      </div>
      <p class="intro-screen__line" aria-hidden="true">Zatrzymanie? Przeszukanie? Wezwanie?<strong>Zanim cokolwiek powiesz.</strong></p>
    </div>
  </section>
```

W linku czcionek Google (linia 10) usuń fragment `&family=Boldonse`.

- [ ] **Step 3: CSS karty**

W `css/style.css`:
1. Zastąp blok `.intro-screen__body { ... }` przez:
   ```css
   .intro-screen__body {
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     gap: 2.5rem;
     min-height: 100%;
     padding: 4rem 1.5rem 3rem;
     text-align: center;
   }
   ```
2. Usuń w całości bloki: komentarz „Headline: single word element…” razem z `.intro-screen__headline-wrap`, `.intro-screen__rotator`, `.intro-screen__rotator-word`, `.intro-screen__bottom`, `.intro-screen__subheader`, `.intro-screen__cta`, `.intro-screen__cta:hover`, `.intro-screen__cta:active`, `.intro-screen__cta-icon`, `.intro-screen__cta-text`, `.intro-screen__cta-text strong`, `.intro-screen__cta-text span` oraz blok `@media (prefers-reduced-motion: reduce) { .intro-screen__rotator-word { ... } }`.
3. W miejscu usuniętych bloków wstaw:
   ```css
   /* Incoming-call card: the red screen is what you see while a call is
      about to be placed, so the first thing on the page is a contact, not
      a banner. Phone-first; on a wide screen it is the same card, centred. */
   .call-card {
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: 0.375rem;
     width: min(100%, 22rem);
   }
   .call-card__photo {
     width: 9rem;
     height: 9rem;
     border-radius: 50%;
     object-fit: cover;
     border: 3px solid var(--intro-black);
     margin-bottom: 0.75rem;
   }
   .call-card__status {
     display: inline-flex;
     align-items: center;
     gap: 0.5rem;
     margin: 0;
     font-size: var(--size-small);
     font-weight: 600;
   }
   .call-card__dot {
     width: 0.5rem;
     height: 0.5rem;
     border-radius: 50%;
     background-color: var(--intro-black);
   }
   .call-card__name {
     margin: 0.25rem 0 0;
     font-family: var(--font-heading);
     font-weight: 500;
     font-size: var(--size-h2);
     line-height: 1.15;
   }
   .call-card__role {
     margin: 0;
     font-size: var(--size-lead);
   }
   .call-card__call {
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: 0.625rem;
     margin-top: 1.75rem;
     color: var(--intro-black);
     font-weight: 600;
   }
   .call-card__disc {
     display: inline-flex;
     align-items: center;
     justify-content: center;
     width: 5.5rem;
     height: 5.5rem;
     border-radius: 50%;
     background-color: var(--intro-black);
     color: #fff;
     transition: transform 0.16s ease-out;
   }
   .call-card__disc svg {
     width: 2.25rem;
     height: 2.25rem;
   }
   .call-card__call:hover .call-card__disc { transform: scale(1.04); }
   .call-card__call:active .call-card__disc { transform: scale(0.96); }
   .call-card__call:focus-visible { outline: 3px solid #fff; outline-offset: 6px; border-radius: 2rem; }
   .call-card__number {
     margin: 0;
     font-size: var(--size-lead);
     font-weight: 600;
     letter-spacing: 0.02em;
   }
   .intro-screen__line {
     margin: 0;
     max-width: 28ch;
     font-size: var(--size-lead);
     line-height: 1.4;
   }
   .intro-screen__line strong {
     display: block;
     font-weight: 600;
   }
   @media (prefers-reduced-motion: reduce) {
     .call-card__disc { transition: none; }
   }
   ```

- [ ] **Step 4: Usuń rotator z JS**

W `js/main.js` usuń cały blok od komentarza `// Rotator headline: a single word element.` (linia ~88) do zamykającego `}` instrukcji `if (rotator && wordEl) { ... }` (kończy się bezpośrednio przed `var siteNav = document.querySelector('.site-nav');`). Zostaw pustą linię przed `var siteNav`.

- [ ] **Step 5: Boldonse i panel**

W `js/design-system.js`:
1. Usuń z `FONTS` linię `"'Boldonse', sans-serif",`.
2. Zastąp `TYPE_TOKENS` przez:
   ```js
     var TYPE_TOKENS = [
       { key: '--font-heading', label: 'Font nagłówków', kind: 'font' },
       { key: '--font-body', label: 'Font treści', kind: 'font' },
       { key: '--size-h1', label: 'H1 (rem)', kind: 'rem' },
       { key: '--size-h2', label: 'H2 (rem)', kind: 'rem' },
       { key: '--size-h3', label: 'H3 (rem)', kind: 'rem' },
       { key: '--size-lead', label: 'Lead (rem)', kind: 'rem' },
       { key: '--size-body', label: 'Treść (rem)', kind: 'rem' },
       { key: '--size-small', label: 'Drobny tekst (rem)', kind: 'rem' }
     ];
   ```

- [ ] **Step 6: Sprawdź**

Run: `grep -c "rotator\|Boldonse" index.html css/style.css js/main.js js/design-system.js; node --check js/main.js && node --check js/design-system.js && echo syntax-ok`
Expected: same `0`, `syntax-ok`.
Następnie zrzut intro (mobile i desktop):
```bash
S=/private/tmp/claude-501/-Users-pawelglen-Projects-AGorski/bbcba996-ca29-4dbb-95ec-755522581766/scratchpad
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=6000 --window-size=390,844 --screenshot=$S/intro-390.png "http://127.0.0.1:4173/?v=intro" 2>/dev/null
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=6000 --window-size=1440,900 --screenshot=$S/intro-1440.png "http://127.0.0.1:4173/?v=intro" 2>/dev/null
```
Otwórz oba PNG (Read) i sprawdź: karta mieści się w viewporcie 390×844 bez przycinania, zdjęcie okrągłe, przycisk Zadzwoń widoczny bez scrolla, linia „Zatrzymanie? Przeszukanie? Wezwanie?” pod kartą czytelna.

- [ ] **Step 7: Checkpoint**

Run: `git diff --stat index.html css/style.css js/`
(Bez commita.)

---

### Task 6: „Pomoc 24/7” prowadzi do telefonu

**Files:**
- Modify: `index.html` (trzy linki)

- [ ] **Step 1: Test: martwy link**

Run: `grep -n 'pomoc-w-zatrzymaniach.html' index.html`
Expected (przed): trzy trafienia: nawigacja (`button-alert--nav`), hero (`button-alert`), stopka („Pomoc 24/7”) oraz czwarte: `urgent-cta-link` („Co robić w pierwszych godzinach…”) — ten ostatni zostaje nietknięty (wymaga treści od Adwokata, osobna decyzja).

- [ ] **Step 2: Zmień trzy linki**

W `index.html` zamień `href="pomoc-w-zatrzymaniach.html"` na `href="tel:+48792892457"` w:
1. `<a class="button-alert button-alert--nav" ...>` (nawigacja),
2. `<a class="button-alert" ...>` (hero),
3. `<a href="pomoc-w-zatrzymaniach.html">Pomoc 24/7</a>` (stopka).

Nie zmieniaj `<a class="urgent-cta-link" ...>`.

- [ ] **Step 3: Sprawdź**

Run: `grep -c 'pomoc-w-zatrzymaniach.html' index.html; grep -c 'tel:+48792892457' index.html`
Expected: `1` (tylko `urgent-cta-link`) i `7` trafień `tel:`: intro, zakomentowany pasek `.intro-floating-cta`, rezerwacja, numer w stopce (te cztery były już wcześniej) plus trzy nowe: nawigacja, hero i stopka „Pomoc 24/7”. Po Tasku 5 intro jest już kartą `.call-card__call`, ale nadal jest to jedno trafienie, więc suma się nie zmienia.

- [ ] **Step 4: Checkpoint**

Run: `git diff index.html | grep '^[+-].*tel:' | head`

---

### Task 7: Tryb desktop: spokojne odsłanianie treści

**Files:**
- Modify: `css/style.css` (na końcu pliku, przed blokiem `/* mobile nav open state */` lub po nim)

**Interfaces:**
- Consumes: sekcje i karty z poprzednich zadań.

- [ ] **Step 1: Dodaj ruch (tylko desktop, z alternatywą)**

Dopisz na końcu `css/style.css`:

```css
/* ---------- Desktop reveal ----------
   Desktop mode only: a phone visitor may be mid-crisis, so nothing there
   waits on an animation. Scroll-driven (no JS), and content is fully
   visible by default: browsers without animation-timeline, and anyone who
   prefers reduced motion, simply get the static page. */
@keyframes rise-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
@media (min-width: 992px) and (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    main h2,
    .section-intro,
    .reason-item,
    .specjalizacje-card,
    .step,
    .bio-grid > *,
    .knowledge-card {
      animation: rise-in linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 45%;
    }
  }
}
```

- [ ] **Step 2: Sprawdź, że nic nie ginie**

Run: `node scripts/audit-styles.mjs | tail -1`
Expected: `all checks pass` (audyt nie zależy od ruchu).
Ręcznie: otwórz `http://127.0.0.1:4173/?v=motion` w przeglądarce na szerokim oknie i przewiń: nagłówki i karty mają się łagodnie odsłaniać. Poniżej 992px lub z włączonym „Reduce motion” treść ma być statyczna.

- [ ] **Step 3: Checkpoint**

Run: `git diff --stat css/style.css`

---

### Task 8: Weryfikacja końcowa, dokumentacja, wersja

**Files:**
- Modify: `index.html` (`?v=16` → `?v=17`)
- Modify: `CONTEXT.md` (nowy wpis na górze)

- [ ] **Step 1: Podbij wersję**

Run: `cd /Users/pawelglen/Projects/AGorski && sed -i '' 's/?v=16/?v=17/g' index.html && grep -c '?v=17' index.html`
Expected: `4`.

- [ ] **Step 2: Wszystkie bramki**

Run:
```bash
node scripts/check-contrast.mjs | tail -1
node scripts/audit-styles.mjs | tail -1
node --check js/main.js && node --check js/design-system.js && echo syntax-ok
/Users/pawelglen/.claude/skills/impeccable/scripts/impeccable detect --json css/style.css index.html js/design-system.js | head -c 4000
```
Expected: `all pairs pass`, `all checks pass`, `syntax-ok`. W raporcie detektora nie ma już: `low-contrast` (zielony, 4.2:1), `all-caps-body`, `kicker-above-heading`, `skipped-heading`, `layout-transition`. Mogą zostać `gpt-thin-border-wide-shadow` (panel design-systemu, narzędzie deweloperskie) i `numbered-section-labels` (prawdziwa sekwencja 01–03, świadomie zostaje). Jeśli pojawi się coś innego z nowych zmian, popraw.

- [ ] **Step 3: Zrzuty (jedna seria + kontrolna)**

```bash
S=/private/tmp/claude-501/-Users-pawelglen-Projects-AGorski/bbcba996-ca29-4dbb-95ec-755522581766/scratchpad
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for spec in "1440,4200,desktop" "390,5200,mobile"; do IFS=, read w h n <<< "$spec"
  for theme in dark light; do
    $C --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=8000 --window-size=$w,$h --screenshot=$S/full-$n-$theme.png "http://127.0.0.1:4173/?v=17&theme=$theme" 2>/dev/null
  done
done
ls -la $S/full-*.png
```
Uwaga: zrzut pełnej strony w headless obejmuje tylko to, co mieści się w `--window-size`; intro jest `position: fixed` i przykrywa pierwszy ekran do przewinięcia (mechanika bez zmian). Jeśli zrzut pokazuje tylko intro, użyj zamiast tego audytu wizualnego przez iframe: otwórz `http://127.0.0.1:4173/scripts/audit.html?w=1440&theme=light` w zwykłym oknie Chrome i przewiń ręcznie. Oceń (Read na PNG): jednolite nagłówki, brak zielonego i żółtych nagłówków, kontrast tekstu w jasnym motywie, brak nakładania i przycięć na 390px. Wszystkie wykryte problemy popraw jedną serią, potem jeszcze jedna kontrola i koniec.

- [ ] **Step 4: Wpis w CONTEXT.md**

W `CONTEXT.md` po pierwszej linii nagłówka (`# PROJEKT: ...`) wstaw przed sekcją `## 0.1`:

```markdown
## 0.2 JEDNOLITY SYSTEM WIZUALNY + DWA TRYBY (2026-09-30)

Zastępuje plan stylowania sekcji z §5 (każda sekcja miała „kolor tożsamości”: zielony, mosiądz, biały). Spec: `docs/superpowers/specs/2026-09-30-unified-design-system-design.md`, plan: `docs/superpowers/plans/2026-09-30-unified-design-system.md`.

- **Kolor:** nagłówki zawsze `--text`. Mosiądz wyłącznie dla tego, co klikalne (przyciski, linki, focus). Zieleń usunięta (token też). Czerwień tylko: Pomoc 24/7, „syrena”, intro, ramka ostrzeżenia.
- **Typografia:** Bodoni Moda dla H1/H2 (+ wordmark nawigacji, numer telefonu w rezerwacji, nazwisko na karcie intro), IBM Plex Sans reszta. Boldonse usunięty. Skala w tokenach `--size-h1..h4`, `--size-lead/body/small`; tylko 14/16/18px w tekście. Bez etykiet „eyebrow”.
- **Dwa tryby:** telefon = tryb kryzysowy (ciaśniejsze odstępy, bez animacji); desktop = elegancki (odstępy rosną w tokenach przy 768px i 1100px, odsłanianie treści przez `animation-timeline: view()` od 992px, bez JS, z `prefers-reduced-motion`).
- **Intro:** karta połączenia (zdjęcie, „Adw. Arkadiusz Górski”, „Adwokat karny · Warszawa”, status 24/7, okrągły przycisk Zadzwoń) + cicha linia „Zatrzymanie? Przeszukanie? Wezwanie? Zanim cokolwiek powiesz.”. Rotator Boldonse usunięty z HTML/CSS/JS. Mechanika wycofania (`--intro-progress`) bez zmian.
- **SEO:** H1 „Adwokat karny w Warszawie. Obrona i reprezentacja pokrzywdzonych.”. Zdanie „To, kto odbiera telefon…” jest teraz `<h2>`.
- **Kontrast (policzony):** ciemny `--text-muted` `#A39A86`; jasny `--text-muted` `#675E4C`, `--accent-brass` `#75592F`, hover `#5E4727`.
- **„Pomoc 24/7”** prowadzi do `tel:+48792892457`: strony `pomoc-w-zatrzymaniach.html` nie ma (nie ma też `obszary-praktyki.html`, `blog.html`, `polityka-prywatnosci.html`).
- **Weryfikacja:** `node scripts/check-contrast.mjs` (kontrast z tokenów) i `node scripts/audit-styles.mjs` (computed styles przez iframe o zadanej szerokości, potrzebny działający serwer na :4173). **Lekcja:** szerokość okna headless wpływa na wyniki (`clamp()`, media queries); audyt mierzy więc w iframe o jawnej szerokości.
```

- [ ] **Step 5: Podsumowanie dla Pawła**

Wypisz: co zmienione (pliki), wyniki trzech bramek, załączone zrzuty, lista rzeczy poza zakresem: (a) martwe linki `obszary-praktyki.html`, `blog.html`, `polityka-prywatnosci.html` i `urgent-cta-link` do nieistniejącej strony pomocy, (b) zdjęcie tła w hero z `picsum.photos` (placeholder, a stopka deklaruje brak podmiotów trzecich), (c) `PRODUCT.md` ma przestarzałą sekcję `## Register`. Brak commita: zapytaj, czy commitować.

