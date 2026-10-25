#!/usr/bin/env node
/* CLAXEN site builder. No dependencies.
   node tools/build.js            -> dist/     (clean URLs, deploy this)
                                     preview/  (links end in index.html, opens straight from disk)
   SITE_URL=https://example.com node tools/build.js   -> bakes your real domain into everything */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const cfg = require(path.join(SRC, 'site.js'));
const { page, helpers, esc } = require(path.join(SRC, 'lib/layout.js'));
const { icons, shapeSvg } = require(path.join(SRC, 'lib/shapes.js'));
const home = require(path.join(SRC, 'pages/home.js'));
const service = require(path.join(SRC, 'pages/service.js'));

const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
const mk = (p) => fs.mkdirSync(p, { recursive: true });
const write = (p, s) => { mk(path.dirname(p)); fs.writeFileSync(p, s); };
const copyDir = (a, b) => {
  if (!fs.existsSync(a)) return;
  mk(b);
  for (const f of fs.readdirSync(a, { withFileTypes: true })) {
    const s = path.join(a, f.name), d = path.join(b, f.name);
    f.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
};

function minCss(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}
function minJs(s) {
  return s.split('\n').filter((l) => l.trim() && !/^\s*\/\/(?!#)/.test(l)).join('\n');
}
function minHtml(s) {
  // keep <pre>, <textarea> and <script> contents intact; collapse blank lines and indentation elsewhere
  const keep = [];
  s = s.replace(/<(pre|textarea|script)\b[\s\S]*?<\/\1>/g, (m) => { keep.push(m); return `\u0000${keep.length - 1}\u0000`; });
  s = s.replace(/\n\s+/g, '\n').replace(/\n{2,}/g, '\n');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
}

const _unused = () => [
  { slug: '', ...home.render({ mode: 'X', depth: 0, slug: '' }) },
  ...cfg.services.map((s) => ({ slug: s.slug, svc: s }))
];

function buildTo(outDir, mode) {
  rm(outDir); mk(outDir);

  // assets
  copyDir(path.join(SRC, 'assets/fonts'), path.join(outDir, 'assets/fonts'));
  copyDir(path.join(SRC, 'assets/img'), path.join(outDir, 'assets/img'));
  for (const f of fs.readdirSync(path.join(SRC, 'assets/js'))) {
    write(path.join(outDir, 'assets/js', f), minJs(fs.readFileSync(path.join(SRC, 'assets/js', f), 'utf8')));
  }
  for (const f of fs.readdirSync(path.join(SRC, 'assets/css'))) {
    write(path.join(outDir, 'assets/css', f), minCss(fs.readFileSync(path.join(SRC, 'assets/css', f), 'utf8')));
  }
  fs.copyFileSync(path.join(SRC, 'favicon.svg'), path.join(outDir, 'favicon.svg'));

  // pages
  const ctxHome = { mode, depth: 0, slug: '' };
  const hp = home.render(ctxHome);
  write(path.join(outDir, 'index.html'), minHtml(page(ctxHome, hp.meta, hp.body, hp.scripts)));
  for (const s of cfg.services) {
    const ctx = { mode, depth: 1, slug: s.slug };
    const sp = service.render(ctx, s);
    write(path.join(outDir, s.slug, 'index.html'), minHtml(page(ctx, sp.meta, sp.body, sp.scripts)));
  }

  // 404 (root-absolute links so it works at any depth)
  const c404 = { mode: 'prod', depth: 0, slug: '404', rootAbs: true };
  const h4 = helpers(c404);
  const body404 = `<section class="band sec nf"><div class="wrap nf__in">
    <div class="nf__shapes" aria-hidden="true">${shapeSvg('web', 'nf__s nf__s--1')}${shapeSvg('bot', 'nf__s nf__s--2')}${shapeSvg('py', 'nf__s nf__s--3')}${shapeSvg('ai', 'nf__s nf__s--4')}</div>
    <p class="eyebrow">Error 404</p>
    <h1 class="display h2" data-kinetic><span class="line"><span class="line__in">This page</span></span> <span class="line"><span class="line__in">went missing.</span></span></h1>
    <p class="sec__lead">The link may be old or mistyped. These still work:</p>
    <ul class="nf__links">${cfg.services.map((s) => `<li><a class="btn btn--line" href="${h4.page(s.slug)}"><span>${esc(s.name)}</span>${icons.arrowRight}</a></li>`).join('')}<li><a class="btn btn--ink" href="${h4.home}"><span>Back home</span>${icons.arrowRight}</a></li></ul>
  </div></section>`;
  write(path.join(outDir, '404.html'), minHtml(page(c404, { title: 'Page not found | CLAXEN', description: 'This page could not be found.', noindex: true }, body404, ['site'])));

  // machine-readable files
  const U = (p = '') => `${cfg.url}/${p}`;
  const urls = [['', '1.0'], ...cfg.services.map((s) => [s.slug + '/', '0.9'])];
  write(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, pr]) => `  <url><loc>${U(p)}</loc><lastmod>${cfg.lastmod}</lastmod><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`);
  write(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${U('sitemap.xml')}\n`);
  write(path.join(outDir, 'llms.txt'), [
    `# ${cfg.name}`, '',
    `> ${cfg.person} is a freelance developer who builds custom websites, Telegram and Discord bots, Python automations and AI tools. Projects range from $${cfg.priceMin} to $${cfg.priceMax.toLocaleString('en-US')}.`, '',
    '## Services', '',
    ...cfg.services.map((s) => `- [${s.name}](${U(s.slug + '/')}): ${s.blurb}`), '',
    '## Contact', '',
    `- Email: ${cfg.email}`, `- Telegram: ${cfg.telegramUrl}`, '',
    '## Optional', '',
    `- [Home](${U()}): overview, demos, pricing guide and FAQ`, ''
  ].join('\n'));
  write(path.join(outDir, 'site.webmanifest'), JSON.stringify({
    name: 'CLAXEN', short_name: 'CLAXEN', description: 'Freelance developer: websites, bots, automations and AI tools.',
    start_url: './', scope: './', display: 'standalone', background_color: '#F3F4F7', theme_color: '#2A3BFF',
    icons: [
      { src: 'assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'assets/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  }, null, 2));
  write(path.join(outDir, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n`);
}

const only = process.argv[2];
if (only !== 'preview') buildTo(path.join(ROOT, 'dist'), 'prod');
if (only !== 'prod') buildTo(path.join(ROOT, 'preview'), 'preview');
console.log('built', only || 'dist + preview', '->', cfg.url);
