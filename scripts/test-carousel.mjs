// Runs the real js/carousel.js against a fake track: 6 cards of 576px with a
// 20px gap and 140px padding, in a 1440px viewport. Checks that the arrows
// move one card at a time, the dots follow, the ends disable the right arrow,
// and the last card counts as current even though it can't reach the start edge.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../js/carousel.js', import.meta.url), 'utf8');
const CARD = 576, GAP = 20, PAD = 140, VIEW = 1440, N = 6;

const listeners = {};
const mkBtn = () => { const l = {}; return { disabled: false, attrs: {}, l,
  addEventListener: (e, f) => { l[e] = f; }, click() { l.click && l.click(); },
  setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; } }; };

const track = {
  scrollLeft: 0,
  clientWidth: VIEW,
  scrollWidth: PAD + N * CARD + (N - 1) * GAP + PAD,
  children: Array.from({ length: N }, (_, i) => ({ offsetLeft: PAD + i * (CARD + GAP) })),
  scrollTo(o) { this.scrollLeft = o.left; this.log.push(o.left); (listeners.scroll || (() => {}))(); },
  addEventListener: (e, f) => { listeners[e] = f; }, log: [],
};
const prev = mkBtn(), next = mkBtn(), dots = Array.from({ length: N }, mkBtn);
const root = {
  querySelector: (q) => q.includes('track') ? track : q.includes('prev') ? prev : q.includes('next') ? next : null,
  querySelectorAll: () => dots,
};
const ctx = {
  window: { matchMedia: () => ({ matches: false }), addEventListener() {}, requestAnimationFrame: (f) => f() },
  document: { querySelectorAll: () => [root], fonts: null },
  Array,
};
vm.createContext(ctx);
vm.runInContext(code, ctx);

let bad = 0;
const check = (name, ok) => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`); };
const active = () => dots.findIndex((d) => d.attrs['aria-current'] === 'true');

check('starts on card 1, prev disabled, next enabled', active() === 0 && prev.disabled && !next.disabled);
next.click();
check('next goes to card 2 (scrolls one card + gap)', track.scrollLeft === CARD + GAP && active() === 1 && !prev.disabled);
next.click(); next.click();
check('three nexts reach card 4', active() === 3);
dots[1].click();
check('dot 2 jumps back to card 2', active() === 1 && track.scrollLeft === CARD + GAP);
const max = track.scrollWidth - track.clientWidth;
for (let i = 0; i < 10; i++) next.click();
check('end of the track: next disabled, scroll capped at the maximum', next.disabled && track.scrollLeft === max);
check('last card is the active dot even though it cannot reach the start edge', active() === N - 1);
prev.click();
check('prev from the end goes back one card and re-enables next', active() < N - 1 && !next.disabled);
console.log(bad ? `\n${bad} failure(s)` : '\nall carousel checks pass');
process.exit(bad ? 1 : 0);
