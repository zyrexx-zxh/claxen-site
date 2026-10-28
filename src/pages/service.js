const { helpers, esc, cfg } = require('../lib/layout.js');
const { shapeSvg, icons } = require('../lib/shapes.js');
const { serviceGraph } = require('../lib/seo.js');

const STEPS = [
  ['Brief', 'You describe the job, the budget and the deadline.'],
  ['Quote', 'I reply with scope, price and timeline before any work starts.'],
  ['Build', 'I build in steps and show progress as it goes.'],
  ['Launch', 'I deploy, hand over the code and access, and stay reachable.']
];

function render(ctx, s) {
  const h = helpers(ctx);
  const others = cfg.services.filter((x) => x.id !== s.id);
  const meta = {
    title: s.seo.title,
    description: s.seo.description,
    keywords: s.seo.keywords,
    ogAlt: `${s.name} by CLAXEN`,
    bodyClass: `page-service page-${s.id}`
  };
  meta.jsonld = serviceGraph(s);

  const gets = s.gets.map(([t, d], i) => `<li class="get"><span class="get__n">0${i + 1}</span><h3 class="get__t">${esc(t)}</h3><p class="get__d">${esc(d)}</p></li>`).join('');
  const fits = s.fits.map((f) => `<li>${esc(f)}</li>`).join('');
  const tools = s.tools.map((t) => `<li>${esc(t)}</li>`).join('');
  const faqs = s.faqs.map(([q, a]) => `<details class="qa"><summary><span>${esc(q)}</span><i aria-hidden="true">${icons.plus}</i></summary><div class="qa__a"><p>${esc(a)}</p></div></details>`).join('');
  const steps = STEPS.map(([t, d], i) => `<li class="step"><span class="step__n">0${i + 1}</span><div><h3 class="step__t">${t}</h3><p class="step__d">${d}</p></div></li>`).join('');
  const more = others.map((o) => `
      <article class="svc svc--${o.id} svc--mini">
        <div class="svc__body">
          <h3 class="svc__name"><a class="svc__link" href="${h.page(o.slug)}">${esc(o.name)}</a></h3>
          <p class="svc__blurb">${esc(o.blurb)}</p>
          <span class="svc__go" aria-hidden="true">${icons.arrowUpRight}</span>
        </div>
        <div class="svc__art" aria-hidden="true" data-3d="${o.id}">${shapeSvg(o.id, 'svc__shape')}</div>
      </article>`).join('');

  const body = `
<section class="shero shero--${s.id} band" aria-labelledby="s-h">
  <div class="wrap shero__grid">
    <div class="shero__copy">
      <nav class="crumbs" aria-label="Breadcrumb"><ol>
        <li><a href="${h.home}">Home</a></li>
        <li><a href="${h.anchor('services')}">Services</a></li>
        <li aria-current="page">${esc(s.name)}</li>
      </ol></nav>
      <h1 class="display shero__h1" id="s-h" data-kinetic>${esc(s.seo.h1).split(' ').reduce((a, w, i, arr) => { const n = Math.ceil(arr.length / 3); const k = Math.floor(i / n); (a[k] = a[k] || []).push(w); return a; }, []).map((l) => `<span class="line"><span class="line__in">${l.join(' ')}</span></span>`).join(' ')}</h1>
      <p class="shero__lead">${esc(s.lead)}</p>
      <div class="hero__cta">
        <a class="btn btn--ink btn--lg" href="#start" data-magnet><span>Start this project</span>${icons.arrowRight}</a>
        <a class="btn btn--line btn--lg" href="#gets"><span>What you get</span>${icons.arrowDown}</a>
      </div>
      <ul class="tags tags--hero">${s.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>
    <div class="shero__art" aria-hidden="true" data-3d="${s.id}" data-3d-mode="hero">${shapeSvg(s.id, 'shero__shape')}</div>
  </div>
</section>

<section class="band band--alt sec" id="gets" aria-labelledby="gets-h">
  <div class="wrap">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">01</span>What you get</p>
      <h2 class="display h2" id="gets-h" data-kinetic><span class="line"><span class="line__in">Included,</span></span> <span class="line"><span class="line__in">not extra.</span></span></h2>
    </header>
    <ul class="gets">${gets}</ul>
  </div>
</section>

<section class="band sec" aria-labelledby="fit-h">
  <div class="wrap fit">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">02</span>Good fit</p>
      <h2 class="display h2" id="fit-h" data-kinetic><span class="line"><span class="line__in">Is this</span></span> <span class="line"><span class="line__in">for you?</span></span></h2>
    </header>
    <div class="fit__cols">
      <div>
        <h3 class="h3">Typical projects</h3>
        <ul class="ticks">${fits}</ul>
      </div>
      <div>
        <h3 class="h3">Built with</h3>
        <ul class="chips chips--static">${tools}</ul>
        <p class="fit__price">Projects from $${cfg.priceMin} to $${cfg.priceMax.toLocaleString('en-US')}. Every project gets a fixed quote before work begins.</p>
      </div>
    </div>
  </div>
</section>

<section class="band band--ink sec sec--tight" aria-labelledby="proc-h">
  <div class="wrap process">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">03</span>How it runs</p>
      <h2 class="display h2" id="proc-h" data-kinetic><span class="line"><span class="line__in">Four steps.</span></span></h2>
    </header>
    <ol class="steps" data-steps>${steps}</ol>
  </div>
</section>

<section class="band band--alt sec" aria-labelledby="sfaq-h">
  <div class="wrap faq">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">04</span>FAQ</p>
      <h2 class="display h2" id="sfaq-h" data-kinetic><span class="line"><span class="line__in">${esc(s.faqHead)}</span></span></h2>
    </header>
    <div class="qas">${faqs}</div>
  </div>
</section>

<section class="band sec" aria-labelledby="more-h">
  <div class="wrap">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">05</span>More services</p>
      <h2 class="display h2" id="more-h"><span class="line"><span class="line__in">Also on the menu.</span></span></h2>
    </header>
    <div class="minis">${more}
    </div>
  </div>
</section>

<section class="band band--blue sec cta" id="start" aria-labelledby="cta-h">
  <div class="wrap cta__in">
    <h2 class="display h2" id="cta-h" data-kinetic><span class="line"><span class="line__in">${esc(s.cta)}</span></span> <span class="line"><span class="line__in">Tell me about it.</span></span></h2>
    <p class="sec__lead">Send a few lines about what you need, your budget and your deadline. I reply with a quote and a timeline.</p>
    <div class="cta__row">
      <a class="btn btn--sun btn--lg" href="${cfg.telegramUrl}" target="_blank" rel="noopener"><span>Message on Telegram</span>${icons.arrowUpRight}</a>
      <a class="btn btn--glass btn--lg" href="mailto:${cfg.email}?subject=${encodeURIComponent(s.name + ' project')}"><span>${cfg.email}</span>${icons.send}</a>
      <a class="btn btn--glass btn--lg" href="${h.anchor('contact')}"><span>Use the brief builder</span>${icons.arrowRight}</a>
    </div>
  </div>
</section>`;

  return { meta, body, scripts: ['site', 'fx'] };
}

module.exports = { render };
