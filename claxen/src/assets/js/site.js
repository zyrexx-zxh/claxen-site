/* CLAXEN core: theme, menu, palette, scroll effects, kinetic type, reveals. No dependencies. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var mq = function (q) { return !!(window.matchMedia && matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(hover: hover) and (pointer: fine)');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var cfg = { email: 'claxen@outlook.com', tg: 'https://t.me/claxen' };
  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.warn('[cx] ' + (name || fn.name), e); } }

  /* ---------- tiny helpers shared with home.js ---------- */
  var toastEl = null, toastT = 0;
  function toast(msg) {
    toastEl = toastEl || $('[data-toast]');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3400);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = doc.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
      doc.body.appendChild(ta); ta.select();
      try { doc.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } finally { doc.body.removeChild(ta); }
    });
  }
  window.CX = { $: $, $$: $$, clamp: clamp, reduce: reduce, fine: fine, toast: toast, copy: copy, safe: safe, cfg: cfg };

  root.classList.add('js-ready');

  /* ---------- theme ---------- */
  var THEME_COLORS = { paper: '#F3F4F7', blue: '#1022B8' };
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('cx-theme', t); } catch (e) {}
    $$('meta[name="theme-color"]').forEach(function (m) { m.removeAttribute('media'); m.setAttribute('content', THEME_COLORS[t]); });
    $$('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', t === 'blue' ? 'true' : 'false');
      b.setAttribute('aria-label', t === 'blue' ? 'Switch to the light paper theme' : 'Switch to the blue theme');
    });
  }
  function toggleTheme(src) {
    var next = root.getAttribute('data-theme') === 'blue' ? 'paper' : 'blue';
    if (doc.startViewTransition && !reduce) {
      var r = (src && src.getBoundingClientRect) ? src.getBoundingClientRect() : { left: innerWidth - 60, top: 40, width: 0, height: 0 };
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var vt = doc.startViewTransition(function () { applyTheme(next); });
      vt.ready.then(function () {
        var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
        root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 750, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () {});
    } else applyTheme(next);
  }
  safe(function theme() {
    applyTheme(root.getAttribute('data-theme') || 'paper');
    $$('[data-theme-toggle]').forEach(function (b) { b.addEventListener('click', function () { toggleTheme(b); }); });
    if (window.matchMedia) {
      var m = matchMedia('(prefers-color-scheme: dark)');
      var fn = function () { var saved = null; try { saved = localStorage.getItem('cx-theme'); } catch (e) {} if (!saved) applyTheme(m.matches ? 'blue' : 'paper'); };
      m.addEventListener ? m.addEventListener('change', fn) : m.addListener && m.addListener(fn);
    }
  });

  /* ---------- mobile menu ---------- */
  safe(function menu() {
    var menu = $('[data-menu]'), btn = $('[data-menu-toggle]');
    if (!menu || !btn) return;
    var closeT = 0;
    function open() {
      clearTimeout(closeT);
      menu.hidden = false; void menu.offsetWidth;
      menu.classList.add('is-open'); root.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
      root.style.overflow = 'hidden';
      var a = $('a', menu); a && setTimeout(function () { a.focus({ preventScroll: true }); }, 300);
    }
    function close(ret) {
      menu.classList.remove('is-open'); root.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
      root.style.overflow = '';
      closeT = setTimeout(function () { menu.hidden = true; }, 720);
      if (ret) btn.focus({ preventScroll: true });
    }
    btn.addEventListener('click', function () { btn.getAttribute('aria-expanded') === 'true' ? close(true) : open(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); if (e.target.closest('[data-palette-open]')) close(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') close(true); });
    addEventListener('resize', function () { if (innerWidth > 940 && btn.getAttribute('aria-expanded') === 'true') close(false); });
  });

  /* ---------- command palette ---------- */
  safe(function palette() {
    var dlg = $('#palette'), dataEl = $('#cx-palette');
    if (!dlg || !dataEl || typeof dlg.showModal !== 'function') {
      $$('[data-palette-open]').forEach(function (b) { b.hidden = true; });
      return;
    }
    var items = JSON.parse(dataEl.textContent), list = $('.palette__list', dlg), input = $('.palette__input', dlg);
    var shown = [], sel = 0;
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    $$('[data-kbd]').forEach(function (k) { k.textContent = isMac ? '⌘ K' : 'Ctrl K'; });
    function score(it, q) {
      if (!q) return 1;
      var hay = (it.t + ' ' + (it.k || '')).toLowerCase(), s = 0;
      var parts = q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], at = hay.indexOf(p);
        if (at < 0) return 0;
        s += it.t.toLowerCase().indexOf(p) === 0 ? 4 : (it.t.toLowerCase().indexOf(p) > 0 ? 3 : 1);
      }
      return s;
    }
    function render(q) {
      shown = items.map(function (it) { return { it: it, s: score(it, q) }; }).filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s; }).slice(0, 9).map(function (x) { return x.it; });
      sel = 0; list.textContent = '';
      if (!shown.length) { var p = doc.createElement('li'); p.className = 'pal-empty'; p.textContent = 'Nothing found. Try "bot", "price" or "contact".'; list.appendChild(p); }
      shown.forEach(function (it, i) {
        var li = doc.createElement('li');
        li.className = 'pal-item'; li.id = 'pal-' + i; li.setAttribute('role', 'option');
        var t = doc.createElement('span'); t.textContent = it.t;
        var d = doc.createElement('small'); d.textContent = it.d;
        li.appendChild(t); li.appendChild(d);
        li.addEventListener('mousemove', function () { choose(i, true); });
        li.addEventListener('click', function () { run(it); });
        list.appendChild(li);
      });
      choose(0);
    }
    function choose(i, noscroll) {
      sel = clamp(i, 0, Math.max(shown.length - 1, 0));
      $$('.pal-item', list).forEach(function (li, k) { li.setAttribute('aria-selected', k === sel ? 'true' : 'false'); if (k === sel && !noscroll) li.scrollIntoView({ block: 'nearest' }); });
      input.setAttribute('aria-activedescendant', shown.length ? 'pal-' + sel : '');
    }
    function open() { if (dlg.open) return; dlg.showModal(); input.value = ''; render(''); input.focus(); }
    function run(it) {
      dlg.close();
      if (it.a === 'copy-email') copy(cfg.email).then(function () { toast('Email copied: ' + cfg.email); }, function () { toast(cfg.email); });
      else if (it.a === 'telegram') window.open(cfg.tg, '_blank', 'noopener');
      else if (it.a === 'theme') toggleTheme($('[data-theme-toggle]'));
      else if (it.h) {
        var hash = it.h.indexOf('#') > -1 ? it.h.slice(it.h.indexOf('#')) : '';
        var same = hash && /^(#|\.\/#|\.\/index\.html#|index\.html#)/.test(it.h) && !/\.\.\//.test(it.h);
        if (same && $(hash)) { $(hash).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', hash); }
        else location.href = it.h;
      }
    }
    $$('[data-palette-open]').forEach(function (b) { b.addEventListener('click', open); });
    input.addEventListener('input', function () { render(input.value.trim()); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); choose((sel + 1) % Math.max(shown.length, 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); choose((sel - 1 + shown.length) % Math.max(shown.length, 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (shown[sel]) run(shown[sel]); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    doc.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((doc.activeElement || {}).tagName || '') || (doc.activeElement && doc.activeElement.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : open(); }
      else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); }
    });
  });

  /* ---------- kinetic type (variable font width reacts to the pointer) ---------- */
  var BASE = 92, PEAK = 16;
  var kin = { lines: [], visible: new Set(), py: -1, raf: 0, last: 0, moved: false };
  function kineticIn(h) {
    var ls = $$('.line__in', h);
    ls.forEach(function (el, i) {
      el.style.setProperty('--d', i);
      var rec = { el: el, cur: reduce ? BASE : 74, target: BASE, delay: reduce ? 0 : 140 + i * 110 };
      el.style.setProperty('--w', rec.cur);
      kin.lines.push(rec);
    });
    kin.visible.add(h);
    setTimeout(function () { h.classList.add('done'); }, reduce ? 0 : 1500);
    kickKinetic();
  }
  function kickKinetic() { if (!kin.raf) { kin.last = performance.now(); kin.raf = requestAnimationFrame(kinTick); } }
  function kinTick(now) {
    var dt = Math.min(now - kin.last, 64); kin.last = now;
    var k = 1 - Math.exp(-dt / 120), busy = false, vh = innerHeight, i, l, r;
    var rects = [];
    for (i = 0; i < kin.lines.length; i++) {
      l = kin.lines[i];
      var host = l.el.closest('[data-kinetic]');
      if (!host || !kin.visible.has(host)) { rects.push(null); continue; }
      rects.push(l.el.parentNode.getBoundingClientRect());
    }
    for (i = 0; i < kin.lines.length; i++) {
      l = kin.lines[i]; r = rects[i];
      if (!r) continue;
      if (l.delay > 0) { l.delay -= dt; busy = true; continue; }
      var t = BASE;
      if (fine && !reduce && kin.py >= 0) {
        var dy = (r.top + r.height / 2 - kin.py) / (vh * 0.34);
        t = BASE + PEAK * Math.exp(-dy * dy);
      }
      l.target = t;
      var d = t - l.cur;
      if (Math.abs(d) > 0.04) { l.cur += d * k; l.el.style.setProperty('--w', l.cur.toFixed(2)); busy = true; }
    }
    kin.raf = busy || kin.moved ? requestAnimationFrame(kinTick) : 0;
    kin.moved = false;
  }
  safe(function kinetic() {
    var heads = $$('[data-kinetic]');
    if (!heads.length) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var h = e.target;
        if (e.isIntersecting) {
          if (!h.classList.contains('in')) { h.classList.add('in'); kineticIn(h); }
          else { kin.visible.add(h); kickKinetic(); }
        } else kin.visible.delete(h);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    heads.forEach(function (h) { io.observe(h); });
    if (fine && !reduce) {
      addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; kin.py = e.clientY; kin.moved = true; kickKinetic(); }, { passive: true });
      root.addEventListener('pointerleave', function () { kin.py = -1; kin.moved = true; kickKinetic(); });
    }
  }, 'kinetic');

  /* ---------- scroll reveals ---------- */
  safe(function reveals() {
    if (reduce || !('IntersectionObserver' in window)) { root.classList.remove('js-ready'); root.classList.add('js'); return; }
    var sel = '.sec__head > :not([data-kinetic]),.get,.qa,.minis > *,.panel,.budget,.brief,.ticket,.tabs__list,.direct,.stack-sec > *,.fit__cols > *,.cta__in > :not([data-kinetic]),.foot__col,.nf__in > :not(h1)';
    var els = $$(sel);
    els.forEach(function (el) {
      var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--rd', Math.min(sibs, 6));
      el.classList.add('rv');
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () { els.forEach(function (el) { el.classList.add('in'); }); }, 12000);
  }, 'reveals');

  /* ---------- scroll: progress bar, header, scrollspy, process line ---------- */
  safe(function scrollFx() {
    var header = $('[data-header]'), lastY = scrollY, ticking = false;
    var steps = $$('[data-steps]');
    var spy = {};
    $$('[data-spy]').forEach(function (a) { spy[a.getAttribute('data-spy')] = a; });
    function update() {
      ticking = false;
      var y = scrollY, h = doc.documentElement.scrollHeight - innerHeight;
      root.style.setProperty('--prog', h > 0 ? clamp(y / h, 0, 1).toFixed(4) : 0);
      if (header) {
        var menuOpen = root.style.overflow === 'hidden';
        header.classList.toggle('is-hidden', !menuOpen && y > 480 && y > lastY + 4 && !header.contains(doc.activeElement));
        if (y < lastY - 4 || y < 480) header.classList.remove('is-hidden');
      }
      lastY = y;
      steps.forEach(function (list) {
        var r = list.getBoundingClientRect(), line = innerHeight * 0.62;
        list.style.setProperty('--p', clamp((line - r.top) / r.height, 0, 1).toFixed(3));
        $$('.step', list).forEach(function (s) { s.classList.toggle('is-on', s.getBoundingClientRect().top < line); });
      });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
    var keys = Object.keys(spy);
    if (keys.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { keys.forEach(function (k) { spy[k].classList.toggle('is-active', k === e.target.id); if (k === e.target.id) spy[k].setAttribute('aria-current', 'true'); else spy[k].removeAttribute('aria-current'); }); }
          else if (spy[e.target.id]) { spy[e.target.id].classList.remove('is-active'); spy[e.target.id].removeAttribute('aria-current'); }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      keys.forEach(function (k) { var s = doc.getElementById(k); s && io.observe(s); });
    }
  }, 'scrollFx');

  /* ---------- magnetic buttons ---------- */
  safe(function magnet() {
    if (!fine || reduce) return;
    $$('[data-magnet]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = 'translate(' + (dx * 14).toFixed(1) + 'px,' + (dy * 10).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  });

  /* ---------- footer wordmark ---------- */
  safe(function wordmark() {
    var el = $('[data-wordmark]');
    if (!el) return;
    var txt = el.textContent.trim(), spans = [];
    el.textContent = '';
    txt.split('').forEach(function (c) { var s = doc.createElement('span'); s.textContent = c; s.style.setProperty('--w', 100); el.appendChild(s); spans.push({ el: s, cur: 100 }); });
    function fit() {
      el.style.setProperty('--fs', '100px');
      var a = el.firstChild, z = el.lastChild;
      var w = a && z ? z.getBoundingClientRect().right - a.getBoundingClientRect().left : 0, avail = el.parentNode.clientWidth;
      if (w > 0) el.style.setProperty('--fs', (100 * avail / w * 0.985).toFixed(2) + 'px');
    }
    fit(); addEventListener('resize', fit);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fit);
    if (!fine || reduce) return;
    var px = -1, raf = 0, near = false;
    function tick() {
      var r = el.getBoundingClientRect(), busy = false;
      spans.forEach(function (s) {
        var b = s.el.getBoundingClientRect(), t = 100;
        if (near && px >= 0) { var d = (b.left + b.width / 2 - px) / (r.width * 0.12); t = 84 + 38 * Math.exp(-d * d); }
        var dd = t - s.cur;
        if (Math.abs(dd) > 0.05) { s.cur += dd * 0.16; s.el.style.setProperty('--w', s.cur.toFixed(1)); busy = true; }
      });
      raf = busy ? requestAnimationFrame(tick) : 0;
    }
    el.parentNode.addEventListener('pointermove', function (e) { px = e.clientX; near = true; if (!raf) raf = requestAnimationFrame(tick); });
    el.parentNode.addEventListener('pointerleave', function () { near = false; if (!raf) raf = requestAnimationFrame(tick); });
  }, 'wordmark');

  /* ---------- misc ---------- */
  safe(function misc() {
    $$('[data-top]').forEach(function (b) { b.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }); });
  });
})();
