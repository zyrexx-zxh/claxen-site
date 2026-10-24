/* The four "machines" of the CLAXEN identity — flat geometric shapes, each one a service.
   Colours come from CSS custom properties so they re-theme (paper / ultramarine) for free. */

// inner markup, drawn in a 120 x 120 box
const inner = {
  web: `
    <rect class="s-body" x="8" y="10" width="104" height="100" rx="5" fill="var(--c-web)"/>
    <circle cx="21" cy="23" r="3.4" fill="var(--on-web)" opacity=".9"/>
    <circle cx="32" cy="23" r="3.4" fill="var(--on-web)" opacity=".6"/>
    <circle cx="43" cy="23" r="3.4" fill="var(--on-web)" opacity=".35"/>
    <rect class="s-line s-line--a" x="21" y="42" width="56" height="9" fill="var(--on-web)"/>
    <rect class="s-line s-line--b" x="21" y="57" width="36" height="5" fill="var(--on-web)" opacity=".55"/>
    <rect x="21" y="78" width="32" height="15" rx="7.5" fill="var(--sun)"/>
    <rect x="66" y="68" width="32" height="28" fill="var(--on-web)" opacity=".18"/>`,
  bot: `
    <circle class="s-body" cx="60" cy="60" r="54" fill="var(--c-bot)"/>
    <path d="M30 41a11 11 0 0 1 11-11h38a11 11 0 0 1 11 11v20a11 11 0 0 1-11 11H62L48 86V72H41a11 11 0 0 1-11-11z" fill="var(--ink-fixed)"/>
    <circle class="s-dot s-dot--1" cx="46" cy="51" r="4.2" fill="var(--c-bot)"/>
    <circle class="s-dot s-dot--2" cx="60" cy="51" r="4.2" fill="var(--c-bot)"/>
    <circle class="s-dot s-dot--3" cx="74" cy="51" r="4.2" fill="var(--c-bot)"/>`,
  py: `
    <path class="s-body" d="M20 8 112 60 20 112z" fill="var(--c-py)" stroke="var(--c-py)" stroke-width="6" stroke-linejoin="round"/>
    <path d="M32 46 50 60 32 74" fill="none" stroke="var(--on-py)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <rect class="s-cursor" x="55" y="73" width="17" height="5.5" fill="var(--on-py)"/>`,
  ai: `
    <path class="s-body" d="M60 4C65 38 82 55 116 60 82 65 65 82 60 116 55 82 38 65 4 60 38 55 55 38 60 4Z" fill="var(--c-ai)"/>
    <path class="s-spark" d="M97 12C98.5 22 103 26.5 113 28 103 29.5 98.5 34 97 44 95.5 34 91 29.5 81 28 91 26.5 95.5 22 97 12Z" fill="var(--ink-fixed)"/>`
};

const meta = {
  web: { name: 'Website', color: 'var(--c-web)' },
  bot: { name: 'Bot', color: 'var(--c-bot)' },
  py:  { name: 'Script', color: 'var(--c-py)' },
  ai:  { name: 'AI tool', color: 'var(--c-ai)' }
};

function shapeSvg(id, cls = '', size) {
  const sz = size ? ` width="${size}" height="${size}"` : '';
  return `<svg class="shape shape--${id} ${cls}" viewBox="0 0 120 120"${sz} aria-hidden="true" focusable="false">${inner[id]}</svg>`;
}
function shapeG(id, x, y, scale, cls = '') {
  const s = scale, o = 60 * s;
  return `<g class="node-shape node-shape--${id} ${cls}" transform="translate(${x - o} ${y - o}) scale(${s})">${inner[id]}</g>`;
}

const icons = {
  arrowUpRight: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12 4v15M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  theme: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><rect x="8.5" y="8.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  send: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="m4 12 16-7-6 15-2.5-6.2z" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
};

module.exports = { inner, meta, shapeSvg, shapeG, icons };
