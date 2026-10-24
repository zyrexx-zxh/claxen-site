#!/usr/bin/env node
/* Static SEO + integrity audit of a built folder.   node tools/audit.js [dist|preview] */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', process.argv[2] || 'dist');
let fails = 0, warns = 0;
const bad = (m) => { fails++; console.log('  FAIL ' + m); };
const warn = (m) => { warns++; console.log('  warn ' + m); };

function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(path.join(d, f.name)) : [path.join(d, f.name)])); }
const htmlFiles = walk(dir).filter((f) => f.endsWith('.html'));
const titles = {}, descs = {};

for (const f of htmlFiles) {
  const rel = path.relative(dir, f), html = fs.readFileSync(f, 'utf8'), is404 = rel === '404.html';
  console.log('\n' + rel);
  const get = (re) => (html.match(re) || [])[1];
  const title = get(/<title>([^<]*)<\/title>/), desc = get(/<meta name="description" content="([^"]*)"/);
  const unesc = (s) => (s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  if (!title) bad('missing <title>'); else { if (unesc(title).length > 60) warn(`title is ${unesc(title).length} chars (>60): ${unesc(title)}`); if (titles[title]) bad('duplicate title'); titles[title] = 1; }
  if (!desc) bad('missing description'); else { if (unesc(desc).length > 160) warn(`description is ${unesc(desc).length} chars (>160)`); if (unesc(desc).length < 70) warn('description is short'); if (descs[desc]) bad('duplicate description'); descs[desc] = 1; }
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) bad(`${h1s} <h1> elements`);
  if (!/<html lang="en"/.test(html)) bad('missing html lang');
  if (!/<meta name="viewport"/.test(html)) bad('missing viewport');
  if (!is404) {
    if (!/<link rel="canonical" href="https?:\/\/[^"]+"/.test(html)) bad('missing canonical');
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) if (!html.includes(`property="${p}"`)) bad('missing ' + p);
    for (const p of ['twitter:card', 'twitter:image']) if (!html.includes(`name="${p}"`)) bad('missing ' + p);
    if (/noindex/.test(html)) bad('page is noindex');
  } else if (!/noindex/.test(html)) bad('404 should be noindex');
  // headings order
  let prev = 0; for (const m of html.matchAll(/<h([1-6])[\s>]/g)) { const n = +m[1]; if (prev && n > prev + 1) bad(`heading jump h${prev} -> h${n}`); prev = n; }
  // json-ld
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { bad('invalid JSON-LD: ' + e.message); } }
  const ld = (html.match(/application\/ld\+json/g) || []).length;
  if (!is404 && !ld) bad('no JSON-LD');
  // ids + anchors + labelledby
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i); if (dup.length) bad('duplicate ids: ' + [...new Set(dup)].join(', '));
  for (const m of html.matchAll(/aria-(?:labelledby|controls|describedby)="([^"]+)"/g)) for (const id of m[1].split(' ')) if (!ids.includes(id)) bad('aria target missing: #' + id);
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(m[1])) bad('broken in-page anchor #' + m[1]);
  // links + assets resolve
  const base = path.dirname(f);
  for (const m of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const u = m[1]; if (/^(https?:|mailto:|tel:|data:)/.test(u)) continue;
    let target = u.startsWith('/') ? path.join(dir, u) : path.resolve(base, u);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) bad('broken link/asset: ' + u);
  }
  // link text
  if (/<a [^>]*>\s*(click here|here|read more)\s*<\/a>/i.test(html)) warn('vague link text');
  if (/<img\b(?![^>]*\balt=)/.test(html)) bad('<img> without alt');
  if (!/<noscript|class="js"|data-kinetic/.test(html)) warn('no progressive enhancement markers');
  if (/your-domain\.example/.test(html)) console.log('  note: placeholder domain still present (run tools/set-domain.js)');
}

// sitemap / robots / llms
const sm = fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log('\nsitemap: ' + locs.length + ' urls');
const pageCount = htmlFiles.filter((f) => !f.endsWith('404.html')).length;
if (locs.length !== pageCount) bad(`sitemap has ${locs.length} urls but ${pageCount} indexable pages`);
if (!/Sitemap: https?:\/\//.test(fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8'))) bad('robots.txt lacks Sitemap line');
for (const f of ['llms.txt', 'site.webmanifest', 'favicon.svg']) if (!fs.existsSync(path.join(dir, f))) bad('missing ' + f);
JSON.parse(fs.readFileSync(path.join(dir, 'site.webmanifest'), 'utf8'));
for (const f of ['assets/img/icon-192.png', 'assets/img/icon-512.png', 'assets/img/apple-touch-icon.png', 'assets/img/favicon-32.png', 'assets/img/og-home.png']) if (!fs.existsSync(path.join(dir, f))) warn('missing image ' + f);

console.log(`\n${fails ? fails + ' FAILED' : 'OK'}, ${warns} warnings`);
process.exit(fails ? 1 : 0);
