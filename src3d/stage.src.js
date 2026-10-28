/* CLAXEN 3D stage. One WebGL renderer draws every 3D slot on the page (hero ring, service objects,
   budget skyline) and copies each frame into that slot's own 2D canvas. Bundled with three.js by tools/build3d.js. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Points, Sprite, Color, Vector2, Raycaster,
  BoxGeometry, SphereGeometry, CylinderGeometry, TorusGeometry, ExtrudeGeometry, Shape, BufferGeometry, Float32BufferAttribute,
  MeshStandardMaterial, MeshBasicMaterial, PointsMaterial, SpriteMaterial, CanvasTexture,
  HemisphereLight, DirectionalLight, AdditiveBlending, sRGBEncoding
} from 'three';

(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var els = Array.prototype.slice.call(doc.querySelectorAll('[data-3d]'));
  if (!els.length) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPEED = reduce ? 0.55 : 1;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var ease = function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };

  var renderer;
  try {
    var weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    renderer = new WebGLRenderer({ alpha: true, antialias: !weak, powerPreference: 'default' });
  } catch (e) { return; }
  if (!renderer || !renderer.getContext()) return;
  renderer.outputEncoding = sRGBEncoding;
  renderer.setClearColor(0x000000, 0);
  renderer.setScissorTest(true);
  var glCanvas = renderer.domElement;

  var dprBase = Math.min(window.devicePixelRatio || 1, 2);
  if (innerWidth < 760) dprBase = Math.min(dprBase, 1.75);
  var quality = (navigator.deviceMemory && navigator.deviceMemory <= 2) ? .75 : 1;
  var dpr = function () { return dprBase * quality; };

  /* ---------- colour handling: read the page's CSS variables so both themes work ---------- */
  var KEYS = { web: '--c-web', onWeb: '--on-web', bot: '--c-bot', ink: '--ink-fixed', py: '--c-py', onPy: '--on-py', ai: '--c-ai', sun: '--sun', fg: '--b-fg', bg: '--b-bg', mute: '--b-mute' };
  var FALLBACK = { web: '#C9CCF3', onWeb: '#3C4594', bot: '#D9A85F', ink: '#16141B', py: '#78BFA8', onPy: '#16141B', ai: '#B3A5E0', sun: '#D9A85F', fg: '#EAE4D8', bg: '#16141B', mute: '#ABA4B0' };
  function readPal(el) {
    var cs = getComputedStyle(el), p = {};
    Object.keys(KEYS).forEach(function (k) {
      var v = (cs.getPropertyValue(KEYS[k]) || '').trim();
      p[k] = /^#|^rgb/i.test(v) ? v : FALLBACK[k];
    });
    return p;
  }
  function lin(hex) { var c = new Color(); c.set(hex); c.convertSRGBToLinear(); return c; }

  /* ---------- small textures ---------- */
  var dotTex, glowTex;
  function radial(size, hard) {
    var c = doc.createElement('canvas'); c.width = c.height = size;
    var x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(hard, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return new CanvasTexture(c);
  }
  dotTex = radial(64, .45); glowTex = radial(128, 0);

  /* ---------- geometry helpers ---------- */
  function rrect(w, h, r) {
    var x = -w / 2, y = -h / 2, s = new Shape();
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function rpoly(pts, r) {
    var s = new Shape(), n = pts.length;
    for (var i = 0; i < n; i++) {
      var P = pts[i], A = pts[(i + n - 1) % n], B = pts[(i + 1) % n];
      var da = Math.hypot(A[0] - P[0], A[1] - P[1]), db = Math.hypot(B[0] - P[0], B[1] - P[1]);
      var a = [P[0] + (A[0] - P[0]) / da * r, P[1] + (A[1] - P[1]) / da * r];
      var b = [P[0] + (B[0] - P[0]) / db * r, P[1] + (B[1] - P[1]) / db * r];
      if (i === 0) s.moveTo(a[0], a[1]); else s.lineTo(a[0], a[1]);
      s.quadraticCurveTo(P[0], P[1], b[0], b[1]);
    }
    s.closePath();
    return s;
  }
  function star(h) {
    var k1 = .09 * h, k2 = .39 * h, s = new Shape();
    s.moveTo(0, h);
    s.bezierCurveTo(k1, k2, k2, k1, h, 0);
    s.bezierCurveTo(k2, -k1, k1, -k2, 0, -h);
    s.bezierCurveTo(-k1, -k2, -k2, -k1, -h, 0);
    s.bezierCurveTo(-k2, k1, -k1, k2, 0, h);
    return s;
  }
  function bubble() {
    var u = function (x, y) { return [(x - 60) / 60, (60 - y) / 60]; }, s = new Shape(), p;
    p = u(41, 30); s.moveTo(p[0], p[1]);
    p = u(79, 30); s.lineTo(p[0], p[1]);
    p = u(90, 41); var c = u(90, 30); s.quadraticCurveTo(c[0], c[1], p[0], p[1]);
    p = u(90, 61); s.lineTo(p[0], p[1]);
    p = u(79, 72); c = u(90, 72); s.quadraticCurveTo(c[0], c[1], p[0], p[1]);
    p = u(62, 72); s.lineTo(p[0], p[1]);
    p = u(48, 86); s.lineTo(p[0], p[1]);
    p = u(48, 72); s.lineTo(p[0], p[1]);
    p = u(41, 72); s.lineTo(p[0], p[1]);
    p = u(30, 61); c = u(30, 72); s.quadraticCurveTo(c[0], c[1], p[0], p[1]);
    p = u(30, 41); s.lineTo(p[0], p[1]);
    p = u(41, 30); c = u(30, 30); s.quadraticCurveTo(c[0], c[1], p[0], p[1]);
    return s;
  }
  var geoCache = {};
  function ext(key, shape, depth, bevel) {
    if (geoCache[key]) return geoCache[key];
    var g = new ExtrudeGeometry(shape, { depth: depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .8, bevelSegments: 4, curveSegments: 18 });
    g.center();
    return (geoCache[key] = g);
  }
  function box(w, h, d) { var k = 'b' + w + h + d; return geoCache[k] || (geoCache[k] = new BoxGeometry(w, h, d)); }
  var sphereG = new SphereGeometry(1, 28, 20);

  /* ---------- the four machines, in 3D ---------- */
  function makeWeb(S) {
    var g = new Group(), L = [];
    var body = new Mesh(ext('web', rrect(1.733, 1.667, .12), .14, .04), S.M('web')); g.add(body);
    function layer(m, x, y, z, k) { m.position.set(x, y, z); g.add(m); L.push({ m: m, z: z, k: k }); return m; }
    [-.65, -.467, -.283].forEach(function (x, i) {
      var d = new Mesh(sphereG, S.M('onWeb', 'web', i * .25)); d.scale.setScalar(.042);
      layer(d, x, .617, .12, .35);
    });
    var la = layer(new Mesh(box(.933, .15, .06), S.M('onWeb')), -.183, .225, .13, .7);
    layer(new Mesh(box(.6, .085, .05), S.M('onWeb', 'web', .45)), -.35, .008, .125, .5);
    layer(new Mesh(ext('pill', rrect(.533, .25, .125), .07, .03), S.M('sun')), -.383, -.425, .15, 1);
    layer(new Mesh(box(.533, .467, .05), S.M('onWeb', 'web', .78)), .367, -.367, .12, .45);
    g.userData.update = function (t, st) {
      la.scale.x = .62 + .38 * (.5 + .5 * Math.sin(t * 1.5));
      la.position.x = -.65 + .933 * la.scale.x / 2;
      for (var i = 0; i < L.length; i++) L[i].m.position.z = L[i].z + st.explode * L[i].k * .5;
    };
    return g;
  }
  function makeBot(S) {
    var g = new Group(), dots = [];
    var disc = new Mesh(new CylinderGeometry(.92, .92, .2, 56), S.M('bot')); disc.rotation.x = Math.PI / 2; g.add(disc);
    var b = new Mesh(ext('bub', bubble(), .1, .035), S.M('ink')); b.scale.set(1.18, 1.18, 1); b.position.set(0, .02, .17); g.add(b);
    [-.233, 0, .233].forEach(function (x) {
      var d = new Mesh(sphereG, S.M('bot')); d.scale.setScalar(.07); d.position.set(x, .16, .3); g.add(d); dots.push(d);
    });
    g.userData.update = function (t, st) {
      for (var i = 0; i < 3; i++) {
        var k = Math.max(0, Math.sin(t * 4.2 - i * .7));
        dots[i].position.y = .16 + k * .1; dots[i].position.z = .3 + st.explode * .12;
      }
      b.position.z = .17 + st.explode * .1;
    };
    return g;
  }
  function makePy(S) {
    var g = new Group();
    var tri = new Mesh(ext('py', rpoly([[-.667, .867], [.867, 0], [-.667, -.867]], .16), .2, .05), S.M('py')); tri.position.x = .05; g.add(tri);
    function bar(x, y, len, ang) {
      var m = new Mesh(box(len, .1, .06), S.M('onPy')); m.position.set(x, y, .17); m.rotation.z = ang; g.add(m);
      return m;
    }
    var ang = Math.atan2(.233, .3), len = Math.hypot(.3, .233);
    var up = bar(-.317, .117, len, -ang), dn = bar(-.317, -.117, len, ang);
    var cur = new Mesh(box(.283, .092, .06), S.M('onPy')); cur.position.set(.108, -.263, .17); g.add(cur);
    g.userData.update = function (t, st) {
      cur.visible = Math.sin(t * 5.5) > -.2;
      var z = .17 + st.explode * .12;
      up.position.z = dn.position.z = cur.position.z = z;
    };
    return g;
  }
  function makeAi(S) {
    var g = new Group();
    var big = new Mesh(ext('ai', star(1), .24, .05), S.M('ai')); g.add(big);
    var small = new Mesh(ext('ai2', star(.27), .12, .03), S.M('ink')); small.position.set(.617, .533, .22); g.add(small);
    g.userData.update = function (t, st) {
      var k = .75 + .4 * (.5 + .5 * Math.sin(t * 2.4));
      small.scale.setScalar(k); small.rotation.z = Math.sin(t * 1.6) * .5;
      small.position.z = .22 + st.explode * .25;
      big.rotation.z = Math.sin(t * .7) * .06;
    };
    return g;
  }
  var MAKE = { web: makeWeb, bot: makeBot, py: makePy, ai: makeAi };

  /* ---------- scene plumbing ---------- */
  function lights(scene) {
    scene.add(new HemisphereLight(0xfff2de, 0x4a4460, .62));
    var key = new DirectionalLight(0xfff0dc, .95); key.position.set(3, 5, 6); scene.add(key);
    var rim = new DirectionalLight(0x9db0ff, .6); rim.position.set(-6, 2, -3); scene.add(rim);
    var fill = new DirectionalLight(0xe6b070, .32); fill.position.set(2, -4, 3); scene.add(fill);
  }
  function Slot(el) {
    var self = this;
    this.el = el; this.type = el.getAttribute('data-3d'); this.mode = el.getAttribute('data-3d-mode') || 'card';
    this.canvas = doc.createElement('canvas'); this.canvas.className = 'stage__canvas'; this.canvas.setAttribute('aria-hidden', 'true');
    el.insertBefore(this.canvas, el.firstChild);
    this.ctx = this.canvas.getContext('2d');
    this.scene = new Scene(); lights(this.scene);
    this.camera = new PerspectiveCamera(32, 1, .1, 60);
    this.cm = []; this.visible = false; this.ready = false; this.w = 0; this.h = 0; this.sp = 0;
    this.ptr = { x: 0, y: 0, tx: 0, ty: 0, inside: false, down: false };
    this.hover = -1; this.t0 = Math.random() * 10; this.explode = 0; this.size();
    this.M = function (key, mix, amt) {
      var m = new MeshStandardMaterial({ roughness: .5, metalness: .08 });
      self.cm.push({ m: m, key: key, mix: mix, amt: amt });
      return m;
    };
    var BUILD = { hero: buildHero, city: buildCity, steps: buildSteps }, UPD = { hero: updateHero, city: updateCity, steps: updateSteps };
    (BUILD[this.type] || buildSingle)(this);
    this.update = UPD[this.type] || updateSingle;
    this.colors();
    var host = el.closest('.svc') || el; // service cards are covered by a full-size link, so listen on the card
    host.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      self.ptr.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      self.ptr.ty = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1, 1);
      self.ptr.inside = true;
      if (self.onMove) self.onMove(e);
    });
    host.addEventListener('pointerleave', function () { self.ptr.tx = 0; self.ptr.ty = 0; self.ptr.inside = false; if (self.onLeave) self.onLeave(); });
    el.addEventListener('pointerdown', function (e) { self.ptr.down = true; if (self.onDown) self.onDown(e); });
    addEventListener('pointerup', function () { self.ptr.down = false; });
  }
  Slot.prototype.size = function () {
    var r = this.el.getBoundingClientRect();
    this.w = Math.max(1, Math.round(r.width)); this.h = Math.max(1, Math.round(r.height));
    this.canvas.width = Math.round(this.w * dpr()); this.canvas.height = Math.round(this.h * dpr());
    this.camera.aspect = this.w / this.h; this.camera.updateProjectionMatrix();
  };
  Slot.prototype.colors = function () {
    var p = this.pal = readPal(this.el);
    this.cm.forEach(function (c) {
      var col = lin(p[c.key]);
      if (c.mix) col.lerp(lin(p[c.mix]), c.amt);
      c.m.color.copy(col);
    });
    if (this.recolor) this.recolor(p);
  };

  /* ---------- hero: the ring of four machines ---------- */
  var HERO_R = 3.0;
  function buildHero(S) {
    S.camera.fov = 38; S.camera.position.set(0, 0, 12.2); S.camera.lookAt(0, 0, 0);
    var ring = new Group(); S.scene.add(ring); S.ring = ring;
    var ids = ['web', 'bot', 'py', 'ai'], hrefs = [];
    S.nodes = ids.map(function (id, i) {
      var a = (i * 90 - 90) * Math.PI / 180;
      var holder = new Group(); holder.position.set(Math.cos(a) * HERO_R, -Math.sin(a) * HERO_R, 0);
      var obj = MAKE[id](S); obj.scale.setScalar(1.0); holder.add(obj);
      var hit = new Mesh(sphereG, new MeshBasicMaterial({ visible: false })); hit.scale.setScalar(1.25); hit.userData.i = i; holder.add(hit);
      ring.add(holder);
      var anchors = S.el.querySelectorAll('a.node'); hrefs[i] = anchors[i] ? anchors[i].getAttribute('href') : null;
      return { holder: holder, obj: obj, hit: hit, s: 1, spin: 0, base: holder.position.clone(), seed: i * 1.7 };
    });
    S.hrefs = hrefs;
    // dotted track
    var tp = [], N = 150;
    for (var i = 0; i < N; i++) { var q = i / N * Math.PI * 2; tp.push(Math.cos(q) * HERO_R, Math.sin(q) * HERO_R, 0); }
    var tg = new BufferGeometry(); tg.setAttribute('position', new Float32BufferAttribute(tp, 3));
    var tm = new PointsMaterial({ size: .05, map: dotTex, transparent: true, opacity: .55, depthWrite: false, sizeAttenuation: true });
    S.track = new Points(tg, tm); ring.add(S.track);
    // two faint tilted orbits give the ring depth
    S.orbits = [1.2, -1.15].map(function (tilt, k) {
      var m = new Mesh(new TorusGeometry(HERO_R * (1.18 + k * .08), .007, 8, 160), new MeshBasicMaterial({ transparent: true, opacity: .13, depthWrite: false }));
      m.rotation.x = tilt; m.rotation.y = k * .8; S.scene.add(m); return m;
    });
    // packet + trail
    var pm = new MeshBasicMaterial({ color: 0xffffff }); S.packetMat = pm;
    S.packet = new Mesh(sphereG, pm); S.packet.scale.setScalar(.15); ring.add(S.packet);
    var gm = new SpriteMaterial({ map: glowTex, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: .55 }); S.glowMat = gm;
    S.glow = new Sprite(gm); S.glow.scale.setScalar(1.1); ring.add(S.glow);
    var TN = 34, tpos = new Float32Array(TN * 3);
    var trg = new BufferGeometry(); trg.setAttribute('position', new Float32BufferAttribute(tpos, 3));
    S.trailMat = new PointsMaterial({ size: .16, map: dotTex, transparent: true, opacity: .8, depthWrite: false, blending: AdditiveBlending });
    S.trail = new Points(trg, S.trailMat); S.trail.frustumCulled = false; ring.add(S.trail); S.TN = TN;
    // dust
    var DN = 230, dp = new Float32Array(DN * 3);
    for (var d = 0; d < DN; d++) {
      var r = 3.6 + Math.random() * 6.5, th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
      dp[d * 3] = r * Math.sin(ph) * Math.cos(th); dp[d * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * .8; dp[d * 3 + 2] = r * Math.cos(ph) - 2;
    }
    var dg = new BufferGeometry(); dg.setAttribute('position', new Float32BufferAttribute(dp, 3));
    S.dustMat = new PointsMaterial({ size: .075, map: dotTex, transparent: true, opacity: .55, depthWrite: false });
    S.dust = new Points(dg, S.dustMat); S.scene.add(S.dust);
    S.lastActive = -9; S.rc = new Raycaster(); S.ndc = new Vector2();
    S.recolor = function (p) {
      S.packetMat.color.copy(lin(p.sun)); S.glowMat.color.copy(lin(p.sun)); S.trailMat.color.copy(lin(p.sun));
      S.dustMat.color.copy(lin(p.fg)); S.track.material.color.copy(lin(p.fg)); S.orbits.forEach(function (o) { o.material.color.copy(lin(p.fg)); });
    };
    function pick(e) {
      var r = S.el.getBoundingClientRect();
      S.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      S.rc.setFromCamera(S.ndc, S.camera);
      var hits = S.rc.intersectObjects(S.nodes.map(function (n) { return n.hit; }), false);
      return hits.length ? hits[0].object.userData.i : -1;
    }
    S.onMove = function (e) {
      if (e.pointerType === 'touch') return;
      var i = pick(e);
      if (i !== S.hover) {
        S.hover = i; S.el.style.cursor = i >= 0 ? 'pointer' : '';
        S.el.dispatchEvent(new CustomEvent(i >= 0 ? 'node-hover' : 'node-leave', { detail: i }));
      }
    };
    S.onLeave = function () { if (S.hover !== -1) { S.hover = -1; S.el.style.cursor = ''; S.el.dispatchEvent(new CustomEvent('node-leave')); } };
    S.onDown = function (e) { S.downAt = { x: e.clientX, y: e.clientY, i: pick(e) }; };
    S.el.addEventListener('click', function (e) {
      var i = pick(e);
      if (i >= 0 && S.hrefs[i]) location.href = S.hrefs[i];
    });
  }
  function updateHero(S, t, dt) {
    var p = S.ptr, el = S.el, pos = el.__pos || 0, active = el.__active == null ? -1 : el.__active;
    // pointer-driven tilt, plus scroll-driven turn
    var ry = p.x * .5 + Math.sin(t * .35) * .1 + S.sp * .9;
    var rx = -p.y * .32 + .1 + S.sp * .35;
    S.ring.rotation.y = lerp(S.ring.rotation.y, ry, 1 - Math.pow(.001, dt));
    S.ring.rotation.x = lerp(S.ring.rotation.x, rx, 1 - Math.pow(.001, dt));
    S.ring.scale.setScalar(1 - Math.max(0, S.sp) * .18);
    S.dust.rotation.y = t * .018 + p.x * .12; S.dust.rotation.x = p.y * -.06 + S.sp * .2;
    S.orbits[0].rotation.z = t * .12; S.orbits[1].rotation.z = -t * .09; S.orbits[0].rotation.y = p.x * .3; S.orbits[1].rotation.x = -1.15 + p.y * .2 + S.sp * .3;
    // nodes
    if (active !== S.lastActive) { if (active >= 0 && S.nodes[active]) S.nodes[active].spin = 1; S.lastActive = active; }
    S.nodes.forEach(function (n, i) {
      var on = (active === i) || (S.hover === i);
      n.s = lerp(n.s, on ? 1.22 : 1, 1 - Math.pow(.0005, dt));
      n.holder.scale.setScalar(n.s);
      n.spin = Math.max(0, n.spin - dt * .85);
      n.obj.rotation.y = Math.sin(t * .8 + n.seed) * .32 + Math.PI * 2 * ease(n.spin);
      n.obj.rotation.x = Math.sin(t * .6 + n.seed) * .12;
      n.holder.position.y = n.base.y + Math.sin(t * 1.1 + n.seed) * .09;
      n.obj.userData.update(t + n.seed, { explode: on ? 1 : 0 });
    });
    // packet around the ring
    var a = (pos * 90 - 90) * Math.PI / 180, R = HERO_R;
    S.packet.position.set(Math.cos(a) * R, -Math.sin(a) * R, .2); S.glow.position.copy(S.packet.position);
    S.glow.scale.setScalar(.7 + Math.sin(t * 5) * .08);
    var tp = S.trail.geometry.attributes.position;
    for (var k = 0; k < S.TN; k++) {
      var aa = a - k * .028, f = 1 - k / S.TN;
      tp.setXYZ(k, Math.cos(aa) * R, -Math.sin(aa) * R, .1 * f);
    }
    tp.needsUpdate = true;
  }

  /* ---------- a single service object (cards and service pages) ---------- */
  function buildSingle(S) {
    S.camera.fov = 30; S.camera.position.set(0, 0, 7.4); S.camera.lookAt(0, 0, 0);
    var big = S.mode === 'hero';
    S.obj = MAKE[S.type](S); S.obj.scale.setScalar(big ? 1.5 : 1.42);
    S.pivot = new Group(); S.pivot.add(S.obj); S.scene.add(S.pivot);
    if (big) {
      var n = 70, p = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) { var r = 2.4 + Math.random() * 2.6, a = Math.random() * 6.283, h = (Math.random() - .5) * 4; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = h; p[i * 3 + 2] = Math.sin(a) * r * .6 - 1; }
      var g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(p, 3));
      S.dustMat = new PointsMaterial({ size: .1, map: dotTex, transparent: true, opacity: .7, depthWrite: false });
      S.dust = new Points(g, S.dustMat); S.scene.add(S.dust);
      S.recolor = function (pal) { S.dustMat.color.copy(lin(pal.fg)); };
    }
  }
  function updateSingle(S, t, dt) {
    var p = S.ptr, k = 1 - Math.pow(.001, dt);
    var ry = Math.sin(t * .6) * .3 + p.x * .6 + S.sp * 1.1;
    var rx = -p.y * .38 + Math.sin(t * .5) * .08 - S.sp * .25;
    S.pivot.rotation.y = lerp(S.pivot.rotation.y, ry, k);
    S.pivot.rotation.x = lerp(S.pivot.rotation.x, rx, k);
    S.pivot.position.y = Math.sin(t * 1.05) * .07;
    S.explode = lerp(S.explode, p.inside ? 1 : .0, 1 - Math.pow(.01, dt));
    var sc = 1 + S.explode * .05; S.pivot.scale.setScalar(sc);
    S.obj.userData.update(t, { explode: S.explode });
    if (S.dust) { S.dust.rotation.y = t * .05 + p.x * .1; S.dust.rotation.x = S.sp * .2; }
  }

  /* ---------- budget skyline ---------- */
  function buildCity(S) {
    S.camera.fov = 31; S.camera.position.set(6.3, 5.7, 8.3); S.camera.lookAt(0, .8, 0);
    S.city = new Group(); S.scene.add(S.city);
    var G = 7, gap = .64, items = [];
    var cityBody = new BoxGeometry(.46, 1, .46).translate(0, .5, 0), cityCap = new BoxGeometry(.5, .06, .5);
    var plate = new Mesh(box(G * gap + .3, .1, G * gap + .3), S.M('fg', 'bg', .78)); plate.position.y = -.06; S.city.add(plate);
    var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(7);
    for (var i = 0; i < G; i++) for (var j = 0; j < G; j++) {
      var x = (i - (G - 1) / 2) * gap, z = (j - (G - 1) / 2) * gap, d = Math.hypot(i - 3, j - 3);
      var body = new Mesh(cityBody, S.M('fg', 'bg', .06)), cap = new Mesh(cityCap, S.M('sun'));
      body.position.set(x, 0, z); cap.position.set(x, 0, z);
      S.city.add(body, cap);
      items.push({ body: body, cap: cap, d: d + rnd() * .7, h: .55 + rnd() * .9 + Math.max(0, 2.6 - d) * .22, cur: 0 });
    }
    items.sort(function (a, b) { return a.d - b.d; });
    S.items = items; S.t = 47; S.tcur = 47;
    var rng = doc.querySelector('[data-budget-range]'); if (rng) S.t = S.tcur = parseFloat(rng.value) || 47;
    doc.addEventListener('cx-budget', function (e) { S.t = e.detail; });
  }
  function updateCity(S, t, dt) {
    var k = 1 - Math.pow(.02, dt);
    S.tcur = lerp(S.tcur, S.t, k);
    var f = S.tcur / 100, n = 2 + f * 47, hs = .3 + f * 1.05;
    S.items.forEach(function (it, idx) {
      var on = idx < n ? 1 : 0, grow = clamp(n - idx, 0, 1);
      var target = on ? it.h * hs * grow : 0;
      it.cur = lerp(it.cur, target, 1 - Math.pow(.003, dt));
      var h = Math.max(.0001, it.cur);
      it.body.scale.y = h; it.cap.position.y = h + .03; it.cap.visible = it.cur > .05; it.body.visible = it.cur > .01;
    });
    var ck = 1 + f * .2; S.camera.position.set(6.3 * ck, 5.7 * ck + f * .5, 8.3 * ck); S.camera.lookAt(0, .7 + f * .9, 0);
    S.city.rotation.y = t * .16 + S.ptr.x * .7 + S.sp * .9;
    S.city.rotation.x = -S.ptr.y * .12;
    S.city.position.y = Math.sin(t * .9) * .05;
  }


  /* ---------- process: four stations along a path; the camera travels as you scroll ---------- */
  function buildSteps(S) {
    S.camera.fov = 30; S.camera.position.set(0, 2.2, 11.4);
    S.rail = new Group(); S.scene.add(S.rail);
    var st = [];
    function station(i) {
      var h = new Group(), parts = [];
      var base = new Mesh(new CylinderGeometry(.82, .86, .1, 40), S.M('fg', 'bg', .9)); base.position.y = -.55; h.add(base);
      var o = new Group(); h.add(o);
      if (i === 0) {
        var paper = new Mesh(ext('paper', rrect(1.05, 1.35, .09), .08, .03), S.M('web')); o.add(paper);
        [.3, .05, -.2].forEach(function (y, k) { var l = new Mesh(box(k === 2 ? .35 : .7, .08, .04), S.M('onWeb')); l.position.set(k === 2 ? -.17 : 0, y, .1); o.add(l); });
        var chk = new Mesh(ext('pillS', rrect(.3, .3, .15), .05, .02), S.M('sun')); chk.position.set(.28, -.42, .1); o.add(chk);
      } else if (i === 1) {
        var coin = new Mesh(new CylinderGeometry(.62, .62, .16, 44), S.M('sun')); coin.rotation.x = Math.PI / 2; o.add(coin);
        var ring = new Mesh(new TorusGeometry(.42, .035, 10, 44), S.M('sun', 'ink', .35)); ring.position.z = .1; o.add(ring);
        var bar = new Mesh(box(.12, .46, .04), S.M('sun', 'ink', .5)); bar.position.z = .1; o.add(bar);
      } else if (i === 2) {
        var sz = [[.95, .34, .95], [.7, .34, .7], [.46, .34, .46]];
        sz.forEach(function (d, k) { var b = new Mesh(box(d[0], d[1], d[2]), S.M('py', 'ink', k * .12)); b.position.y = -.3 + k * .36; b.userData.k = k; o.add(b); parts.push(b); });
      } else {
        var body = new Mesh(new CylinderGeometry(.27, .3, .95, 28), S.M('ai')); o.add(body);
        var nose = new Mesh(new CylinderGeometry(0, .27, .5, 28), S.M('web', 'ai', .2)); nose.position.y = .72; o.add(nose);
        var win = new Mesh(sphereG, S.M('ink')); win.scale.setScalar(.1); win.position.set(0, .15, .27); o.add(win);
        [0, 2.094, 4.188].forEach(function (a) { var fin = new Mesh(box(.04, .38, .3), S.M('web', 'ai', .2)); fin.position.set(Math.sin(a) * .34, -.42, Math.cos(a) * .34); fin.rotation.y = a; o.add(fin); });
        var fl = new Mesh(new CylinderGeometry(.16, 0, .45, 20), S.M('sun')); fl.position.y = -.9; fl.rotation.x = Math.PI; o.add(fl); parts.push(fl);
        o.rotation.z = -.5;
      }
      h.position.set((i - 1.5) * 1.62, 0, -Math.abs(i - 1.5) * .3);
      S.rail.add(h);
      o.position.y = [.22, .12, 0, .12][i];
      st.push({ h: h, o: o, parts: parts, act: 0, i: i, yo: o.position.y });
    }
    for (var i = 0; i < 4; i++) station(i);
    S.st = st;
    var line = new Mesh(box(1, .05, .05), S.M('sun')); line.position.set(-2.43, -.62, .6); S.rail.add(line); S.line = line;
    var lineBg = new Mesh(box(4.86, .03, .03), S.M('fg', 'bg', .7)); lineBg.position.set(0, -.62, .6); S.rail.add(lineBg);
    S.list = doc.querySelector('[data-steps]'); S.pcur = 0;
  }
  function updateSteps(S, t, dt) {
    var p = S.list ? clamp(parseFloat(S.list.style.getPropertyValue('--p')) || 0, 0, 1) : 0;
    S.pcur = lerp(S.pcur, p, 1 - Math.pow(.004, dt));
    var q = S.pcur * 4;
    S.st.forEach(function (n) {
      var a = clamp(q - n.i + .35, 0, 1); a = a * a * (3 - 2 * a);
      n.act = lerp(n.act, a, 1 - Math.pow(.001, dt));
      n.h.position.y = -.35 + n.act * .35 + Math.sin(t * 1.1 + n.i) * .05 * n.act;
      n.h.scale.setScalar(.82 + n.act * .22);
      n.o.rotation.y = Math.sin(t * .7 + n.i) * .3 + S.ptr.x * .35 + (1 - n.act) * .5;
      n.h.children[0].material.opacity = 1;
      var em = n.act * .22;
      n.o.traverse(function (m) { if (m.isMesh && m.material.emissive) m.material.emissive.copy(m.material.color).multiplyScalar(em); });
      if (n.i === 2) n.parts.forEach(function (b) { b.position.y = -.3 + b.userData.k * (.36 + Math.sin(t * 2 - b.userData.k) * .02 * n.act) + (1 - n.act) * -.18 * b.userData.k; });
      if (n.i === 3) { n.parts[0].scale.y = .6 + Math.abs(Math.sin(t * 9)) * .7 * n.act; n.parts[0].visible = n.act > .2; n.o.position.y = n.yo + Math.sin(t * 1.6) * .06 * n.act; }
    });
    S.line.scale.x = Math.max(.001, 4.86 * S.pcur); S.line.position.x = -2.43 + 2.43 * S.pcur;
    S.rail.rotation.y = -.28 + S.ptr.x * .25 + (S.pcur - .5) * .25; S.rail.rotation.x = -S.ptr.y * .08;
    S.camera.position.x = (S.pcur - .5) * .5; S.camera.lookAt((S.pcur - .5) * .8, .05, 0);
  }

  /* ---------- slots registry ---------- */
  var slots = [];
  els.forEach(function (el) {
    try { slots.push(new Slot(el)); } catch (e) { /* leave the SVG fallback in place */ }
  });
  /* ---------- sizing, visibility, loop ---------- */
  function fitBuffer() {
    var W = 1, H = 1, d = dpr();
    slots.forEach(function (s) { W = Math.max(W, s.w); H = Math.max(H, s.h); });
    renderer.setPixelRatio(1);
    renderer.setSize(Math.ceil(W * d), Math.ceil(H * d), false);
  }
  function resizeAll() { slots.forEach(function (s) { s.size(); }); fitBuffer(); }
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function () { resizeAll(); });
    slots.forEach(function (s) { ro.observe(s.el); });
  } else addEventListener('resize', resizeAll);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { for (var i = 0; i < slots.length; i++) if (slots[i].el === e.target) slots[i].visible = e.isIntersecting; }); }, { rootMargin: '120px' });
    slots.forEach(function (s) { io.observe(s.el); });
  } else slots.forEach(function (s) { s.visible = true; });

  new MutationObserver(function () { slots.forEach(function (s) { s.colors(); }); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  var lost = false;
  glCanvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; slots.forEach(function (s) { s.el.classList.remove('has-3d'); }); });
  glCanvas.addEventListener('webglcontextrestored', function () { lost = false; });

  /* tilt the phone and the 3D follows (Android and other browsers that allow it without a prompt) */
  var gyro = null;
  if (!reduce && 'ontouchstart' in window && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || e.beta == null) return;
      gyro = { x: clamp(e.gamma / 28, -1, 1), y: clamp(-(e.beta - 55) / 26, -1, 1) };
    }, { passive: true });
  }

  var last = performance.now(), t0 = last, ema = 6, slowFor = 0, skip = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (doc.hidden || lost) { last = now; return; }
    var dt = Math.min((now - last) / 1000, .05); last = now;
    var t = (now - t0) / 1000 * SPEED, vh = innerHeight, work0 = performance.now(), drawn = 0;
    skip++;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (!s.visible) continue;
      // when the machine is struggling, secondary slots draw every other frame
      if (quality < .8 && s.type !== 'hero' && (skip & 1)) continue;
      var r = s.el.getBoundingClientRect();
      s.sp = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1) * -1;
      if (gyro && !s.ptr.inside) { s.ptr.tx = gyro.x; s.ptr.ty = gyro.y; }
      s.ptr.x = lerp(s.ptr.x, s.ptr.tx, 1 - Math.pow(.002, dt)); s.ptr.y = lerp(s.ptr.y, s.ptr.ty, 1 - Math.pow(.002, dt));
      s.update(s, t + s.t0, dt * SPEED);
      var W = s.canvas.width, H = s.canvas.height;
      renderer.setViewport(0, 0, W, H); renderer.setScissor(0, 0, W, H);
      renderer.render(s.scene, s.camera);
      s.ctx.clearRect(0, 0, W, H);
      s.ctx.drawImage(glCanvas, 0, glCanvas.height - H, W, H, 0, 0, W, H);
      if (!s.ready) { s.ready = true; s.el.classList.add('has-3d'); }
      drawn++;
    }
    if (drawn) {
      var ms = performance.now() - work0; ema = lerp(ema, ms, .08);
      var frameGap = dt * 1000;
      if (frameGap > 26) slowFor += dt; else slowFor = Math.max(0, slowFor - dt * .5);
      if (slowFor > 1.6 && quality > .6) { quality = Math.max(.6, quality - .15); slowFor = 0; resizeAll(); }
    }
  }
  slots.forEach(function (s) { s.size(); });
  fitBuffer();
  window.CX3D = { ready: true, slots: slots.length };
  requestAnimationFrame(frame);
})();
