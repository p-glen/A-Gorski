// Prints an inline Lucide icon (https://lucide.dev, ISC licence) ready to paste
// into HTML. Source files are cached in img/icons/lucide/ (pinned version) so
// the site never loads icons from a CDN at runtime.
//   node scripts/icon.mjs phone                 -> markup with no class
//   node scripts/icon.mjs phone scene__icon     -> markup with class="scene__icon"
// Icons are stroked with currentColor; size them in CSS (width/height).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '1.61.0';
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'img', 'icons', 'lucide');

export async function icon(name, cls = '') {
  const file = join(DIR, `${name}.svg`);
  if (!existsSync(file)) {
    const res = await fetch(`https://unpkg.com/lucide-static@${VERSION}/icons/${name}.svg`);
    if (!res.ok) throw new Error(`Lucide has no icon "${name}" (${res.status}). Browse https://lucide.dev/icons`);
    mkdirSync(DIR, { recursive: true });
    writeFileSync(file, await res.text());
  }
  const inner = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
  const c = cls ? ` class="${cls}"` : '';
  return `<svg${c} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name, cls] = process.argv.slice(2);
  if (!name) { console.error('usage: node scripts/icon.mjs <lucide-name> [class]'); process.exit(1); }
  console.log(await icon(name, cls));
}
