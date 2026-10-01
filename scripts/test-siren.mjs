// Runs the real js/siren.js against a tiny fake DOM and a simulated clock, and
// checks the behaviour that matters: flashes are irregular, never closer than
// the WCAG limit, the lights sit at exactly zero between flashes, and they are
// stronger/deeper while scrolling than while parked.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../js/siren.js', import.meta.url), 'utf8');
const W = 1200, H = 830, FRAME = 1000 / 60;

function run(label, { seconds, scrolling, seed }) {
  // deterministic Math.random so a failure can be reproduced
  let s = seed;
  const random = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

  const mkLight = () => ({ style: { opacity: '0', transform: '' } });
  const red = mkLight(), blue = mkLight();
  const rim = { querySelector: (q) => (q.includes('red') ? red : blue) };
  const section = {
    clientWidth: W, clientHeight: H,
    querySelector: (q) => (q === '.siren-rim' ? rim : null),
  };
  let now = 0, scrollY = 1000, pending = null;
  const win = {
    scrollY: 1000,
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
  };
  const ctx = {
    window: win,
    document: {
      hidden: false,
      querySelector: (q) => (q === '.sprawa-pilna-section' ? section : null),
      addEventListener() {},
    },
    performance: { now: () => now },
    requestAnimationFrame: (cb) => { pending = cb; return 1; },
    cancelAnimationFrame() {},
    getComputedStyle: () => ({ getPropertyValue: () => '1' }),
    IntersectionObserver: class { constructor(cb) { this.cb = cb; } observe() { this.cb([{ isIntersecting: true }]); } },
    Math: Object.assign(Object.create(Math), { random }),
    parseFloat,
  };
  win.requestAnimationFrame = ctx.requestAnimationFrame;
  win.IntersectionObserver = ctx.IntersectionObserver;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);

  const frames = [];
  const read = (L) => {
    const op = parseFloat(L.style.opacity || '0');
    const m = /translate3d\(([-\d.]+)px,([-\d.]+)px,0\) scale\(([-\d.]+),([-\d.]+)\)/.exec(L.style.transform || '');
    // reach into the card is the smaller of the two scales
    return { o: op, x: m ? +m[1] + 280 : null, y: m ? +m[2] + 280 : null, sc: m ? Math.min(+m[3], +m[4]) : null, st: m ? Math.max(+m[3], +m[4]) / Math.min(+m[3], +m[4]) : null };
  };
  const total = seconds * 1000;
  for (now = 0; now < total; now += FRAME) {
    if (scrolling) { scrollY = 1000 + 500 * Math.sin(now / 350); win.scrollY = scrollY; }
    const cb = pending; pending = null;
    if (cb) cb(now);
    frames.push({ t: now, L: [read(red), read(blue)] });
  }

  // analysis
  const onsets = [], who = [], prev = [0, 0];
  let zero = 0, sumLit = 0, nLit = 0, peak = 0;
  const scales = [], quad = [0, 0, 0, 0], reach = [];
  for (const fr of frames) {
    let allZero = true;
    fr.L.forEach((L, i) => {
      if (L.o > 0) allZero = false;
      if (prev[i] < 0.03 && L.o >= 0.03) { onsets.push(fr.t); who.push(i); }
      prev[i] = L.o;
      if (L.o > 0) { sumLit += L.o; nLit++; }
      if (L.o > peak) peak = L.o;
      if (L.sc !== null && L.o > 0.05) {
        scales.push(L.sc);
        quad[(L.y > H / 2 ? 2 : 0) + (L.x > W / 2 ? 1 : 0)]++;
      }
    });
    if (allZero) zero++;
  }
  const gaps = onsets.slice(1).map((t, i) => t - onsets[i]);
  // "blue, then red straight after": a blue flash (index 1) followed within
  // 700 ms by a red one (index 0), as a share of all blue flashes.
  let blueThenRed = 0, blues = 0, answered = 0;
  for (let i = 0; i < onsets.length - 1; i++) {
    if (who[i] === 1) {
      blues++;
      if (who[i + 1] === 0 && onsets[i + 1] - onsets[i] <= 700) blueThenRed++;
    }
    if (who[i + 1] !== who[i] && onsets[i + 1] - onsets[i] <= 700) answered++;
  }
  let max1s = 0;
  onsets.forEach((a) => { max1s = Math.max(max1s, onsets.filter((b) => b >= a && b < a + 1000).length); });
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  return {
    label, flashesPerMin: +(onsets.length / seconds * 60).toFixed(1),
    minGapMs: Math.round(Math.min(...gaps)), maxFlashesIn1s: max1s,
    pctFramesAllZero: +(zero / frames.length * 100).toFixed(1),
    peakOpacity: +peak.toFixed(2), meanOpacityWhenLit: +(sumLit / Math.max(1, nLit)).toFixed(3),
    scaleMinMeanMax: [Math.min(...scales), mean(scales), Math.max(...scales)].map((v) => +v.toFixed(2)),
    perimeterQuadrants: quad,
    blueThenRedWithin700msPct: +(blueThenRed / Math.max(1, blues) * 100).toFixed(0),
    anyAnswerWithin700msPct: +(answered / Math.max(1, onsets.length - 1) * 100).toFixed(0),
    gapSpreadMs: [Math.round(Math.min(...gaps)), Math.round(mean(gaps)), Math.round(Math.max(...gaps))],
  };
}

const idle = run('parked on the section', { seconds: 600, scrolling: false, seed: Number(process.env.SEED || 7) });
const scroll = run('scrolling', { seconds: 600, scrolling: true, seed: Number(process.env.SEED || 7) });
console.log(idle); console.log(scroll);

let bad = 0;
const check = (name, ok) => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`); };
for (const r of [idle, scroll]) {
  check(`${r.label}: never more than 3 flashes in any second`, r.maxFlashesIn1s <= 3);
  check(`${r.label}: lights fully off most of the time (>${r.label === 'scrolling' ? 30 : 75}%)`, r.pctFramesAllZero > (r.label === 'scrolling' ? 30 : 75));
  check(`${r.label}: flashes vary in reach (max/min scale > 1.8)`, r.scaleMinMeanMax[2] / r.scaleMinMeanMax[0] > 1.8);
  check(`${r.label}: flashes visit every side of the section`, r.perimeterQuadrants.every((q) => q > 0));
  check(`${r.label}: intervals vary (max gap > 3x min gap)`, r.gapSpreadMs[2] > 3 * r.gapSpreadMs[0]);
}
for (const r of [idle, scroll]) {
  check(`${r.label}: red answers blue right away in >= 30% of cases`, r.blueThenRedWithin700msPct >= 30);
  check(`${r.label}: the other colour follows within 0.7 s after >= 35% of flashes`, r.anyAnswerWithin700msPct >= 35);
  check(`${r.label}: reach spans more than 4x (calm to deep)`, r.scaleMinMeanMax[2] / r.scaleMinMeanMax[0] > 4);
}
check('scrolling is stronger than parked (mean opacity)', scroll.meanOpacityWhenLit > idle.meanOpacityWhenLit * 1.3);
check('scrolling reaches deeper than parked (mean scale)', scroll.scaleMinMeanMax[1] > idle.scaleMinMeanMax[1] * 1.2);
check('scrolling flashes more often than parked', scroll.flashesPerMin > idle.flashesPerMin * 1.3);
console.log(bad ? `\n${bad} failure(s)` : '\nall siren checks pass');
process.exit(bad ? 1 : 0);
