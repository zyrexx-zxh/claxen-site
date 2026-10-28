/* CLAXEN fx: CSS-3D scroll effects (work without WebGL) and the loader for the WebGL stage. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn('fx', e); } }

  /* ---------- 3D scroll entrances: --e goes 1 -> 0 as an element rises into view ---------- */
  var ent = [], hero = null, marquee = null, fw = null, lastY = scrollY, vel = 0, skew = 0, ticking = false, idle = 0;
  safe(function () {
    ent = $$('[data-e3d]').map(function (el) { return { el: el, v: -1 }; });
    hero = doc.querySelector('.hero');
    marquee = doc.querySelector('.marquee');
    fw = doc.querySelector('[data-wordmark]');
  });
  function update() {
    ticking = false;
    var vh = innerHeight, y = scrollY;
    ent.forEach(function (it) {
      var r = it.el.getBoundingClientRect();
      var e = r.top > vh ? 1 : clamp((r.top - vh * .52) / (vh * .48), 0, 1);
      e = Math.round(e * 100) / 100;
      if (e !== it.v) { it.v = e; it.el.style.setProperty('--e', e); }
    });
    if (hero) {
      var hp = clamp(y / (hero.offsetHeight * .85), 0, 1);
      hero.style.setProperty('--hp', hp.toFixed(3));
    }
    if (marquee) {
      vel = vel * .8 + (y - lastY) * .2; skew = clamp(vel * -.35, -14, 14);
      marquee.style.setProperty('--skew', skew.toFixed(2));
    }
    if (fw) {
      var fr = fw.getBoundingClientRect(), kids = fw.children, n = kids.length;
      var pf = clamp((vh - fr.top) / (fr.height + vh * .25), 0, 1);
      for (var i = 0; i < n; i++) {
        var ti = clamp((pf * 1.6 - i / n * .8) / .5, 0, 1), fe = Math.round((1 - (ti < .5 ? 4 * ti * ti * ti : 1 - Math.pow(-2 * ti + 2, 3) / 2)) * 100) / 100;
        if (kids[i].__fe !== fe) { kids[i].__fe = fe; kids[i].style.setProperty('--fe', fe); }
      }
    }
    lastY = y;
    if (Math.abs(vel) > .05) { ticking = true; requestAnimationFrame(update); }
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  kick();

  /* ---------- tilt + glare on the service cards (mouse only) ---------- */
  safe(function () {
    if (!fine) return;
    $$('.svc:not(.svc--mini)').forEach(function (c) {
      var raf = 0, px = 0, py = 0;
      function apply() {
        raf = 0;
        c.style.setProperty('--rx', (-py * 2.2).toFixed(2));
        c.style.setProperty('--ry', (px * 3).toFixed(2));
        c.style.setProperty('--gx', ((px + 1) * 50).toFixed(1) + '%');
        c.style.setProperty('--gy', ((py + 1) * 50).toFixed(1) + '%');
      }
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
        py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
        c.classList.add('is-tilt');
        if (!raf) raf = requestAnimationFrame(apply);
      });
      c.addEventListener('pointerleave', function () { px = py = 0; c.classList.remove('is-tilt'); if (!raf) raf = requestAnimationFrame(apply); });
    });
    // soft light that follows the cursor across the hero
    if (hero) hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- WebGL stage: load after first paint, only if there is something to draw ---------- */
  safe(function () {
    var src = doc.body.getAttribute('data-stage');
    if (!src || !doc.querySelector('[data-3d]')) return;
    var ok = false;
    try { var c = doc.createElement('canvas'); ok = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) {}
    if (!ok) return;
    function load() { var s = doc.createElement('script'); s.src = src; s.async = true; doc.head.appendChild(s); }
    function go() { if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 1500 }); else setTimeout(load, 300); }
    if (doc.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  });
})();
