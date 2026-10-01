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

// Graphics (icons) need 3:1. The call button is the one place green is used,
// and its glyph is white.
for (const [name, theme] of [['dark', dark], ['light', light]]) {
  const green = theme['--call-green'];
  const r = green ? ratio('#FFFFFF', green) : 0;
  const ok = r >= 3;
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(5)} white icon on --call-green: ${r ? r.toFixed(2) + ':1' : 'token missing'}`);
}

if (css.includes('--accent-green')) {
  failures++;
  console.log('FAIL --accent-green still defined in tokens.css');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall pairs pass');
process.exit(failures ? 1 : 0);
