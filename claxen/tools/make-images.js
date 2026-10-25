#!/usr/bin/env node
/* Renders favicons, app icons and the 1200x630 social images with headless Chromium (Playwright).
   Needs Playwright installed. Output goes to src/assets/img. Re-run only if you change the brand or copy. */
const fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const SRC = path.join(__dirname, '..', 'src'), OUT = path.join(SRC, 'assets/img'), WORK = path.join(__dirname, '..', 'work');
const cfg = require(path.join(SRC, 'site.js'));
const { shapeSvg } = require(path.join(SRC, 'lib/shapes.js'));
fs.mkdirSync(OUT, { recursive: true });
const fontCss = `
@font-face{font-family:"Mona Display";src:url(${path.join(SRC, 'assets/fonts/mona-display.woff')});font-weight:800;font-stretch:75% 125%}
@font-face{font-family:"Mona Text";src:url(${path.join(SRC, 'assets/fonts/mona-text.woff')});font-weight:400 700}
:root{--c-web:#2A3BFF;--on-web:#fff;--c-bot:#FFD21A;--c-py:#0B0C10;--on-py:#fff;--c-ai:#C9B7FF;--ink-fixed:#0B0C10;--sun:#FFD21A}
*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;overflow:hidden;font-family:"Mona Text",sans-serif}
.d{font-family:"Mona Display";font-weight:800;letter-spacing:-.022em;line-height:.93;font-variation-settings:"wdth" 92}
.mark{display:flex;align-items:center;gap:14px;font-family:"Mona Display";font-weight:800;font-size:34px}
.mark svg{width:46px;height:46px}
.sm{font-size:26px;font-weight:600}
svg.shape{overflow:visible}
`;
const markFor = (key) => {
  const [a, b] = key === 'web' ? ['#fff', '#FFD21A'] : key === 'bot' ? ['#2A3BFF', '#0B0C10'] : ['#2A3BFF', '#FFD21A'];
  return `<svg viewBox="0 0 28 28"><rect x="1" y="3" width="17" height="17" fill="${a}"/><circle cx="18" cy="18" r="9" fill="${b}"/></svg>`;
};
const THEMES = {
  home: { bg: '#F3F4F7', fg: '#0B0C10', mute: '#4B4E58', vars: '' },
  web: { bg: '#2A3BFF', fg: '#fff', mute: '#DCE0FF', vars: '--c-web:#fff;--on-web:#2A3BFF;' },
  bot: { bg: '#FFD21A', fg: '#0B0C10', mute: '#34331F', vars: '--c-bot:#0B0C10;--ink-fixed:#FFD21A;' },
  py: { bg: '#0B0C10', fg: '#F3F4F7', mute: '#B4B8C6', vars: '--c-py:#C9B7FF;--on-py:#0B0C10;' },
  ai: { bg: '#C9B7FF', fg: '#0B0C10', mute: '#34304A', vars: '--c-ai:#0B0C10;--ink-fixed:#C9B7FF;' }
};
function page(key) {
  const t = THEMES[key];
  const foot = `<div class="sm" style="color:${t.mute}">${cfg.email} &nbsp;&middot;&nbsp; ${cfg.telegramText}</div>`;
  if (key === 'home') {
    return `<body style="background:${t.bg};color:${t.fg};position:relative">
      <div style="position:absolute;left:72px;top:60px" class="mark">${markFor(key)}CLAXEN</div>
      <div class="d" style="position:absolute;left:72px;top:150px;font-size:84px;width:640px">Websites, bots,<br>automation &amp; AI<br>that do the work.</div>
      <div style="position:absolute;left:72px;bottom:56px;display:grid;gap:8px"><div class="sm" style="color:${t.mute}">Projects from $${cfg.priceMin} to $${cfg.priceMax.toLocaleString('en-US')}</div>${foot}</div>
      <div style="position:absolute;left:790px;top:60px;width:320px">${shapeSvg('web', '')}</div>
      <div style="position:absolute;left:700px;top:330px;width:230px;z-index:2">${shapeSvg('bot', '')}</div>
      <div style="position:absolute;left:960px;top:350px;width:190px">${shapeSvg('py', '')}</div>
      <div style="position:absolute;left:690px;top:60px;width:130px;z-index:2">${shapeSvg('ai', '')}</div></body>`;
  }
  const s = cfg.services.find((x) => x.id === key);
  return `<body style="background:${t.bg};color:${t.fg};position:relative;${t.vars}">
    <div style="position:absolute;left:72px;top:60px" class="mark">${markFor(key)}CLAXEN</div>
    <div class="d" style="position:absolute;left:72px;top:150px;font-size:78px;width:640px">${s.seo.h1}</div>
    <div style="position:absolute;left:72px;bottom:56px">${foot}</div>
    <div style="position:absolute;right:56px;top:140px;width:380px;transform:rotate(-4deg)">${shapeSvg(key, '')}</div></body>`;
}
(async () => {
  const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--no-sandbox'] });
  const shot = async (html, w, h, file, omit) => {
    const f = path.join(WORK, 'img-tmp.html');
    fs.writeFileSync(f, html);
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(OUT, file), omitBackground: !!omit }); await p.close();
    console.log('wrote', file);
  };
  for (const key of ['home', 'web', 'bot', 'py', 'ai']) {
    const slug = key === 'home' ? 'home' : cfg.services.find((x) => x.id === key).slug;
    await shot(`<style>${fontCss}</style>${page(key)}`, 1200, 630, `og-${slug}.png`);
  }
  const svg = fs.readFileSync(path.join(SRC, 'favicon.svg'), 'utf8');
  const icon = (size, pad, round) => `<style>*{margin:0}body{width:${size}px;height:${size}px;background:#2A3BFF;overflow:hidden;display:grid;place-items:center}svg{width:${size * (1 - pad * 2)}px;height:${size * (1 - pad * 2)}px}</style>${svg.replace('rx="14"', 'rx="0"')}`;
  await shot(`<style>*{margin:0}body{width:32px;height:32px}svg{width:32px;height:32px}</style>${svg}`, 32, 32, 'favicon-32.png', true);
  await shot(icon(180, 0, 0), 180, 180, 'apple-touch-icon.png');
  await shot(icon(192, 0.1, 0), 192, 192, 'icon-192.png');
  await shot(icon(512, 0.1, 0), 512, 512, 'icon-512.png');
  await browser.close();
})();
