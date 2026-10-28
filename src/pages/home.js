const { helpers, esc, cfg } = require('../lib/layout.js');
const { shapeSvg, shapeG, icons } = require('../lib/shapes.js');
const { homeGraph } = require('../lib/seo.js');

const NODES = { web: [320, 110], bot: [530, 320], py: [320, 530], ai: [110, 320] };
const ORDER = ['web', 'bot', 'py', 'ai'];
const SHORT = { web: 'Sites that load fast and get found.', bot: 'Telegram and Discord, always on.', py: 'Scripts that do the boring work.', ai: 'Tools that write, sort and decide.' };

const PROCESS = [
  ['Brief', 'You tell me what you need, your budget and your deadline. The brief form on this page writes the message for you.'],
  ['Quote', 'I reply with scope, price and a timeline before any work starts. If the idea does not fit the budget, I say so and suggest a smaller first step.'],
  ['Build', 'I build it in steps and show you progress along the way, so you can change direction while changes are still cheap.'],
  ['Launch', 'I deploy it on the hosting you choose, hand over the code and access, and stay reachable for fixes afterwards.']
];

function loopSvg(h) {
  const nodes = ORDER.map((id, i) => {
    const s = cfg.services.find((x) => x.id === id);
    const [x, y] = NODES[id];
    return `<a class="node" href="${h.page(s.slug)}" data-node="${i}" data-short="${esc(SHORT[id])}" aria-label="${esc(s.name)}: ${esc(s.blurb)}">
        <circle class="node__hit" cx="${x}" cy="${y}" r="92" fill="transparent"/>
        ${shapeG(id, x, y, 1.25)}
      </a>`;
  }).join('\n      ');
  return `<svg class="loop__svg" viewBox="0 0 640 640" role="img" aria-labelledby="loop-t" focusable="false">
      <title id="loop-t">A loop connecting the four things Claxen builds: websites, bots, Python automations and AI tools.</title>
      <circle class="loop__track" cx="320" cy="320" r="210"/>
      <circle class="loop__trail" cx="320" cy="320" r="210" pathLength="1000" transform="rotate(-90 320 320)" data-trail/>
      ${nodes}
      <g class="loop__packet" data-packet transform="translate(320 110)"><circle r="17" class="loop__ring"/><circle r="8.5" class="loop__dot"/></g>
    </svg>`;
}

function hero(h) {
  return `<section class="hero band" aria-labelledby="hero-h">
  <div class="wrap hero__grid">
    <div class="hero__copy">
      <p class="eyebrow eyebrow--live"><span class="pulse" aria-hidden="true"></span>Freelance developer &middot; open for projects</p>
      <h1 class="display hero__h1" id="hero-h" data-kinetic>
        <span class="line"><span class="line__in">Websites, bots,</span></span>
        <span class="line"><span class="line__in">automation &amp; AI</span></span>
        <span class="line"><span class="line__in">that do the work.</span></span>
      </h1>
      <p class="hero__sub">I&rsquo;m Claxen. I build custom websites, Telegram and Discord bots, Python automations and AI tools, for projects from <strong>$${cfg.priceMin}</strong> to <strong>$${cfg.priceMax.toLocaleString('en-US')}</strong>.</p>
      <div class="hero__cta">
        <a class="btn btn--ink btn--lg" href="#contact" data-magnet><span>Start a project</span>${icons.arrowRight}</a>
        <a class="btn btn--line btn--lg" href="#services"><span>See what I build</span>${icons.arrowDown}</a>
      </div>
    </div>
    <div class="loop" data-loop data-3d="hero">
      ${loopSvg(h)}
      <div class="loop__center" aria-live="off">
        <p class="loop__kicker">Now running</p>
        <p class="loop__name" data-loop-name>Four machines, one developer</p>
        <p class="loop__text" data-loop-text>Each one does a job you would rather not do by hand.</p>
      </div>
      <ol class="sr-only">${ORDER.map((id) => { const s = cfg.services.find((x) => x.id === id); return `<li>${esc(s.name)}: ${esc(s.blurb)}</li>`; }).join('')}</ol>
    </div>
  </div>
  <div class="marquee" aria-hidden="true"><div class="marquee__track">${Array(2).fill(0).map(() => `<ul>${cfg.services.map((s) => `<li>${esc(s.name)}</li>`).join('')}${cfg.services.map((s) => `<li>${esc(s.tags[0])}</li>`).join('')}</ul>`).join('')}</div></div>
</section>`;
}

function services(h) {
  const cards = cfg.services.map((s, i) => `
    <article class="svc svc--${s.id}" style="--i:${i}" data-e3d>
      <div class="svc__body">
        <p class="svc__no">0${i + 1}</p>
        <h3 class="svc__name"><a class="svc__link" href="${h.page(s.slug)}">${esc(s.name)}</a></h3>
        <p class="svc__blurb">${esc(s.blurb)}</p>
        <ul class="tags">${s.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <span class="svc__go" aria-hidden="true">${icons.arrowUpRight}</span>
      </div>
      <div class="svc__art" aria-hidden="true" data-3d="${s.id}">${shapeSvg(s.id, 'svc__shape')}</div>
    </article>`).join('');
  return `<section class="band band--alt sec" id="services" aria-labelledby="services-h">
  <div class="wrap">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">01</span>What I build</p>
      <h2 class="display h2" id="services-h" data-kinetic><span class="line"><span class="line__in">Four things,</span></span> <span class="line"><span class="line__in">built properly.</span></span></h2>
      <p class="sec__lead">Every project is written for you, not reskinned from a template. Pick a service to see what it covers, what it fits and what people usually ask.</p>
    </header>
    <div class="stack" data-stack>${cards}
    </div>
  </div>
</section>`;
}

function stack() {
  const all = [...new Set(cfg.services.flatMap((s) => s.tools))];
  return `<section class="band band--sun sec sec--tight" aria-labelledby="stack-h">
  <div class="wrap stack-sec">
    <h2 class="h3" id="stack-h">What it&rsquo;s made of</h2>
    <ul class="chips chips--static">${all.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  </div>
</section>`;
}

function demos() {
  return `<section class="band sec" id="try" aria-labelledby="try-h">
  <div class="wrap">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">02</span>Try it</p>
      <h2 class="display h2" id="try-h" data-kinetic><span class="line"><span class="line__in">Don&rsquo;t take my word.</span></span> <span class="line"><span class="line__in">Poke it.</span></span></h2>
      <p class="sec__lead">Three small demos that run right here in your browser. They are scripted, not connected to anything, but they show how this kind of work feels to use.</p>
    </header>

    <div class="tabs" data-tabs>
      <div class="tabs__list" role="tablist" aria-label="Demos">
        <button class="tab" role="tab" type="button" id="tab-bot" aria-controls="panel-bot" aria-selected="true">Telegram bot</button>
        <button class="tab" role="tab" type="button" id="tab-term" aria-controls="panel-term" aria-selected="false" tabindex="-1">Terminal</button>
        <button class="tab" role="tab" type="button" id="tab-text" aria-controls="panel-text" aria-selected="false" tabindex="-1">Text tool</button>
      </div>

      <div class="panel" role="tabpanel" id="panel-bot" aria-labelledby="tab-bot" tabindex="0">
        <div class="panel__info">
          <h3 class="h3">A bot that takes the brief</h3>
          <p>Telegram bots can answer questions, take orders and collect requests at any hour. This one walks you through a project brief and hands the result to the form below.</p>
          <ul class="ticks"><li>Buttons instead of typing</li><li>Instant replies, any hour</li><li>Hands the details to a person</li></ul>
        </div>
        <div class="phone" data-bot data-e3d="y">
          <div class="phone__bar"><span class="avatar" aria-hidden="true">${shapeSvg('bot', '', 28)}</span><span class="phone__who"><b>claxen_demo_bot</b><small>bot</small></span></div>
          <div class="chat" data-chat role="log" aria-live="polite" aria-label="Demo bot conversation">
            <p class="msg msg--bot">Hi, I&rsquo;m the CLAXEN demo bot. What would you like to do?</p>
          </div>
          <div class="replies" data-replies>
            <button type="button" class="reply" data-say="book">Book a project</button>
            <button type="button" class="reply" data-say="prices">Prices</button>
            <button type="button" class="reply" data-say="build">What do you build?</button>
          </div>
        </div>
      </div>

      <div class="panel" role="tabpanel" id="panel-term" aria-labelledby="tab-term" tabindex="0">
        <div class="panel__info">
          <h3 class="h3">Scripts you can talk to</h3>
          <p>A lot of automation is a small program that takes a command and does something useful. Type <code>help</code> to see what this one knows, or tap a command.</p>
          <ul class="ticks"><li>Runs anywhere Python runs</li><li>Logs what it did</li><li>Alerts you when it fails</li></ul>
        </div>
        <div class="term" data-term data-e3d="r">
          <div class="term__bar" aria-hidden="true"><i></i><i></i><i></i><span>claxen &mdash; bash</span></div>
          <div class="term__out" data-term-out role="log" aria-live="polite"><p>CLAXEN shell 1.0. Type <b>help</b> to list commands.</p></div>
          <form class="term__form" data-term-form autocomplete="off">
            <label for="term-in" class="term__prompt">claxen@site:~$</label>
            <input id="term-in" class="term__in" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Terminal command">
          </form>
          <div class="chips term__chips" data-term-chips>
            ${['help', 'services', 'price', 'stack', 'contact'].map((c) => `<button type="button" class="chip" data-cmd="${c}">${c}</button>`).join('')}
          </div>
        </div>
      </div>

      <div class="panel" role="tabpanel" id="panel-text" aria-labelledby="tab-text" tabindex="0">
        <div class="panel__info">
          <h3 class="h3">Turn a wall of text into next steps</h3>
          <p>AI tools are good at reading long text for you. This demo does a simple version with plain code in your browser, so you can see the kind of job I would automate. A real AI tool does it better and connects to your apps.</p>
          <ul class="ticks"><li>Summaries of long messages</li><li>Tasks, dates and amounts pulled out</li><li>Reply drafts for review</li></ul>
        </div>
        <div class="tt" data-tt data-e3d>
          <label class="tt__label" for="tt-in">Paste any text</label>
          <textarea class="tt__in" id="tt-in" rows="7" data-tt-in spellcheck="false">Hi Claxen, we run a small online shop and answer the same questions on Telegram all day. Customers ask about delivery times, prices and order status. We need a bot that answers these and passes real problems to us. Our budget is around $400 and we would like it live by 15 November. Please send a quote and tell us if you need our product list first.</textarea>
          <div class="chips">
            <button class="chip" type="button" data-act="summary">Summarise</button>
            <button class="chip" type="button" data-act="tasks">Pull out tasks</button>
            <button class="chip" type="button" data-act="reply">Draft a reply</button>
            <button class="chip" type="button" data-act="clean">Clean up</button>
          </div>
          <div class="tt__out" data-tt-out aria-live="polite"><p class="muted">Pick an action to see the result.</p></div>
          <p class="note">Runs only in your browser. Nothing you paste is sent anywhere. This is plain code, not an AI model.</p>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function process() {
  const steps = PROCESS.map(([t, d], i) => `<li class="step"><span class="step__n">0${i + 1}</span><div><h3 class="step__t">${t}</h3><p class="step__d">${d}</p></div></li>`).join('');
  return `<section class="band band--ink sec" id="process" aria-labelledby="process-h">
  <div class="wrap process">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">03</span>How a project runs</p>
      <h2 class="display h2" id="process-h" data-kinetic><span class="line"><span class="line__in">Four steps.</span></span> <span class="line"><span class="line__in">No surprises.</span></span></h2>
      <p class="sec__lead">You always know what is happening, what it costs and what comes next.</p>
      <div class="stage stage--steps" data-3d="steps" aria-hidden="true"></div>
    </header>
    <ol class="steps" data-steps>${steps}</ol>
  </div>
</section>`;
}

function pricing() {
  return `<section class="band band--lilac sec" id="pricing" aria-labelledby="pricing-h">
  <div class="wrap pricing">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">04</span>Pricing</p>
      <h2 class="display h2" id="pricing-h" data-kinetic><span class="line"><span class="line__in">From $${cfg.priceMin}</span></span> <span class="line"><span class="line__in">to $${cfg.priceMax.toLocaleString('en-US')}.</span></span></h2>
      <p class="sec__lead">Small jobs and big builds both get a fixed quote before any work starts. Slide to see what a budget usually covers.</p>
      <div class="stage stage--city" data-3d="city" aria-hidden="true"></div>
    </header>
    <div class="budget" data-budget>
      <div class="budget__top">
        <output class="budget__val" data-budget-out for="budget-range">$250</output>
        <label class="budget__label" for="budget-range">My budget</label>
      </div>
      <input class="range" id="budget-range" type="range" min="0" max="100" step="1" value="47" data-budget-range aria-describedby="budget-guide">
      <div class="range__ticks" aria-hidden="true"><span>$10</span><span>$100</span><span>$1,000</span><span>$10,000</span></div>
      <div class="budget__guide" id="budget-guide" aria-live="polite">
        <p class="budget__tier" data-budget-tier></p>
        <p class="budget__text" data-budget-text></p>
      </div>
      <p class="note">A rough guide only. I quote each project after reading the brief.</p>
    </div>
  </div>
</section>`;
}

function faq() {
  const items = cfg.faqHome.map(([q, a]) => `<details class="qa"><summary><span>${esc(q)}</span><i aria-hidden="true">${icons.plus}</i></summary><div class="qa__a"><p>${esc(a)}</p></div></details>`).join('');
  return `<section class="band band--alt sec" id="faq" aria-labelledby="faq-h">
  <div class="wrap faq">
    <header class="sec__head">
      <p class="eyebrow"><span class="num">05</span>FAQ</p>
      <h2 class="display h2" id="faq-h" data-kinetic><span class="line"><span class="line__in">Good questions.</span></span></h2>
    </header>
    <div class="qas">${items}</div>
  </div>
</section>`;
}

function contact() {
  const kinds = [['website', 'Website'], ['bot', 'Bot'], ['automation', 'Automation'], ['ai', 'AI tool'], ['unsure', 'Not sure yet']];
  return `<section class="band band--blue sec" id="contact" aria-labelledby="contact-h">
  <div class="wrap contact">
    <div class="contact__lead">
      <p class="eyebrow"><span class="num">06</span>Contact</p>
      <h2 class="display h2" id="contact-h" data-kinetic><span class="line"><span class="line__in">Tell me what</span></span> <span class="line"><span class="line__in">you need.</span></span></h2>
      <p class="sec__lead">Fill in what you know. The brief on the right writes itself, and you can send it by email or paste it into Telegram. I reply with a quote and a timeline.</p>
      <ul class="direct">
        <li><span>Email</span><a href="mailto:${cfg.email}">${cfg.email}</a></li>
        <li><span>Telegram</span><a href="${cfg.telegramUrl}" target="_blank" rel="noopener">${cfg.telegramText}</a></li>
        <li><span>My clock</span><b data-clock>IST</b></li>
      </ul>
    </div>
    <form class="brief" data-brief novalidate data-e3d="y">
      <fieldset class="field">
        <legend>What do you need?</legend>
        <div class="kinds">${kinds.map(([v, t], i) => `<label class="kind"><input type="radio" name="kind" value="${t}"${i === 0 ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>
      </fieldset>
      <div class="field field--row">
        <label class="field"><span>Your name</span><input type="text" name="name" autocomplete="name" placeholder="Name"></label>
        <label class="field"><span>Telegram or email</span><input type="text" name="reach" autocomplete="email" placeholder="@handle or you@mail.com"></label>
      </div>
      <div class="field field--row">
        <label class="field"><span>Budget <b data-brief-budget>$250</b></span><input type="range" class="range range--small" min="0" max="100" step="1" value="47" data-brief-range aria-label="Budget"></label>
        <label class="field"><span>Deadline</span><select name="when"><option>No rush</option><option>Within a month</option><option>Within 2 weeks</option><option>As soon as possible</option></select></label>
      </div>
      <label class="field"><span>What should it do?</span><textarea name="about" rows="4" placeholder="A few lines is enough. Links to something similar help."></textarea></label>
    </form>
    <aside class="ticket" aria-label="Your brief" data-e3d="r">
      <p class="ticket__h">Your brief</p>
      <pre class="ticket__body" data-ticket aria-live="polite">Project: Website
Budget: $250
Deadline: No rush</pre>
      <div class="ticket__actions">
        <a class="btn btn--sun" href="mailto:${cfg.email}?subject=Project%20brief" data-mail><span>Email this brief</span>${icons.send}</a>
        <button class="btn btn--glass" type="button" data-copy><span>Copy brief</span>${icons.copy}</button>
        <a class="btn btn--glass" href="${cfg.telegramUrl}" target="_blank" rel="noopener" data-tg><span>Open Telegram</span>${icons.arrowUpRight}</a>
      </div>
      <p class="note">Telegram can&rsquo;t take a pre-filled message, so I copy the brief first. Paste it into the chat.</p>
    </aside>
  </div>
</section>`;
}

function render(ctx) {
  const h = helpers(ctx);
  const meta = {
    title: 'Freelance Developer for Websites, Bots and AI Tools | CLAXEN',
    description: 'Claxen builds custom websites, Telegram and Discord bots, Python automations and AI tools. Projects from $10 to $10,000. Message Claxen for a quote.',
    ogTitle: 'CLAXEN | Websites, bots, Python automation and AI tools',
    ogAlt: 'CLAXEN, a freelance developer building websites, bots, automations and AI tools',
    keywords: 'freelance developer, website development, telegram bot development, discord bot, python automation, AI automation tools, hire developer'
  };
  meta.jsonld = homeGraph(meta);
  const body = [hero(h), services(h), stack(), demos(), process(), pricing(), faq(), contact()].join('\n');
  return { meta, body, scripts: ['site', 'fx', 'home'] };
}

module.exports = { render };
