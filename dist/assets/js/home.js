/* CLAXEN home: hero loop, service stack, demos, pricing slider, brief builder. */
(function () {
  'use strict';
  var C = window.CX;
  if (!C) return;
  var doc = document, $ = C.$, $$ = C.$$, clamp = C.clamp, reduce = C.reduce, safe = C.safe;
  var money = function (v) { return '$' + v.toLocaleString('en-US'); };
  function el(tag, cls, text) { var n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function goContact() { var c = $('#contact'); if (c) { c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', '#contact'); } }
  /* shared budget state: 0..100 on a log scale from $10 to $10,000 */
  var state = { t: 47, kind: 'Website' };
  function valFromT(t) {
    var v = Math.pow(10, 1 + 3 * t / 100), step = v < 100 ? 5 : v < 1000 ? 25 : 250;
    return clamp(Math.round(v / step) * step, 10, 10000);
  }
  function tFromVal(v) { return clamp((Math.log(v) / Math.LN10 - 1) / 3 * 100, 0, 100); }
  var TIERS = [
    [50, 'Small fixes and tiny scripts', 'A one-off script, a bug fix, or a small change to an existing bot or page.'],
    [200, 'Single-purpose tools', 'A simple command bot, a data-collection script, or a one-page site.'],
    [1000, 'Focused projects', 'A bot with several features, a multi-page site, or a script wired into a couple of services.'],
    [4000, 'Full builds', 'A custom website with animation and forms, a bot with an admin panel and payments, or an AI tool connected to your data.'],
    [Infinity, 'Larger systems', 'Web apps and platforms, with several integrations working together.']
  ];
  var subs = [];
  function setT(t, from) {
    state.t = clamp(Math.round(t), 0, 100);
    subs.forEach(function (fn) { fn(from); });
    doc.dispatchEvent(new CustomEvent('cx-budget', { detail: state.t }));
  }
  /* ---------- hero loop ---------- */
  safe(function loop() {
    var box = $('[data-loop]');
    if (!box) return;
    var nodes = $$('.node', box), trail = $('[data-trail]', box), packet = $('[data-packet]', box);
    var nameEl = $('[data-loop-name]', box), textEl = $('[data-loop-text]', box), center = $('.loop__center', box);
    var R = 210, CX0 = 320, CY0 = 320;
    var pos = 0, from = 0, to = 0, prog = 0, dur = 1100, moving = false, wait = 1500, active = -1;
    var paused = false, visible = true, last = 0, raf = 0;
    var ease = function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
    function setPacket(p) {
      var a = (p * 90 - 90) * Math.PI / 180;
      packet.setAttribute('transform', 'translate(' + (CX0 + R * Math.cos(a)).toFixed(1) + ' ' + (CY0 + R * Math.sin(a)).toFixed(1) + ')');
      var d = ((p % 4) + 4) % 4 / 4 * 1000;
      trail.style.strokeDashoffset = (150 - d).toFixed(1);
      box.__pos = p;
    }
    function activate(i) {
      if (i === active) return;
      active = i; box.__active = i;
      nodes.forEach(function (n, k) { n.classList.toggle('is-active', k === i); });
      var n = nodes[i];
      if (!n) return;
      var label = n.getAttribute('aria-label') || '', nm = label.split(':')[0];
      center.classList.add('is-swap');
      setTimeout(function () {
        nameEl.textContent = nm;
        textEl.textContent = n.getAttribute('data-short') || '';
        center.classList.remove('is-swap');
      }, active === -1 || reduce ? 0 : 160);
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(now - last, 50); last = now;
      if (!visible || doc.hidden || (paused && !moving)) return;
      if (moving) {
        prog += dt;
        var k = Math.min(prog / dur, 1);
        pos = from + (to - from) * ease(k);
        setPacket(pos);
        if (k >= 1) { moving = false; wait = 1400; activate(((Math.round(to) % 4) + 4) % 4); }
      } else {
        wait -= dt;
        if (wait <= 0) { from = pos; to = pos + 1; prog = 0; dur = 1100; moving = true; nodes.forEach(function (n) { n.classList.remove('is-active'); }); active = -2; box.__active = -2; }
      }
    }
    function jump(i) {
      var cur = ((Math.round(pos) % 4) + 4) % 4, d = ((i - cur) % 4 + 4) % 4;
      if (d > 2) d -= 4;
      from = pos; to = Math.round(pos) + d; prog = 0; dur = 520; moving = true;
      active = -2; box.__active = -2; activate(i); wait = 2200;
    }
    nodes.forEach(function (n, i) {
      n.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { paused = true; jump(i); } });
      n.addEventListener('focus', function () { paused = true; jump(i); });
      n.addEventListener('blur', function () { paused = false; });
    });
    box.addEventListener('pointerleave', function () { paused = false; });
    /* the 3D ring reports hover over a machine; treat it like hovering the SVG node */
    box.addEventListener('node-hover', function (e) { paused = true; jump(e.detail); });
    box.addEventListener('node-leave', function () { paused = false; });
    setPacket(0); activate(0);
    box.classList.add('is-live');
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);
    last = performance.now(); raf = requestAnimationFrame(frame);
  }, 'loop');
  /* ---------- sticky service cards: earlier cards sink as the next one covers them ---------- */
  safe(function stack() {
    var wrap = $('[data-stack]');
    if (!wrap || reduce) return;
    var cards = $$('.svc', wrap), wide = window.matchMedia('(min-width: 961px)'), ticking = false;
    function update() {
      ticking = false;
      cards.forEach(function (c, i) {
        var s = 0;
        if (wide.matches && cards[i + 1]) {
          var a = c.getBoundingClientRect(), b = cards[i + 1].getBoundingClientRect();
          s = clamp(1 - (b.top - a.top) / a.height, 0, 1);
        }
        var prev = parseFloat(c.style.getPropertyValue('--sink')) || 0;
        if (Math.abs(prev - s) > 0.004) c.style.setProperty('--sink', s.toFixed(3));
      });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update); update();
  }, 'stack');
  /* ---------- tabs ---------- */
  safe(function tabs() {
    $$('[data-tabs]').forEach(function (box) {
      var tabs = $$('[role="tab"]', box), panels = tabs.map(function (t) { return doc.getElementById(t.getAttribute('aria-controls')); });
      function select(i, focus) {
        tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; panels[k].hidden = !on; });
        if (focus) tabs[i].focus();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(i); });
        t.addEventListener('keydown', function (e) {
          var n = null, L = tabs.length;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % L;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + L) % L;
          else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = L - 1;
          if (n !== null) { e.preventDefault(); select(n, true); }
        });
      });
      select(0);
    });
  }, 'tabs');
  /* ---------- demo 1: scripted Telegram bot ---------- */
  safe(function bot() {
    var box = $('[data-bot]');
    if (!box) return;
    var chat = $('[data-chat]', box), replies = $('[data-replies]', box), sel = { kind: null, budget: null }, busy = false;
    var KINDS = [['Website', 'k:Website'], ['Bot', 'k:Bot'], ['Automation', 'k:Automation'], ['AI tool', 'k:AI tool']];
    var BUDGETS = [['Under $100', 'b:50:Under $100'], ['$100 to $1,000', 'b:400:$100 to $1,000'], ['$1,000 to $10,000', 'b:3000:$1,000 to $10,000']];
    function scroll() { chat.scrollTop = chat.scrollHeight; }
    function say(text, cls) { var m = el('p', 'msg ' + cls, text); chat.appendChild(m); scroll(); return m; }
    function setReplies(list) {
      replies.textContent = '';
      list.forEach(function (r) {
        var b = el('button', 'reply', r[0]); b.type = 'button'; b.setAttribute('data-say', r[1]);
        replies.appendChild(b);
      });
    }
    function botSay(text, then, list) {
      var t = el('p', 'msg msg--bot msg--typing'); t.setAttribute('aria-label', 'Bot is typing');
      t.appendChild(el('i')); t.appendChild(el('i')); t.appendChild(el('i'));
      chat.appendChild(t); scroll();
      setTimeout(function () {
        chat.removeChild(t); say(text, 'msg--bot');
        if (list) setReplies(list);
        busy = false; then && then();
      }, reduce ? 0 : 750);
    }
    var MAIN = [['Book a project', 'book'], ['Prices', 'prices'], ['What do you build?', 'build']];
    function handle(key, label) {
      if (busy) return; busy = true;
      say(label, 'msg--me'); replies.textContent = '';
      if (key === 'book') botSay('Great. What do you need?', null, KINDS);
      else if (key === 'prices') botSay('Projects run from $10 to $10,000. A small script or fix sits at the low end, while a full web app with an admin panel needs a bigger budget. I quote after reading your brief.', null, [['Book a project', 'book'], ['What do you build?', 'build']]);
      else if (key === 'build') botSay('Four things: websites and web apps, Telegram and Discord bots, Python automations, and AI tools. Which is closest to what you need?', null, KINDS);
      else if (key.indexOf('k:') === 0) { sel.kind = key.slice(2); botSay('Got it, ' + sel.kind.toLowerCase() + '. Roughly what budget?', null, BUDGETS); }
      else if (key.indexOf('b:') === 0) {
        var p = key.split(':'); sel.budget = +p[1];
        botSay('Perfect. Your brief is ready: ' + sel.kind + ', ' + p[2] + '. Tap below and I’ll fill the form for you.', null, [['Open the brief form', 'go'], ['Start over', 'start']]);
      } else if (key === 'go') {
        if (sel.kind) { $$('input[name="kind"]').forEach(function (r) { if (r.value === sel.kind) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } }); }
        if (sel.budget) setT(tFromVal(sel.budget), 'bot');
        botSay('Done. Scroll down: the form is filled in.', function () { goContact(); }, [['Start over', 'start']]);
      } else if (key === 'start') { botSay('Okay, from the top. What would you like to do?', null, MAIN); sel.kind = sel.budget = null; }
    }
    replies.addEventListener('click', function (e) { var b = e.target.closest('[data-say]'); if (b) handle(b.getAttribute('data-say'), b.textContent); });
  }, 'bot');
  /* ---------- demo 2: terminal ---------- */
  safe(function terminal() {
    var box = $('[data-term]');
    if (!box) return;
    var out = $('[data-term-out]', box), form = $('[data-term-form]', box), input = $('input', form);
    var hist = [], hi = 0;
    function line(parts, cls) {
      var p = el('p', cls || '');
      (Array.isArray(parts) ? parts : [parts]).forEach(function (x) {
        if (typeof x === 'string') p.appendChild(doc.createTextNode(x));
        else { var a = el('a', '', x.text); a.href = x.href; if (/^https?:/.test(x.href)) { a.target = '_blank'; a.rel = 'noopener'; } p.appendChild(a); }
      });
      out.appendChild(p); out.scrollTop = out.scrollHeight;
    }
    function svcs() { return $$('.svc__name a').map(function (a) { return { text: a.textContent, href: a.getAttribute('href') }; }); }
    function stackList() { return $$('.stack-sec .chips li').map(function (li) { return li.textContent; }); }
    var CMD = {
      help: function () { ['help        list commands', 'services    what I build', 'price       how pricing works', 'stack       tools I reach for', 'contact     how to reach me', 'whoami      who is this', 'ls          list the service pages', 'clear       clear the screen'].forEach(function (t) { line(t, 'dim'); }); line(['Hint: try ', { text: 'sudo hire claxen', href: '#contact' }]); },
      services: function () { svcs().forEach(function (s, i) { line([(i + 1) + '. ', { text: s.text, href: s.href }]); }); },
      price: function () { line('Projects run from $10 to $10,000.'); line('Every project gets a fixed quote before work starts.', 'dim'); },
      stack: function () { line(stackList().join('  ·  ')); },
      contact: function () { line(['email     ', { text: C.cfg.email, href: 'mailto:' + C.cfg.email }]); line(['telegram  ', { text: 't.me/claxen', href: C.cfg.tg }]); },
      whoami: function () { line('claxen: freelance developer. websites, bots, automations, AI tools.'); },
      ls: function () { line(svcs().map(function (s) { return (s.href.replace(/\/?(index\.html)?$/, '').replace(/^\.\//, '')) + '/'; }).join('  ')); },
      date: function () { line(new Date().toString(), 'dim'); },
      clear: function () { out.textContent = ''; }
    };
    function run(raw) {
      var cmd = raw.trim().replace(/\s+/g, ' ');
      line('claxen@site:~$ ' + raw, 'cmd');
      if (!cmd) return;
      hist.push(cmd); hi = hist.length;
      var low = cmd.toLowerCase();
      if (low === 'sudo hire claxen' || low === 'hire claxen' || low === 'hire') {
        var steps = [['[sudo] password for you: ********', 'dim'], ['Access granted.', 'ok'], ['Opening the brief form...', 'hi']];
        steps.forEach(function (s, i) { setTimeout(function () { line(s[0], s[1]); }, reduce ? 0 : 450 * (i + 1)); });
        setTimeout(goContact, reduce ? 0 : 450 * 4);
      } else if (low.indexOf('echo ') === 0) line(cmd.slice(5));
      else if (CMD[low]) CMD[low]();
      else if (low.indexOf('sudo') === 0) line('Nice try. Maybe: sudo hire claxen', 'dim');
      else line('command not found: ' + cmd.split(' ')[0] + '. Type help.', 'dim');
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; run(v); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) input.value = hist[--hi]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); input.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ''); }
    });
    $('[data-term-chips]', box).addEventListener('click', function (e) { var b = e.target.closest('[data-cmd]'); if (b) { run(b.getAttribute('data-cmd')); } });
    box.addEventListener('click', function (e) { if (!e.target.closest('a,button') && !getSelection().toString()) input.focus({ preventScroll: true }); });
  }, 'terminal');
  /* ---------- demo 3: text tool (plain code, not an AI model) ---------- */
  safe(function textTool() {
    var box = $('[data-tt]');
    if (!box) return;
    var inp = $('[data-tt-in]', box), out = $('[data-tt-out]', box);
    var STOP = 'a an the and or but if so to of in on at for with from by is are was were be been it its this that these those i we you our your my me us they them he she as not no do does did have has had will would can could should please also just very more most some any all about into over than then there their what when where who how which one two'.split(' ');
    var MONTHS = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
    var DATE_RE = new RegExp('\\b(?:\\d{1,2}(?:st|nd|rd|th)?\\s+' + MONTHS + '\\b|' + MONTHS + '\\s+\\d{1,2}(?:st|nd|rd|th)?\\b|today|tomorrow|tonight|next\\s+(?:week|month|monday|tuesday|wednesday|thursday|friday)|by\\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|friday)|end of (?:the )?(?:week|month))', 'gi');
    var MONEY_RE = /(?:[$€£₹]\s?\d[\d,]*(?:\.\d+)?|\b\d[\d,]*(?:\.\d+)?\s?(?:usd|eur|dollars|rupees|inr)\b)/gi;
    var ACTION_RE = /\b(need|needs|want|wants|would like|please|send|tell|let me know|must|should|require|requires|can you|could you|looking for|we'd like)\b/i;
    function sentences(t) { return (t.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map(function (s) { return s.trim(); }).filter(Boolean); }
    function words(t) { return (t.toLowerCase().match(/[a-zÀ-ɏ']+/g) || []); }
    function uniq(a) { var s = {}; return a.filter(function (x) { var k = x.toLowerCase(); if (s[k]) return false; s[k] = 1; return true; }); }
    function heading(t) { return el('h4', '', t); }
    function list(items) { var ul = el('ul'); items.forEach(function (i) { ul.appendChild(el('li', '', i)); }); return ul; }
    function show(nodes) { out.textContent = ''; nodes.forEach(function (n) { out.appendChild(n); }); }
    var ACT = {
      summary: function (t) {
        var ss = sentences(t), freq = {};
        if (ss.length < 2) return show([heading('Summary'), el('p', '', ss[0] || 'Paste some text first.')]);
        words(t).forEach(function (w) { if (STOP.indexOf(w) < 0 && w.length > 2) freq[w] = (freq[w] || 0) + 1; });
        var scored = ss.map(function (s, i) {
          var ws = words(s), sc = 0; ws.forEach(function (w) { sc += freq[w] || 0; });
          return { s: s, i: i, sc: sc / Math.sqrt(ws.length || 1) + (i === 0 ? 1.5 : 0) };
        });
        var n = ss.length > 8 ? 3 : 2;
        var pick = scored.sort(function (a, b) { return b.sc - a.sc; }).slice(0, n).sort(function (a, b) { return a.i - b.i; });
        var sum = pick.map(function (p) { return p.s; }).join(' ');
        show([heading('Summary'), el('p', '', sum), el('p', 'muted', words(t).length + ' words down to ' + words(sum).length + '.')]);
      },
      tasks: function (t) {
        var ss = sentences(t), tasks = ss.filter(function (s) { return ACTION_RE.test(s); });
        var dates = uniq(t.match(DATE_RE) || []), money = uniq(t.match(MONEY_RE) || []);
        var nodes = [heading('Tasks and requests'), tasks.length ? list(tasks) : el('p', 'muted', 'No requests found.')];
        nodes.push(heading('Dates')); nodes.push(dates.length ? list(dates) : el('p', 'muted', 'None found.'));
        nodes.push(heading('Amounts')); nodes.push(money.length ? list(money) : el('p', 'muted', 'None found.'));
        show(nodes);
      },
      reply: function (t) {
        var ss = sentences(t), tasks = ss.filter(function (s) { return ACTION_RE.test(s); }).slice(0, 2);
        var dates = uniq(t.match(DATE_RE) || []), money = uniq(t.match(MONEY_RE) || []);
        var L = ['Hi,', '', 'Thanks for the details. Here is what I understood:'];
        (tasks.length ? tasks : ss.slice(0, 2)).forEach(function (s) { L.push('- ' + s.replace(/^[,\s]+/, '')); });
        if (money.length) L.push('- Budget: ' + money[0]);
        if (dates.length) L.push('- Timing: ' + dates[0]);
        L.push('', 'Next, I will review this and send a quote with a timeline. If anything above is wrong, tell me and I will adjust it.', '', 'Best,', 'Claxen');
        var pre = el('pre', '', L.join('\n'));
        show([heading('Draft reply (for you to review)'), pre]);
      },
      clean: function (t) {
        var c = t.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\s+([,.!?;:])/g, '$1').replace(/([,.!?;:])(?=[A-Za-z])/g, '$1 ').trim();
        c = c.replace(/(^|[.!?]\s+|\n)([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
        show([heading('Cleaned text'), el('pre', '', c)]);
      }
    };
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (b) ACT[b.getAttribute('data-act')](inp.value); });
  }, 'text tool');
  /* ---------- pricing slider + brief builder ---------- */
  safe(function pricing() {
    var out = $('[data-budget-out]'), range = $('[data-budget-range]'), tier = $('[data-budget-tier]'), txt = $('[data-budget-text]');
    var brief = $('[data-brief]'), range2 = $('[data-brief-range]'), bud2 = $('[data-brief-budget]');
    var ticket = $('[data-ticket]'), mail = $('[data-mail]'), copyBtn = $('[data-copy]'), tg = $('[data-tg]');
    if (!range) return;
    function fill(r) { r.style.setProperty('--fill', 'calc(' + state.t + '% + ' + ((0.5 - state.t / 100) * 44).toFixed(1) + 'px)'); }
    function ticketText() {
      var f = brief ? new FormData(brief) : null, v = valFromT(state.t), L = [];
      var kind = (f && f.get('kind')) || state.kind;
      L.push('Project: ' + kind, 'Budget: ' + money(v), 'Deadline: ' + ((f && f.get('when')) || 'No rush'));
      var name = f && (f.get('name') || '').trim(), reach = f && (f.get('reach') || '').trim(), about = f && (f.get('about') || '').trim();
      if (name || reach) L.push('From: ' + [name, reach].filter(Boolean).join(', '));
      if (about) L.push('', about);
      return L.join('\n');
    }
    function paint(from) {
      var v = valFromT(state.t), t = TIERS.filter(function (x) { return v < x[0]; })[0] || TIERS[TIERS.length - 1];
      out.textContent = money(v); out.style.setProperty('--w', (78 + state.t * 0.42).toFixed(1));
      range.value = state.t; fill(range); range.setAttribute('aria-valuetext', money(v));
      tier.textContent = t[1]; txt.textContent = t[2];
      if (range2) { range2.value = state.t; fill(range2); range2.setAttribute('aria-valuetext', money(v)); }
      if (bud2) bud2.textContent = money(v);
      if (ticket) { var tt = ticketText(); ticket.textContent = tt; if (mail) mail.href = 'mailto:' + C.cfg.email + '?subject=' + encodeURIComponent('Project brief: ' + ((brief && new FormData(brief).get('kind')) || state.kind)) + '&body=' + encodeURIComponent(tt); }
    }
    subs.push(paint);
    range.addEventListener('input', function () { setT(+range.value, 'price'); });
    if (range2) range2.addEventListener('input', function () { setT(+range2.value, 'brief'); });
    if (brief) {
      brief.addEventListener('input', function () { paint(); });
      brief.addEventListener('change', function () { paint(); });
      brief.addEventListener('submit', function (e) { e.preventDefault(); });
    }
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var tt = ticketText();
      C.copy(tt).then(function () { C.toast('Brief copied. Paste it into an email or chat.'); }, function () { C.toast('Could not copy. Select the text in the brief and copy it.'); });
    });
    if (tg) tg.addEventListener('click', function () {
      C.copy(ticketText()).then(function () { C.toast('Brief copied. Paste it into the Telegram chat.'); }, function () {});
    });
    setT(state.t);
    var clock = $('[data-clock]');
    if (clock) {
      var fmt = function () { try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()) + ' IST'; } catch (e) { return 'IST'; } };
      clock.textContent = fmt(); setInterval(function () { clock.textContent = fmt(); }, 30000);
    }
  }, 'pricing');
})();