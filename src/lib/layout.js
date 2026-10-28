const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cfg = require('../site.js');
const { icons, shapeSvg } = require('./shapes.js');

const SRC = path.join(__dirname, '..');
const hashCache = {};
function fileHash(rel) {
  if (hashCache[rel]) return hashCache[rel];
  const p = path.join(SRC, rel);
  const h = fs.existsSync(p) ? crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex').slice(0, 8) : '0';
  return (hashCache[rel] = h);
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ctx = { mode: 'prod' | 'preview', depth: 0|1, slug: ''|'website-development'... } */
function helpers(ctx) {
  const abs = !!ctx.rootAbs; // used by 404.html, which can be served from any path
  const root = abs ? '/' : (ctx.depth ? '../'.repeat(ctx.depth) : './');
  const idx = ctx.mode === 'preview' ? 'index.html' : '';
  const home = abs ? '/' : (ctx.depth ? root + idx : (ctx.mode === 'preview' ? './index.html' : './'));
  return {
    root,
    home,
    page: (slug) => (slug ? `${root}${slug}/${idx}` : home),
    anchor: (id) => (ctx.depth || abs ? `${home}#${id}` : `#${id}`),
    asset: (rel, hashed = true) => `${root}${rel}${hashed ? '?v=' + fileHash(rel) : ''}`,
    abs: (slug) => `${cfg.url}/${slug ? slug + '/' : ''}`
  };
}

function head(ctx, p) {
  const h = helpers(ctx);
  const canonical = h.abs(ctx.slug);
  const ogImg = `${cfg.url}/assets/img/og-${ctx.slug || 'home'}.png`;
  const jsonld = (p.jsonld || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
${p.noindex ? '' : `<link rel="canonical" href="${canonical}">`}
<meta name="robots" content="${p.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}">
<meta name="author" content="${cfg.person}">
${p.keywords ? `<meta name="keywords" content="${esc(p.keywords)}">` : ''}
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#16141B">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${cfg.name}">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(p.ogTitle || p.title)}">
<meta property="og:description" content="${esc(p.description)}">
${p.noindex ? '' : `<meta property="og:url" content="${canonical}">`}
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(p.ogAlt || p.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.ogTitle || p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${ogImg}">
<link rel="icon" href="${h.root}favicon.svg" type="image/svg+xml">
<link rel="icon" href="${h.root}assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${h.root}assets/img/apple-touch-icon.png">
<link rel="manifest" href="${h.root}site.webmanifest">
${ctx.mode === 'preview' ? '' : `<link rel="preload" href="${h.asset('assets/fonts/mona-display.woff', false)}" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${h.asset('assets/fonts/mona-text.woff', false)}" as="font" type="font/woff" crossorigin>`}
<script>
/* theme before first paint: saved choice, else dusk (the soft dark theme) */
(function(){var d=document.documentElement;d.classList.add('js');var t=null;try{t=localStorage.getItem('cx-theme2')}catch(e){}
if(t!=='dusk'&&t!=='sand'){t='dusk'}
d.setAttribute('data-theme',t)})();
</script>
<link rel="stylesheet" href="${h.asset('assets/css/site.css')}">
${jsonld}
</head>`;
}

function header(ctx) {
  const h = helpers(ctx);
  const nav = [['Services', 'services'], ['Try it', 'try'], ['Process', 'process'], ['Pricing', 'pricing'], ['FAQ', 'faq']];
  const links = nav.map(([t, id]) => `<li><a href="${h.anchor(id)}" data-spy="${id}">${t}</a></li>`).join('');
  const mlinks = nav.map(([t, id]) => `<li><a href="${h.anchor(id)}">${t}</a></li>`).join('') + `<li><a href="${h.anchor('contact')}">Contact</a></li>`;
  const svcLinks = cfg.services.map((s) => `<li><a href="${h.page(s.slug)}">${s.name}</a></li>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <a class="wordmark" href="${h.home}" aria-label="${cfg.name}, home">
    <svg class="wordmark__mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><rect x="1" y="3" width="17" height="17" fill="var(--c-web)"/><circle cx="18" cy="18" r="9" fill="var(--c-bot)"/></svg>
    <span class="wordmark__text">CLAXEN</span>
  </a>
  <nav class="nav" aria-label="Primary"><ul>${links}</ul></nav>
  <div class="tools">
    <button class="tool tool--search" type="button" data-palette-open aria-label="Open the command menu" aria-keyshortcuts="Control+K Meta+K">${icons.search}<span class="tool__txt">Search</span><kbd data-kbd>Ctrl K</kbd></button>
    <button class="tool tool--icon" type="button" data-theme-toggle aria-label="Switch theme" aria-pressed="false">${icons.theme}</button>
    <a class="btn btn--sm btn--ink tool--cta" href="${h.anchor('contact')}">Start a project</a>
    <button class="tool tool--menu" type="button" data-menu-toggle aria-expanded="false" aria-controls="menu"><span class="tool__txt">Menu</span><span class="burger" aria-hidden="true"><i></i><i></i></span></button>
  </div>
  <div class="progress" aria-hidden="true"><i data-progress></i></div>
</header>
<div class="menu" id="menu" data-menu hidden>
  <div class="menu__inner">
    <ul class="menu__links">${mlinks}</ul>
    <p class="menu__h">Services</p>
    <ul class="menu__svc">${svcLinks}</ul>
    <button class="btn btn--line" type="button" data-palette-open>Search the site</button>
  </div>
</div>`;
}

function palette(ctx) {
  const h = helpers(ctx);
  const items = [
    ...cfg.services.map((s) => ({ t: s.name, d: 'Service page', h: h.page(s.slug), k: `${s.name} ${s.tags.join(' ')} ${s.nav}` })),
    { t: 'Services', d: 'Section', h: h.anchor('services'), k: 'what i build websites bots automation ai' },
    { t: 'Try the demos', d: 'Section', h: h.anchor('try'), k: 'demo bot terminal text tool playground' },
    { t: 'How a project runs', d: 'Section', h: h.anchor('process'), k: 'process steps timeline workflow' },
    { t: 'Pricing and budget', d: 'Section', h: h.anchor('pricing'), k: 'price cost budget $10 $10000 quote' },
    { t: 'FAQ', d: 'Section', h: h.anchor('faq'), k: 'questions answers' },
    { t: 'Start a project', d: 'Contact', h: h.anchor('contact'), k: 'contact brief hire quote' },
    { t: 'Copy my email', d: 'Action', a: 'copy-email', k: 'email copy outlook' },
    { t: 'Open Telegram', d: 'Action', a: 'telegram', k: 'telegram t.me message chat' },
    { t: 'Switch theme', d: 'Action', a: 'theme', k: 'theme dark light dusk sand night day' }
  ];
  return `<dialog class="palette" id="palette" aria-label="Command menu">
  <form method="dialog" class="palette__box">
    <div class="palette__top">${icons.search}<input class="palette__input" type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" placeholder="Jump to a page or run an action" autocomplete="off" spellcheck="false" aria-label="Search pages and actions"><button class="palette__x" type="submit" aria-label="Close">${icons.close}</button></div>
    <ul class="palette__list" id="palette-list" role="listbox" aria-label="Results"></ul>
    <p class="palette__hint"><span>Up and down to move</span><span>Enter to open</span><span>Esc to close</span></p>
  </form>
  <script type="application/json" id="cx-palette">${JSON.stringify(items).replace(/</g, '\\u003c')}</script>
</dialog>`;
}

function footer(ctx) {
  const h = helpers(ctx);
  const svc = cfg.services.map((s) => `<li><a href="${h.page(s.slug)}">${s.name}</a></li>`).join('');
  return `<footer class="site-footer band band--alt" id="top-footer">
  <div class="wrap">
    <div class="foot__grid">
      <div class="foot__col foot__col--intro">
        <p class="foot__lead">Websites, bots, automations and AI tools, built one project at a time by one developer.</p>
        <p class="foot__price">Projects from $${cfg.priceMin} to $${cfg.priceMax.toLocaleString('en-US')}.</p>
      </div>
      <nav class="foot__col" aria-label="Services"><h2 class="foot__h">Services</h2><ul>${svc}</ul></nav>
      <nav class="foot__col" aria-label="Explore"><h2 class="foot__h">Explore</h2><ul>
        <li><a href="${h.anchor('try')}">Try the demos</a></li><li><a href="${h.anchor('process')}">How a project runs</a></li><li><a href="${h.anchor('pricing')}">Pricing</a></li><li><a href="${h.anchor('faq')}">FAQ</a></li></ul></nav>
      <div class="foot__col"><h2 class="foot__h">Contact</h2><ul>
        <li><a href="mailto:${cfg.email}">${cfg.email}</a></li>
        <li><a href="${cfg.telegramUrl}" rel="me noopener" target="_blank">${cfg.telegramText}</a></li></ul></div>
    </div>
    <div class="foot__word" data-wordmark aria-hidden="true">CLAXEN</div>
    <div class="foot__base">
      <p>&copy; ${cfg.year} ${cfg.name}. Built by hand, with no templates.</p>
      <button class="btn btn--line btn--sm" type="button" data-top>Back to top</button>
    </div>
  </div>
</footer>`;
}

function page(ctx, p, bodyHtml, scripts) {
  const h = helpers(ctx);
  return `<!doctype html>
<html lang="en" data-theme="dusk">
${head(ctx, p)}
<body class="${p.bodyClass || ''}" data-stage="${h.asset('assets/js/stage.js')}">
${header(ctx)}
<main id="main">
${bodyHtml}
</main>
${footer(ctx)}
${palette(ctx)}
<div class="toast" role="status" aria-live="polite" data-toast></div>
${(scripts || ['site']).map((s) => `<script src="${h.asset('assets/js/' + s + '.js')}" defer></script>`).join('\n')}
</body>
</html>
`;
}

module.exports = { page, helpers, esc, cfg };
