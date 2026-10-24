#!/usr/bin/env node
// Builds the static content pages from content/*.md:
//   blog/, praktyki/, <poradnik slug>/, polityka-prywatnosci/
// and refreshes the three blog cards on the landing page (index.html).
// No dependencies. All links are relative, so the output works under any
// path prefix (GitHub Pages) or at a domain root. Set SITE_URL to also emit
// canonical links and sitemap.xml.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { icon } from './icon.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');
const PHONE = '792 892 457';
const PHONE_HREF = 'tel:+48792892457';
const AUTHOR = 'Arkadiusz Górski';
const BACK_ICON = await icon('arrow-left', 'breadcrumb__icon');
const CLOCK_ICON = await icon('clock', 'knowledge-card__icon');
const PHONE_ICON = await icon('phone', 'claim__icon');
const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => {
  const f = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s);
};
const readDir = (p) => fs.readdirSync(path.join(ROOT, p)).filter((f) => f.endsWith('.md')).sort();

// ---------- markdown ----------
function parseMd(rel) {
  const m = read(rel).match(/^---\n([\s\S]*?)\n---\n+([\s\S]*)$/);
  if (!m) throw new Error(`${rel}: missing frontmatter`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2].trim() };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Keeps one-letter Polish words (w, z, i, o, u, a) glued to the next word.
const nbsp = (s) => s.replace(/(^|[\s(„])([wziouaWZIOUA])\s+(?=\S)/g, '$1$2 ');
function inline(s) {
  let t = esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/==(.+?)==/g, '<mark class="marker">$1</mark>');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  return nbsp(t);
}
function slugify(t) {
  return t.replace(/ł/g, 'l').replace(/Ł/g, 'L').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const blocksOf = (body) => body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

function renderBlock(b) {
  if (b.startsWith('## ')) {
    const text = b.slice(3).trim();
    return `<h2 id="${slugify(text)}">${inline(text)}</h2>`;
  }
  const lines = b.split('\n');
  if (lines.every((l) => l.startsWith('- '))) {
    return `<ul>\n${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('\n')}\n</ul>`;
  }
  if (lines.every((l) => /^\d+\.\s/.test(l))) {
    return `<ol>\n${lines.map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''))}</li>`).join('\n')}\n</ol>`;
  }
  return `<p>${inline(lines.join(' '))}</p>`;
}
const renderBlocks = (blocks) => blocks.map(renderBlock).join('\n');
const plain = (md) => md.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const readingMin = (body) => Math.max(1, Math.ceil(plain(body).split(/\s+/).length / 200));
// Short form for cards: 11.2026.
function fmtMonth(iso) {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso || '');
  return m ? `${m[2]}.${m[1]}` : '';
}
function fmtDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
}

// ---------- shared partials (taken from the landing page) ----------
const landing = read('index.html');
const ASSET_V = (landing.match(/css\/style\.css\?v=(\d+)/) || [, '1'])[1];
const NAV = landing.match(/<header class="site-nav">[\s\S]*?<\/header>/)[0];
const FOOTER = landing.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];
// Fonts are self-hosted (css/fonts.css); the preload links are copied from the landing page.
const FONT_LINKS = (landing.match(/<link[^>]+rel="(?:preload|stylesheet)"[^>]*fonts[^>]*>/g) || []);

function relink(html, root) {
  return html.replace(/\b(href|src)="([^"]*)"/g, (m, attr, v) =>
    /^(https?:|tel:|mailto:|sms:|\/\/)/.test(v) ? m : `${attr}="${root}${v}"`);
}

// Which detail page a directory belongs to (the nav arrow for it gets aria-current).
function navKey(dir) {
  if (!dir) return '';
  const first = dir.split('/')[0];
  return first === guide.slug ? 'zatrzymanie' : ['praktyki', 'blog'].includes(first) ? first : '';
}
function navFor(dir, root) {
  const key = navKey(dir);
  const html = NAV.replace(/ aria-current="[^"]*"/g, '')
    .replace(new RegExp(`(<a [^>]*data-nav-detail="${key}")`), '$1 aria-current="page"');
  return relink(html, root);
}
const THEME_SCRIPT = '<script>try{var t=localStorage.getItem("kag-theme");if(!t&&matchMedia("(prefers-color-scheme: light)").matches)t="light";if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>';

function page({ root, dir, title, description, robots, bodyClass, main, scripts = [], jsonld }) {
  const canonical = SITE_URL ? `\n  <link rel="canonical" href="${SITE_URL}/${dir ? dir + '/' : ''}">` : '';
  const ld = jsonld ? `\n  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : '';
  const js = ['js/main.js', ...scripts].map((s) => `<script src="${root}${s}?v=${ASSET_V}"></script>`).join('\n  ');
  return `<!doctype html>
<html lang="pl" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">${robots ? `\n  <meta name="robots" content="${robots}">` : ''}${canonical}
  ${THEME_SCRIPT}
  ${relink(FONT_LINKS.join('\n  '), root)}
  <link rel="stylesheet" href="${root}css/tokens.css?v=${ASSET_V}">
  <link rel="stylesheet" href="${root}css/style.css?v=${ASSET_V}">
  <link rel="stylesheet" href="${root}css/pages.css?v=${ASSET_V}">${ld}
</head>
<body class="${bodyClass}">
  ${navFor(dir, root)}

  <div id="page-content">
  <main>
${main}
  </main>
  ${relink(FOOTER, root)}
  </div>

  ${js}
</body>
</html>
`;
}

function ctaBlock(root) {
  return `<section class="cta-block" aria-labelledby="cta-title">
  <div class="container container--article">
    <h2 id="cta-title" class="cta-block__title">Porozmawiajmy o twojej sprawie</h2>
    <p class="cta-block__text">Pierwsza rozmowa jest bezpłatna, bez płatności z góry.</p>
    <div class="cta-block__actions">
      <a class="button-primary" href="${root}#rezerwacja">Umów konsultację</a>
      <a class="cta-block__phone" href="${PHONE_HREF}">${PHONE}</a>
    </div>
    <p class="cta-block__note">W sprawach zatrzymań i przeszukań dostępny całą dobę.</p>
  </div>
</section>`;
}

// ---------- load content ----------
const practices = readDir('content/praktyki').map((f) => {
  const { meta, body } = parseMd(`content/praktyki/${f}`);
  return { ...meta, order: Number(meta.order), body };
}).sort((a, b) => a.order - b.order);
const practiceBySlug = Object.fromEntries(practices.map((p) => [p.slug, p]));

const posts = readDir('content/blog').map((f) => {
  const { meta, body } = parseMd(`content/blog/${f}`);
  if (!practiceBySlug[meta.category]) throw new Error(`${f}: unknown category ${meta.category}`);
  return { ...meta, order: Number(meta.order), body, min: readingMin(body) };
});
posts.sort((a, b) => (a.date && b.date ? b.date.localeCompare(a.date) : a.order - b.order));

const guide = (() => { const { meta, body } = parseMd('content/poradnik.md'); return { ...meta, body }; })();
const privacy = parseMd('content/polityka-prywatnosci.md');

// remove previously generated output
for (const d of ['blog', 'praktyki', guide.slug, 'polityka-prywatnosci']) {
  fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });
}
const generated = [];
const emit = (dir, html) => { write(`${dir}/index.html`, html); generated.push(dir); };

// ---------- blog ----------
const catShort = (slug) => practiceBySlug[slug].short;
const postHref = (root, p) => `${root}blog/${p.slug}/`;
const metaLine = (p) => [`${p.min} min czytania`, fmtDate(p.date)].filter(Boolean).join(' · ');

function postCard(p, root, featured) {
  return `<li class="post-card${featured ? ' post-card--featured' : ''}" data-category="${p.category}">
  <a class="post-card__link" href="${postHref(root, p)}">
    <div class="post-card__text">
      <p class="post-card__cat">${esc(catShort(p.category))}</p>
      <h2 class="post-card__title">${inline(p.title)}</h2>
      <p class="post-card__excerpt">${inline(p.excerpt)}</p>
      <p class="post-card__meta">${esc(metaLine(p))}</p>
    </div>
    <div class="post-card__cover" aria-hidden="true"><span>${esc(catShort(p.category))}</span></div>
  </a>
</li>`;
}

{
  const root = '../';
  const used = [...new Set(posts.map((p) => p.category))];
  const chips = [`<button type="button" class="chip" data-filter="all" aria-pressed="true">Wszystkie</button>`]
    .concat(used.map((c) => `<button type="button" class="chip" data-filter="${c}" aria-pressed="false">${esc(catShort(c))}</button>`)).join('\n');
  const main = `<section class="blog-index">
  <div class="container container--read">
    <header class="page-head">
      <h1>Analizy</h1>
      <p class="page-head__lead">Komentarze i analizy o praktyce karnej, compliance i postępowaniach sankcyjnych.</p>
    </header>
    <div class="chips" role="group" aria-label="Kategorie wpisów" data-chips hidden>
${chips}
    </div>
    <ul class="post-list">
${posts.map((p, i) => postCard(p, root, i === 0)).join('\n')}
    </ul>
  </div>
</section>
${ctaBlock(root)}`;
  emit('blog', page({ root, dir: 'blog', title: 'Analizy: komentarze o prawie karnym gospodarczym | Adwokat Arkadiusz Górski',
    description: 'Komentarze i analizy o praktyce karnej, compliance, AML i postępowaniach sankcyjnych. Teksty adwokata Arkadiusza Górskiego.',
    bodyClass: 'page page--blog', main, scripts: ['js/blog.js'] }));
}

for (const p of posts) {
  const root = '../../';
  const cat = practiceBySlug[p.category];
  const sameCat = posts.filter((x) => x.slug !== p.slug && x.category === p.category);
  const rest = posts.filter((x) => x.slug !== p.slug && x.category !== p.category);
  const related = [...sameCat, ...rest].slice(0, 3);
  const postBlocks = blocksOf(p.body);
  const main = `<article class="article article--post">
  <div class="container container--article">
    <nav class="breadcrumb" aria-label="Ścieżka"><a class="breadcrumb__back" href="${root}blog/">${BACK_ICON}Analizy</a><span aria-hidden="true">/</span><a href="${root}praktyki/${cat.slug}/">${esc(cat.short)}</a></nav>
    <header class="article__head">
      <p class="article__meta"><span>${AUTHOR}</span><span>${esc(metaLine(p))}</span></p>
      <h1 class="article__title">${inline(p.title)}</h1>
    </header>
    <div class="prose">
      <p class="lead">${inline(postBlocks[0])}</p>
${renderBlocks(postBlocks.slice(1))}
    </div>${p.updated ? `\n    <p class="article__legal">Stan prawny na: ${esc(fmtDate(p.updated))}</p>` : ''}
  </div>
</article>
${ctaBlock(root)}
<section class="related" aria-labelledby="related-title">
  <div class="container container--article">
    <h2 id="related-title" class="related__title">Czytaj dalej</h2>
    <ul class="related__list">
${related.map((r) => `<li><a href="${postHref(root, r)}"><span class="related__cat">${esc(catShort(r.category))}</span><span class="related__name">${inline(r.title)}</span></a></li>`).join('\n')}
    </ul>
  </div>
</section>`;
  const jsonld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: plain(p.title), description: p.metaDescription,
    inLanguage: 'pl', author: { '@type': 'Person', name: AUTHOR }, ...(p.date ? { datePublished: p.date } : {}), ...(p.updated ? { dateModified: p.updated } : {}) };
  emit(`blog/${p.slug}`, page({ root, dir: `blog/${p.slug}`, title: p.metaTitle, description: p.metaDescription, bodyClass: 'page page--article', main, jsonld }));
}

// ---------- practices ----------
{
  const root = '../';
  const main = `<section class="practice-index">
  <div class="container">
    <header class="page-head">
      <h1>Specjalizacje</h1>
      <p class="page-head__lead">Praktyka jest zawężona świadomie. Sprawy karne gospodarcze, postępowania sankcyjne i compliance opierają się na tej samej wiedzy o tym, jak działają organy. Ten sam stan faktyczny bywa podstawą roszczeń cywilnych i karnych.</p>
    </header>
    <ul class="practice-grid">
${practices.map((p) => `<li class="practice-card"><a href="${root}praktyki/${p.slug}/">
  <div class="practice-card__media"><img src="${root}img/${p.image}" alt="" width="896" height="1200" loading="lazy" decoding="async"></div>
  <h2 class="practice-card__title">${inline(p.title)}</h2>
  <p class="practice-card__text">${inline(p.card)}</p>
  <span class="practice-card__go">Zobacz zakres <span aria-hidden="true">→</span></span>
</a></li>`).join('\n')}
    </ul>
  </div>
</section>
${ctaBlock(root)}`;
  emit('praktyki', page({ root, dir: 'praktyki', title: 'Specjalizacje | Adwokat Arkadiusz Górski, Warszawa',
    description: 'Prawo karne, prawo karne gospodarcze i skarbowe, nieuczciwa konkurencja, compliance, AML i postępowania sankcyjne. Zakres praktyki adwokata.',
    bodyClass: 'page page--practices', main }));
}

for (const p of practices) {
  const root = '../../';
  const blocks = blocksOf(p.body);
  const related = posts.filter((x) => x.category === p.slug);
  const main = `<article class="article article--practice">
  <div class="container container--article">
    <nav class="breadcrumb" aria-label="Ścieżka"><a class="breadcrumb__back" href="${root}praktyki/">${BACK_ICON}Specjalizacje</a></nav>
    <header class="article__head">
      <h1 class="article__title">${inline(p.title)}</h1>
    </header>
    <div class="prose">
      <p class="lead">${inline(blocks[0])}</p>
${renderBlocks(blocks.slice(1))}
    </div>
  </div>
</article>
${related.length ? `<section class="related" aria-labelledby="related-title">
  <div class="container container--article">
    <h2 id="related-title" class="related__title">Wpisy z tej praktyki</h2>
    <ul class="related__list">
${related.map((r) => `<li><a href="${postHref(root, r)}"><span class="related__cat">${esc(catShort(r.category))}</span><span class="related__name">${inline(r.title)}</span></a></li>`).join('\n')}
    </ul>
  </div>
</section>` : ''}
${ctaBlock(root)}`;
  emit(`praktyki/${p.slug}`, page({ root, dir: `praktyki/${p.slug}`, title: p.metaTitle, description: p.metaDescription, bodyClass: 'page page--practice', main }));
}

// ---------- guide ----------
{
  const root = '../';
  const blocks = blocksOf(guide.body);
  const itemRe = /^\*\*(\d+)\.\s+(.+?)\*\*\s*(.*)$/s;
  const first = blocks.findIndex((b) => itemRe.test(b));
  let last = first;
  while (last + 1 < blocks.length && itemRe.test(blocks[last + 1])) last++;
  const pre = blocks.slice(0, first);
  const items = blocks.slice(first, last + 1).map((b) => { const m = itemRe.exec(b); return { n: m[1], title: m[2], text: m[3] }; });
  const post = blocks.slice(last + 1);
  const main = `<article class="guide">
  <header class="guide__hero">
    <div class="container container--article">
      <h1 class="article__title">${inline(guide.title)}</h1>
      <p class="lead">${inline(pre[0])}</p>
      <div class="guide__call">
        <a class="button-primary guide__call-button" href="${PHONE_HREF}">${PHONE_ICON}Zadzwoń: ${PHONE}</a>
        <p class="guide__call-note"><span class="guide__dot" aria-hidden="true"></span>24/7 w sprawach zatrzymań i przeszukań</p>
      </div>
    </div>
  </header>
  <div class="container container--article">
    <div class="prose">
      <h2 id="dobre-praktyki">Dobre praktyki</h2>
${renderBlocks(pre.slice(1))}
    </div>
    <ol class="practices">
${items.map((i) => `<li class="practice" id="praktyka-${i.n}"><span class="practice__n" aria-hidden="true">${String(i.n).padStart(2, '0')}</span><h3 class="practice__title">${inline(i.title)}</h3><p>${inline(i.text)}</p></li>`).join('\n')}
    </ol>
    <div class="prose">
${renderBlocks(post)}
    </div>${guide.updated ? `\n    <p class="article__legal">Stan prawny na: ${esc(fmtDate(guide.updated))}</p>` : ''}
  </div>
</article>
${ctaBlock(root)}
<a class="callbar" href="${PHONE_HREF}">Zadzwoń: ${PHONE}</a>`;
  const jsonld = { '@context': 'https://schema.org', '@type': 'Article', headline: plain(guide.title), description: guide.metaDescription,
    inLanguage: 'pl', author: { '@type': 'Person', name: AUTHOR }, ...(guide.updated ? { dateModified: guide.updated } : {}) };
  emit(guide.slug, page({ root, dir: guide.slug, title: guide.metaTitle, description: guide.metaDescription, bodyClass: 'page page--guide', main, scripts: ['js/blog.js'], jsonld }));
}

// ---------- privacy (draft, not indexed) ----------
{
  const root = '../';
  const main = `<article class="article">
  <div class="container container--article">
    <header class="article__head"><h1 class="article__title">${inline(privacy.meta.title)}</h1></header>
    <div class="prose">
${renderBlocks(blocksOf(privacy.body))}
    </div>
  </div>
</article>`;
  emit('polityka-prywatnosci', page({ root, dir: 'polityka-prywatnosci', title: privacy.meta.metaTitle, description: privacy.meta.metaDescription,
    robots: 'noindex', bodyClass: 'page page--article', main }));
}

// ---------- landing: refresh the six blog cards ----------
{
  const top = posts.slice(0, 6);
  const cards = top.map((p) => `          <a class="knowledge-card" href="blog/${p.slug}/">
            <h3>${inline(p.title)}</h3>
            <div class="knowledge-card__foot">
              <span class="knowledge-card__tag">${esc(catShort(p.category))}</span>
              <span class="knowledge-card__time">${CLOCK_ICON}${p.min}<span class="sr-only"> min czytania</span></span>
            </div>
          </a>`).join('\n');
  const re = /(<!-- BLOG-CARDS:start -->)[\s\S]*?(<!-- BLOG-CARDS:end -->)/;
  if (!re.test(landing)) throw new Error('index.html: BLOG-CARDS markers missing');
  const next = landing.replace(re, `$1\n${cards}\n          $2`);
  if (next !== landing) write('index.html', next);
}

// ---------- sitemap (only with a known domain) ----------
if (SITE_URL) {
  const urls = ['', ...generated.filter((d) => d !== 'polityka-prywatnosci').map((d) => `${d}/`)];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
}

console.log(`built ${generated.length} pages: ${posts.length} posts, ${practices.length} practices, 1 guide, 2 indexes, 1 privacy`);
