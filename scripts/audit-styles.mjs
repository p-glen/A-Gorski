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
    // On a phone the hero copy sits on the photograph and is always light
    // type on a dark scrim, whatever the theme (see style.css, max-width 899px).
    const HERO_INK = 'rgb(243, 239, 230)';
    const okColour = (c) => c === a.bodyColor || (w < 900 && h === 'h1' && c === HERO_INK);
    check(`${tag} ${h}: colour = body text`, keys.every((k) => okColour(k.split('|')[3])), keys.map((k) => k.split('|')[3]).join(','));
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
